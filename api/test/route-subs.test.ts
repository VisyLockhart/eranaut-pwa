import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RouteSubDto, SubmarineDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;

const valid = { name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3 };
const count = (t: TestApp) => (t.db.prepare('SELECT COUNT(*) AS n FROM route_subs').get() as { n: number }).n;

/** 建一間工坊與一艘潛艇,回潛艇 id */
async function makeSubmarine(api: Api): Promise<string> {
  const w = (await api('POST', '/api/workshops', { name: 'W', server: '伊弗利特' })).json() as { id: string };
  const res = await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, name: 'S', status: 'exploring', remaining_minutes: 60 }] });
  return (res.json().submarines as SubmarineDto[])[0]!.id;
}

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const [method, url] of [['GET', '/api/route-subs'], ['POST', '/api/route-subs'], ['PUT', '/api/route-subs/x'], ['DELETE', '/api/route-subs/x']] as const) {
    const res = await t.app.inject({ method, url, payload: method === 'POST' || method === 'PUT' ? valid : undefined });
    assert.equal(res.statusCode, 401, `${method} ${url}`);
  }
});

test('新增、列表、取代、刪除', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const res = await api('POST', '/api/route-subs', { ...valid, name: '  主力艇  ' });
  assert.equal(res.statusCode, 201);
  const s = res.json() as RouteSubDto;
  assert.match(s.id, /^[0-9a-f-]{36}$/);
  assert.deepEqual({ ...s, id: 'x' }, {
    id: 'x', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
    created_at: '2026-10-01T00:00:00.000Z', updated_at: '2026-10-01T00:00:00.000Z',
  });
  t.clock.now = new Date('2026-10-02T00:00:00Z');
  const put = await api('PUT', `/api/route-subs/${s.id}`, { ...valid, name: '改名', level: 125, hull: 10 });
  assert.equal(put.statusCode, 200);
  const p = put.json() as RouteSubDto;
  assert.equal(p.id, s.id);
  assert.equal(p.name, '改名');
  assert.equal(p.level, 125);
  assert.equal(p.hull, 10);
  assert.equal(p.created_at, '2026-10-01T00:00:00.000Z');
  assert.equal(p.updated_at, '2026-10-02T00:00:00.000Z');
  assert.equal(((await api('GET', '/api/route-subs')).json() as RouteSubDto[]).length, 1);
  assert.equal((await api('DELETE', `/api/route-subs/${s.id}`)).statusCode, 204);
  assert.equal((await api('DELETE', `/api/route-subs/${s.id}`)).statusCode, 404);
  assert.equal(count(t), 0);
});

test('列表依建立順序;重名可以', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  for (const n of ['乙', '甲', '甲']) {
    t.clock.now = new Date(t.clock.now.getTime() + 1000);
    assert.equal((await api('POST', '/api/route-subs', { ...valid, name: n })).statusCode, 201);
  }
  assert.deepEqual(((await api('GET', '/api/route-subs')).json() as RouteSubDto[]).map((x) => x.name), ['乙', '甲', '甲']);
});

test('上限 10 組:第 11 組回 409,刪一組後可再建', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  let first = '';
  for (let i = 0; i < 10; i++) {
    const r = await api('POST', '/api/route-subs', { ...valid, name: `艇${i}` });
    assert.equal(r.statusCode, 201);
    if (i === 0) first = (r.json() as RouteSubDto).id;
  }
  const over = await api('POST', '/api/route-subs', valid);
  assert.equal(over.statusCode, 409);
  assert.deepEqual(over.json(), { error: 'limit_reached' });
  assert.equal(count(t), 10);
  assert.equal((await api('PUT', `/api/route-subs/${first}`, { ...valid, name: '覆蓋' })).statusCode, 200); // 滿了仍可覆蓋
  await api('DELETE', `/api/route-subs/${first}`);
  assert.equal((await api('POST', '/api/route-subs', valid)).statusCode, 201);
});

