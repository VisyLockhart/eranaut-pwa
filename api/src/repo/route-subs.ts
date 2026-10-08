import { randomUUID } from 'node:crypto';
import type { RouteSubDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidRouteSub } from '../services/route-subs.js';

// 所有查詢都帶 user_id,任何查詢都不可跨使用者(CLAUDE.md §5)。

const COLUMNS = 'id, name, level, hull, stern, bow, bridge, created_at, updated_at';

type Row = Omit<RouteSubDto, 'bound_submarine_ids'>;

function withBindings(db: Db, rows: Row[]): RouteSubDto[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const b = db
    .prepare(`SELECT route_sub_id, submarine_id FROM route_sub_bindings WHERE route_sub_id IN (${ids.map(() => '?').join(',')}) ORDER BY rowid`)
    .all(...ids) as { route_sub_id: string; submarine_id: string }[];
  return rows.map((r) => ({ ...r, bound_submarine_ids: b.filter((x) => x.route_sub_id === r.id).map((x) => x.submarine_id) }));
}

/** 整組取代這組配置的綁定;其他配置已綁的同一艘潛艇會被搬過來(一艘艇只綁一組)。呼叫端須先確認潛艇都是本人的 */
function setBindings(db: Db, routeSubId: string, submarineIds: string[]): void {
  db.prepare('DELETE FROM route_sub_bindings WHERE route_sub_id = ?').run(routeSubId);
  const del = db.prepare('DELETE FROM route_sub_bindings WHERE submarine_id = ?');
  const ins = db.prepare('INSERT INTO route_sub_bindings (route_sub_id, submarine_id) VALUES (?, ?)');
  for (const sid of submarineIds) {
    del.run(sid);
    ins.run(routeSubId, sid);
  }
}

export function listRouteSubs(db: Db, userId: string): RouteSubDto[] {
  return withBindings(db, db.prepare(`SELECT ${COLUMNS} FROM route_subs WHERE user_id = ? ORDER BY created_at, rowid`).all(userId) as Row[]);
}

export function getRouteSub(db: Db, userId: string, id: string): RouteSubDto | undefined {
  const row = db.prepare(`SELECT ${COLUMNS} FROM route_subs WHERE id = ? AND user_id = ?`).get(id, userId) as Row | undefined;
  return row ? withBindings(db, [row])[0] : undefined;
}

export function countRouteSubs(db: Db, userId: string): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM route_subs WHERE user_id = ?').get(userId) as { n: number }).n;
}

/** 這些工坊潛艇是不是都是這位使用者的(經由工坊) */
export function ownsAllSubmarines(db: Db, userId: string, submarineIds: string[]): boolean {
  return submarineIds.every((id) => ownsSubmarine(db, userId, id));
}

/** 這艘工坊潛艇是不是這位使用者的(經由工坊) */
export function ownsSubmarine(db: Db, userId: string, submarineId: string): boolean {
  return (
    db
      .prepare('SELECT 1 FROM submarines s JOIN workshops w ON w.id = s.workshop_id WHERE s.id = ? AND w.user_id = ?')
      .get(submarineId, userId) !== undefined
  );
}

export function insertRouteSub(db: Db, userId: string, v: ValidRouteSub, now: Date): RouteSubDto {
  const id = randomUUID();
  const t = now.toISOString();
  db.prepare(
    `INSERT INTO route_subs (id, user_id, name, level, hull, stern, bow, bridge, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, v.name, v.level, v.hull, v.stern, v.bow, v.bridge, t, t);
  setBindings(db, id, v.bound_submarine_ids);
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
    setBindings(db, id, v.bound_submarine_ids);
    return getRouteSub(db, userId, id);
  })();
}

export function deleteRouteSub(db: Db, userId: string, id: string): boolean {
  return db.prepare('DELETE FROM route_subs WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}
