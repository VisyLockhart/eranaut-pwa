import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { OverviewDto, SubmarineDto, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { buildReminderMessage } from '../src/services/reminder-message.js';
import { processDueDeliveries, type DeliveryLogger } from '../src/services/deliveries.js';
import type { ReminderSender, SendTarget } from '../src/discord/sender.js';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const HOUR = 3_600_000;

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;
const advance = (t: TestApp, ms: number) => void (t.clock.now = new Date(t.clock.now.getTime() + ms));

/** 一間工坊 + ①號潛艇;parts 有給就設定這艘的配件(D-296)。回 { wid, sid } */
async function setup(t: TestApp, api: Api, parts: { hull: number; stern: number; bow: number; bridge: number } | null = { hull: 3, stern: 1, bow: 2, bridge: 4 }) {
  const w = (await api('POST', '/api/workshops', { name: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜' })).json() as WorkshopDto;
  const res = await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, name: 'S1', status: 'complete' }] });
  const sid = (res.json() as SubmarinesUpdateResult).submarines[0]!.id;
  if (parts) assert.equal((await api('PUT', `/api/submarines/${sid}/build`, parts)).statusCode, 200);
  return { wid: w.id, sid };
}
const dispatch = (api: Api, wid: string, extra: object = {}, minutes = 120) =>
  api('PUT', `/api/workshops/${wid}/submarines/1`, { name: 'S1', status: 'exploring', remaining_minutes: minutes, ...extra });
const upkeepOf = async (api: Api, wid: string) => ((await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[])[0]!.upkeep;
const ON = { upkeep: { route_key: '1:OJ' } };

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const [method, url] of [['PUT', '/api/submarines/x/upkeep'], ['DELETE', '/api/submarines/x/upkeep'], ['POST', '/api/workshops/x/upkeep/repaired']] as const) {
    assert.equal((await t.app.inject({ method, url, payload: {} })).statusCode, 401, `${method} ${url}`);
  }
});

test('開啟:3124 + 溺沒海 O→J,上限 6(船尾鯊魚級),開啟的這次更新算第 1 趟', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  const res = await dispatch(api, wid, ON);
  assert.equal(res.statusCode, 200);
  const u = (res.json() as SubmarinesUpdateResult).submarines[0]!.upkeep!;
  assert.deepEqual(
    { k: u.route_key, sea: u.route_sea, pts: u.route_points, done: u.voyages_done, limit: u.limit_voyages, sig: u.parts_sig, cur: u.current_sig },
    { k: '1:OJ', sea: 1, pts: ['O', 'J'], done: 1, limit: 6, sig: '3,1,2,4', cur: '3,1,2,4' },
  );
  const ov = (await api('GET', '/api/overview')).json() as OverviewDto;
  assert.equal(ov.workshops[0]!.submarines[0]!.upkeep!.voyages_done, 1, '總覽也帶回維修狀態');
});

test('計次:探索還沒回來就重送不算;返航後再出航才 +1;沒開啟的潛艇完全不變', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  assert.equal(await upkeepOf(api, wid), undefined, '沒開啟時不帶 upkeep 欄位');
  await dispatch(api, wid, ON); // 1
  advance(t, 10 * 60_000);
  await dispatch(api, wid, {}, 100); // 同一趟改時間
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 1);
  advance(t, 3 * HOUR); // 已返航
  await dispatch(api, wid);
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 2);
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete' });
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 2, '送出探索完成不算');
  await dispatch(api, wid); // 上一筆是探索完成 → 算
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 3);
});

test('整坊更新也計次', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  await dispatch(api, wid, ON);
  advance(t, 3 * HOUR);
  await api('PUT', `/api/workshops/${wid}/submarines`, { submarines: [{ position: 1, name: 'S1', status: 'exploring', remaining_minutes: 60 }] });
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 2);
});

test('用盡 6/6 後返航再出航 → 視為已維修,重設為第 1 趟並記錄維修時間', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  await dispatch(api, wid, ON);
  for (let i = 0; i < 5; i++) {
    advance(t, 3 * HOUR);
    await dispatch(api, wid);
  }
  let u = (await upkeepOf(api, wid))!;
  assert.equal(u.voyages_done, 6);
  advance(t, 10 * 60_000);
  await dispatch(api, wid);
  assert.equal((await upkeepOf(api, wid))!.voyages_done, 6, '第 6 趟還沒回來,重送不算也不重設');
  advance(t, 3 * HOUR);
  await dispatch(api, wid);
  u = (await upkeepOf(api, wid))!;
  assert.equal(u.voyages_done, 1);
  assert.equal(u.repaired_at, t.clock.now.toISOString());
});

