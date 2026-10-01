import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Db } from '../db/index.js';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** 距到期不足 29 天才續期,每天最多寫一次 DB(D-142 ②) */
export const RENEW_THRESHOLD_MS = 29 * 24 * 60 * 60 * 1000;

export interface SessionInfo {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  expiresAt: Date;
}

/** DB 只存雜湊,cookie 內是原始隨機值(D-35、D-142 ②) */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(
  db: Db,
  input: { userId: string; displayName: string; avatarUrl: string | null },
  now: Date,
): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  db.prepare(
    'INSERT INTO sessions (id, token_hash, user_id, display_name, avatar_url, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(randomUUID(), hashToken(token), input.userId, input.displayName, input.avatarUrl, now.toISOString(), expiresAt.toISOString());
  return { token, expiresAt };
}

interface Row {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  expires_at: string;
}

/**
 * 以 cookie 的原始值找 session。已停用的使用者視同無效(停用時本來就會刪 session,這裡是保險)。
 * 過期則刪除該列並回 null。需要時滑動續期:`expires_at` 重設為「現在 + 30 天」(不是累加),`renewed` 為 true 時呼叫端要重送 cookie。
 */
export function authenticateSession(db: Db, token: string, now: Date): { session: SessionInfo; renewed: boolean } | null {
  const row = db
    .prepare(
      `SELECT s.id, s.user_id, s.display_name, s.avatar_url, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND u.suspended_at IS NULL`,
    )
    .get(hashToken(token)) as Row | undefined;
  if (!row) return null;

  let expiresAt = new Date(row.expires_at);
  if (expiresAt.getTime() <= now.getTime()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(row.id);
    return null;
  }

  let renewed = false;
  if (expiresAt.getTime() - now.getTime() < RENEW_THRESHOLD_MS) {
    expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(expiresAt.toISOString(), row.id);
    renewed = true;
  }
  return {
    session: { id: row.id, userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_url, expiresAt },
    renewed,
  };
}

export function deleteSessionByToken(db: Db, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

/** 停用使用者時使用(D-130) */
export function deleteSessionsForUser(db: Db, userId: string): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}
