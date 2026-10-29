import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SubmarineDto, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

// 潛艇自己的配件(D-296)

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const P = { hull: 3, stern: 1, bow: 2, bridge: 4 };

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;

async function setup(api: Api) {
  const w = (await api('POST', '/api/workshops', { name: 'W', server: '伊弗利特' })).json() as WorkshopDto;
  const res = await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, status: 'complete' }, { position: 2, status: 'complete' }] });
  const subs = (res.json() as SubmarinesUpdateResult).submarines;
  return { wid: w.id, s1: subs[0]!.id, s2: subs[1]!.id };
}
const list = async (api: Api, wid: string) => (await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[];

test('未登入 401', async () => {
  const t = makeApp();
  for (const method of ['PUT', 'DELETE'] as const) assert.equal((await t.app.inject({ method, url: '/api/submarines/x/build', payload: P })).statusCode, 401);
});

test('設定 / 覆寫 / 清除:沒設定的潛艇不帶 build 欄位', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, s1 } = await setup(api);
  assert.equal((await list(api, wid))[0]!.build, undefined);
  const res = await api('PUT', `/api/submarines/${s1}/build`, P);
  assert.equal(res.statusCode, 200);
  const b = (res.json() as SubmarineDto).build!;
  assert.deepEqual([b.hull, b.stern, b.bow, b.bridge], [3, 1, 2, 4]);
  await api('PUT', `/api/submarines/${s1}/build`, { hull: 10, stern: 10, bow: 10, bridge: 10 });
  assert.equal((await list(api, wid))[0]!.build!.hull, 10);
  assert.equal((await list(api, wid))[1]!.build, undefined, '另一艘不受影響');
  const del = await api('DELETE', `/api/submarines/${s1}/build`);
  assert.equal(del.statusCode, 200);
  assert.equal((del.json() as SubmarineDto).build, undefined);
});

test('隨更新潛艇一起送:物件 = 設定、null = 清除、省略 = 不變;驗證失敗整筆不生效', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete', build: P });
  assert.equal((await list(api, wid))[0]!.build!.bridge, 4);
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete' });
  assert.equal((await list(api, wid))[0]!.build!.bridge, 4, '省略 = 不變');
  for (const bad of [{ ...P, hull: 0 }, { ...P, hull: 11 }, { ...P, bow: 1.5 }, { hull: 1, stern: 1, bow: 1 }, 'x', { ...P, mark_repaired: 'y' }]) {
    const res = await api('PUT', `/api/workshops/${wid}/submarines/1`, { name: '改名', status: 'complete', build: bad });
    assert.equal(res.statusCode, 400, JSON.stringify(bad));
    assert.ok(res.json().fields.build);
  }
  assert.equal((await list(api, wid))[0]!.name, null, '整筆回復');
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete', build: null });
  assert.equal((await list(api, wid))[0]!.build, undefined);
});

test('同一個請求「設定配件 + 開啟維修提醒」:提醒依新配件算上限', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const res = await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete', build: P, upkeep: { route_key: '1:OJ' } });
  assert.equal(res.statusCode, 200);
  const u = (await list(api, wid))[0]!.upkeep!;
  assert.equal(u.parts_sig, '3,1,2,4');
  assert.equal(u.limit_voyages, 6);
});

test('別人的潛艇與不存在的 id 回 404', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const { s1 } = await setup(a);
  assert.equal((await b('PUT', `/api/submarines/${s1}/build`, P)).statusCode, 404);
  assert.equal((await b('DELETE', `/api/submarines/${s1}/build`)).statusCode, 404);
  assert.equal((await a('PUT', '/api/submarines/not-exist/build', P)).statusCode, 404);
  assert.equal(t.db.prepare('SELECT COUNT(*) FROM submarine_build').pluck().get(), 0);
});

test('PUT 的 body 不合法 400', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { s1 } = await setup(api);
  for (const body of [{}, { ...P, stern: 0 }, { ...P, bridge: '4' }, [P]]) {
    assert.equal((await api('PUT', `/api/submarines/${s1}/build`, body)).statusCode, 400, JSON.stringify(body));
  }
});

test('刪除工坊時,潛艇配件一併刪除(不留孤兒列)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, s1, s2 } = await setup(api);
  await api('PUT', `/api/submarines/${s1}/build`, P);
  await api('PUT', `/api/submarines/${s2}/build`, P);
  assert.equal(t.db.prepare('SELECT COUNT(*) FROM submarine_build').pluck().get(), 2);
  assert.equal((await api('DELETE', `/api/workshops/${wid}`)).statusCode, 204);
  assert.equal(t.db.prepare('SELECT COUNT(*) FROM submarine_build').pluck().get(), 0);
});
