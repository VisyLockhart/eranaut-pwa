import { randomUUID } from 'node:crypto';
import type { OverviewDto, SubmarineDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { expectedReturnAt, type ValidSubmarine } from '../services/submarines.js';
import { getWorkshop, listWorkshops } from './workshops.js';

// 所有查詢都經由「工坊屬於該使用者」這一關,不可跨使用者。

const COLUMNS = 's.id, s.workshop_id, s.position, s.name, s.status, s.expected_return_at, s.last_synced_at';

export function listSubmarines(db: Db, userId: string, workshopId: string): SubmarineDto[] {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM submarines s JOIN workshops w ON w.id = s.workshop_id
       WHERE s.workshop_id = ? AND w.user_id = ? ORDER BY s.position`,
    )
    .all(workshopId, userId) as SubmarineDto[];
}

export function getOverview(db: Db, userId: string): OverviewDto {
  const subs = db
    .prepare(
      `SELECT ${COLUMNS} FROM submarines s JOIN workshops w ON w.id = s.workshop_id
       WHERE w.user_id = ? ORDER BY s.position`,
    )
    .all(userId) as SubmarineDto[];
  const byWorkshop = new Map<string, SubmarineDto[]>();
  for (const s of subs) byWorkshop.set(s.workshop_id, [...(byWorkshop.get(s.workshop_id) ?? []), s]);
  return { workshops: listWorkshops(db, userId).map((w) => ({ ...w, submarines: byWorkshop.get(w.id) ?? [] })) };
}

/**
 * 以 (workshop_id, position) UPSERT,整批在同一個交易內(全成功或全不寫)。
 * 工坊不存在或不屬於該使用者回 undefined。回傳該工坊目前全部潛艇。
 * 既有列保留原 id,只覆蓋名稱/狀態/返航時間/同步時間(D-44:只存最新快照)。
 */
export function upsertSubmarines(db: Db, userId: string, workshopId: string, items: ValidSubmarine[], now: Date): SubmarineDto[] | undefined {
  if (!getWorkshop(db, userId, workshopId)) return undefined;
  const stmt = db.prepare(
    `INSERT INTO submarines (id, workshop_id, position, name, status, expected_return_at, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(workshop_id, position) DO UPDATE SET
       name = excluded.name, status = excluded.status,
       expected_return_at = excluded.expected_return_at, last_synced_at = excluded.last_synced_at`,
  );
  db.transaction(() => {
    for (const v of items) stmt.run(randomUUID(), workshopId, v.position, v.name, v.status, expectedReturnAt(v, now), now.toISOString());
  })();
  // TODO(提醒模組):依 D-139 對這些潛艇(整批模式則該工坊)upsert 提醒,並提示預先提醒時間已過者(D-135)
  return listSubmarines(db, userId, workshopId);
}
