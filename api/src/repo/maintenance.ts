import { MAINTENANCE_SHOW_AFTER_MS, MAINTENANCE_SHOW_BEFORE_MS, type MaintenanceDto } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import type { ValidMaintenanceEvent } from '../services/maintenance.js';

// 遊戲伺服器維護的目前狀態(D-283)。全站只有一份資料,與使用者無關,所以查詢不帶 user_id。
// 過期資料在寫入時順手刪(結束後超過 48 小時),不另開清理排程。

const KEEP_AFTER_END_MS = 48 * 60 * 60 * 1000;

interface Row {
  id: string;
  title: string;
  url: string;
  start_at: string;
  end_at: string;
}

/**
 * 寫入一筆維護事件(以文章 ID upsert,重送沒有副作用)。
 * `finished` 事件設定完成時間;已完成的維護不會被稍後才到的 `scheduled` 重新打開(事件可能亂序或重送)。
 */
export function applyMaintenanceEvent(db: Db, e: ValidMaintenanceEvent, now: Date): void {
  const t = now.toISOString();
  const start = new Date(e.startMs).toISOString();
  const end = new Date(e.endMs).toISOString();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM server_maintenance WHERE title LIKE '%官網%'").run(); // 舊版 bot 誤送的官網維護
    db.prepare('DELETE FROM server_maintenance WHERE end_at < ?').run(new Date(now.getTime() - KEEP_AFTER_END_MS).toISOString());
    db.prepare(
      `INSERT INTO server_maintenance (id, title, url, start_at, end_at, finished_at, updated_at)
       VALUES (@id, @title, @url, @start, @end, @finished, @t)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, url = excluded.url, start_at = excluded.start_at, end_at = excluded.end_at,
         finished_at = COALESCE(server_maintenance.finished_at, excluded.finished_at), updated_at = excluded.updated_at`,
    ).run({ id: e.id, title: e.title, url: e.url, start, end, finished: e.event === 'finished' ? t : null, t });
  });
  tx();
}

/** 目前該顯示的維護:未完成、開始前 24 小時起、預計結束後 6 小時內;多筆取開始最早者 */
export function getActiveMaintenance(db: Db, now: Date): MaintenanceDto | null {
  const row = db
    .prepare(
      `SELECT id, title, url, start_at, end_at FROM server_maintenance
       WHERE finished_at IS NULL AND title NOT LIKE '%官網%' AND start_at <= ? AND end_at > ?
       ORDER BY start_at, id LIMIT 1`,
    )
    .get(new Date(now.getTime() + MAINTENANCE_SHOW_BEFORE_MS).toISOString(), new Date(now.getTime() - MAINTENANCE_SHOW_AFTER_MS).toISOString()) as Row | undefined;
  return row ?? null;
}
