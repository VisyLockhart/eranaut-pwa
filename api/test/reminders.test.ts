import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { deleteRemindersForUser } from '../src/repo/reminders.js';
import { computeCandidates, methodsFromBits } from '../src/services/reminders.js';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const T0 = new Date('2026-10-01T00:00:00Z').getTime();
const at = (minutesFromT0: number) => new Date(T0 + minutesFromT0 * 60_000).toISOString();

async function asUser(t: TestApp, discordId = ID_A) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: 'u', global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
}
type Api = Awaited<ReturnType<typeof asUser>>;

async function workshop(api: Api, over: object = {}) {
  return (await api('POST', '/api/workshops', { name: 'W', server: '迦樓羅', ...over })).json() as WorkshopDto;
}
const putSubs = async (api: Api, wid: string, submarines: object[]) =>
  (await api('PUT', `/api/workshops/${wid}/submarines`, { submarines })).json() as SubmarinesUpdateResult;
const exploring = (position: number, remaining_minutes: number) => ({ position, status: 'exploring', remaining_minutes });
const complete = (position: number) => ({ position, status: 'complete' });
const advance = (t: TestApp, minutes: number) => void (t.clock.now = new Date(t.clock.now.getTime() + minutes * 60_000));

interface Snap { submarine_id: string | null; scheduled_at: string; deliveries: { method: string; status: string; attempts: number; next_attempt_at: string }[] }
function snap(t: TestApp): Snap[] {
  const rs = t.db.prepare('SELECT id, submarine_id, scheduled_at FROM reminders ORDER BY scheduled_at, id').all() as { id: string; submarine_id: string | null; scheduled_at: string }[];
  return rs.map((r) => ({
    submarine_id: r.submarine_id,
    scheduled_at: r.scheduled_at,
    deliveries: t.db.prepare('SELECT method, status, attempts, next_attempt_at FROM reminder_deliveries WHERE reminder_id = ? ORDER BY method').all(r.id) as Snap['deliveries'],
  }));
}
const times = (t: TestApp) => snap(t).map((s) => s.scheduled_at);
const markDelivery = (t: TestApp, method: string, status: string, attempts = 1) =>
  t.db.prepare('UPDATE reminder_deliveries SET status = ?, attempts = ?, last_error = ? WHERE method = ?').run(status, attempts, status === 'failed' ? 'boom' : null, method);

// ---- 純函式 ----

test('computeCandidates:逐艘 = 每艘探索中的艇一筆,應發 = 返航 − 預先提醒', () => {
  const subs = [
    { id: 'a', status: 'exploring' as const, expected_return_at: at(60) },
    { id: 'b', status: 'complete' as const, expected_return_at: null },
    { id: 'c', status: 'exploring' as const, expected_return_at: at(120) },
  ];
  assert.deepEqual(computeCandidates(false, 0, subs).map((c) => [c.submarineId, c.scheduledAt.toISOString()]), [['a', at(60)], ['c', at(120)]]);
  assert.deepEqual(computeCandidates(false, 15, subs).map((c) => c.scheduledAt.toISOString()), [at(45), at(105)]);
});

test('computeCandidates:整批 = 一筆,應發 = 最晚返航 − 預先提醒;沒有探索中的艇就沒有', () => {
  const subs = [
    { id: 'a', status: 'exploring' as const, expected_return_at: at(60) },
    { id: 'c', status: 'exploring' as const, expected_return_at: at(120) },
    { id: 'd', status: 'complete' as const, expected_return_at: null },
  ];
  assert.deepEqual(computeCandidates(true, 0, subs).map((c) => [c.submarineId, c.scheduledAt.toISOString()]), [[null, at(120)]]);
  assert.deepEqual(computeCandidates(true, 30, subs).map((c) => c.scheduledAt.toISOString()), [at(90)]);
  assert.deepEqual(computeCandidates(true, 0, [{ id: 'd', status: 'complete', expected_return_at: null }]), []);
  assert.deepEqual(computeCandidates(false, 0, []), []);
});

test('methodsFromBits:位元對應 delivery 方式', () => {
  assert.deepEqual(methodsFromBits(0), []);
  assert.deepEqual(methodsFromBits(1), ['dm']);
  assert.deepEqual(methodsFromBits(2), ['channel']);
  assert.deepEqual(methodsFromBits(3), ['dm', 'channel']);
  assert.deepEqual(methodsFromBits(4), [], '預留位元不產生 delivery');
});

