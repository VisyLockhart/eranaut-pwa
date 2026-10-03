import { randomUUID } from 'node:crypto';
import type { Db } from '../db/index.js';

// 瀏覽器推播訂閱(D-165):一個人可有多台裝置,endpoint 全域唯一。

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
}

/** 新增或更新;同一個 endpoint 已存在(同一個瀏覽器、可能換人登入)時改掛到目前的使用者並更新金鑰 */
export function upsertPushSubscription(
  db: Db,
  userId: string,
  s: { endpoint: string; p256dh: string; auth: string; userAgent: string | null },
  now: Date,
): void {
  db.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent`,
  ).run(randomUUID(), userId, s.endpoint, s.p256dh, s.auth, s.userAgent, now.toISOString());
}

export function listPushSubscriptions(db: Db, userId: string): PushSubscriptionRow[] {
  return db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY created_at').all(userId) as PushSubscriptionRow[];
}

export function countPushSubscriptions(db: Db, userId: string): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?').get(userId) as { n: number }).n;
}

/** 只刪屬於該使用者的那一筆;回傳是否真的刪到 */
export function deletePushSubscriptionByEndpoint(db: Db, userId: string, endpoint: string): boolean {
  return db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, endpoint).changes > 0;
}

export function deletePushSubscriptionById(db: Db, id: string): void {
  db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
}

export function deletePushSubscriptionsForUser(db: Db, userId: string): void {
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
}
