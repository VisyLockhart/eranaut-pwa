import { randomUUID } from 'node:crypto';
import { DEFAULT_NOTIFY_METHODS } from '@eranaut/shared';
import type { Db } from '../db/index.js';

export interface UserRow {
  id: string;
  discord_user_id: string;
  notify_methods: number;
  suspended_at: string | null;
  suspended_auto: number | null;
  suspended_by: string | null;
  created_at: string;
}

export function findUserByDiscordId(db: Db, discordUserId: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE discord_user_id = ?').get(discordUserId) as UserRow | undefined;
}

/** 通過資格檢查的首次登入才建立(D-136 ②) */
export function createUser(db: Db, discordUserId: string, now: Date): UserRow {
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, discord_user_id, notify_methods, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    discordUserId,
    DEFAULT_NOTIFY_METHODS,
    now.toISOString(),
  );
  return findUserByDiscordId(db, discordUserId)!;
}

/** 恢復使用:三個停用欄位清回 NULL(D-132 ③) */
export function clearSuspension(db: Db, userId: string): void {
  db.prepare('UPDATE users SET suspended_at = NULL, suspended_auto = NULL, suspended_by = NULL WHERE id = ?').run(userId);
}

export function getNotifyMethods(db: Db, userId: string): number {
  return (db.prepare('SELECT notify_methods FROM users WHERE id = ?').get(userId) as { notify_methods: number }).notify_methods;
}

export function setNotifyMethods(db: Db, userId: string, bits: number): void {
  db.prepare('UPDATE users SET notify_methods = ? WHERE id = ?').run(bits, userId);
}
