import { NotifyMethod } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { countPushSubscriptions, deletePushSubscriptionByEndpoint, upsertPushSubscription } from '../repo/push.js';
import { getNotifyMethods, setNotifyMethods } from '../repo/users.js';
import { syncUserReminders } from './reminders.js';

// 推播訂閱與提醒方式位元的同步(D-165):
// - 登記第一台裝置(或任何一台)→ 打開推播位元,提醒隨之重算(新增 push delivery)
// - 最後一台裝置移除、或所有訂閱都失效 → 關閉推播位元並重算
// 寫入與重算放在同一個交易內,與 DM / 頻道的作法一致(D-139)。

export function registerPushSubscription(
  db: Db,
  userId: string,
  s: { endpoint: string; p256dh: string; auth: string; userAgent: string | null },
  now: Date,
): void {
  db.transaction(() => {
    upsertPushSubscription(db, userId, s, now);
    const bits = getNotifyMethods(db, userId);
    if ((bits & NotifyMethod.Push) === 0) setNotifyMethods(db, userId, bits | NotifyMethod.Push);
    syncUserReminders(db, userId, now);
  })();
}

/** 沒有訂閱了就關閉推播位元並重算(推播服務回報全部失效、或使用者移除最後一台裝置) */
export function clearPushIfNoSubscriptions(db: Db, userId: string, now: Date): void {
  db.transaction(() => {
    if (countPushSubscriptions(db, userId) > 0) return;
    const bits = getNotifyMethods(db, userId);
    if ((bits & NotifyMethod.Push) === 0) return;
    setNotifyMethods(db, userId, bits & ~NotifyMethod.Push);
    syncUserReminders(db, userId, now);
  })();
}

export function removePushSubscription(db: Db, userId: string, endpoint: string, now: Date): boolean {
  return db.transaction(() => {
    const removed = deletePushSubscriptionByEndpoint(db, userId, endpoint);
    clearPushIfNoSubscriptions(db, userId, now);
    return removed;
  })();
}
