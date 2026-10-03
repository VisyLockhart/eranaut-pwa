import { randomUUID } from 'node:crypto';
import type { Db } from '../db/index.js';

export type DeliveryMethod = 'dm' | 'channel' | 'push';

export interface ReminderRow {
  id: string;
  user_id: string;
  workshop_id: string;
  submarine_id: string | null;
  scheduled_at: string;
}

export interface DeliveryRow {
  id: string;
  reminder_id: string;
  method: DeliveryMethod;
  status: 'pending' | 'sent' | 'failed' | 'missed';
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
}

export function listRemindersForWorkshop(db: Db, workshopId: string): ReminderRow[] {
  return db.prepare('SELECT id, user_id, workshop_id, submarine_id, scheduled_at FROM reminders WHERE workshop_id = ?').all(workshopId) as ReminderRow[];
}

export function listDeliveries(db: Db, reminderId: string): DeliveryRow[] {
  return db.prepare('SELECT * FROM reminder_deliveries WHERE reminder_id = ?').all(reminderId) as DeliveryRow[];
}

export function insertReminder(db: Db, r: { userId: string; workshopId: string; submarineId: string | null; scheduledAt: string }, now: Date): string {
  const id = randomUUID();
  db.prepare('INSERT INTO reminders (id, user_id, workshop_id, submarine_id, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    r.userId,
    r.workshopId,
    r.submarineId,
    r.scheduledAt,
    now.toISOString(),
  );
  return id;
}

export function setReminderTime(db: Db, reminderId: string, scheduledAt: string): void {
  db.prepare('UPDATE reminders SET scheduled_at = ? WHERE id = ?').run(scheduledAt, reminderId);
}

export function deleteReminder(db: Db, reminderId: string): void {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(reminderId); // deliveries 由 CASCADE 刪除
}

/** 停用使用者時取消其全部提醒(D-130、D-139) */
export function deleteRemindersForUser(db: Db, userId: string): void {
  db.prepare('DELETE FROM reminders WHERE user_id = ?').run(userId);
}

/** 新增或重置為待發:次數歸零、`next_attempt_at` = 應發時間、清除錯誤(D-139) */
export function resetDelivery(db: Db, reminderId: string, method: DeliveryMethod, scheduledAt: string): void {
  db.prepare(
    `INSERT INTO reminder_deliveries (id, reminder_id, method, status, attempts, next_attempt_at, last_error)
     VALUES (?, ?, ?, 'pending', 0, ?, NULL)
     ON CONFLICT(reminder_id, method) DO UPDATE SET status = 'pending', attempts = 0, next_attempt_at = excluded.next_attempt_at, last_error = NULL`,
  ).run(randomUUID(), reminderId, method, scheduledAt);
}

export function deleteDelivery(db: Db, deliveryId: string): void {
  db.prepare('DELETE FROM reminder_deliveries WHERE id = ?').run(deliveryId);
}
