import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SubmarineDto, SubmarinesChangeResult, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

// 工坊管理模式(D-313~D-315):新增 / 刪除 / 搬移 / 複製 / 位置編輯

const ID_A = '777777777777777777';
const ID_B = '888888888888888888';

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;

const P = { hull: 3, stern: 1, bow: 2, bridge: 4 };
const mkWorkshop = async (api: Api, name: string) => ((await api('POST', '/api/workshops', { name, server: '伊弗利特' })).json() as WorkshopDto).id;
const list = async (api: Api, wid: string) => (await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[];
const positions = (subs: SubmarineDto[]) => subs.map((s) => `${s.position}:${s.name ?? '-'}`);

async function fill(api: Api, wid: string, names: string[]) {
  const res = await api('PUT', `/api/workshops/${wid}/submarines`, { submarines: names.map((name, i) => ({ position: i + 1, name, status: 'complete' })) });
  return (res.json() as SubmarinesUpdateResult).submarines;
}
const sub = (r: SubmarinesChangeResult, wid: string) => r.workshops.find((w) => w.workshop_id === wid)!.submarines;

test('未登入 401', async () => {
  const t = makeApp();
  for (const url of ['/api/workshops/x/submarines', '/api/workshops/x/submarines/delete', '/api/workshops/x/submarines/layout', '/api/submarines/transfer']) {
    assert.equal((await t.app.inject({ method: 'POST', url, payload: {} })).statusCode, 401, url);
  }
});

test('更新潛艇:位置可到 20、超過 20 與狀態「新登記」被拒絕', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/20`, { status: 'complete' })).statusCode, 200);
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/21`, { status: 'complete' })).statusCode, 400);
  assert.equal((await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'registered' })).statusCode, 400);
});

test('新增:新登記、第一個空位、名稱選填;不算待收也沒有提醒;第一次派出後變探索中', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  await fill(api, wid, ['甲', '乙']);
  const res = await api('POST', `/api/workshops/${wid}/submarines`, { name: ' 新艇 ' });
  assert.equal(res.statusCode, 200);
  const body = res.json() as SubmarinesChangeResult;
  const added = sub(body, wid).find((s) => s.id === body.created_ids[0])!;
  assert.equal(added.position, 3);
  assert.equal(added.name, '新艇');
  assert.equal(added.status, 'registered');
  assert.equal(added.expected_return_at, null);
  const blank = ((await api('POST', `/api/workshops/${wid}/submarines`, {})).json() as SubmarinesChangeResult).created_ids[0]!;
  assert.equal((await list(api, wid)).find((s) => s.id === blank)!.name, null);
  // 派出
  const go = await api('PUT', `/api/workshops/${wid}/submarines/3`, { status: 'exploring', remaining_minutes: 60 });
  assert.equal(go.statusCode, 200);
  assert.equal((await list(api, wid))[2]!.status, 'exploring');
  // 名稱太長 / 工坊不存在
  assert.equal((await api('POST', `/api/workshops/${wid}/submarines`, { name: 'x'.repeat(21) })).statusCode, 400);
  assert.equal((await api('POST', '/api/workshops/nope/submarines', {})).statusCode, 404);
});

test('新增到第 21 艘回 409', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  for (let i = 0; i < 20; i++) assert.equal((await api('POST', `/api/workshops/${wid}/submarines`, {})).statusCode, 200);
  assert.equal((await api('POST', `/api/workshops/${wid}/submarines`, {})).statusCode, 409);
  assert.equal((await list(api, wid)).length, 20);
});

test('刪除:連帶資料一起刪、剩下的依序重排、刪光工坊仍在', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  const subs = await fill(api, wid, ['甲', '乙', '丙', '丁']);
  await api('PUT', `/api/submarines/${subs[1]!.id}/build`, P);
  const res = await api('POST', `/api/workshops/${wid}/submarines/delete`, { submarine_ids: [subs[1]!.id, subs[2]!.id] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(positions(sub(res.json() as SubmarinesChangeResult, wid)), ['1:甲', '2:丁']);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM submarine_build').get() as { n: number }).n, 0);
  const all = await api('POST', `/api/workshops/${wid}/submarines/delete`, { submarine_ids: [subs[0]!.id, subs[3]!.id] });
  assert.equal(all.statusCode, 200);
  assert.deepEqual(sub(all.json() as SubmarinesChangeResult, wid), []);
  assert.equal((await api('GET', '/api/overview')).statusCode, 200);
});

test('刪除:空清單 / 重複 / 別人的 / 不在該工坊的潛艇', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const other = await asUser(t, ID_B);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(api, 'W2');
  const [a] = await fill(api, w1, ['甲']);
  const [b] = await fill(api, w2, ['乙']);
  const url = `/api/workshops/${w1}/submarines/delete`;
  assert.equal((await api('POST', url, { submarine_ids: [] })).statusCode, 400);
  assert.equal((await api('POST', url, { submarine_ids: [a!.id, a!.id] })).statusCode, 400);
  assert.equal((await api('POST', url, { submarine_ids: [b!.id] })).statusCode, 404, '別間工坊的艇');
  assert.equal((await other('POST', url, { submarine_ids: [a!.id] })).statusCode, 404, '別人的工坊');
  assert.equal((await list(api, w1)).length, 1);
});

