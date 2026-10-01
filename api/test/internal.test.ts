import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGuildAdministrator, createGuildCache, GUILD_CACHE_TTL_MS } from '../src/services/guild-cache.js';
import { bearerMatches } from '../src/routes/internal.js';
import { addUser, config, loginWith, makeApp, member, ORIGIN, ROLE_A, ROLE_B, ROLE_C, sessionCookie, type TestApp } from './helpers.js';

const ADMIN_ROLE = '444444444444444444'; // FakeDiscord 預設:此身份組有 Administrator(權限 8)
const OWNER = '100000000000000001';
const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const ID_C = '777777777777777777';
const ADMIN_ID = '888888888888888801';
const SECRET = config.internalSecret;

const m = (id: string, roles: string[], over: Partial<ReturnType<typeof member>> = {}) =>
  member({ id, roles, user: { id, username: `user${id.slice(-3)}`, global_name: null, avatar: null }, ...over });

function call(t: TestApp, method: 'GET' | 'POST', url: string, opts: { caller?: { id: string; roles: string[] } | null; body?: unknown; secret?: string | null } = {}) {
  const headers: Record<string, string> = {};
  if (opts.secret !== null) headers.authorization = `Bearer ${opts.secret ?? SECRET}`;
  const caller = opts.caller === undefined ? { id: ADMIN_ID, roles: [ADMIN_ROLE] } : opts.caller;
  if (caller) {
    headers['x-caller-id'] = caller.id;
    headers['x-caller-roles'] = caller.roles.join(',');
  }
  return t.internal.inject({ method, url, headers, payload: opts.body as object | undefined });
}
const userRow = (t: TestApp, id: string) =>
  t.db.prepare('SELECT suspended_at, suspended_auto, suspended_by FROM users WHERE discord_user_id = ?').get(id) as {
    suspended_at: string | null; suspended_auto: number | null; suspended_by: string | null;
  };

test('Bearer 密鑰:缺少或錯誤 → 401;healthz 不需密鑰', async () => {
  const t = makeApp();
  assert.equal((await call(t, 'GET', '/me/submarines', { secret: null })).statusCode, 401);
  assert.equal((await call(t, 'GET', '/me/submarines', { secret: 'wrong' })).statusCode, 401);
  assert.equal((await t.internal.inject({ method: 'GET', url: '/healthz' })).statusCode, 200);
  assert.equal(bearerMatches('Bearer abc', 'abc'), true);
  assert.equal(bearerMatches('Basic abc', 'abc'), false);
  assert.equal(bearerMatches(undefined, 'abc'), false);
});

test('呼叫者標頭缺少或格式錯誤 → 400', async () => {
  const t = makeApp();
  assert.equal((await call(t, 'GET', '/admin/suspended-users', { caller: null })).statusCode, 400);
  assert.equal((await call(t, 'GET', '/admin/suspended-users', { caller: { id: 'abc', roles: [] } })).statusCode, 400);
  assert.equal((await call(t, 'GET', '/admin/suspended-users', { caller: { id: ADMIN_ID, roles: ['x'] } })).statusCode, 400);
});

test('管理員判斷:伺服器擁有者或有 Administrator 權限的身份組才算;權限位元要看實際 bit', async () => {
  const t = makeApp();
  t.discord.guildInfo = {
    ownerId: OWNER,
    roles: [
      { id: ADMIN_ROLE, permissions: '8' },
      { id: '444444444444444445', permissions: '104324673' }, // 無 Administrator 位元
      { id: '444444444444444446', permissions: '1099511627784' }, // 含 bit 3 與高位元
    ],
  };
  const cache = createGuildCache(t.discord, () => t.clock.now);
  assert.equal(await isGuildAdministrator(cache, OWNER, []), true);
  assert.equal(await isGuildAdministrator(cache, ID_A, [ADMIN_ROLE]), true);
  assert.equal(await isGuildAdministrator(cache, ID_A, ['444444444444444445']), false);
  assert.equal(await isGuildAdministrator(cache, ID_A, ['444444444444444446']), true);
  assert.equal(await isGuildAdministrator(cache, ID_A, [ROLE_A, ROLE_B]), false);
});

test('快取:60 秒內不重複呼叫 Discord,到期後重新載入', async () => {
  const t = makeApp();
  let n = 0;
  const orig = t.discord.getGuildAdminInfo.bind(t.discord);
  t.discord.getGuildAdminInfo = async () => (n++, orig());
  const cache = createGuildCache(t.discord, () => t.clock.now);
  await cache.adminInfo();
  await cache.adminInfo();
  assert.equal(n, 1);
  t.clock.now = new Date(t.clock.now.getTime() + GUILD_CACHE_TTL_MS);
  await cache.adminInfo();
  assert.equal(n, 2);
});

