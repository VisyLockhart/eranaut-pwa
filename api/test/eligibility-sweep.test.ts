import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPermissions, parseRoleRule } from '../src/auth/permissions.js';
import { runEligibilitySweep, type SweepLogger } from '../src/services/eligibility-sweep.js';
import { startEligibilitySweep } from '../src/services/eligibility-scheduler.js';
import { addUser, loginWith, makeApp, member, ORIGIN, ROLE_A, ROLE_B, ROLE_C, sessionCookie, type TestApp } from './helpers.js';
import Fastify from 'fastify';
import fastifySchedule from '@fastify/schedule';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const ID_C = '777777777777777777';
const DAY = 24 * 60 * 60_000;

class MemoryLog implements SweepLogger {
  entries: Record<string, unknown>[] = [];
  info(obj: object) { this.entries.push(obj as Record<string, unknown>); }
  warn(obj: object) { this.entries.push(obj as Record<string, unknown>); }
}
const m = (id: string, roles: string[]) => member({ id, roles, user: { id, username: `u${id}`, global_name: null, avatar: null } });

function sweep(t: TestApp, log = new MemoryLog()) {
  const permissions = createPermissions({ member: parseRoleRule(`${ROLE_A}+${ROLE_B},${ROLE_C}`) });
  return { log, run: () => runEligibilitySweep({ db: t.db, discord: t.discord, permissions, now: () => t.clock.now, log }) };
}
const userRow = (t: TestApp, discordId: string) =>
  t.db.prepare('SELECT suspended_at, suspended_auto, suspended_by FROM users WHERE discord_user_id = ?').get(discordId) as {
    suspended_at: string | null; suspended_auto: number | null; suspended_by: string | null;
  };
const count = (t: TestApp, table: string) => (t.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

test('失去資格者自動停用:標記自動、刪除 session 與提醒、保留工坊與潛艇;仍有資格者不動', async () => {
  const t = makeApp();
  t.discord.grant('a', m(ID_A, [ROLE_A, ROLE_B]));
  t.discord.grant('b', m(ID_B, [ROLE_C]));
  const cookieA = sessionCookie(await loginWith(t, 'a'))!;
  await loginWith(t, 'b');
  const w = (await t.app.inject({ method: 'POST', url: '/api/workshops', headers: { origin: ORIGIN }, cookies: { eranaut_session: cookieA }, payload: { name: '工坊', server: '伊弗利特' } })).json() as { id: string };
  await t.app.inject({ method: 'PUT', url: `/api/workshops/${w.id}/submarines`, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookieA }, payload: { submarines: [{ position: 1, status: 'exploring', remaining_minutes: 600 }] } });
  assert.equal(count(t, 'reminders'), 1);

  t.discord.members.set(ID_A, m(ID_A, [ROLE_A])); // 只剩 A,不符合「A 且 B」
  const s = sweep(t);
  const r = await s.run();
  assert.deepEqual([r.skipped, r.suspended, r.restored], [false, 1, 0]);

  const ua = userRow(t, ID_A);
  assert.equal(ua.suspended_at, t.clock.now.toISOString());
  assert.equal(ua.suspended_auto, 1);
  assert.equal(ua.suspended_by, null);
  assert.equal(count(t, 'reminders'), 0);
  assert.equal(count(t, 'reminder_deliveries'), 0);
  assert.equal(count(t, 'workshops'), 1);
  assert.equal(count(t, 'submarines'), 1);
  assert.equal(userRow(t, ID_B).suspended_at, null);
  const me = await t.app.inject({ method: 'GET', url: '/api/workshops', cookies: { eranaut_session: cookieA } });
  assert.equal(me.statusCode, 401, '停用後既有 cookie 立即失效');
});

test('離開伺服器(不在成員名單)同樣自動停用', async () => {
  const t = makeApp();
  addUser(t.db, ID_A);
  addUser(t.db, ID_B);
  t.discord.members.set(ID_B, m(ID_B, [ROLE_C])); // A 不在名單
  const r = await sweep(t).run();
  assert.equal(r.suspended, 1);
  assert.notEqual(userRow(t, ID_A).suspended_at, null);
  assert.equal(userRow(t, ID_B).suspended_at, null);
});