test('開啟時可指定已跑趟數與上限;送出探索完成則只記錄已跑趟數', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  await dispatch(api, wid, { upkeep: { route_key: '1:OJ', already_done: 3, limit_voyages: 5 } });
  let u = (await upkeepOf(api, wid))!;
  assert.deepEqual([u.voyages_done, u.limit_voyages], [4, 5]);
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { upkeep: null, status: 'complete' });
  assert.equal(await upkeepOf(api, wid), undefined, 'upkeep: null = 關閉');
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete', upkeep: { route_key: '1:OJ', already_done: 2 } });
  u = (await upkeepOf(api, wid))!;
  assert.deepEqual([u.voyages_done, u.limit_voyages], [2, 6]);
});

test('沒設定配件、不支援的路線、不合理的趟數都拒絕,而且整筆更新不生效', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api, null);
  let res = await api('PUT', `/api/workshops/${wid}/submarines/1`, { name: '改名', status: 'exploring', remaining_minutes: 60, ...ON });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().fields.upkeep, 'invalid_value');
  assert.equal(res.json().upkeep_reason, 'no_build');
  assert.equal(((await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[])[0]!.name, 'S1', '整筆回復');

  const b = await setup(t, api); // 另一間有綁定的
  for (const upkeep of [{ route_key: '9:ZZ' }, { route_key: '1:OJ', already_done: -1 }, { route_key: '1:OJ', limit_voyages: 0 }, { route_key: '1:OJ', limit_voyages: 99 }, 'x']) {
    res = await dispatch(api, b.wid, { upkeep });
    assert.equal(res.statusCode, 400, JSON.stringify(upkeep));
  }
  res = await dispatch(api, b.wid, { upkeep: { route_key: '1:OJ', already_done: 6 } }); // 已跑 ≥ 上限
  assert.equal(res.statusCode, 400);
  assert.equal(await upkeepOf(api, b.wid), undefined);
  const batch = await api('PUT', `/api/workshops/${b.wid}/submarines`, { submarines: [{ position: 1, status: 'complete', upkeep: { route_key: '1:OJ', already_done: 9 } }] });
  assert.equal(batch.statusCode, 400);
  assert.deepEqual(batch.json().items, [{ index: 0, fields: { upkeep: 'invalid_value' } }]);
});

test('手動調整趟數 / 上限、標示已維修、關閉', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, sid } = await setup(t, api);
  await dispatch(api, wid, ON);
  let res = await api('PUT', `/api/submarines/${sid}/upkeep`, { voyages_done: 4 });
  assert.equal((res.json() as SubmarineDto).upkeep!.voyages_done, 4);
  res = await api('PUT', `/api/submarines/${sid}/upkeep`, { limit_voyages: 7 });
  assert.equal((res.json() as SubmarineDto).upkeep!.limit_voyages, 7);
  for (const bad of [{}, { voyages_done: -1 }, { voyages_done: 1.5 }, { limit_voyages: 0 }, { voyages_done: 'a' }]) {
    assert.equal((await api('PUT', `/api/submarines/${sid}/upkeep`, bad)).statusCode, 400, JSON.stringify(bad));
  }
  const rep = await api('POST', `/api/workshops/${wid}/upkeep/repaired`, { submarine_ids: [sid] });
  const u = (rep.json() as SubmarinesUpdateResult).submarines[0]!.upkeep!;
  assert.deepEqual([u.voyages_done, u.repaired_at], [0, t.clock.now.toISOString()]);
  assert.equal((await api('POST', `/api/workshops/${wid}/upkeep/repaired`, { submarine_ids: [] })).statusCode, 400);
  const del = await api('DELETE', `/api/submarines/${sid}/upkeep`);
  assert.equal((del.json() as SubmarineDto).upkeep, undefined);
  assert.equal((await api('PUT', `/api/submarines/${sid}/upkeep`, { voyages_done: 1 })).statusCode, 404, '沒開啟時調整 → 404');
});

test('不能碰別人的潛艇', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const { wid, sid } = await setup(t, a);
  await dispatch(a, wid, ON);
  assert.equal((await b('PUT', `/api/submarines/${sid}/upkeep`, { voyages_done: 0 })).statusCode, 404);
  assert.equal((await b('DELETE', `/api/submarines/${sid}/upkeep`)).statusCode, 404);
  assert.equal((await b('POST', `/api/workshops/${wid}/upkeep/repaired`, { submarine_ids: [sid] })).statusCode, 404);
  assert.equal((await upkeepOf(a, wid))!.voyages_done, 1);
});