test('上限是每位使用者各自計算', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  for (let i = 0; i < 10; i++) await a('POST', '/api/route-subs', valid);
  assert.equal((await b('POST', '/api/route-subs', valid)).statusCode, 201);
});

test('驗證:每個欄位的錯誤碼,且錯誤時不寫入 DB', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const cases: [string, object, Record<string, string>][] = [
    ['缺名稱', { ...valid, name: undefined }, { name: 'required' }],
    ['名稱全空白', { ...valid, name: '   ' }, { name: 'required' }],
    ['名稱 21 字', { ...valid, name: '一'.repeat(21) }, { name: 'too_long' }],
    ['名稱型別錯', { ...valid, name: 1 }, { name: 'invalid_type' }],
    ['等級 0', { ...valid, level: 0 }, { level: 'invalid_value' }],
    ['等級 131', { ...valid, level: 131 }, { level: 'invalid_value' }],
    ['等級小數', { ...valid, level: 50.5 }, { level: 'invalid_value' }],
    ['等級字串', { ...valid, level: '50' }, { level: 'invalid_type' }],
    ['缺等級', { ...valid, level: undefined }, { level: 'required' }],
    ['船體 0', { ...valid, hull: 0 }, { hull: 'invalid_value' }],
    ['船尾 11', { ...valid, stern: 11 }, { stern: 'invalid_value' }],
    ['船首字串', { ...valid, bow: 'a' }, { bow: 'invalid_type' }],
    ['缺艦橋', { ...valid, bridge: undefined }, { bridge: 'required' }],
    ['綁定型別錯', { ...valid, bound_submarine_ids: 5 }, { bound_submarine_ids: 'invalid_type' }],
    ['綁定陣列內型別錯', { ...valid, bound_submarine_ids: ['a', 5] }, { bound_submarine_ids: 'invalid_type' }],
    ['綁定超過上限', { ...valid, bound_submarine_ids: Array.from({ length: 33 }, (_, i) => `s${i}`) }, { bound_submarine_ids: 'invalid_value' }],
    ['多欄位一次回', { name: '', level: 999, hull: 99 }, { name: 'required', level: 'invalid_value', hull: 'invalid_value', stern: 'required', bow: 'required', bridge: 'required' }],
  ];
  for (const [label, body, fields] of cases) {
    const res = await api('POST', '/api/route-subs', body);
    assert.equal(res.statusCode, 400, label);
    assert.deepEqual(res.json(), { error: 'validation_failed', fields }, label);
  }
  assert.equal(count(t), 0);
  assert.equal((await api('POST', '/api/route-subs', null)).statusCode, 400);
});

test('邊界值:等級 1 / 125、零件 1 / 10 可存', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  assert.equal((await api('POST', '/api/route-subs', { name: 'x'.repeat(20), level: 1, hull: 1, stern: 1, bow: 1, bridge: 1 })).statusCode, 201);
  assert.equal((await api('POST', '/api/route-subs', { name: 'y', level: 125, hull: 10, stern: 10, bow: 10, bridge: 10 })).statusCode, 201);
});

test('隔離:別人的 id 一律 404,不影響對方資料', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const s = (await a('POST', '/api/route-subs', valid)).json() as RouteSubDto;
  assert.equal((await b('PUT', `/api/route-subs/${s.id}`, { ...valid, name: '被改' })).statusCode, 404);
  assert.equal((await b('DELETE', `/api/route-subs/${s.id}`)).statusCode, 404);
  assert.deepEqual(await (await b('GET', '/api/route-subs')).json(), []);
  assert.equal(((await a('GET', '/api/route-subs')).json() as RouteSubDto[])[0]!.name, '主力艇');
  assert.equal((await a('PUT', '/api/route-subs/not-exist', valid)).statusCode, 404);
});

