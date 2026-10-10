import { randomUUID } from 'node:crypto';
import type { RouteFilterDto, RouteFilterSpec } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidRouteFilter } from '../services/route-filters.js';

// 所有查詢都帶 user_id,任何查詢都不可跨使用者(CLAUDE.md §5)。spec 以 JSON 文字整筆讀寫。

const COLUMNS = 'id, name, spec, favorite, created_at, updated_at';

interface Row {
  id: string;
  name: string;
  spec: string;
  favorite: number;
  created_at: string;
  updated_at: string;
}

const toDto = (r: Row): RouteFilterDto => ({ ...r, spec: JSON.parse(r.spec) as RouteFilterSpec, favorite: r.favorite === 1 });

export function listRouteFilters(db: Db, userId: string): RouteFilterDto[] {
  return (db.prepare(`SELECT ${COLUMNS} FROM route_filters WHERE user_id = ? ORDER BY created_at, rowid`).all(userId) as Row[]).map(toDto);
}

export function getRouteFilter(db: Db, userId: string, id: string): RouteFilterDto | undefined {
  const row = db.prepare(`SELECT ${COLUMNS} FROM route_filters WHERE id = ? AND user_id = ?`).get(id, userId) as Row | undefined;
  return row ? toDto(row) : undefined;
}

export function countRouteFilters(db: Db, userId: string): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM route_filters WHERE user_id = ?').get(userId) as { n: number }).n;
}

export function insertRouteFilter(db: Db, userId: string, v: ValidRouteFilter, now: Date): RouteFilterDto {
  const id = randomUUID();
  const t = now.toISOString();
  db.prepare('INSERT INTO route_filters (id, user_id, name, spec, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    userId,
    v.name,
    JSON.stringify(v.spec),
    t,
    t,
  );
  return getRouteFilter(db, userId, id)!;
}

/** 整筆取代;找不到(或不是自己的)回 undefined */
export function replaceRouteFilter(db: Db, userId: string, id: string, v: ValidRouteFilter, now: Date): RouteFilterDto | undefined {
  const res = db
    .prepare('UPDATE route_filters SET name = ?, spec = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(v.name, JSON.stringify(v.spec), now.toISOString(), id, userId);
  return res.changes === 0 ? undefined : getRouteFilter(db, userId, id);
}

/** 切換常用:不動其他欄位與 updated_at;找不到(或不是自己的)回 undefined */
export function setRouteFilterFavorite(db: Db, userId: string, id: string, favorite: boolean): RouteFilterDto | undefined {
  const res = db.prepare('UPDATE route_filters SET favorite = ? WHERE id = ? AND user_id = ?').run(favorite ? 1 : 0, id, userId);
  return res.changes === 0 ? undefined : getRouteFilter(db, userId, id);
}

export function deleteRouteFilter(db: Db, userId: string, id: string): boolean {
  return db.prepare('DELETE FROM route_filters WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}
