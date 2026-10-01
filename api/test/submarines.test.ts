import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, type OverviewDto, type SubmarineDto, type WorkshopDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: 'u', global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;
const mkWorkshop = async (api: Api, name = '貝殼工坊') => ((await api('POST', '/api/workshops', { name, server: '迦樓羅' })).json() as WorkshopDto).id;
const NOW_MS = new Date('2026-10-01T00:00:00Z').getTime();
const iso = (minutesFromNow: number) => new Date(NOW_MS + minutesFromNow * 60_000).toISOString();
const subCount = (t: TestApp) => (t.db.prepare('SELECT COUNT(*) AS n FROM submarines').get() as { n: number }).n;

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const [method, url] of [['GET', '/api/overview'], ['GET', '/api/workshops/x/submarines'], ['PUT', '/api/workshops/x/submarines'], ['PUT', '/api/workshops/x/submarines/1']] as const) {
    assert.equal((await t.app.inject({ method, url, payload: method === 'PUT' ? {} : undefined })).statusCode, 401, `${method} ${url}`);
  }
});

test('整坊更新:新增多艘;返航時間 = 收到請求當下 + 剩餘時間(D-48);探索完成沒有返航時間', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const res = await api('PUT', `/api/workshops/${wid}/submarines`, {
    submarines: [
      { position: 2, name: '潛水艇-2', status: 'complete' },
      { position: 1, name: '潛水艇-1', status: 'exploring', remaining_minutes: 2141 },
      { position: 3, status: 'exploring', remaining_minutes: 1 },
    ],
  });
  assert.equal(res.statusCode, 200);
  const list = res.json() as SubmarineDto[];
  assert.deepEqual(list.map((s) => s.position), [1, 2, 3], '回傳依位置排序');
  assert.equal(list[0]!.expected_return_at, iso(2141));
  assert.equal(list[0]!.last_synced_at, iso(0));
  assert.equal(list[1]!.status, 'complete');
  assert.equal(list[1]!.expected_return_at, null);
  assert.equal(list[2]!.name, null);
  assert.equal(list[2]!.expected_return_at, iso(1));
  assert.ok(list.every((s) => s.workshop_id === wid && /^[0-9a-f-]{36}$/.test(s.id)));
});

test('再次更新以 (workshop_id, position) UPSERT:不新增列、保留 id、覆蓋名稱/狀態/時間;沒列出的位置不動', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const first = (await api('PUT', `/api/workshops/${wid}/submarines`, {
    submarines: [{ position: 1, name: '舊名', status: 'exploring', remaining_minutes: 60 }, { position: 2, name: 'B', status: 'exploring', remaining_minutes: 90 }],
  })).json() as SubmarineDto[];

  t.clock.now = new Date(t.clock.now.getTime() + 10 * 60_000);
  const second = (await api('PUT', `/api/workshops/${wid}/submarines`, { submarines: [{ position: 1, name: '新名', status: 'complete' }] })).json() as SubmarineDto[];

  assert.equal(subCount(t), 2);
  assert.equal(second[0]!.id, first[0]!.id);
  assert.equal(second[0]!.name, '新名');
  assert.equal(second[0]!.status, 'complete');
  assert.equal(second[0]!.expected_return_at, null);
  assert.equal(second[0]!.last_synced_at, iso(10));
  assert.deepEqual(second[1], first[1], '未列出的位置完全不動');
});

test('整批是原子的:任一艘驗證失敗就全部不寫,並回報是第幾艘的哪個欄位', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const res = await api('PUT', `/api/workshops/${wid}/submarines`, {
    submarines: [
      { position: 1, status: 'exploring', remaining_minutes: 30 },
      { position: 2, status: 'exploring' },
      { position: 3, status: 'bogus' },
    ],
  });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.json(), {
    error: 'validation_failed',
    fields: {},
    items: [{ index: 1, fields: { remaining_minutes: 'required' } }, { index: 2, fields: { status: 'invalid_value' } }],
  });
  assert.equal(subCount(t), 0);
});

