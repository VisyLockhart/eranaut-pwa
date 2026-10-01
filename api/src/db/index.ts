import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { migrations, type Migration } from './migrations.js';

export type Db = Database.Database;

/** 開啟資料庫並套用連線設定。SQLite 預設不啟用外鍵,必須每條連線都開(D-137 ⑥)。 */
export function openDatabase(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  return db;
}

/** 以 PRAGMA user_version 記錄版本,逐一在交易內套用尚未執行的 migration。可重複呼叫。 */
export function migrate(db: Db, list: readonly Migration[] = migrations): number {
  let current = db.pragma('user_version', { simple: true }) as number;
  const sorted = [...list].sort((a, b) => a.version - b.version);
  for (const m of sorted) {
    if (m.version <= current) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.pragma(`user_version = ${m.version}`);
    })();
    current = m.version;
  }
  return current;
}