test('非管理員呼叫管理員端點 → 403;Discord 查詢失敗 → 502', async () => {
  const t = makeApp();
  const normal = { id: ID_A, roles: [ROLE_A, ROLE_B] };
  for (const [method, url] of [['GET', '/admin/eligible-members'], ['GET', '/admin/suspended-users'], ['POST', '/admin/suspend'], ['POST', '/admin/unsuspend']] as const) {
    assert.equal((await call(t, method, url, { caller: normal, body: { target_discord_id: ID_B } })).statusCode, 403, url);
  }
  t.discord.failGuildInfo = true;
  t.clock.now = new Date(t.clock.now.getTime() + GUILD_CACHE_TTL_MS); // 讓快取失效
  assert.equal((await call(t, 'GET', '/admin/eligible-members')).statusCode, 502);
});

test('eligible-members:只列符合使用資格者、排除機器人、依輸入過濾(暱稱/帳號名)、最多 25 筆', async () => {
  const t = makeApp();
  t.discord.members.set(ID_A, m(ID_A, [ROLE_A, ROLE_B], { nick: 'Winter' }));
  t.discord.members.set(ID_B, m(ID_B, [ROLE_C], { nick: 'Alice' }));
  t.discord.members.set(ID_C, m(ID_C, [ROLE_A])); // 不符合 (A 且 B) 或 C
  t.discord.members.set('999999999999999901', m('999999999999999901', [ROLE_C], { user: { id: '999999999999999901', username: 'botty', global_name: null, avatar: null, bot: true } }));

  let res = await call(t, 'GET', '/admin/eligible-members');
  assert.deepEqual(res.json(), { members: [{ id: ID_B, name: 'Alice' }, { id: ID_A, name: 'Winter' }] });
  res = await call(t, 'GET', '/admin/eligible-members?query=wint');
  assert.deepEqual(res.json(), { members: [{ id: ID_A, name: 'Winter' }] });
  res = await call(t, 'GET', `/admin/eligible-members?query=user${ID_B.slice(-3)}`);
  assert.deepEqual(res.json(), { members: [{ id: ID_B, name: 'Alice' }] }, '也可用帳號名搜尋');

  for (let i = 0; i < 30; i++) {
    const id = String(300000000000000000n + BigInt(i));
    t.discord.members.set(id, m(id, [ROLE_C], { nick: `Bulk${String(i).padStart(2, '0')}` }));
  }
  t.clock.now = new Date(t.clock.now.getTime() + GUILD_CACHE_TTL_MS); // 讓快取失效(各測試獨立 app,這裡每個 app 的快取是共用的)
  res = await call(t, 'GET', '/admin/eligible-members');
  assert.equal(res.json().members.length, 25);
});

test('suspend:手動停權記錄操作者、刪除 session 與提醒、保留資料;重複停權回已是該狀態;從未登入 → 404;ID 格式錯 → 400', async () => {
  const t = makeApp();
  t.discord.grant('a', m(ID_A, [ROLE_C]));
  const cookie = sessionCookie(await loginWith(t, 'a'))!;
  const api = (method: 'POST' | 'PUT', url: string, payload: object) => t.app.inject({ method, url, payload, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  const w = (await api('POST', '/api/workshops', { name: '工坊', server: '伊弗利特' })).json() as { id: string };
  await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, status: 'exploring', remaining_minutes: 600 }] });
  const count = (table: string) => (t.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  assert.equal(count('reminders'), 1);

  const res = await call(t, 'POST', '/admin/suspend', { body: { target_discord_id: ID_A } });
  assert.deepEqual(res.json(), { result: 'suspended' });
  assert.deepEqual(userRow(t, ID_A), { suspended_at: t.clock.now.toISOString(), suspended_auto: 0, suspended_by: ADMIN_ID });
  assert.equal(count('sessions'), 0);
  assert.equal(count('reminders'), 0);
  assert.equal(count('submarines'), 1);

  assert.deepEqual((await call(t, 'POST', '/admin/suspend', { body: { target_discord_id: ID_A } })).json(), { result: 'already_suspended' });
  assert.equal((await call(t, 'POST', '/admin/suspend', { body: { target_discord_id: ID_B } })).statusCode, 404);
  assert.equal(t.db.prepare('SELECT 1 FROM users WHERE discord_user_id = ?').get(ID_B), undefined, '不預先建立停權紀錄');
  assert.equal((await call(t, 'POST', '/admin/suspend', { body: { target_discord_id: 'abc' } })).statusCode, 400);
  assert.equal((await call(t, 'POST', '/admin/suspend', { body: {} })).statusCode, 400);
});

