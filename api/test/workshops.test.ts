import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS, NOTIFY_LEAD_MINUTES, SERVERS, type WorkshopDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';

/** 登入並回傳帶 session + Origin 的請求函式 */
async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
const valid = { name: '貝殼工坊', server: '伊弗利特' };
const rows = (t: TestApp) => (t.db.prepare('SELECT COUNT(*) AS n FROM workshops').get() as { n: number }).n;

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const [method, url] of [['GET', '/api/workshops'], ['POST', '/api/workshops'], ['GET', '/api/workshops/x'], ['PUT', '/api/workshops/x'], ['DELETE', '/api/workshops/x']] as const) {
    const res = await t.app.inject({ method, url, payload: method === 'POST' || method === 'PUT' ? valid : undefined });
    assert.equal(res.statusCode, 401, `${method} ${url}`);
  }
});

test('新增:只填必填欄位,其餘取預設;回 201 與完整工坊', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const res = await api('POST', '/api/workshops', valid);
  assert.equal(res.statusCode, 201);
  const w = res.json() as WorkshopDto;
  assert.match(w.id, /^[0-9a-f-]{36}$/);
  assert.deepEqual({ ...w, id: 'x', created_at: 'x' }, {
    id: 'x', name: '貝殼工坊', server: '伊弗利特', captain: null, address_district: null, address_ward: null,
    address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: 'x',
  });
  assert.equal(w.created_at, '2026-10-01T00:00:00.000Z');
});

test('新增:全部欄位,notify_batched 對外是布林、DB 存 0/1', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const res = await api('POST', '/api/workshops', {
    name: '鋼鐵之心', server: '泰坦', captain: '克蘭恩', address_district: '海霧村', address_ward: 12, address_detail: '3 號', notify_batched: true, notify_lead_minutes: 15,
  });
  const w = res.json() as WorkshopDto;
  assert.equal(w.notify_batched, true);
  assert.equal(w.notify_lead_minutes, 15);
  assert.equal(w.address_ward, 12);
  assert.equal((t.db.prepare('SELECT notify_batched FROM workshops').get() as { notify_batched: number }).notify_batched, 1);
});

test('名稱與選填文字會去頭尾空白;空白字串視為未填', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w = (await api('POST', '/api/workshops', { name: '  珊瑚礁  ', server: '巴哈姆特', captain: '   ', address_detail: ' 5 樓 ' })).json() as WorkshopDto;
  assert.equal(w.name, '珊瑚礁');
  assert.equal(w.captain, null);
  assert.equal(w.address_detail, '5 樓');
});

test('驗證:每個欄位的錯誤碼,且錯誤時不寫入 DB', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const cases: [string, object, Record<string, string>][] = [
    ['缺名稱', { server: '迦樓羅' }, { name: 'required' }],
    ['名稱全空白', { name: '   ', server: '迦樓羅' }, { name: 'required' }],
    ['名稱 21 字', { name: '一'.repeat(21), server: '迦樓羅' }, { name: 'too_long' }],
    ['名稱型別錯', { name: 123, server: '迦樓羅' }, { name: 'invalid_type' }],
    ['缺伺服器', { name: 'W' }, { server: 'required' }],
    ['伺服器不在清單', { name: 'W', server: '不存在' }, { server: 'invalid_value' }],
    ['伺服器型別錯', { name: 'W', server: 1 }, { server: 'invalid_type' }],
    ['代表角色 21 字', { ...valid, captain: 'a'.repeat(21) }, { captain: 'too_long' }],
    ['住宅區不在清單', { ...valid, address_district: '亂區' }, { address_district: 'invalid_value' }],
    ['房區 0', { ...valid, address_ward: 0 }, { address_ward: 'invalid_value' }],
    ['房區負數', { ...valid, address_ward: -3 }, { address_ward: 'invalid_value' }],
    ['房區小數', { ...valid, address_ward: 1.5 }, { address_ward: 'invalid_value' }],
    ['房區字串', { ...valid, address_ward: '3' }, { address_ward: 'invalid_type' }],
    ['詳細地址 31 字', { ...valid, address_detail: 'x'.repeat(31) }, { address_detail: 'too_long' }],
    ['notify_batched 非布林', { ...valid, notify_batched: 1 }, { notify_batched: 'invalid_type' }],
    ['預先提醒 7 分鐘', { ...valid, notify_lead_minutes: 7 }, { notify_lead_minutes: 'invalid_value' }],
    ['預先提醒字串', { ...valid, notify_lead_minutes: '5' }, { notify_lead_minutes: 'invalid_type' }],
    ['多個錯誤一次回', { name: '', server: 'x', address_ward: 0 }, { name: 'required', server: 'invalid_value', address_ward: 'invalid_value' }],
  ];
  for (const [label, body, fields] of cases) {
    const res = await api('POST', '/api/workshops', body);
    assert.equal(res.statusCode, 400, label);
    assert.deepEqual(res.json(), { error: 'validation_failed', fields }, label);
  }
  assert.equal(rows(t), 0);
});

