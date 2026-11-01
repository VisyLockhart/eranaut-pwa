import { randomUUID } from 'node:crypto';
import { LIMITS, type SubmarineDto, type SubmarinesChangeResult, type SubmarineTransferMode } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { getSubmarine, listSubmarines } from '../repo/submarines.js';
import { getWorkshop } from '../repo/workshops.js';
import { syncWorkshopReminders } from './reminders.js';

// 工坊管理模式(D-313、D-314、D-315):新增 / 刪除 / 搬移 / 複製 / 位置編輯。
// 每個操作都是「寫入 + 重算受影響工坊的提醒」放在同一個交易內,全成功或全不寫(D-139)。

/** 被拒絕的管理操作;路由依 `status` 回應 */
export class ManageRejected extends Error {
  constructor(
    readonly status: 400 | 404 | 409,
    readonly code: 'not_found' | 'validation_failed' | 'too_many_submarines',
  ) {
    super(code);
  }
}

const COPY_SUFFIX = '(複製)';

interface Row {
  id: string;
  position: number;
  name: string | null;
}

function rowsOf(db: Db, workshopId: string): Row[] {
  return db.prepare('SELECT id, position, name FROM submarines WHERE workshop_id = ? ORDER BY position').all(workshopId) as Row[];
}

/** 該工坊第一個空位(1~20);滿了回 undefined */
function freePosition(db: Db, workshopId: string): number | undefined {
  const used = new Set(rowsOf(db, workshopId).map((r) => r.position));
  for (let p = 1; p <= LIMITS.maxSubmarineRecords; p++) if (!used.has(p)) return p;
  return undefined;
}

/** 刪除後預設重排:剩下的依原順序補成 1、2、3…(先全改負數,避開唯一約束) */
function compact(db: Db, workshopId: string): void {
  const rows = rowsOf(db, workshopId);
  db.prepare('UPDATE submarines SET position = -position WHERE workshop_id = ?').run(workshopId);
  const set = db.prepare('UPDATE submarines SET position = ? WHERE id = ?');
  rows.forEach((r, i) => set.run(i + 1, r.id));
}

function requireWorkshop(db: Db, userId: string, workshopId: unknown): string {
  if (typeof workshopId !== 'string' || !getWorkshop(db, userId, workshopId)) throw new ManageRejected(404, 'not_found');
  return workshopId;
}

/** 一串潛艇 id:必須是非空、不重複、全都屬於該工坊 */
function requireOwnIds(db: Db, workshopId: string, ids: unknown): string[] {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== 'string') || new Set(ids).size !== ids.length) throw new ManageRejected(400, 'validation_failed');
  const own = new Set(rowsOf(db, workshopId).map((r) => r.id));
  for (const i of ids as string[]) if (!own.has(i)) throw new ManageRejected(404, 'not_found');
  return ids as string[];
}

function result(db: Db, userId: string, workshopIds: string[], createdIds: string[], now: Date): SubmarinesChangeResult {
  return {
    workshops: [...new Set(workshopIds)].map((id) => ({ workshop_id: id, submarines: listSubmarines(db, userId, id, now) })),
    created_ids: createdIds,
  };
}

function insertRegistered(db: Db, workshopId: string, position: number, name: string | null, now: Date): string {
  const id = randomUUID();
  db.prepare("INSERT INTO submarines (id, workshop_id, position, name, status, expected_return_at, last_synced_at) VALUES (?, ?, ?, ?, 'registered', NULL, ?)").run(id, workshopId, position, name, now.toISOString());
  return id;
}

function copyName(name: string | null, sameWorkshop: boolean): string | null {
  if (!sameWorkshop || name === null) return name;
  const base = [...name].slice(0, Math.max(0, LIMITS.submarineName - [...COPY_SUFFIX].length)).join('');
  return `${base}${COPY_SUFFIX}`;
}

/** 新增一艘「新登記」的潛艇(名稱選填),放在第一個空位 */
export function createSubmarine(db: Db, userId: string, workshopId: string, body: unknown, now: Date): SubmarinesChangeResult {
  return db.transaction(() => {
    requireWorkshop(db, userId, workshopId);
    const raw = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>).name : undefined;
    let name: string | null = null;
    if (raw !== undefined && raw !== null) {
      if (typeof raw !== 'string') throw new ManageRejected(400, 'validation_failed');
      const v = raw.trim();
      if ([...v].length > LIMITS.submarineName) throw new ManageRejected(400, 'validation_failed');
      name = v === '' ? null : v;
    }
    const pos = freePosition(db, workshopId);
    if (pos === undefined) throw new ManageRejected(409, 'too_many_submarines');
    const id = insertRegistered(db, workshopId, pos, name, now);
    syncWorkshopReminders(db, workshopId, now);
    return result(db, userId, [workshopId], [id], now);
  })();
}

