import type { Db } from '../db/index.js';
import { NotifyMethod } from '@eranaut/shared';
import { deletePushSubscriptionsForUser } from '../repo/push.js';
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
  // 推播訂閱一併撤銷(D-165):停用者的裝置不再收到任何通知;推播位元也清掉,恢復後要重新在裝置上開啟
  deletePushSubscriptionsForUser(db, userId);
  db.prepare('UPDATE users SET notify_methods = notify_methods & ? WHERE id = ?').run(~NotifyMethod.Push, userId);
}