test('改這艘的配件:維修進度保留,current_sig 變成新配件;清除配件為 null', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, sid } = await setup(t, api);
  await dispatch(api, wid, ON);
  await api('PUT', `/api/submarines/${sid}/build`, { hull: 5, stern: 5, bow: 5, bridge: 5 });
  let u = (await upkeepOf(api, wid))!;
  assert.deepEqual([u.voyages_done, u.parts_sig, u.current_sig], [1, '3,1,2,4', '5,5,5,5']);
  await api('DELETE', `/api/submarines/${sid}/build`);
  u = (await upkeepOf(api, wid))!;
  assert.deepEqual([u.voyages_done, u.current_sig], [1, null]);
});

test('改配件並同時標示已維修:趟數歸 0、零件簽名與上限依新配件重算(D-296 ③)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, sid } = await setup(t, api);
  await dispatch(api, wid, ON);
  advance(t, 60_000);
  const res = await api('PUT', `/api/submarines/${sid}/build`, { hull: 5, stern: 5, bow: 5, bridge: 5, mark_repaired: true });
  assert.equal(res.statusCode, 200);
  const u = (await upkeepOf(api, wid))!;
  assert.equal(u.voyages_done, 0);
  assert.equal(u.parts_sig, '5,5,5,5');
  assert.equal(u.current_sig, '5,5,5,5');
  assert.equal(u.repaired_at, t.clock.now.toISOString());
});

test('刪除潛艇所在工坊時,維修提醒一併刪除(不留孤兒列)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(t, api);
  await dispatch(api, wid, ON);
  assert.equal((await api('DELETE', `/api/workshops/${wid}`)).statusCode, 204);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM submarine_upkeep').get() as { n: number }).n, 0);
});

// ---- 提醒文案 ----
const base = { workshopName: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜', lead: false, returnAt: null, mentionDiscordUserId: null };

test('文案:沒有 repair 或空陣列 → 和原本完全一樣', () => {
  const m = buildReminderMessage({ ...base, scope: { kind: 'submarine', position: 2, name: '潛水艇-2' } });
  assert.equal(buildReminderMessage({ ...base, repair: [], scope: { kind: 'submarine', position: 2, name: '潛水艇-2' } }), m);
});

test('文案:逐艘返航加一行(出航前);預先提醒說返航後;整批列出艇號', () => {
  const one = [{ position: 2, voyagesDone: 6, limit: 6, materials: 10 }];
  assert.equal(
    buildReminderMessage({ ...base, repair: one, scope: { kind: 'submarine', position: 2, name: '潛水艇-2' } }),
    '⚓ 潛水艇已返航\n②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)\n🔧 配件已用滿 6/6 趟,出航前需先維修(修理材料約 10 個)。',
  );
  assert.match(buildReminderMessage({ ...base, lead: true, repair: one, scope: { kind: 'submarine', position: 2, name: null } }), /\n🔧 配件已用滿 6\/6 趟,返航後需先維修/);
  const two = [...one, { position: 4, voyagesDone: 6, limit: 6, materials: null }];
  assert.ok(buildReminderMessage({ ...base, repair: two, scope: { kind: 'batch', count: 3 } }).endsWith('\n🔧 出航前需先維修:②(6/6 趟)、④(6/6 趟)(修理材料約 10 個)。'));
});

test('實際發送:趟數用盡的潛艇,返航提醒多一行;改趟數 / 標示已維修後內容跟著變', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const sent: string[] = [];
  const sender: ReminderSender = { async send(_t: SendTarget, content: string) { sent.push(content); } };
  const log: DeliveryLogger = { info() {}, warn() {} };
  const run = () => processDueDeliveries({ db: t.db, sender, reminderChannelId: null, now: () => t.clock.now, log });
  const { wid, sid } = await setup(t, api);
  await dispatch(api, wid, { upkeep: { route_key: '1:OJ', already_done: 5 } }, 60); // 第 6 趟
  advance(t, HOUR);
  await run();
  assert.equal(sent.length, 1);
  assert.ok(sent[0]!.endsWith('\n🔧 配件已用滿 6/6 趟,出航前需先維修(修理材料約 10 個)。'));

  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete' });
  await dispatch(api, wid, {}, 60); // 返航後出航 → 已維修,第 1 趟
  advance(t, HOUR);
  await run();
  assert.equal(sent.length, 2);
  assert.doesNotMatch(sent[1]!, /🔧/);
  void sid;
});
