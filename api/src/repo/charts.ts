import type { WorkshopChartDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidChartSea } from '../services/charts.js';

// 海圖探索紀錄(D-293)。所有查詢都經過工坊的 user_id,不可跨使用者(CLAUDE.md §5)。

interface Row {
  workshop_id: string;
  sea: number;
  points: string;
  updated_at: string;
}

const toDto = (r: Row): WorkshopChartDto => ({ sea: r.sea, points: JSON.parse(r.points) as number[], updated_at: r.updated_at });

/** 某間工坊的紀錄,依海域排序;工坊不屬於該使用者時為空陣列(呼叫端另外檢查工坊是否存在) */
export function listCharts(db: Db, userId: string, workshopId: string): WorkshopChartDto[] {
  return (
    db
      .prepare(
        `SELECT c.workshop_id, c.sea, c.points, c.updated_at FROM workshop_charts c JOIN workshops w ON w.id = c.workshop_id
         WHERE c.workshop_id = ? AND w.user_id = ? ORDER BY c.sea`,
      )
      .all(workshopId, userId) as Row[]
  ).map(toDto);
}

/** 使用者全部工坊的紀錄:工坊 id → 紀錄(依海域排序);給總覽用 */
export function listChartsByWorkshop(db: Db, userId: string): Map<string, WorkshopChartDto[]> {
  const rows = db
    .prepare(
      `SELECT c.workshop_id, c.sea, c.points, c.updated_at FROM workshop_charts c JOIN workshops w ON w.id = c.workshop_id
       WHERE w.user_id = ? ORDER BY c.sea`,
    )
    .all(userId) as Row[];
  const out = new Map<string, WorkshopChartDto[]>();
  for (const r of rows) out.set(r.workshop_id, [...(out.get(r.workshop_id) ?? []), toDto(r)]);
  return out;
}

/** 覆寫列出的海域(同一個交易);`points` 為空 = 刪除該海域。呼叫端需先確認工坊屬於該使用者 */
export function saveCharts(db: Db, workshopId: string, seas: readonly ValidChartSea[], now: Date): void {
  const upsert = db.prepare(
    `INSERT INTO workshop_charts (workshop_id, sea, points, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(workshop_id, sea) DO UPDATE SET points = excluded.points, updated_at = excluded.updated_at`,
  );
  const remove = db.prepare('DELETE FROM workshop_charts WHERE workshop_id = ? AND sea = ?');
  db.transaction(() => {
    for (const s of seas) {
      if (s.points.length === 0) remove.run(workshopId, s.sea);
      else upsert.run(workshopId, s.sea, JSON.stringify(s.points), now.toISOString());
    }
  })();
}
