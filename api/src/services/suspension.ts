import type { Db } from '../db/index.js';
import { deleteRemindersForUser } from '../repo/reminders.js';
import { deleteSessionsForUser } from '../repo/sessions.js';

// 停用使用者(D-130、D-132):每日比對與管理員指令共用。
// 效果:標記停用、刪除全部 session 與提醒(deliveries CASCADE);工坊與潛艇保留。

export type Suspension = { kind: 'auto' } | { kind: 'manual'; byDiscordId: string };

export function suspendUser(db: Db, userId: string, s: Suspension, now: Date): void {
  db.prepare('UPDATE users SET suspended_at = ?, suspended_auto = ?, suspended_by = ? WHERE id = ?').run(
    now.toISOString(),
    s.kind === 'auto' ? 1 : 0,
    s.kind === 'manual' ? s.byDiscordId : null,
    userId,
  );
  deleteSessionsForUser(db, userId);
  deleteRemindersForUser(db, userId);
}