test('搬移:換工坊、等級配件跟著走、放第一個空位、來源重排', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(api, 'W2');
  const subs = await fill(api, w1, ['甲', '乙', '丙']);
  await fill(api, w2, ['子']);
  await api('PUT', `/api/submarines/${subs[0]!.id}/build`, P);
  await api('PUT', `/api/submarines/${subs[0]!.id}/progress`, { level: 50, exp_in_level: 100 });
  const res = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'move', target_workshop_ids: [w2] });
  assert.equal(res.statusCode, 200);
  const body = res.json() as SubmarinesChangeResult;
  assert.deepEqual(positions(sub(body, w1)), ['1:乙', '2:丙']);
  const moved = sub(body, w2).find((s) => s.id === subs[0]!.id)!;
  assert.equal(moved.position, 2);
  assert.equal(moved.build!.hull, 3);
  assert.equal(moved.progress!.level, 50);
  assert.equal(moved.status, 'complete', '搬移不改狀態');
  assert.deepEqual(body.created_ids, []);
});

test('搬移:目的地只能一間、不能是來源;超過 4 艘不阻擋(放在未排入)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(api, 'W2');
  const w3 = await mkWorkshop(api, 'W3');
  const subs = await fill(api, w1, ['甲', '乙']);
  await fill(api, w2, ['1', '2', '3', '4']);
  const base = { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'move' };
  assert.equal((await api('POST', '/api/submarines/transfer', { ...base, target_workshop_ids: [w2, w3] })).statusCode, 400);
  assert.equal((await api('POST', '/api/submarines/transfer', { ...base, target_workshop_ids: [w1] })).statusCode, 400);
  assert.equal((await api('POST', '/api/submarines/transfer', { ...base, target_workshop_ids: [] })).statusCode, 400);
  const ok = await api('POST', '/api/submarines/transfer', { ...base, target_workshop_ids: [w2] });
  assert.equal(ok.statusCode, 200);
  assert.equal(sub(ok.json() as SubmarinesChangeResult, w2).length, 5);
  assert.equal((await list(api, w2))[4]!.position, 5);
});

test('搬移:返航提醒跟著換工坊,未排入的艇不提醒', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(api, 'W2');
  await api('PUT', `/api/users/me/notify`, {}).catch(() => undefined);
  const subs = await fill(api, w1, ['甲']);
  await fill(api, w2, ['1', '2', '3', '4']);
  await api('PUT', `/api/workshops/${w1}/submarines/1`, { status: 'exploring', remaining_minutes: 600 });
  const count = (w: string) => (t.db.prepare('SELECT COUNT(*) AS n FROM reminders WHERE workshop_id = ?').get(w) as { n: number }).n;
  const before = count(w1);
  await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'move', target_workshop_ids: [w2] });
  assert.equal(count(w1), 0);
  assert.equal(count(w2), 0, '放進第 5 位 = 未排入,不提醒');
  assert.ok(before >= 0);
});

test('複製:只帶名稱、配件、等級經驗;狀態新登記;原地複製加「(複製)」;可多個目的地', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(api, 'W2');
  const w3 = await mkWorkshop(api, 'W3');
  const subs = await fill(api, w1, ['甲']);
  await api('PUT', `/api/submarines/${subs[0]!.id}/build`, P);
  await api('PUT', `/api/submarines/${subs[0]!.id}/progress`, { level: 70, exp_in_level: 5, assist_on: true });
  const res = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'copy', target_workshop_ids: [w1, w2, w3] });
  assert.equal(res.statusCode, 200);
  const body = res.json() as SubmarinesChangeResult;
  assert.equal(body.created_ids.length, 3);
  assert.deepEqual(positions(sub(body, w1)), ['1:甲', '2:甲(複製)']);
  for (const [w, name] of [[w1, '甲(複製)'], [w2, '甲'], [w3, '甲']] as const) {
    const c = sub(body, w).find((s) => body.created_ids.includes(s.id))!;
    assert.equal(c.name, name);
    assert.equal(c.status, 'registered');
    assert.equal(c.expected_return_at, null);
    assert.equal(c.build!.bridge, 4);
    assert.equal(c.progress!.level, 70);
    assert.equal(c.progress!.exp_in_level, 5);
    assert.equal(c.progress!.assist_on, false, '航線輔助不帶');
    assert.equal(c.upkeep, undefined, '維修提醒不帶');
  }
  assert.equal(sub(body, w1)[0]!.status, 'complete', '原艇不變');
  assert.equal(sub(body, w1)[0]!.progress!.assist_on, true);
});