// ---- 逐艘模式 ----

test('逐艘:探索中的艇各一筆提醒(預設只 DM,待發,下次嘗試 = 應發時間);探索完成沒有', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60), exploring(2, 120), complete(3)]);
  assert.deepEqual(snap(t), [
    { submarine_id: snap(t)[0]!.submarine_id, scheduled_at: at(60), deliveries: [{ method: 'dm', status: 'pending', attempts: 0, next_attempt_at: at(60) }] },
    { submarine_id: snap(t)[1]!.submarine_id, scheduled_at: at(120), deliveries: [{ method: 'dm', status: 'pending', attempts: 0, next_attempt_at: at(120) }] },
  ]);
  assert.equal(new Set(snap(t).map((s) => s.submarine_id)).size, 2);
});

test('逐艘:同一艘重複更新只留最新一筆(upsert,不累積),返航時間跟著改', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60)]);
  advance(t, 10);
  await putSubs(api, w.id, [exploring(1, 30)]);
  advance(t, 5);
  await putSubs(api, w.id, [exploring(1, 90)]);
  assert.deepEqual(times(t), [at(15 + 90)]);
});

test('逐艘:艇改成探索完成,提醒刪除', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60), exploring(2, 90)]);
  await putSubs(api, w.id, [complete(1)]);
  assert.deepEqual(times(t), [at(90)]);
});

test('再次更新會把已發送的 delivery 重置為待發(返航時間改變 = 新的提醒)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 10)]);
  advance(t, 11);
  markDelivery(t, 'dm', 'sent');
  await putSubs(api, w.id, [exploring(1, 60)]);
  assert.deepEqual(snap(t).map((s) => [s.scheduled_at, s.deliveries]), [[at(71), [{ method: 'dm', status: 'pending', attempts: 0, next_attempt_at: at(71) }]]]);
});

// ---- 預先提醒 ----

test('預先提醒:只在提前時間提醒,返航當下不再提醒(D-135 ①)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_lead_minutes: 15 });
  const r = await putSubs(api, w.id, [exploring(1, 60)]);
  assert.deepEqual(times(t), [at(45)]);
  assert.deepEqual(r.reminder_skipped_positions, []);
});

test('預先提醒時間已過:略過該艘並在回應列出位置;其他艘不受影響(D-135 ②)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_lead_minutes: 30 });
  const r = await putSubs(api, w.id, [exploring(1, 10), exploring(2, 120), exploring(3, 30), complete(4)]);
  assert.deepEqual(r.reminder_skipped_positions, [1, 3], '剩 10 分、剛好 30 分(應發時間 = 現在)都已過');
  assert.deepEqual(times(t), [at(90)]);
});

test('預先提醒未開時不會有「略過」提示', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  assert.deepEqual((await putSubs(api, w.id, [exploring(1, 1)])).reminder_skipped_positions, []);
  assert.equal(snap(t).length, 1);
});

test('預先提醒略過時,原本已存在的舊提醒會被刪掉(不會留著舊時間)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_lead_minutes: 30 });
  await putSubs(api, w.id, [exploring(1, 120)]);
  assert.equal(snap(t).length, 1);
  advance(t, 1);
  const r = await putSubs(api, w.id, [exploring(1, 10)]);
  assert.deepEqual(r.reminder_skipped_positions, [1]);
  assert.equal(snap(t).length, 0);
});

test('單艘快速修改也會重算提醒並回報略過', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_lead_minutes: 15 });
  const ok = (await api('PUT', `/api/workshops/${w.id}/submarines/1`, exploring(1, 60))).json() as SubmarinesUpdateResult;
  assert.deepEqual(ok.reminder_skipped_positions, []);
  assert.deepEqual(times(t), [at(45)]);
  const late = (await api('PUT', `/api/workshops/${w.id}/submarines/1`, exploring(1, 5))).json() as SubmarinesUpdateResult;
  assert.deepEqual(late.reminder_skipped_positions, [1]);
  assert.equal(snap(t).length, 0);
});

// ---- 整批模式 ----

test('整批:整個工坊一筆,應發 = 最晚返航;不論更新幾艘', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_batched: true });
  await putSubs(api, w.id, [exploring(1, 60), exploring(2, 180), exploring(3, 90), complete(4)]);
  assert.deepEqual(snap(t).map((s) => [s.submarine_id, s.scheduled_at]), [[null, at(180)]]);
  advance(t, 10);
  await putSubs(api, w.id, [exploring(2, 30)]);
  assert.deepEqual(times(t), [at(90)], '最晚返航變成第 3 艘的 90 分,應發時間跟著改(仍只有一筆)');
});

