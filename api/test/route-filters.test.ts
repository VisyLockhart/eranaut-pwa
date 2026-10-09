import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RouteFilterDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown, origin: string | null = ORIGIN) =>
    t.app.inject({ method, url, payload: payload as object, headers: origin ? { origin } : {}, cookies: { eranaut_session: cookie } });
}

const spec = { v: 1, sea: 3, max_hours: 12, sort: 'opens', required: [5, 7], excluded: [9], item_ids: [100, 200], match: 'any' };
const valid = { name: '灰海', spec };
const count = (t: TestApp) => (t.db.prepare('SELECT COUNT(*) AS n FROM route_filters').get() as { n: number }).n;

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const [method, url] of [['GET', '/api/route-filters'], ['POST', '/api/route-filters'], ['PUT', '/api/route-filters/x'], ['DELETE', '/api/route-filters/x']] as const) {
    const res = await t.app.inject({ method, url, payload: method === 'POST' || method === 'PUT' ? valid : undefined });
    assert.equal(res.statusCode, 401, `${method} ${url}`);
  }
});

test('新增、列表、取代、刪除', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const res = await api('POST', '/api/route-filters', { ...valid, name: '  灰海  ' });
  assert.equal(res.statusCode, 201);
  const f = res.json() as RouteFilterDto;
  assert.match(f.id, /^[0-9a-f-]{36}$/);
  assert.equal(f.name, '灰海');
  assert.deepEqual(f.spec, spec);
  assert.equal(f.created_at, '2026-10-01T00:00:00.000Z');
  t.clock.now = new Date('2026-10-02T00:00:00Z');
  const put = await api('PUT', `/api/route-filters/${f.id}`, { name: '改名', spec: { ...spec, sea: 'all', max_hours: null } });
  assert.equal(put.statusCode, 200);
  const p = put.json() as RouteFilterDto;
  assert.equal(p.id, f.id);
  assert.equal(p.name, '改名');
  assert.equal(p.spec.sea, 'all');
  assert.equal(p.spec.max_hours, null);
  assert.equal(p.created_at, '2026-10-01T00:00:00.000Z');
  assert.equal(p.updated_at, '2026-10-02T00:00:00.000Z');
  assert.equal(((await api('GET', '/api/route-filters')).json() as RouteFilterDto[]).length, 1);
  assert.equal((await api('DELETE', `/api/route-filters/${f.id}`)).statusCode, 204);
  assert.equal((await api('DELETE', `/api/route-filters/${f.id}`)).statusCode, 404);
  assert.equal(count(t), 0);
});

test('列表依建立順序;重名可以', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  for (const n of ['乙', '甲', '甲']) {
    t.clock.now = new Date(t.clock.now.getTime() + 1000);
    assert.equal((await api('POST', '/api/route-filters', { ...valid, name: n })).statusCode, 201);
  }
  assert.deepEqual(((await api('GET', '/api/route-filters')).json() as RouteFilterDto[]).map((x) => x.name), ['乙', '甲', '甲']);
});

test('省略的欄位補預設值、陣列去重', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const res = await api('POST', '/api/route-filters', { name: 'x', spec: { required: [1, 1, 2] } });
  assert.equal(res.statusCode, 201);
  assert.deepEqual((res.json() as RouteFilterDto).spec, { v: 1, sea: 'all', max_hours: null, sort: 'perMin', required: [1, 2], excluded: [], item_ids: [], match: 'all' });
});

test('每人最多 10 組,第 11 組 409;刪掉後可再新增;上限各人獨立', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  for (let i = 0; i < 10; i++) assert.equal((await a('POST', '/api/route-filters', valid)).statusCode, 201);
  const over = await a('POST', '/api/route-filters', valid);
  assert.equal(over.statusCode, 409);
  assert.equal(over.json().error, 'limit_reached');
  assert.equal(count(t), 10);
  assert.equal((await b('POST', '/api/route-filters', valid)).statusCode, 201);
  const list = (await a('GET', '/api/route-filters')).json() as RouteFilterDto[];
  assert.equal((await a('DELETE', `/api/route-filters/${list[0]!.id}`)).statusCode, 204);
  assert.equal((await a('POST', '/api/route-filters', valid)).statusCode, 201);
});

test('別人的組合看不到也改不了(404)', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const f = (await a('POST', '/api/route-filters', valid)).json() as RouteFilterDto;
  assert.deepEqual((await b('GET', '/api/route-filters')).json(), []);
  assert.equal((await b('PUT', `/api/route-filters/${f.id}`, valid)).statusCode, 404);
  assert.equal((await b('DELETE', `/api/route-filters/${f.id}`)).statusCode, 404);
  assert.equal(((await a('GET', '/api/route-filters')).json() as RouteFilterDto[]).length, 1);
});

test('欄位驗證', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const bad = async (body: unknown, fields: Record<string, string>) => {
    const res = await api('POST', '/api/route-filters', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal(res.json().error, 'validation_failed');
    assert.deepEqual(res.json().fields, fields, JSON.stringify(body));
  };
  await bad(undefined, { name: 'required', spec: 'required' });
  await bad({ spec }, { name: 'required' });
  await bad({ name: '   ', spec }, { name: 'required' });
  await bad({ name: 5, spec }, { name: 'invalid_type' });
  await bad({ name: 'x'.repeat(21), spec }, { name: 'too_long' });
  await bad({ name: 'x' }, { spec: 'required' });
  await bad({ name: 'x', spec: 'a' }, { spec: 'invalid_type' });
  await bad({ name: 'x', spec: { ...spec, v: 2 } }, { spec: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, sea: 0 } }, { sea: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, sea: 'a' } }, { sea: 'invalid_type' });
  await bad({ name: 'x', spec: { ...spec, max_hours: 169 } }, { max_hours: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, max_hours: '6' } }, { max_hours: 'invalid_type' });
  await bad({ name: 'x', spec: { ...spec, sort: 'nope' } }, { sort: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, match: 'some' } }, { match: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, required: 'a' } }, { required: 'invalid_type' });
  await bad({ name: 'x', spec: { ...spec, required: [0] } }, { required: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, required: [1.5] } }, { required: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, excluded: [10000] } }, { excluded: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, item_ids: Array.from({ length: 51 }, (_, i) => i + 1) } }, { item_ids: 'invalid_value' });
  await bad({ name: 'x', spec: { ...spec, required: [5], excluded: [5] } }, { excluded: 'invalid_value' });
  assert.equal(count(t), 0);
});

test('PUT 驗證失敗 400、不存在 404;Origin 不符的寫入被擋', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const f = (await api('POST', '/api/route-filters', valid)).json() as RouteFilterDto;
  assert.equal((await api('PUT', `/api/route-filters/${f.id}`, { name: '', spec })).statusCode, 400);
  assert.equal((await api('PUT', '/api/route-filters/nope', valid)).statusCode, 404);
  const res = await api('POST', '/api/route-filters', valid, 'https://evil.example');
  assert.equal(res.statusCode, 403);
  assert.equal(count(t), 1);
});