test('驗證:body 是陣列或沒有 body 回 400;非 JSON 內容回 415', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  assert.equal((await api('POST', '/api/workshops', [1, 2])).statusCode, 400);
  assert.equal((await api('POST', '/api/workshops')).statusCode, 400);
  assert.equal((await api('POST', '/api/workshops', 'text')).statusCode, 415, '非 JSON 的 Content-Type');
});

test('邊界值:名稱與選填文字剛好上限可過;以字元數計(emoji 算 1);房區不設上限;所有固定選項都能存', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  assert.equal((await api('POST', '/api/workshops', { name: '一'.repeat(20), server: '迦樓羅', captain: '二'.repeat(20), address_detail: '三'.repeat(30) })).statusCode, 201);
  assert.equal((await api('POST', '/api/workshops', { name: '🚢'.repeat(20), server: '迦樓羅' })).statusCode, 201);
  assert.equal((await api('POST', '/api/workshops', { ...valid, address_ward: Number.MAX_SAFE_INTEGER })).statusCode, 201);
  for (const server of SERVERS) assert.equal((await api('POST', '/api/workshops', { name: 'W', server })).statusCode, 201, server);
  for (const address_district of DISTRICTS) assert.equal((await api('POST', '/api/workshops', { ...valid, address_district })).statusCode, 201, address_district);
  for (const notify_lead_minutes of NOTIFY_LEAD_MINUTES) assert.equal((await api('POST', '/api/workshops', { ...valid, notify_lead_minutes })).statusCode, 201, String(notify_lead_minutes));
});

test('不限制重名、不限制數量(D-137)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  for (let i = 0; i < 12; i++) assert.equal((await api('POST', '/api/workshops', valid)).statusCode, 201);
  assert.equal(((await api('GET', '/api/workshops')).json() as WorkshopDto[]).length, 12);
});

test('列表:只回自己的,依建立順序', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  for (const name of ['一', '二', '三']) {
    await a('POST', '/api/workshops', { name, server: '迦樓羅' });
    t.clock.now = new Date(t.clock.now.getTime() + 1000);
  }
  await b('POST', '/api/workshops', { name: 'B 的', server: '鳳凰' });
  assert.deepEqual(((await a('GET', '/api/workshops')).json() as WorkshopDto[]).map((w) => w.name), ['一', '二', '三']);
  assert.deepEqual(((await b('GET', '/api/workshops')).json() as WorkshopDto[]).map((w) => w.name), ['B 的']);
});

test('單筆查詢:自己的 200;別人的與不存在的都是 404', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const mine = (await a('POST', '/api/workshops', valid)).json() as WorkshopDto;
  assert.equal((await a('GET', `/api/workshops/${mine.id}`)).statusCode, 200);
  assert.equal((await b('GET', `/api/workshops/${mine.id}`)).statusCode, 404);
  assert.equal((await a('GET', '/api/workshops/does-not-exist')).statusCode, 404);
});