/** 刪除多艘(連同等級、配件、維修提醒、返航提醒),剩下的預設重排 */
export function deleteSubmarines(db: Db, userId: string, workshopId: string, body: unknown, now: Date): SubmarinesChangeResult {
  return db.transaction(() => {
    requireWorkshop(db, userId, workshopId);
    const ids = requireOwnIds(db, workshopId, typeof body === 'object' && body !== null ? (body as Record<string, unknown>).submarine_ids : undefined);
    const del = db.prepare('DELETE FROM submarines WHERE id = ?');
    for (const id of ids) del.run(id);
    compact(db, workshopId);
    syncWorkshopReminders(db, workshopId, now);
    return result(db, userId, [workshopId], [], now);
  })();
}

/** 搬移 / 複製(含複製+搬移的多目的地);規則見 `SubmarinesTransferInput` */
export function transferSubmarines(db: Db, userId: string, body: unknown, now: Date): SubmarinesChangeResult {
  return db.transaction(() => {
    const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    const source = requireWorkshop(db, userId, b.source_workshop_id);
    const mode = b.mode as SubmarineTransferMode;
    if (mode !== 'move' && mode !== 'copy') throw new ManageRejected(400, 'validation_failed');
    const ids = requireOwnIds(db, source, b.submarine_ids);
    const t = b.target_workshop_ids;
    if (!Array.isArray(t) || t.length === 0 || new Set(t).size !== t.length) throw new ManageRejected(400, 'validation_failed');
    const targets = t.map((w) => requireWorkshop(db, userId, w));
    if (mode === 'move' && (targets.length !== 1 || targets[0] === source)) throw new ManageRejected(400, 'validation_failed');

    const created: string[] = [];
    if (mode === 'move') {
      const target = targets[0]!;
      const upd = db.prepare('UPDATE submarines SET workshop_id = ?, position = ? WHERE id = ?');
      const rem = db.prepare('UPDATE reminders SET workshop_id = ? WHERE submarine_id = ?');
      for (const id of ids) {
        const pos = freePosition(db, target);
        if (pos === undefined) throw new ManageRejected(409, 'too_many_submarines');
        upd.run(target, pos, id);
        rem.run(target, id);
      }
      compact(db, source);
    } else {
      // 複本只帶名稱、配件、等級與經驗(D-313 ②);狀態「新登記」(D-315)
      const originals = ids.map((id) => getSubmarine(db, userId, id, now)!);
      for (const target of targets) {
        for (const o of originals) {
          const pos = freePosition(db, target);
          if (pos === undefined) throw new ManageRejected(409, 'too_many_submarines');
          const nid = insertRegistered(db, target, pos, copyName(o.name, target === source), now);
          copyExtras(db, o, nid, now);
          created.push(nid);
        }
      }
    }
    const affected = [source, ...targets];
    for (const w of new Set(affected)) syncWorkshopReminders(db, w, now);
    return result(db, userId, affected, created, now);
  })();
}

function copyExtras(db: Db, from: SubmarineDto, toId: string, now: Date): void {
  const t = now.toISOString();
  if (from.build) {
    db.prepare('INSERT INTO submarine_build (submarine_id, hull, stern, bow, bridge, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(toId, from.build.hull, from.build.stern, from.build.bow, from.build.bridge, t);
  }
  if (from.progress) {
    // 帶「現在的」等級與經驗(已結算返航的經驗);輔助設定、待結算路線不帶
    db.prepare("INSERT INTO submarine_progress (submarine_id, level, exp_in_level, source, assist_on, updated_at) VALUES (?, ?, ?, 'manual', 0, ?)").run(toId, from.progress.effective_level, from.progress.effective_exp, t);
  }
}

/** 位置編輯:`slots` 固定 4 格(null = 空位)+ 其餘未排入;兩者合起來必須剛好是該工坊全部的潛艇 */
export function layoutSubmarines(db: Db, userId: string, workshopId: string, body: unknown, now: Date): SubmarinesChangeResult {
  return db.transaction(() => {
    requireWorkshop(db, userId, workshopId);
    const b = typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    const slots = b.slots;
    const unplacedIn = b.unplaced === undefined ? [] : b.unplaced;
    const N = LIMITS.maxSubmarinesPerWorkshop;
    if (!Array.isArray(slots) || slots.length !== N || !slots.every((s) => s === null || typeof s === 'string')) throw new ManageRejected(400, 'validation_failed');
    if (!Array.isArray(unplacedIn) || !unplacedIn.every((s) => typeof s === 'string')) throw new ManageRejected(400, 'validation_failed');
    const placed = (slots as (string | null)[]).filter((s): s is string => s !== null);
    const all = [...placed, ...(unplacedIn as string[])];
    const own = rowsOf(db, workshopId);
    if (new Set(all).size !== all.length || all.length !== own.length || !own.every((r) => all.includes(r.id))) throw new ManageRejected(400, 'validation_failed');

    db.prepare('UPDATE submarines SET position = -position WHERE workshop_id = ?').run(workshopId);
    const set = db.prepare('UPDATE submarines SET position = ? WHERE id = ?');
    (slots as (string | null)[]).forEach((id, i) => id && set.run(i + 1, id));
    (unplacedIn as string[]).forEach((id, i) => set.run(N + 1 + i, id));
    syncWorkshopReminders(db, workshopId, now);
    return result(db, userId, [workshopId], [], now);
  })();
}