test('單艘驗證:每個欄位的錯誤碼', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const ok = { status: 'exploring', remaining_minutes: 10 };
  const cases: [string, object, Record<string, string>][] = [
    ['缺狀態', {}, { status: 'required' }],
    ['狀態不在清單', { status: 'sailing' }, { status: 'invalid_value' }],
    ['狀態型別錯', { status: 1 }, { status: 'invalid_type' }],
    ['探索中缺剩餘時間', { status: 'exploring' }, { remaining_minutes: 'required' }],
    ['剩餘時間 0(總和必須 > 0)', { status: 'exploring', remaining_minutes: 0 }, { remaining_minutes: 'invalid_value' }],
    ['剩餘時間負數', { status: 'exploring', remaining_minutes: -5 }, { remaining_minutes: 'invalid_value' }],
    ['剩餘時間小數', { status: 'exploring', remaining_minutes: 1.5 }, { remaining_minutes: 'invalid_value' }],
    ['剩餘時間字串', { status: 'exploring', remaining_minutes: '60' }, { remaining_minutes: 'invalid_type' }],
    ['剩餘時間超過 99 天 23 時 59 分', { status: 'exploring', remaining_minutes: LIMITS.maxRemainingMinutes + 1 }, { remaining_minutes: 'invalid_value' }],
    ['名稱 21 字', { ...ok, name: '一'.repeat(21) }, { name: 'too_long' }],
    ['名稱型別錯', { ...ok, name: 5 }, { name: 'invalid_type' }],
  ];
  for (const [label, body, fields] of cases) {
    const res = await api('PUT', `/api/workshops/${wid}/submarines/1`, body);
    assert.equal(res.statusCode, 400, label);
    assert.deepEqual(res.json(), { error: 'validation_failed', fields }, label);
  }
  assert.equal(subCount(t), 0);
});

test('位置只能是 1~4 的整數;批次內不可重複位置;最多 4 艘;空陣列與非陣列', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const sub = (position: unknown) => ({ position, status: 'complete' });
  const batch = (submarines: unknown) => api('PUT', `/api/workshops/${wid}/submarines`, { submarines });
  for (const bad of [0, 5, -1, 1.5]) assert.equal((await batch([sub(bad)])).statusCode, 400, `position ${bad}`);
  assert.deepEqual((await batch([sub('1')])).json().items, [{ index: 0, fields: { position: 'invalid_type' } }]);
  assert.deepEqual((await batch([{ status: 'complete' }])).json().items, [{ index: 0, fields: { position: 'required' } }]);
  assert.deepEqual((await batch([sub(1), sub(1)])).json().items, [{ index: 1, fields: { position: 'invalid_value' } }]);
  assert.deepEqual((await batch([sub(1), sub(2), sub(3), sub(4), sub(1)])).json().fields, { submarines: 'invalid_value' });
  assert.deepEqual((await batch([])).json().fields, { submarines: 'required' });
  assert.deepEqual((await batch('x')).json().fields, { submarines: 'invalid_type' });
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines`, {})).statusCode, 400);
  assert.equal((await batch([sub(1), sub(2), sub(3), sub(4)])).statusCode, 200);
  assert.equal(subCount(t), 4);
});

test('邊界:剩餘時間 1 與上限都可過;名稱前後空白去除、空白視為清空;complete 時忽略 remaining_minutes', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const res = await api('PUT', `/api/workshops/${wid}/submarines`, {
    submarines: [
      { position: 1, name: '  艇一  ', status: 'exploring', remaining_minutes: 1 },
      { position: 2, name: '   ', status: 'exploring', remaining_minutes: LIMITS.maxRemainingMinutes },
      { position: 3, status: 'complete', remaining_minutes: 999 },
      { position: 4, name: '二'.repeat(20), status: 'complete' },
    ],
  });
  assert.equal(res.statusCode, 200);
  const l = res.json() as SubmarineDto[];
  assert.equal(l[0]!.name, '艇一');
  assert.equal(l[1]!.name, null);
  assert.equal(l[1]!.expected_return_at, iso(LIMITS.maxRemainingMinutes));
  assert.equal(l[2]!.expected_return_at, null);
});

test('單艘快速修改:位置取自網址,只動那一艘,回該艘', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  await api('PUT', `/api/workshops/${wid}/submarines`, {
    submarines: [{ position: 1, name: 'A', status: 'exploring', remaining_minutes: 60 }, { position: 2, name: 'B', status: 'exploring', remaining_minutes: 90 }],
  });
  const before = (await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[];
  t.clock.now = new Date(t.clock.now.getTime() + 5 * 60_000);
  const res = await api('PUT', `/api/workshops/${wid}/submarines/2`, { name: 'B2', status: 'exploring', remaining_minutes: 30 });
  assert.equal(res.statusCode, 200);
  const s = res.json() as SubmarineDto;
  assert.equal(s.position, 2);
  assert.equal(s.name, 'B2');
  assert.equal(s.expected_return_at, iso(5 + 30));
  const after = (await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[];
  assert.deepEqual(after[0], before[0], '第 1 艘不動');
  // 位置不存在時可補位(D-122)
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/3`, { status: 'complete' })).statusCode, 200);
  assert.equal(subCount(t), 3);
});