test('綁定:自己的潛艇可綁(可多艘);別人的潛艇、不存在的 id 回 400;空陣列或省略 = 解除', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const mine = await makeSubmarine(a);
  const mine2 = await makeSubmarine(a);
  const theirs = await makeSubmarine(b);
  const s = (await a('POST', '/api/route-subs', { ...valid, bound_submarine_ids: [mine, mine2, mine] })).json() as RouteSubDto;
  assert.deepEqual(s.bound_submarine_ids, [mine, mine2]); // 重複的只留一個
  for (const bad of [theirs, '00000000-0000-4000-8000-000000000000']) {
    const post = await a('POST', '/api/route-subs', { ...valid, bound_submarine_ids: [mine, bad] });
    assert.equal(post.statusCode, 400);
    assert.deepEqual(post.json(), { error: 'validation_failed', fields: { bound_submarine_ids: 'invalid_value' } });
    assert.equal((await a('PUT', `/api/route-subs/${s.id}`, { ...valid, bound_submarine_ids: [bad] })).statusCode, 400);
  }
  assert.equal(count(t), 1);
  assert.deepEqual(((await a('GET', '/api/route-subs')).json() as RouteSubDto[])[0]!.bound_submarine_ids, [mine, mine2]); // 失敗的請求不動綁定
  assert.deepEqual(((await a('PUT', `/api/route-subs/${s.id}`, { ...valid, bound_submarine_ids: [mine2] })).json() as RouteSubDto).bound_submarine_ids, [mine2]);
  assert.deepEqual(((await a('PUT', `/api/route-subs/${s.id}`, valid)).json() as RouteSubDto).bound_submarine_ids, []); // 省略 = 解除
});

test('一艘潛艇只綁一組配置:綁到另一組時從原本那組搬走', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const sub = await makeSubmarine(a);
  const s1 = (await a('POST', '/api/route-subs', { ...valid, name: '甲', bound_submarine_ids: [sub] })).json() as RouteSubDto;
  const s2 = (await a('POST', '/api/route-subs', { ...valid, name: '乙', bound_submarine_ids: [sub] })).json() as RouteSubDto;
  assert.deepEqual(s2.bound_submarine_ids, [sub]);
  const list = (await a('GET', '/api/route-subs')).json() as RouteSubDto[];
  assert.deepEqual(list.find((x) => x.id === s1.id)!.bound_submarine_ids, []);
  assert.deepEqual(list.find((x) => x.id === s2.id)!.bound_submarine_ids, [sub]);
});

test('綁定的潛艇或工坊被刪後,綁定自動解除、儲存潛艇保留;刪配置時綁定一併清除', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const w = (await a('POST', '/api/workshops', { name: 'W', server: '泰坦' })).json() as { id: string };
  const sub = ((await a('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, status: 'complete' }] })).json().submarines as SubmarineDto[])[0]!;
  const s = (await a('POST', '/api/route-subs', { ...valid, bound_submarine_ids: [sub.id] })).json() as RouteSubDto;
  assert.equal((await a('DELETE', `/api/workshops/${w.id}`)).statusCode, 204);
  const after = ((await a('GET', '/api/route-subs')).json() as RouteSubDto[])[0]!;
  assert.equal(after.id, s.id);
  assert.deepEqual(after.bound_submarine_ids, []);
  const mine = await makeSubmarine(a);
  const s2 = (await a('POST', '/api/route-subs', { ...valid, bound_submarine_ids: [mine] })).json() as RouteSubDto;
  assert.equal((await a('DELETE', `/api/route-subs/${s2.id}`)).statusCode, 204);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM route_sub_bindings').get() as { n: number }).n, 0);
});

test('使用者被刪(CASCADE)後無殘留', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  await a('POST', '/api/route-subs', valid);
  assert.equal(count(t), 1);
  t.db.prepare('DELETE FROM users').run();
  assert.equal(count(t), 0);
});

test('Origin 不符的寫入請求 403', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  void api;
  const res = await t.app.inject({ method: 'POST', url: '/api/route-subs', payload: valid, headers: { origin: 'https://evil.example' } });
  assert.equal(res.statusCode, 403);
});
