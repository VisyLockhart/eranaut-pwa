import { randomUUID } from 'node:crypto';
import type { WorkshopDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidWorkshop } from '../services/workshops.js';

// 所有查詢都帶 user_id,任何查詢都不可跨使用者(CLAUDE.md §5)。

interface Row {
  id: string;
  name: string;
  server: WorkshopDto['server'];
  captain: string | null;
  address_district: WorkshopDto['address_district'];
  address_ward: number | null;
  address_detail: string | null;
  notify_batched: number;
  notify_lead_minutes: WorkshopDto['notify_lead_minutes'];
  created_at: string;
}

const COLUMNS = 'id, name, server, captain, address_district, address_ward, address_detail, notify_batched, notify_lead_minutes, created_at';

function toDto(r: Row): WorkshopDto {
  return { ...r, notify_batched: r.notify_batched === 1 };
}

export function listWorkshops(db: Db, userId: string): WorkshopDto[] {
  const rows = db.prepare(`SELECT ${COLUMNS} FROM workshops WHERE user_id = ? ORDER BY created_at, rowid`).all(userId) as Row[];
  return rows.map(toDto);
}

export function getWorkshop(db: Db, userId: string, id: string): WorkshopDto | undefined {
  const r = db.prepare(`SELECT ${COLUMNS} FROM workshops WHERE id = ? AND user_id = ?`).get(id, userId) as Row | undefined;
  return r && toDto(r);
}

export function insertWorkshop(db: Db, userId: string, v: ValidWorkshop, now: Date): WorkshopDto {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO workshops (id, user_id, name, server, captain, address_district, address_ward, address_detail, notify_batched, notify_lead_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, userId, v.name, v.server, v.captain, v.address_district, v.address_ward, v.address_detail, v.notify_batched ? 1 : 0, v.notify_lead_minutes, now.toISOString());
  return getWorkshop(db, userId, id)!;
}

/** 整筆取代可編輯欄位;找不到(或不是自己的)回 undefined */
export function replaceWorkshop(db: Db, userId: string, id: string, v: ValidWorkshop): WorkshopDto | undefined {
  const res = db
    .prepare(
      `UPDATE workshops SET name = ?, server = ?, captain = ?, address_district = ?, address_ward = ?, address_detail = ?, notify_batched = ?, notify_lead_minutes = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(v.name, v.server, v.captain, v.address_district, v.address_ward, v.address_detail, v.notify_batched ? 1 : 0, v.notify_lead_minutes, id, userId);
  return res.changes === 0 ? undefined : getWorkshop(db, userId, id);
}

/** 潛艇與提醒由 ON DELETE CASCADE 連帶刪除(需 foreign_keys = ON) */
export function deleteWorkshop(db: Db, userId: string, id: string): boolean {
  return db.prepare('DELETE FROM workshops WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}
