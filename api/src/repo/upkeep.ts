import type { SubmarineDto, UpkeepDto, UpkeepParts } from '@eranaut/shared';
import { nextVoyagesDone, upkeepPartsSig } from '@eranaut/shared';
import type { Db } from '../db/index.js';

// 配件維修提醒(D-288)。一艘潛艇最多一列,列存在 = 已開啟。呼叫端須先確認潛艇屬於該使用者。

interface Row {
  submarine_id: string;
  route_key: string;
  route_sea: number;
  route_points: string;
  voyages_done: number;
  limit_voyages: number;
  parts_sig: string;
  repaired_at: string | null;
  updated_at: string;
  hull: number | null;
  stern: number | null;
  bow: number | null;
  bridge: number | null;
}

// 目前綁定的配置零件(沒綁定為 NULL),用來和開啟當時的 parts_sig 比對
const SELECT = `
SELECT u.submarine_id, u.route_key, u.route_sea, u.route_points, u.voyages_done, u.limit_voyages, u.parts_sig,
       u.repaired_at, u.updated_at, rs.hull, rs.stern, rs.bow, rs.bridge
FROM submarine_upkeep u
LEFT JOIN route_sub_bindings b ON b.submarine_id = u.submarine_id
LEFT JOIN route_subs rs ON rs.id = b.route_sub_id`;

function toDto(r: Row): UpkeepDto {
  return {
    route_key: r.route_key,
    route_sea: r.route_sea,
    route_points: JSON.parse(r.route_points) as string[],
    voyages_done: r.voyages_done,
    limit_voyages: r.limit_voyages,
    parts_sig: r.parts_sig,
    current_sig: r.hull === null ? null : upkeepPartsSig({ hull: r.hull, stern: r.stern!, bow: r.bow!, bridge: r.bridge! }),
    repaired_at: r.repaired_at,
    updated_at: r.updated_at,
  };
}

/** 把維修提醒狀態附到潛艇上(沒開啟的潛艇不加欄位) */
export function attachUpkeep(db: Db, subs: SubmarineDto[]): SubmarineDto[] {
  if (subs.length === 0) return subs;
  const rows = db.prepare(`${SELECT} WHERE u.submarine_id IN (${subs.map(() => '?').join(',')})`).all(...subs.map((s) => s.id)) as Row[];
  const byId = new Map(rows.map((r) => [r.submarine_id, toDto(r)]));
  return subs.map((s) => (byId.has(s.id) ? { ...s, upkeep: byId.get(s.id)! } : s));
}

/** 這艘潛艇目前綁定的配置零件;沒綁定回 undefined */
export function getBoundParts(db: Db, submarineId: string): UpkeepParts | undefined {
  return db
    .prepare('SELECT rs.hull, rs.stern, rs.bow, rs.bridge FROM route_sub_bindings b JOIN route_subs rs ON rs.id = b.route_sub_id WHERE b.submarine_id = ?')
    .get(submarineId) as UpkeepParts | undefined;
}

export interface UpkeepWrite {
  route_key: string;
  route_sea: number;
  route_points: string[];
  voyages_done: number;
  limit_voyages: number;
  parts_sig: string;
}

/** 開啟(或重新設定)維修提醒;`repaired` 為 true 時記錄維修時間 */
export function saveUpkeep(db: Db, submarineId: string, w: UpkeepWrite, repaired: boolean, now: Date): void {
  const t = now.toISOString();
  db.prepare(
    `INSERT INTO submarine_upkeep (submarine_id, route_key, route_sea, route_points, voyages_done, limit_voyages, parts_sig, repaired_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(submarine_id) DO UPDATE SET route_key = excluded.route_key, route_sea = excluded.route_sea, route_points = excluded.route_points,
       voyages_done = excluded.voyages_done, limit_voyages = excluded.limit_voyages, parts_sig = excluded.parts_sig,
       repaired_at = excluded.repaired_at, updated_at = excluded.updated_at`,
  ).run(submarineId, w.route_key, w.route_sea, JSON.stringify(w.route_points), w.voyages_done, w.limit_voyages, w.parts_sig, repaired ? t : null, t);
}

export function deleteUpkeep(db: Db, submarineId: string): boolean {
  return db.prepare('DELETE FROM submarine_upkeep WHERE submarine_id = ?').run(submarineId).changes > 0;
}

export function getUpkeepRow(db: Db, submarineId: string): { voyages_done: number; limit_voyages: number } | undefined {
  return db.prepare('SELECT voyages_done, limit_voyages FROM submarine_upkeep WHERE submarine_id = ?').get(submarineId) as
    | { voyages_done: number; limit_voyages: number }
    | undefined;
}

/** 手動調整趟數 / 上限(不動 parts_sig 與 repaired_at) */
export function patchUpkeep(db: Db, submarineId: string, p: { voyages_done?: number; limit_voyages?: number }, now: Date): boolean {
  const cur = getUpkeepRow(db, submarineId);
  if (!cur) return false;
  db.prepare('UPDATE submarine_upkeep SET voyages_done = ?, limit_voyages = ?, updated_at = ? WHERE submarine_id = ?').run(
    p.voyages_done ?? cur.voyages_done,
    p.limit_voyages ?? cur.limit_voyages,
    now.toISOString(),
    submarineId,
  );
  return true;
}

/** 標示已維修:趟數歸 0 */
export function markRepaired(db: Db, submarineIds: string[], now: Date): void {
  const stmt = db.prepare('UPDATE submarine_upkeep SET voyages_done = 0, repaired_at = ?, updated_at = ? WHERE submarine_id = ?');
  const t = now.toISOString();
  for (const id of submarineIds) stmt.run(t, t, id);
}

/**
 * 更新潛艇時的計次(D-288):送出「探索中」且上一筆已返航才 +1;已用盡又出航視為已維修。
 * 沒開啟的潛艇什麼都不做。必須在覆寫潛艇列「之前」取得 `prev`。
 */
export function countVoyage(
  db: Db,
  submarineId: string,
  prev: { status: 'exploring' | 'complete'; expected_return_at: string | null },
  next: { status: 'exploring' | 'complete' },
  now: Date,
): void {
  const cur = getUpkeepRow(db, submarineId);
  if (!cur) return;
  const r = nextVoyagesDone(cur.voyages_done, cur.limit_voyages, prev, next, now);
  if (r.voyages_done === cur.voyages_done && !r.repaired) return;
  const t = now.toISOString();
  db.prepare('UPDATE submarine_upkeep SET voyages_done = ?, repaired_at = CASE WHEN ? THEN ? ELSE repaired_at END, updated_at = ? WHERE submarine_id = ?').run(
    r.voyages_done,
    r.repaired ? 1 : 0,
    t,
    t,
    submarineId,
  );
}

/** 某間工坊內「趟數已用盡」的潛艇(提醒文案用):位置、已跑 / 上限、零件簽名 */
export function listExhausted(db: Db, workshopId: string): { position: number; voyages_done: number; limit_voyages: number; parts_sig: string }[] {
  return db
    .prepare(
      `SELECT s.position, u.voyages_done, u.limit_voyages, u.parts_sig
       FROM submarine_upkeep u JOIN submarines s ON s.id = u.submarine_id
       WHERE s.workshop_id = ? AND u.voyages_done >= u.limit_voyages ORDER BY s.position`,
    )
    .all(workshopId) as { position: number; voyages_done: number; limit_voyages: number; parts_sig: string }[];
}
