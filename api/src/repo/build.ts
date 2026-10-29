import type { BuildDto, SubmarineDto, UpkeepParts } from '@eranaut/shared';
import type { Db } from '../db/index.js';

// 潛艇自己的配件(D-296)。一艘潛艇最多一列,列存在 = 已設定。呼叫端須先確認潛艇屬於該使用者。

interface Row extends BuildDto {
  submarine_id: string;
}

/** 把配件附到潛艇上(沒設定的潛艇不加欄位) */
export function attachBuild(db: Db, subs: SubmarineDto[]): SubmarineDto[] {
  if (subs.length === 0) return subs;
  const rows = db
    .prepare(`SELECT submarine_id, hull, stern, bow, bridge, updated_at FROM submarine_build WHERE submarine_id IN (${subs.map(() => '?').join(',')})`)
    .all(...subs.map((s) => s.id)) as Row[];
  const byId = new Map(rows.map((r) => [r.submarine_id, { hull: r.hull, stern: r.stern, bow: r.bow, bridge: r.bridge, updated_at: r.updated_at }]));
  return subs.map((s) => (byId.has(s.id) ? { ...s, build: byId.get(s.id)! } : s));
}

/** 這艘潛艇目前的配件;沒設定回 undefined */
export function getBuildParts(db: Db, submarineId: string): UpkeepParts | undefined {
  return db.prepare('SELECT hull, stern, bow, bridge FROM submarine_build WHERE submarine_id = ?').get(submarineId) as UpkeepParts | undefined;
}

export function saveBuild(db: Db, submarineId: string, p: UpkeepParts, now: Date): void {
  db.prepare(
    `INSERT INTO submarine_build (submarine_id, hull, stern, bow, bridge, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(submarine_id) DO UPDATE SET hull = excluded.hull, stern = excluded.stern, bow = excluded.bow, bridge = excluded.bridge, updated_at = excluded.updated_at`,
  ).run(submarineId, p.hull, p.stern, p.bow, p.bridge, now.toISOString());
}

export function deleteBuild(db: Db, submarineId: string): void {
  db.prepare('DELETE FROM submarine_build WHERE submarine_id = ?').run(submarineId);
}