test('單艘:網址位置不合法或與 body 不一致回 400', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  const body = { status: 'complete' };
  for (const p of ['0', '5', 'abc', '1.5']) assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/${p}`, body)).statusCode, 400, p);
  const mismatch = await api('PUT', `/api/workshops/${wid}/submarines/1`, { ...body, position: 2 });
  assert.equal(mismatch.statusCode, 400);
  assert.deepEqual(mismatch.json().fields, { position: 'invalid_value' });
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/1`, { ...body, position: 1 })).statusCode, 200);
  assert.equal(subCount(t), 1);
});

test('別人的與不存在的工坊一律 404,且不寫入', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const wid = await mkWorkshop(a);
  const body = { submarines: [{ position: 1, status: 'complete' }] };
  assert.equal((await b('PUT', `/api/workshops/${wid}/submarines`, body)).statusCode, 404);
  assert.equal((await b('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete' })).statusCode, 404);
  assert.equal((await b('GET', `/api/workshops/${wid}/submarines`)).statusCode, 404);
  assert.equal((await a('PUT', '/api/workshops/nope/submarines', body)).statusCode, 404);
  assert.equal((await a('GET', '/api/workshops/nope/submarines')).statusCode, 404);
  assert.equal(subCount(t), 0);
  // 就算 body 不合法,別人的工坊也是 404(不洩漏存在與否)
  assert.equal((await b('PUT', `/api/workshops/${wid}/submarines`, {})).statusCode, 404);
});

test('總覽:只含自己的工坊,每間內含依位置排序的潛艇;沒有潛艇的工坊回空陣列;工坊 CRUD 回應格式不變', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const w1 = await mkWorkshop(a, '一');
  t.clock.now = new Date(t.clock.now.getTime() + 1000);
  await mkWorkshop(a, '二(空)');
  await a('PUT', `/api/workshops/${w1}/submarines`, {
    submarines: [{ position: 3, status: 'complete' }, { position: 1, name: 'x', status: 'exploring', remaining_minutes: 5 }],
  });
  const wb = await mkWorkshop(b, 'B 的');
  await b('PUT', `/api/workshops/${wb}/submarines`, { submarines: [{ position: 1, status: 'complete' }] });

  const ov = (await a('GET', '/api/overview')).json() as OverviewDto;
  assert.deepEqual(ov.workshops.map((w) => w.name), ['一', '二(空)']);
  assert.deepEqual(ov.workshops[0]!.submarines.map((s) => s.position), [1, 3]);
  assert.deepEqual(ov.workshops[1]!.submarines, []);
  assert.equal(ov.workshops[0]!.notify_batched, false);
  assert.ok(!('submarines' in ((await a('GET', `/api/workshops/${w1}`)).json() as object)), '工坊 CRUD 不含潛艇');
  assert.deepEqual(((await b('GET', '/api/overview')).json() as OverviewDto).workshops.map((w) => w.name), ['B 的']);
  assert.deepEqual(((await asUser(t, '777777777777777777').then((c) => c('GET', '/api/overview'))).json() as OverviewDto), { workshops: [] });
});

test('刪除工坊後,總覽不再出現其潛艇', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  await api('PUT', `/api/workshops/${wid}/submarines`, { submarines: [{ position: 1, status: 'complete' }] });
  await api('DELETE', `/api/workshops/${wid}`);
  assert.deepEqual((await api('GET', '/api/overview')).json(), { workshops: [] });
  assert.equal(subCount(t), 0);
});

test('Origin 檢查:別的來源回 403 且不寫入', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api);
  t.discord.grant('c', member({ id: ID_A, user: { id: ID_A, username: 'u', global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, 'c'))!;
  const res = await t.app.inject({
    method: 'PUT', url: `/api/workshops/${wid}/submarines`, payload: { submarines: [{ position: 1, status: 'complete' }] },
    headers: { origin: 'https://evil.example' }, cookies: { eranaut_session: cookie },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(subCount(t), 0);
});
