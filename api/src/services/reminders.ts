import { NotifyMethod } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import {
  deleteDelivery,
  deleteReminder,
  insertReminder,
  listDeliveries,
  listRemindersForWorkshop,
  resetDelivery,
  setReminderTime,
  type DeliveryMethod,
} from '../repo/reminders.js';

// 提醒的產生與重算(D-128、D-135、D-139、D-145 ④)。
// 不累積資料:每艘潛艇最多一筆提醒、整批模式每間工坊最多一筆,以 upsert 維護;不需要清理排程。
// 本檔只負責「該有哪些提醒」;實際發送與重試由輪詢排程處理(D-128、D-129),尚未實作。

const MINUTE = 60_000;

export interface Candidate {
  /** 逐艘模式為潛艇 id;整批模式為 null */
  submarineId: string | null;
  scheduledAt: Date;
}

interface WorkshopRow {
  id: string;
  user_id: string;
  notify_batched: number;
  notify_lead_minutes: number;
}
interface SubmarineRow {
  id: string;
  position: number;
  status: 'exploring' | 'complete';
  expected_return_at: string | null;
}

/**
 * 依工坊設定算出「理論上的提醒」(尚未考慮時間已過):
 * - 逐艘(預設):每艘探索中的艇一筆,應發時間 = 返航時間 − 預先提醒分鐘
 * - 整批:整個工坊一筆,應發時間 = 探索中潛艇最晚的返航時間 − 預先提醒分鐘(D-128、D-135 ④)
 * 預先提醒開啟時只在提前時間提醒,返航當下不再提醒(D-135 ①)。
 */
export function computeCandidates(batched: boolean, leadMinutes: number, subs: readonly Pick<SubmarineRow, 'id' | 'status' | 'expected_return_at'>[]): Candidate[] {
  const exploring = subs.filter((s) => s.status === 'exploring' && s.expected_return_at !== null);
  const lead = leadMinutes * MINUTE;
  if (batched) {
    if (exploring.length === 0) return [];
    const latest = Math.max(...exploring.map((s) => new Date(s.expected_return_at!).getTime()));
    return [{ submarineId: null, scheduledAt: new Date(latest - lead) }];
  }
  return exploring.map((s) => ({ submarineId: s.id, scheduledAt: new Date(new Date(s.expected_return_at!).getTime() - lead) }));
}

export function methodsFromBits(bits: number): DeliveryMethod[] {
  const out: DeliveryMethod[] = [];
  if (bits & NotifyMethod.Dm) out.push('dm');
  if (bits & NotifyMethod.Channel) out.push('channel');
  if (bits & NotifyMethod.Push) out.push('push');
  return out;
}

export interface SyncResult {
  /** 因預先提醒時間已過而略過的提醒:逐艘模式為潛艇 id,整批模式為 `null`(D-135 ②) */
  leadSkipped: (string | null)[];
}

/**
 * 重算某間工坊的全部提醒,使其符合目前的潛艇、工坊設定與使用者提醒方式。可重複呼叫(冪等)。
 *
 * - 沒有提醒方式(`notify_methods = 0`)→ 不留任何提醒
 * - 艇已探索完成、模式切換造成型態不同、候選消失 → 刪除
 * - 應發時間改變 → 更新並把各 delivery 重置為待發;新的應發時間已過 → 刪除該提醒(D-135 ②:略過)
 * - 應發時間不變 → 已發送/失敗/錯過的 delivery 保持原狀,只增刪 delivery 列;
 *   因提醒方式改變而新增的 delivery,只在應發時間仍在未來才新增(D-145 ④,防止重複提醒)
 *
 * 呼叫端應把它和造成變動的寫入放在同一個交易內。
 */
export function syncWorkshopReminders(db: Db, workshopId: string, now: Date): SyncResult {
  const ws = db.prepare('SELECT id, user_id, notify_batched, notify_lead_minutes FROM workshops WHERE id = ?').get(workshopId) as WorkshopRow | undefined;
  if (!ws) return { leadSkipped: [] };
  const bits = (db.prepare('SELECT notify_methods FROM users WHERE id = ?').get(ws.user_id) as { notify_methods: number }).notify_methods;
  const methods = methodsFromBits(bits);
  const subs = db.prepare('SELECT id, position, status, expected_return_at FROM submarines WHERE workshop_id = ?').all(workshopId) as SubmarineRow[];

  const candidates = methods.length === 0 ? [] : computeCandidates(ws.notify_batched === 1, ws.notify_lead_minutes, subs);
  const existing = listRemindersForWorkshop(db, workshopId);
  const byKey = new Map(existing.map((r) => [r.submarine_id, r]));
  const nowIso = now.toISOString();
  const kept = new Set<string>();
  const leadSkipped: (string | null)[] = [];

  for (const c of candidates) {
    const iso = c.scheduledAt.toISOString();
    const ex = byKey.get(c.submarineId);

    if (ex && ex.scheduled_at === iso) {
      // 應發時間不變:不重置已完成的 delivery(D-145 ④)
      kept.add(ex.id);
      const have = new Map(listDeliveries(db, ex.id).map((d) => [d.method, d]));
      for (const [m, d] of have) if (!methods.includes(m)) deleteDelivery(db, d.id);
      if (iso > nowIso) for (const m of methods) if (!have.has(m)) resetDelivery(db, ex.id, m, iso);
      continue;
    }

    if (iso <= nowIso) {
      // 新的應發時間已過:略過。逐艘/整批的返航當下已過視為艇已完成,不提示;預先提醒的時間已過才提示(D-135 ②)
      if (ws.notify_lead_minutes > 0) leadSkipped.push(c.submarineId);
      continue;
    }

    let id: string;
    if (ex) {
      id = ex.id;
      setReminderTime(db, id, iso);
      for (const d of listDeliveries(db, id)) if (!methods.includes(d.method)) deleteDelivery(db, d.id);
    } else {
      id = insertReminder(db, { userId: ws.user_id, workshopId, submarineId: c.submarineId, scheduledAt: iso }, now);
    }
    for (const m of methods) resetDelivery(db, id, m, iso);
    kept.add(id);
  }

  for (const r of existing) if (!kept.has(r.id)) deleteReminder(db, r.id);
  return { leadSkipped };
}

/** 使用者提醒方式改變時,重算其全部工坊(D-139) */
export function syncUserReminders(db: Db, userId: string, now: Date): void {
  const ids = db.prepare('SELECT id FROM workshops WHERE user_id = ?').all(userId) as { id: string }[];
  for (const { id } of ids) syncWorkshopReminders(db, id, now);
}
