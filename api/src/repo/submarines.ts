import { randomUUID } from 'node:crypto';
import type { OverviewDto, SubmarineDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { expectedReturnAt, type ValidSubmarine } from '../services/submarines.js';
import { attachBuild } from './build.js';
import { attachProgress, settleOnDispatch } from './progress.js';
import { countVoyage, attachUpkeep } from './upkeep.js';
import { getWorkshop, listWorkshops } from './workshops.js';

// 所有查詢都經由「工坊屬於該使用者」這一關,不可跨使用者。

const COLUMNS = 's.id, s.workshop_id, s.position, s.name, s.status, s.expected_return_at, s.last_synced_at';

/** 附上維修提醒、等級與配件(都是選填:沒開啟 / 沒填的潛艇不加欄位) */
function attachExtras(db: Db, subs: SubmarineDto[], now: Date): SubmarineDto[] {
  return attachBuild(db, attachProgress(db, attachUpkeep(db, subs), now));
}

export function listSubmarines(db: Db, userId: string, workshopId: string, now: Date = new Date()): SubmarineDto[] {
  const rows = db
    .prepare(
      `SELECT ${COLUMNS} FROM submarines s JOIN workshops w ON w.id = s.workshop_id
       WHERE s.workshop_id = ? AND w.user_id = ? ORDER BY s.position`,
    )
    .all(workshopId, userId) as SubmarineDto[];
  return attachExtras(db, rows, now);
}

/** 以潛艇 id 取單艘(含維修提醒狀態);不是該使用者的回 undefined */
export function getSubmarine(db: Db, userId: string, submarineId: string, now: Date = new Date()): SubmarineDto | undefined {
  const row = db
    .prepare(
      `SELECT ${COLUMNS} FROM submarines s JOIN workshops w ON w.id = s.workshop_id
       WHERE s.id = ? AND w.user_id = ?`,
    )
    .get(submarineId, userId) as SubmarineDto | undefined;
  return row ? attachExtras(db, [row], now)[0] : undefined;
}

export function getOverview(db: Db, userId: string, now: Date = new Date()): OverviewDto {
  const subs = db
    .prepare(
      `SELECT ${COLUMNS} FROM submarines s JOIN workshops w ON w.id = s.workshop_id
       WHERE w.user_id = ? ORDER BY s.position`,
    )
    .all(userId) as SubmarineDto[];
  const withUpkeep = attachExtras(db, subs, now);
  const byWorkshop = new Map<string, SubmarineDto[]>();
  for (const s of withUpkeep) byWorkshop.set(s.workshop_id, [...(byWorkshop.get(s.workshop_id) ?? []), s]);
  return { workshops: listWorkshops(db, userId).map((w) => ({ ...w, submarines: byWorkshop.get(w.id) ?? [] })) };
}

/**
 * 以 (workshop_id, position) UPSERT,整批在同一個交易內(全成功或全不寫)。
 * 工坊不存在或不屬於該使用者回 undefined。回傳該工坊目前全部潛艇。
 * 既有列保留原 id,只覆蓋名稱/狀態/返航時間/同步時間(D-44:只存最新快照)。
 * 配件維修提醒的計次(D-288)掛在這裡:整坊與單艘更新都經過此函式,先讀舊列再覆寫,
 * 「探索還沒回來就重送」因此不會重複計次。本次請求帶 `upkeep`(開啟 / 關閉)的潛艇由呼叫端另行處理,不在這裡計次。
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
  const prev = new Map(
    (db.prepare('SELECT id, position, status, expected_return_at FROM submarines WHERE workshop_id = ?').all(workshopId) as {
      id: string;
      position: number;
      status: 'exploring' | 'complete';
      expected_return_at: string | null;
    }[]).map((r) => [r.position, r]),
  );
  db.transaction(() => {
    for (const v of items) {
      stmt.run(randomUUID(), workshopId, v.position, v.name, v.status, expectedReturnAt(v, now), now.toISOString());
      const p = prev.get(v.position);
      if (p && v.upkeep === undefined) countVoyage(db, p.id, p, v, now);
      // 等級(D-289):上一趟已返航又派出新的一趟 → 先把上一趟待結算的經驗寫進等級
      if (p) settleOnDispatch(db, p.id, p, v, now);
    }
  })();
  return listSubmarines(db, userId, workshopId, now);
}