test('整批:全部探索完成就沒有提醒;預先提醒與整批併用 = 最晚返航 − 提前', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_batched: true, notify_lead_minutes: 10 });
  await putSubs(api, w.id, [exploring(1, 60), exploring(2, 120)]);
  assert.deepEqual(times(t), [at(110)]);
  await putSubs(api, w.id, [complete(1), complete(2)]);
  assert.equal(snap(t).length, 0);
});

test('整批 + 預先提醒時間已過:略過,回應列出本次請求中探索中的位置', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api, { notify_batched: true, notify_lead_minutes: 60 });
  const r = await putSubs(api, w.id, [exploring(1, 20), exploring(2, 40), complete(3)]);
  assert.deepEqual(r.reminder_skipped_positions, [1, 2]);
  assert.equal(snap(t).length, 0);
});

// ---- 工坊設定改變 ----

test('切換整批 ↔ 逐艘:改成另一種型態並刪除原本的', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60), exploring(2, 120)]);
  assert.equal(snap(t).filter((s) => s.submarine_id !== null).length, 2);

  await api('PUT', `/api/workshops/${w.id}`, { name: 'W', server: '迦樓羅', notify_batched: true });
  assert.deepEqual(snap(t).map((s) => [s.submarine_id, s.scheduled_at]), [[null, at(120)]]);

  await api('PUT', `/api/workshops/${w.id}`, { name: 'W', server: '迦樓羅', notify_batched: false });
  assert.deepEqual(snap(t).map((s) => s.scheduled_at), [at(60), at(120)]);
  assert.ok(snap(t).every((s) => s.submarine_id !== null));
});

test('修改預先提醒分鐘:應發時間改變,delivery 重置為待發', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60)]);
  markDelivery(t, 'dm', 'failed', 3);
  await api('PUT', `/api/workshops/${w.id}`, { name: 'W', server: '迦樓羅', notify_lead_minutes: 10 });
  assert.deepEqual(snap(t).map((s) => [s.scheduled_at, s.deliveries]), [[at(50), [{ method: 'dm', status: 'pending', attempts: 0, next_attempt_at: at(50) }]]]);
  await api('PUT', `/api/workshops/${w.id}`, { name: 'W', server: '迦樓羅', notify_lead_minutes: 0 });
  assert.deepEqual(times(t), [at(60)]);
});

test('只改工坊名稱等與提醒無關的欄位:應發時間不變,已發送/失敗的 delivery 保持原狀(D-145 ④)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 10)]);
  advance(t, 11);
  markDelivery(t, 'dm', 'failed', 3);
  await api('PUT', `/api/workshops/${w.id}`, { name: '改名', server: '泰坦' });
  assert.deepEqual(snap(t).map((s) => s.deliveries), [[{ method: 'dm', status: 'failed', attempts: 3, next_attempt_at: at(10) }]]);
});

test('應發時間已到但還沒被輪詢發出的提醒,重算時不會被丟掉', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 10)]);
  advance(t, 10.2);
  await api('PUT', `/api/workshops/${w.id}`, { name: '改名', server: '迦樓羅' });
  assert.deepEqual(snap(t).map((s) => s.deliveries.map((d) => d.status)), [['pending']]);
});

// ---- 使用者提醒方式 ----

test('提醒方式:預設 DM;GET/PUT 用具名布林', async () => {
  const t = makeApp();
  const api = await asUser(t);
  assert.deepEqual((await api('GET', '/api/notify-prefs')).json(), { dm: true, channel: false });
  const res = await api('PUT', '/api/notify-prefs', { dm: false, channel: true });
  assert.deepEqual(res.json(), { dm: false, channel: true });
  assert.deepEqual((await api('GET', '/api/notify-prefs')).json(), { dm: false, channel: true });
  assert.equal((t.db.prepare('SELECT notify_methods FROM users').get() as { notify_methods: number }).notify_methods, 2, 'DB 內是位元');
});

