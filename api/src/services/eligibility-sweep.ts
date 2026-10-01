import type { Db } from '../db/index.js';
import type { Permissions } from '../auth/permissions.js';
import type { DiscordClient } from '../discord/client.js';
import { deleteExpiredSessions, deleteSessionsForUser } from '../repo/sessions.js';
import { deleteRemindersForUser } from '../repo/reminders.js';
import { clearSuspension } from '../repo/users.js';

// 每日資格比對(D-130 ①③④、D-143 ③b)。
// - 向 Discord 取全部成員與身份組,套用共用的 `member` 規則,與 `users` 比對
// - 有使用者列、未停用、不再符合資格 → 自動停用(suspended_auto = 1、suspended_by = NULL),刪除其 session 與提醒;資料保留
// - 自動停用、現在又符合資格 → 恢復(三欄清空)
// - 手動停權者(suspended_auto = 0)一律不動;沒有 users 列的新成員不處理(登入當下才驗證)
// - 順手清掉已過期的 session
// - 取不到成員名單(Discord 失敗)或名單為空 → 整次放棄、不做任何變更,避免誤把所有人停用

export interface SweepLogger {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
}

export interface SweepDeps {
  db: Db;
  discord: DiscordClient;
  permissions: Permissions;
  now: () => Date;
  log: SweepLogger;
}

export interface SweepSummary {
  skipped: boolean;
  suspended: number;
  restored: number;
  expiredSessionsRemoved: number;
}

interface UserState {
  id: string;
  discord_user_id: string;
  suspended_at: string | null;
  suspended_auto: number | null;
}

export async function runEligibilitySweep(deps: SweepDeps): Promise<SweepSummary> {
  const { db, discord, permissions, log } = deps;
  const now = deps.now();
  const summary: SweepSummary = { skipped: false, suspended: 0, restored: 0, expiredSessionsRemoved: 0 };

  let members;
  try {
    members = await discord.listGuildMembers();
  } catch (e) {
    log.warn({ event: 'eligibility_sweep', outcome: 'skipped', reason: 'discord_error', error: String((e as Error).message) });
    summary.skipped = true;
    return summary;
  }
  if (members.length === 0) {
    log.warn({ event: 'eligibility_sweep', outcome: 'skipped', reason: 'empty_member_list' });
    summary.skipped = true;
    return summary;
  }

  const eligible = new Set<string>();
  for (const m of members) if (permissions.can('member', m.roles)) eligible.add(m.user.id);

  const users = db.prepare('SELECT id, discord_user_id, suspended_at, suspended_auto FROM users').all() as UserState[];
  const nowIso = now.toISOString();

  db.transaction(() => {
    for (const u of users) {
      const ok = eligible.has(u.discord_user_id);
      if (u.suspended_at === null && !ok) {
        db.prepare('UPDATE users SET suspended_at = ?, suspended_auto = 1, suspended_by = NULL WHERE id = ?').run(nowIso, u.id);
        deleteSessionsForUser(db, u.id);
        deleteRemindersForUser(db, u.id);
        log.info({ event: 'eligibility_sweep', action: 'suspend', userId: u.id, discordUserId: u.discord_user_id });
        summary.suspended++;
      } else if (u.suspended_at !== null && u.suspended_auto === 1 && ok) {
        clearSuspension(db, u.id);
        log.info({ event: 'eligibility_sweep', action: 'restore', userId: u.id, discordUserId: u.discord_user_id });
        summary.restored++;
      }
    }
    summary.expiredSessionsRemoved = deleteExpiredSessions(db, now);
  })();

  log.info({ event: 'eligibility_sweep', outcome: 'done', ...summary });
  return summary;
}
