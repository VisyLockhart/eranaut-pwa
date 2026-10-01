import type { Db } from '../db/index.js';
import { SendError, type ReminderSender } from '../discord/sender.js';
import { buildReminderMessage } from './reminder-message.js';

// 提醒的輪詢與發送(D-128、D-129)。
// - 只查 `status = 'pending'` 且 `next_attempt_at` 已到的 delivery(D-139)
// - 5xx / 網路錯誤:每次間隔 1 分鐘重試,總共最多嘗試 3 次;429 依 retry_after 等待,同樣算一次嘗試(D-148 修訂)
// - 永久性錯誤(使用者關 DM、封鎖 bot、已離開伺服器、頻道無權限…)不重試,標記失敗並寫結構化 log
// - DM 永久失敗時**不**自動改發頻道(D-129)
// - 過期不補發:晚超過 30 分鐘的提醒標記「錯過」
// - 失敗只寫 log,不做使用者畫面

export const RETRY_INTERVAL_MS = 60_000;
export const MAX_ATTEMPTS = 3; // 總嘗試次數(含第一次)
export const MISSED_AFTER_MS = 30 * 60_000;
const BATCH_LIMIT = 100;

export interface DeliveryLogger {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
}

export interface DeliveryDeps {
  db: Db;
  sender: ReminderSender;
  reminderChannelId: string | null;
  now: () => Date;
  log: DeliveryLogger;
}

interface DueRow {
  delivery_id: string;
  method: 'dm' | 'channel';
  attempts: number;
  scheduled_at: string;
  submarine_id: string | null;
  workshop_id: string;
  discord_user_id: string;
  workshop_name: string;
  server: string;
  captain: string | null;
  notify_lead_minutes: number;
}

export interface TickSummary {
  sent: number;
  retrying: number;
  failed: number;
  missed: number;
  rateLimited: number;
}

function finish(db: Db, id: string, status: 'sent' | 'failed' | 'missed', attempts: number, error: string | null): void {
  db.prepare('UPDATE reminder_deliveries SET status = ?, attempts = ?, last_error = ? WHERE id = ?').run(status, attempts, error, id);
}

/** 處理所有已到期的 delivery,逐一循序發送(128 人規模不需要並行,也避免撞限速) */
export async function processDueDeliveries(deps: DeliveryDeps): Promise<TickSummary> {
  const { db, sender, log } = deps;
  const summary: TickSummary = { sent: 0, retrying: 0, failed: 0, missed: 0, rateLimited: 0 };
  const now = deps.now();

  const due = db
    .prepare(
      `SELECT d.id AS delivery_id, d.method, d.attempts, r.scheduled_at, r.submarine_id, r.workshop_id,
              u.discord_user_id,
              w.name AS workshop_name, w.server, w.captain, w.notify_lead_minutes
       FROM reminder_deliveries d
       JOIN reminders r ON r.id = d.reminder_id
       JOIN users u ON u.id = r.user_id
       JOIN workshops w ON w.id = r.workshop_id
       WHERE d.status = 'pending' AND d.next_attempt_at <= ?
       ORDER BY d.next_attempt_at
       LIMIT ?`,
    )
    .all(now.toISOString(), BATCH_LIMIT) as DueRow[];

  for (const row of due) {
    const base = { event: 'reminder_delivery', deliveryId: row.delivery_id, method: row.method, workshopId: row.workshop_id };

    // 過期不補發(D-129)
    if (now.getTime() - new Date(row.scheduled_at).getTime() > MISSED_AFTER_MS) {
      finish(db, row.delivery_id, 'missed', row.attempts, 'missed: 晚於應發時間超過 30 分鐘');
      log.warn({ ...base, outcome: 'missed' });
      summary.missed++;
      continue;
    }
    if (row.method === 'channel' && !deps.reminderChannelId) {
      finish(db, row.delivery_id, 'failed', row.attempts, 'channel_not_configured');
      log.warn({ ...base, outcome: 'failed', error: 'channel_not_configured' });
      summary.failed++;
      continue;
    }

    const content = composeContent(db, row);
    const attempts = row.attempts + 1;
    try {
      await sender.send(
        row.method === 'dm'
          ? { method: 'dm', discordUserId: row.discord_user_id }
          : { method: 'channel', discordUserId: row.discord_user_id, channelId: deps.reminderChannelId! },
        content,
      );
      finish(db, row.delivery_id, 'sent', attempts, null);
      log.info({ ...base, outcome: 'sent', attempts });
      summary.sent++;
    } catch (e) {
      const err = e instanceof SendError ? e : new SendError(`未預期的錯誤:${(e as Error).message}`, 'retry');
      if (err.kind === 'rate_limited' && attempts < MAX_ATTEMPTS) {
        // 限速也算一次嘗試:等到 retry_after 之後再試
        const next = new Date(now.getTime() + (err.retryAfterMs ?? 1000));
        db.prepare('UPDATE reminder_deliveries SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?').run(attempts, next.toISOString(), err.message, row.delivery_id);
        log.warn({ ...base, outcome: 'rate_limited', attempts, retryAt: next.toISOString() });
        summary.rateLimited++;
      } else if (err.kind === 'retry' && attempts < MAX_ATTEMPTS) {
        const next = new Date(now.getTime() + RETRY_INTERVAL_MS);
        db.prepare('UPDATE reminder_deliveries SET attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?').run(attempts, next.toISOString(), err.message, row.delivery_id);
        log.warn({ ...base, outcome: 'retry', attempts, error: err.message });
        summary.retrying++;
      } else {
        finish(db, row.delivery_id, 'failed', attempts, err.message);
        log.warn({ ...base, outcome: 'failed', attempts, error: err.message });
        summary.failed++;
      }
    }
  }
  return summary;
}

/** 發送當下重新讀取名稱、艘數、返航時間,內容永遠是最新的(D-147) */
function composeContent(db: Db, row: DueRow): string {
  const lead = row.notify_lead_minutes > 0;
  const mention = row.method === 'channel' ? row.discord_user_id : null;
  const common = { workshopName: row.workshop_name, server: row.server, captain: row.captain, lead, mentionDiscordUserId: mention };

  if (row.submarine_id !== null) {
    const s = db.prepare('SELECT position, name, expected_return_at FROM submarines WHERE id = ?').get(row.submarine_id) as
      | { position: number; name: string | null; expected_return_at: string | null }
      | undefined;
    return buildReminderMessage({
      ...common,
      scope: { kind: 'submarine', position: s?.position ?? 1, name: s?.name ?? null },
      returnAt: s?.expected_return_at ? new Date(s.expected_return_at) : null,
    });
  }
  const exploring = db.prepare("SELECT expected_return_at FROM submarines WHERE workshop_id = ? AND status = 'exploring'").all(row.workshop_id) as { expected_return_at: string | null }[];
  const times = exploring.map((s) => (s.expected_return_at ? new Date(s.expected_return_at).getTime() : 0)).filter((t) => t > 0);
  return buildReminderMessage({
    ...common,
    scope: { kind: 'batch', count: exploring.length },
    returnAt: times.length ? new Date(Math.max(...times)) : null,
  });
}