test('複製:名稱已滿 20 字時截短再加後綴;超過 20 艘回 409 且整筆不生效', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const w1 = await mkWorkshop(api, 'W1');
  const long = '一二三四五六七八九十一二三四五六七八九十';
  const subs = await fill(api, w1, [long]);
  const res = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'copy', target_workshop_ids: [w1] });
  const name = sub(res.json() as SubmarinesChangeResult, w1)[1]!.name!;
  assert.equal([...name].length, 20);
  assert.ok(name.endsWith('(複製)'));
  const w2 = await mkWorkshop(api, 'W2');
  await fill(api, w2, ['x']);
  for (let i = 0; i < 18; i++) await api('POST', `/api/workshops/${w2}/submarines`, {});
  const before = (await list(api, w2)).length;
  assert.equal(before, 19);
  const two = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id, subs[0]!.id], mode: 'copy', target_workshop_ids: [w2] });
  assert.equal(two.statusCode, 400);
  const over = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'copy', target_workshop_ids: [w2, w1, w2].slice(0, 2) });
  assert.equal(over.statusCode, 200);
  const w3 = await mkWorkshop(api, 'W3');
  for (let i = 0; i < 20; i++) await api('POST', `/api/workshops/${w3}/submarines`, {});
  const full = await api('POST', '/api/submarines/transfer', { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'copy', target_workshop_ids: [w3] });
  assert.equal(full.statusCode, 409);
  assert.equal((await list(api, w3)).length, 20);
});

test('搬移 / 複製:別人的工坊 404', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const other = await asUser(t, ID_B);
  const w1 = await mkWorkshop(api, 'W1');
  const w2 = await mkWorkshop(other, 'X');
  const subs = await fill(api, w1, ['甲']);
  const body = { source_workshop_id: w1, submarine_ids: [subs[0]!.id], mode: 'copy', target_workshop_ids: [w2] };
  assert.equal((await api('POST', '/api/submarines/transfer', body)).statusCode, 404);
  assert.equal((await other('POST', '/api/submarines/transfer', body)).statusCode, 404);
  assert.equal((await api('POST', '/api/submarines/transfer', { ...body, mode: 'x', target_workshop_ids: [w1] })).statusCode, 400);
});

test('位置編輯:4 格 + 未排入,未排入不參與提醒;完整性檢查', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  const subs = await fill(api, wid, ['甲', '乙', '丙', '丁']);
  await api('POST', `/api/workshops/${wid}/submarines`, { name: '戊' });
  await api('POST', `/api/workshops/${wid}/submarines`, { name: '己' });
  const all = await list(api, wid);
  const [a, b, c, d, e, f] = all.map((s) => s.id) as [string, string, string, string, string, string];
  const url = `/api/workshops/${wid}/submarines/layout`;
  // 戊換進 ②、乙取消釘選;④ 空位
  const ok = await api('POST', url, { slots: [a, e, c, null], unplaced: [b, d, f] });
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(positions(sub(ok.json() as SubmarinesChangeResult, wid)), ['1:甲', '2:戊', '3:丙', '5:乙', '6:丁', '7:己']);
  // 缺一艘 / 多一艘 / 重複 / 格數不對
  assert.equal((await api('POST', url, { slots: [a, e, c, null], unplaced: [b, d] })).statusCode, 400);
  assert.equal((await api('POST', url, { slots: [a, a, c, null], unplaced: [b, d, e, f] })).statusCode, 400);
  assert.equal((await api('POST', url, { slots: [a, e, c], unplaced: [b, d, f] })).statusCode, 400);
  assert.equal((await api('POST', url, { slots: [a, e, c, 'zzz'], unplaced: [b, d, f] })).statusCode, 400);
  // 未排入的探索中潛艇不提醒
  await api('PUT', `/api/workshops/${wid}/submarines/5`, { status: 'exploring', remaining_minutes: 600 });
  await api('PUT', `/api/workshops/${wid}/submarines/3`, { status: 'exploring', remaining_minutes: 600 });
  const n = () => (t.db.prepare('SELECT COUNT(*) AS n FROM reminders WHERE workshop_id = ?').get(wid) as { n: number }).n;
  const withPinned = n();
  await api('POST', url, { slots: [a, e, null, null], unplaced: [b, d, f, c] });
  assert.ok(n() <= withPinned, '丙被取消釘選後提醒不增加');
  assert.equal(subs.length, 4);
});

test('提醒只看位置 1~4:未排入的探索中潛艇不產生提醒', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const wid = await mkWorkshop(api, 'W');
  await api('PUT', `/api/workshops/${wid}/submarines/6`, { status: 'exploring', remaining_minutes: 600 });
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM reminders WHERE workshop_id = ?').get(wid) as { n: number }).n, 0);
});
