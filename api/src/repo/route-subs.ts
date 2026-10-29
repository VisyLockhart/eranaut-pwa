import { randomUUID } from 'node:crypto';
import type { RouteSubDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidRouteSub } from '../services/route-subs.js';

// 所有查詢都帶 user_id,任何查詢都不可跨使用者(CLAUDE.md §5)。

const COLUMNS = 'id, name, level, hull, stern, bow, bridge, favorite, created_at, updated_at';

type Row = Omit<RouteSubDto, 'favorite'> & { favorite: number };

function toDto(r: Row): RouteSubDto {
  return { ...r, favorite: r.favorite === 1 };
}

export function listRouteSubs(db: Db, userId: string): RouteSubDto[] {
  return (db.prepare(`SELECT ${COLUMNS} FROM route_subs WHERE user_id = ? ORDER BY created_at, rowid`).all(userId) as Row[]).map(toDto);
}

export function getRouteSub(db: Db, userId: string, id: string): RouteSubDto | undefined {
  const row = db.prepare(`SELECT ${COLUMNS} FROM route_subs WHERE id = ? AND user_id = ?`).get(id, userId) as Row | undefined;
  return row ? toDto(row) : undefined;
}

export function countRouteSubs(db: Db, userId: string): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM route_subs WHERE user_id = ?').get(userId) as { n: number }).n;
}

export function insertRouteSub(db: Db, userId: string, v: ValidRouteSub, now: Date): RouteSubDto {
  const id = randomUUID();
  const t = now.toISOString();
  db.prepare(
    `INSERT INTO route_subs (id, user_id, name, level, hull, stern, bow, bridge, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, v.name, v.level, v.hull, v.stern, v.bow, v.bridge, t, t);
  return getRouteSub(db, userId, id)!;
}

/** 整筆取代可編輯欄位;找不到(或不是自己的)回 undefined */
export function replaceRouteSub(db: Db, userId: string, id: string, v: ValidRouteSub, now: Date): RouteSubDto | undefined {
  return db.transaction(() => {
    const res = db
      .prepare(
        `UPDATE route_subs SET name = ?, level = ?, hull = ?, stern = ?, bow = ?, bridge = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .run(v.name, v.level, v.hull, v.stern, v.bow, v.bridge, now.toISOString(), id, userId);
    if (res.changes === 0) return undefined;
      return getRouteSub(db, userId, id);
  })();
}

/** 切換常用:不動其他欄位與 updated_at;找不到(或不是自己的)回 undefined */
export function setRouteSubFavorite(db: Db, userId: string, id: string, favorite: boolean): RouteSubDto | undefined {
  const res = db.prepare('UPDATE route_subs SET favorite = ? WHERE id = ? AND user_id = ?').run(favorite ? 1 : 0, id, userId);
  return res.changes === 0 ? undefined : getRouteSub(db, userId, id);
}

export function deleteRouteSub(db: Db, userId: string, id: string): boolean {
  return db.prepare('DELETE FROM route_subs WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}
