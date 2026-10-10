import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase, migrate, type Db } from '../src/db/index.js';
import { migrations } from '../src/db/migrations.js';

const NOW = '2026-10-01T00:00:00Z';

function fresh(): Db {
  const db = openDatabase(':memory:');
  migrate(db);
  return db;
}
function addUser(db: Db, discordId = '111'): string {
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, discord_user_id, created_at) VALUES (?, ?, ?)').run(id, discordId, NOW);
  return id;
}
function addWorkshop(db: Db, userId: string, name = 'W'): string {
  const id = randomUUID();
  db.prepare('INSERT INTO workshops (id, user_id, name, server, created_at) VALUES (?, ?, ?, ?, ?)').run(id, userId, name, '迦樓羅', NOW);
  return id;
}
function addSub(db: Db, workshopId: string, position: number): string {
  const id = randomUUID();
  db.prepare("INSERT INTO submarines (id, workshop_id, position, status, last_synced_at) VALUES (?, ?, ?, 'complete', ?)").run(id, workshopId, position, NOW);
  return id;
}
const count = (db: Db, table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

test('連線啟用外鍵', () => {
  assert.equal(openDatabase(':memory:').pragma('foreign_keys', { simple: true }), 1);
});

test('migrate 建立全部資料表,且可重複執行', () => {
  const db = openDatabase(':memory:');
  assert.equal(migrate(db), 6);
  assert.equal(migrate(db), 6);
  const names = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
  assert.deepEqual(names, ['push_subscriptions', 'reminder_deliveries', 'reminders', 'route_filters', 'route_sub_bindings', 'route_subs', 'sessions', 'submarines', 'users', 'workshops']);
});

test('預設值:notify_methods = 1(只 DM)、停用欄位為 NULL、工坊預設不提醒', () => {
  const db = fresh();
  const u = addUser(db);
  const w = addWorkshop(db, u);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(u) as Record<string, unknown>;
  assert.equal(user.notify_methods, 1);
  assert.equal(user.suspended_at, null);
  const ws = db.prepare('SELECT * FROM workshops WHERE id = ?').get(w) as Record<string, unknown>;
  assert.equal(ws.notify_batched, 0);
  assert.equal(ws.notify_lead_minutes, 0);
});

test('discord_user_id 不可重複', () => {
  const db = fresh();
  addUser(db, '111');
  assert.throws(() => addUser(db, '111'), /UNIQUE/);
});

test('外鍵:工坊不能指向不存在的使用者', () => {
  const db = fresh();
  assert.throws(() => addWorkshop(db, randomUUID()), /FOREIGN KEY/);
});

test('工坊可重名(D-137 ④)', () => {
  const db = fresh();
  const u = addUser(db);
  addWorkshop(db, u, '同名');
  addWorkshop(db, u, '同名');
  assert.equal(count(db, 'workshops'), 2);
});

test('(workshop_id, position) 唯一,可供 UPSERT', () => {
  const db = fresh();
  const w = addWorkshop(db, addUser(db));
  addSub(db, w, 1);
  assert.throws(() => addSub(db, w, 1), /UNIQUE/);
  db.prepare(
    `INSERT INTO submarines (id, workshop_id, position, name, status, last_synced_at) VALUES (?, ?, 1, 'x', 'complete', ?)
     ON CONFLICT(workshop_id, position) DO UPDATE SET name = excluded.name`,
  ).run(randomUUID(), w, NOW);
  assert.equal(count(db, 'submarines'), 1);
});

test('刪除工坊連帶刪除潛艇與提醒(CASCADE)', () => {
  const db = fresh();
  const u = addUser(db);
  const w = addWorkshop(db, u);
  const s = addSub(db, w, 1);
  const r = randomUUID();
  db.prepare('INSERT INTO reminders (id, user_id, workshop_id, submarine_id, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(r, u, w, s, NOW, NOW);
  db.prepare("INSERT INTO reminder_deliveries (id, reminder_id, method, status, next_attempt_at) VALUES (?, ?, 'dm', 'pending', ?)").run(randomUUID(), r, NOW);
  db.prepare('DELETE FROM workshops WHERE id = ?').run(w);
  assert.equal(count(db, 'submarines'), 0);
  assert.equal(count(db, 'reminders'), 0);
  assert.equal(count(db, 'reminder_deliveries'), 0);
});

test('刪除使用者連帶刪除 session 與提醒', () => {
  const db = fresh();
  const u = addUser(db);
  db.prepare("INSERT INTO sessions (id, token_hash, user_id, display_name, created_at, expires_at) VALUES (?, 'h', ?, 'W', ?, ?)").run(randomUUID(), u, NOW, NOW);
  db.prepare('DELETE FROM users WHERE id = ?').run(u);
  assert.equal(count(db, 'sessions'), 0);
});

test('有工坊的使用者不能被直接刪除(工坊外鍵無 CASCADE)', () => {
  const db = fresh();
  const u = addUser(db);
  addWorkshop(db, u);
  assert.throws(() => db.prepare('DELETE FROM users WHERE id = ?').run(u), /FOREIGN KEY/);
});

test('提醒唯一性:每艘一筆、整批每工坊一筆', () => {
  const db = fresh();
  const u = addUser(db);
  const w = addWorkshop(db, u);
  const s = addSub(db, w, 1);
  const ins = (sub: string | null) =>
    db.prepare('INSERT INTO reminders (id, user_id, workshop_id, submarine_id, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), u, w, sub, NOW, NOW);
  ins(s);
  assert.throws(() => ins(s), /UNIQUE/);
  ins(null);
  assert.throws(() => ins(null), /UNIQUE/);
});

test('reminder_deliveries 以 (reminder_id, method) 唯一', () => {
  const db = fresh();
  const u = addUser(db);
  const w = addWorkshop(db, u);
  const r = randomUUID();
  db.prepare('INSERT INTO reminders (id, user_id, workshop_id, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?)').run(r, u, w, NOW, NOW);
  const ins = (m: string) => db.prepare("INSERT INTO reminder_deliveries (id, reminder_id, method, status, next_attempt_at) VALUES (?, ?, ?, 'pending', ?)").run(randomUUID(), r, m, NOW);
  ins('dm');
  ins('channel');
  assert.throws(() => ins('dm'), /UNIQUE/);
});

test('migration 失敗時整個交易回滾、版本不前進', () => {
  const db = openDatabase(':memory:');
  assert.throws(() => migrate(db, [{ version: 1, name: 'bad', sql: 'CREATE TABLE a (x); CREATE TABLE a (x);' }]));
  assert.equal(db.pragma('user_version', { simple: true }), 0);
  assert.equal(count(db, 'sqlite_master'), 0);
});

test('migration 4:舊的單艘綁定搬進綁定表,舊欄位清空', () => {
  const db = openDatabase(':memory:');
  migrate(db, migrations.filter((m) => m.version <= 3));
  const u = addUser(db);
  const sub = addSub(db, addWorkshop(db, u), 1);
  const rs = randomUUID();
  db.prepare('INSERT INTO route_subs (id, user_id, name, level, hull, stern, bow, bridge, bound_submarine_id, created_at, updated_at) VALUES (?, ?, ?, 1, 1, 1, 1, 1, ?, ?, ?)').run(rs, u, 'R', sub, NOW, NOW);
  assert.equal(migrate(db), 6);
  assert.deepEqual(db.prepare('SELECT route_sub_id, submarine_id FROM route_sub_bindings').all(), [{ route_sub_id: rs, submarine_id: sub }]);
  assert.equal((db.prepare('SELECT bound_submarine_id AS b FROM route_subs').get() as { b: string | null }).b, null);
});