test('自動停用者重新符合資格 → 恢復,三欄清空;仍不符合則保持停用', async () => {
  const t = makeApp();
  addUser(t.db, ID_A, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 1 });
  addUser(t.db, ID_B, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 1 });
  t.discord.members.set(ID_A, m(ID_A, [ROLE_C]));
  t.discord.members.set(ID_B, m(ID_B, [ROLE_A])); // 不符合
  const r = await sweep(t).run();
  assert.deepEqual([r.suspended, r.restored], [0, 1]);
  assert.deepEqual(userRow(t, ID_A), { suspended_at: null, suspended_auto: null, suspended_by: null });
  assert.equal(userRow(t, ID_B).suspended_auto, 1);
});

test('手動停權者不動:即使符合資格也不恢復,不符合也不改成自動', async () => {
  const t = makeApp();
  addUser(t.db, ID_A, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: '1234' });
  addUser(t.db, ID_B, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: '1234' });
  t.discord.members.set(ID_A, m(ID_A, [ROLE_C])); // 符合
  // B 不在伺服器
  t.discord.members.set(ID_C, m(ID_C, [ROLE_C]));
  const r = await sweep(t).run();
  assert.deepEqual([r.suspended, r.restored], [0, 0]);
  for (const id of [ID_A, ID_B]) assert.deepEqual(userRow(t, id), { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: '1234' });
});

test('沒有 users 列的新成員不會被建立', async () => {
  const t = makeApp();
  addUser(t.db, ID_A);
  t.discord.members.set(ID_A, m(ID_A, [ROLE_C]));
  t.discord.members.set(ID_C, m(ID_C, [ROLE_C]));
  await sweep(t).run();
  assert.equal(count(t, 'users'), 1);
});

test('Discord 失敗或名單為空:整次放棄,不做任何變更(避免誤停用所有人)', async () => {
  const t = makeApp();
  addUser(t.db, ID_A);
  const s = sweep(t);

  t.discord.members.set(ID_B, m(ID_B, [ROLE_C]));
  t.discord.failList = true;
  assert.equal((await s.run()).skipped, true);
  assert.equal(userRow(t, ID_A).suspended_at, null);

  t.discord.failList = false;
  t.discord.members.clear();
  assert.equal((await s.run()).skipped, true);
  assert.equal(userRow(t, ID_A).suspended_at, null);
  assert.ok(s.log.entries.some((e) => e.reason === 'discord_error'));
  assert.ok(s.log.entries.some((e) => e.reason === 'empty_member_list'));
});

test('順手清掉已過期的 session,未過期的保留', async () => {
  const t = makeApp();
  t.discord.grant('a', m(ID_A, [ROLE_C]));
  await loginWith(t, 'a');
  assert.equal(count(t, 'sessions'), 1);
  t.clock.now = new Date(t.clock.now.getTime() + 10 * DAY);
  assert.equal((await sweep(t).run()).expiredSessionsRemoved, 0);
  t.clock.now = new Date(t.clock.now.getTime() + 25 * DAY); // 超過 30 天
  const r = await sweep(t).run();
  assert.equal(r.expiredSessionsRemoved, 1);
  assert.equal(count(t, 'sessions'), 0);
});

test('排程:啟動立即執行一次', async () => {
  const t = makeApp();
  addUser(t.db, ID_A);
  t.discord.members.set(ID_B, m(ID_B, [ROLE_C]));
  const app = Fastify();
  await app.register(fastifySchedule);
  const permissions = createPermissions({ member: parseRoleRule(`${ROLE_A}+${ROLE_B},${ROLE_C}`) });
  const log = new MemoryLog();
  startEligibilitySweep(app, { db: t.db, discord: t.discord, permissions, now: () => t.clock.now, log }, DAY);
  await app.ready();
  await new Promise((r) => setTimeout(r, 100));
  assert.notEqual(userRow(t, ID_A).suspended_at, null);
  await app.close();
});