test('提醒方式驗證:缺欄位 / 非布林 → 400;未登入 401;別的來源 403', async () => {
  const t = makeApp();
  const api = await asUser(t);
  assert.deepEqual((await api('PUT', '/api/notify-prefs', {})).json(), { error: 'validation_failed', fields: { dm: 'required', channel: 'required' } });
  assert.deepEqual((await api('PUT', '/api/notify-prefs', { dm: 1, channel: 'yes' })).json().fields, { dm: 'invalid_type', channel: 'invalid_type' });
  assert.equal((await api('PUT', '/api/notify-prefs')).statusCode, 400);
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/notify-prefs' })).statusCode, 401);
  assert.equal((await t.app.inject({ method: 'PUT', url: '/api/notify-prefs', payload: { dm: true, channel: true }, headers: { origin: 'https://evil.example' } })).statusCode, 403);
  assert.deepEqual((await api('GET', '/api/notify-prefs')).json(), { dm: true, channel: false }, '失敗時不改');
});

test('改提醒方式:未到期的提醒增刪 delivery;全取消 = 不留提醒;再開回來會重建', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 60)]);
  const methodsOf = () => snap(t).map((s) => s.deliveries.map((d) => d.method));

  await api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  assert.deepEqual(methodsOf(), [['channel', 'dm']]);
  await api('PUT', '/api/notify-prefs', { dm: false, channel: true });
  assert.deepEqual(methodsOf(), [['channel']]);
  await api('PUT', '/api/notify-prefs', { dm: false, channel: false });
  assert.equal(snap(t).length, 0);
  await api('PUT', '/api/notify-prefs', { dm: true, channel: false });
  assert.deepEqual(methodsOf(), [['dm']]);
  assert.deepEqual(times(t), [at(60)]);
});

test('全不選時更新潛艇不產生提醒,也沒有「略過」提示', async () => {
  const t = makeApp();
  const api = await asUser(t);
  await api('PUT', '/api/notify-prefs', { dm: false, channel: false });
  const w = await workshop(api, { notify_lead_minutes: 30 });
  const r = await putSubs(api, w.id, [exploring(1, 5)]);
  assert.equal(snap(t).length, 0);
  assert.deepEqual(r.reminder_skipped_positions, []);
});

test('防重複提醒:DM 已發出後才加開頻道,不會補發頻道,DM 維持已發送(D-145 ④)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  const w = await workshop(api);
  await putSubs(api, w.id, [exploring(1, 10)]);
  advance(t, 12);
  markDelivery(t, 'dm', 'sent');
  await api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  assert.deepEqual(snap(t).map((s) => s.deliveries.map((d) => [d.method, d.status])), [[['dm', 'sent']]]);
});

test('提醒方式只影響自己的提醒', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const wa = await workshop(a);
  const wb = await workshop(b);
  await putSubs(a, wa.id, [exploring(1, 60)]);
  await putSubs(b, wb.id, [exploring(1, 60)]);
  await b('PUT', '/api/notify-prefs', { dm: false, channel: false });
  assert.equal(snap(t).length, 1);
  assert.deepEqual((await a('GET', '/api/notify-prefs')).json(), { dm: true, channel: false });
});

// ---- 刪除與停用 ----

test('刪除工坊連帶刪除提醒;停用使用者可一次取消其全部提醒(D-130)', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const wa = await workshop(a);
  const wa2 = await workshop(a);
  const wb = await workshop(b);
  for (const [api, w] of [[a, wa], [a, wa2], [b, wb]] as const) await putSubs(api, w.id, [exploring(1, 60)]);
  assert.equal(snap(t).length, 3);
  await a('DELETE', `/api/workshops/${wa2.id}`);
  assert.equal(snap(t).length, 2);
  const uid = (t.db.prepare('SELECT id FROM users WHERE discord_user_id = ?').get(ID_A) as { id: string }).id;
  deleteRemindersForUser(t.db, uid);
  assert.equal(snap(t).length, 1, '只刪該使用者的');
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM reminder_deliveries').get() as { n: number }).n, 1);
});

test('提醒資料量有上限:反覆更新不會累積(每艘最多一筆、每筆每種方式最多一個 delivery)', async () => {
  const t = makeApp();
  const api = await asUser(t);
  await api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  const w = await workshop(api);
  for (let i = 0; i < 10; i++) {
    advance(t, 1);
    await putSubs(api, w.id, [exploring(1, 60 + i), exploring(2, 90)]);
    await api('PUT', `/api/workshops/${w.id}`, { name: `W${i}`, server: '迦樓羅', notify_batched: i % 2 === 0 });
  }
  const n = (table: string) => (t.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
  assert.ok(n('reminders') <= 2);
  assert.ok(n('reminder_deliveries') <= 4);
});