test('unsuspend:仍符合資格 → 恢復;不符合 → 轉為自動停用;未停用 → 已是該狀態;查詢失敗不改狀態', async () => {
  const t = makeApp();
  const manual = { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: ADMIN_ID };
  addUser(t.db, ID_A, manual);
  addUser(t.db, ID_B, manual);
  addUser(t.db, ID_C);
  t.discord.members.set(ID_A, m(ID_A, [ROLE_C]));
  t.discord.members.set(ID_B, m(ID_B, [ROLE_A])); // 身份組尚未補回

  assert.deepEqual((await call(t, 'POST', '/admin/unsuspend', { body: { target_discord_id: ID_A } })).json(), { result: 'unsuspended' });
  assert.deepEqual(userRow(t, ID_A), { suspended_at: null, suspended_auto: null, suspended_by: null });

  assert.deepEqual((await call(t, 'POST', '/admin/unsuspend', { body: { target_discord_id: ID_B } })).json(), { result: 'now_auto_suspended' });
  assert.deepEqual(userRow(t, ID_B), { suspended_at: t.clock.now.toISOString(), suspended_auto: 1, suspended_by: null });

  assert.deepEqual((await call(t, 'POST', '/admin/unsuspend', { body: { target_discord_id: ID_C } })).json(), { result: 'not_suspended' });
  assert.equal((await call(t, 'POST', '/admin/unsuspend', { body: { target_discord_id: '999999999999999999' } })).statusCode, 404);

  addUser(t.db, '121212121212121212', manual);
  t.discord.failMember = true;
  assert.equal((await call(t, 'POST', '/admin/unsuspend', { body: { target_discord_id: '121212121212121212' } })).statusCode, 502);
  assert.equal(userRow(t, '121212121212121212').suspended_auto, 0, '查詢失敗不改狀態');
});

test('suspended-users:列出全部停用者(含自動),已離開伺服器者 name 為 null,可依輸入過濾', async () => {
  const t = makeApp();
  addUser(t.db, ID_A, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: ADMIN_ID });
  addUser(t.db, ID_B, { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 1 });
  addUser(t.db, ID_C); // 未停用,不列出
  t.discord.members.set(ID_A, m(ID_A, [], { nick: 'Winter' }));
  // B 已離開伺服器

  const all = (await call(t, 'GET', '/admin/suspended-users')).json();
  assert.deepEqual(all, {
    users: [
      { id: ID_A, name: 'Winter', left_guild: false, suspended_auto: false },
      { id: ID_B, name: null, left_guild: true, suspended_auto: true },
    ],
  });
  assert.deepEqual((await call(t, 'GET', '/admin/suspended-users?query=wint')).json().users.map((u: { id: string }) => u.id), [ID_A]);
  assert.deepEqual((await call(t, 'GET', `/admin/suspended-users?query=${ID_B}`)).json().users.map((u: { id: string }) => u.id), [ID_B]);
});

test('/me/submarines:有資格且已登入過者回自己的總覽;無記錄、已停用都是 404 無資料;沒有資格 → 403', async () => {
  const t = makeApp();
  t.discord.grant('a', m(ID_A, [ROLE_C]));
  const cookie = sessionCookie(await loginWith(t, 'a'))!;
  const api = (method: 'POST' | 'PUT', url: string, payload: object) => t.app.inject({ method, url, payload, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  const w = (await api('POST', '/api/workshops', { name: '貝殼工坊', server: '伊弗利特' })).json() as { id: string };
  await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, status: 'exploring', remaining_minutes: 600 }] });

  const mine = { id: ID_A, roles: [ROLE_C] };
  const res = await call(t, 'GET', '/me/submarines', { caller: mine });
  assert.equal(res.statusCode, 200);
  const overview = res.json();
  assert.equal(overview.workshops[0].name, '貝殼工坊');

  assert.equal((await call(t, 'GET', '/me/submarines', { caller: { id: ID_B, roles: [ROLE_C] } })).statusCode, 404, '從未登入過');
  assert.equal((await call(t, 'GET', '/me/submarines', { caller: { id: ID_B, roles: [ROLE_A] } })).statusCode, 403, '沒有資格');
  t.db.prepare("UPDATE users SET suspended_at = '2026-10-01T00:00:00Z', suspended_auto = 0").run();
  const suspended = await call(t, 'GET', '/me/submarines', { caller: mine });
  assert.deepEqual([suspended.statusCode, suspended.json()], [404, { error: 'no_data' }], '不透露停用狀態');
});