test('整筆取代:更新欄位、省略的選填欄位被清空、id 與建立時間不變', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const created = (await api('POST', '/api/workshops', { name: '舊', server: '泰坦', captain: 'X', address_district: '白銀鄉', address_ward: 3, address_detail: 'd', notify_batched: true, notify_lead_minutes: 30 })).json() as WorkshopDto;
  t.clock.now = new Date(t.clock.now.getTime() + 60_000);
  const res = await api('PUT', `/api/workshops/${created.id}`, { name: '新', server: '奧汀' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    id: created.id, name: '新', server: '奧汀', captain: null, address_district: null, address_ward: null, address_detail: null,
    notify_batched: false, notify_lead_minutes: 0, created_at: created.created_at,
  });
});

test('取代:驗證失敗回 400 且不改動;別人的與不存在的回 404 且不改動', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const mine = (await a('POST', '/api/workshops', valid)).json() as WorkshopDto;
  assert.equal((await a('PUT', `/api/workshops/${mine.id}`, { name: '', server: '迦樓羅' })).statusCode, 400);
  assert.equal((await b('PUT', `/api/workshops/${mine.id}`, { name: '被改', server: '迦樓羅' })).statusCode, 404);
  assert.equal((await a('PUT', '/api/workshops/nope', valid)).statusCode, 404);
  assert.equal(((await a('GET', `/api/workshops/${mine.id}`)).json() as WorkshopDto).name, '貝殼工坊');
});

test('刪除:204,連帶刪除潛艇與提醒(CASCADE);別人的與不存在的回 404 且不刪', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const w = (await a('POST', '/api/workshops', valid)).json() as WorkshopDto;
  const uid = (t.db.prepare("SELECT id FROM users WHERE discord_user_id = ?").get(ID_A) as { id: string }).id;
  t.db.prepare("INSERT INTO submarines (id, workshop_id, position, status, last_synced_at) VALUES ('s1', ?, 1, 'complete', '2026-10-01T00:00:00Z')").run(w.id);
  t.db.prepare("INSERT INTO reminders (id, user_id, workshop_id, submarine_id, scheduled_at, created_at) VALUES ('r1', ?, ?, 's1', '2026-10-01T00:00:00Z', '2026-10-01T00:00:00Z')").run(uid, w.id);

  assert.equal((await b('DELETE', `/api/workshops/${w.id}`)).statusCode, 404);
  assert.equal((await a('DELETE', '/api/workshops/nope')).statusCode, 404);
  assert.equal(rows(t), 1);

  assert.equal((await a('DELETE', `/api/workshops/${w.id}`)).statusCode, 204);
  assert.equal(rows(t), 0);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM submarines').get() as { n: number }).n, 0);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM reminders').get() as { n: number }).n, 0);
  assert.equal((await a('DELETE', `/api/workshops/${w.id}`)).statusCode, 404);
});

test('改資料的請求受 Origin 檢查:別的來源回 403 且不寫入', async () => {
  const t = makeApp();
  t.discord.grant('c', member({ id: ID_A, user: { id: ID_A, username: 'u', global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, 'c'))!;
  const call = (method: 'POST' | 'PUT' | 'DELETE', url: string, origin: string) =>
    t.app.inject({ method, url, payload: valid, headers: { origin }, cookies: { eranaut_session: cookie } });
  const w = (await call('POST', '/api/workshops', ORIGIN)).json() as WorkshopDto;
  const evil = 'https://evil.example';
  assert.equal((await call('POST', '/api/workshops', evil)).statusCode, 403);
  assert.equal((await call('PUT', `/api/workshops/${w.id}`, evil)).statusCode, 403);
  assert.equal((await call('DELETE', `/api/workshops/${w.id}`, evil)).statusCode, 403);
  assert.equal(rows(t), 1);
});
