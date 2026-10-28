import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { OverviewDto, SubmarineDto, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

// 潛艇等級與練級輔助(D-289)

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

async function setup(api: Api) {
  const w = (await api('POST', '/api/workshops', { name: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜' })).json() as WorkshopDto;
  const res = await api('PUT', `/api/workshops/${w.id}/submarines`, { submarines: [{ position: 1, name: 'S1', status: 'complete' }] });
  return { wid: w.id, sid: (res.json() as SubmarinesUpdateResult).submarines[0]!.id };
}
const send = (api: Api, wid: string, extra: object = {}, minutes = 120) =>
  api('PUT', `/api/workshops/${wid}/submarines/1`, { name: 'S1', status: 'exploring', remaining_minutes: minutes, ...extra });
const progressOf = async (api: Api, wid: string) => ((await api('GET', `/api/workshops/${wid}/submarines`)).json() as SubmarineDto[])[0]!.progress;
const JK = { sea: 1, points: ['J', 'K'] };

test('未登入一律 401', async () => {
  const t = makeApp();
  for (const method of ['PUT', 'DELETE'] as const) {
    assert.equal((await t.app.inject({ method, url: '/api/submarines/x/progress', payload: {} })).statusCode, 401, method);
  }
});

test('沒填等級:潛艇不帶 progress 欄位,更新與總覽跟以前完全一樣', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const res = await send(api, wid);
  assert.equal(res.statusCode, 200);
  assert.equal('progress' in (res.json() as SubmarinesUpdateResult).submarines[0]!, false);
  const ov = (await api('GET', '/api/overview')).json() as OverviewDto;
  assert.equal('progress' in ov.workshops[0]!.submarines[0]!, false);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM submarine_progress').get() as { n: number }).n, 0);
});

test('隨更新設定等級與經驗;沒有待結算時有效值 = 設定值', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const res = await send(api, wid, { progress: { level: 20, exp_in_level: 1000, sim_on: true, school: 'snap' } });
  assert.equal(res.statusCode, 200);
  const p = (res.json() as SubmarinesUpdateResult).submarines[0]!.progress!;
  assert.deepEqual(
    { l: p.level, e: p.exp_in_level, src: p.source, sim: p.sim_on, sc: p.school, pend: p.pending, el: p.effective_level, ee: p.effective_exp },
    { l: 20, e: 1000, src: 'manual', sim: true, sc: 'snap', pend: null, el: 20, ee: 1000 },
  );
});

test('換等級不帶經驗 → 經驗歸 0;同等級不帶經驗 → 保留', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20, exp_in_level: 5000 } });
  await send(api, wid, { progress: { sim_on: true } });
  assert.equal((await progressOf(api, wid))!.exp_in_level, 5000);
  await send(api, wid, { progress: { level: 21 } });
  const p = (await progressOf(api, wid))!;
  assert.deepEqual([p.level, p.exp_in_level], [21, 0]);
});

test('練級輔助:派出時記路線,返航後有效等級才會升,下一次派出才寫回', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const res = await send(api, wid, { progress: { level: 20, exp_in_level: 0, sim_on: true, route: JK } }, 600);
  const p0 = (res.json() as SubmarinesUpdateResult).submarines[0]!.progress!;
  assert.deepEqual(p0.pending, { sea: 1, points: ['J', 'K'], exp: 292420 });
  assert.deepEqual([p0.effective_level, p0.effective_exp], [20, 0], '還沒返航');

  advance(t, 11 * HOUR); // 已返航
  const p1 = (await progressOf(api, wid))!;
  assert.deepEqual([p1.level, p1.exp_in_level], [20, 0], '還沒寫回');
  assert.deepEqual([p1.effective_level, p1.effective_exp], [21, 142621], '讀取時算出已升級');

  // 下一次派出:先把上一趟寫回,再記新的路線
  await send(api, wid, { progress: { route: { sea: 1, points: ['J'] } } });
  const p2 = (await progressOf(api, wid))!;
  assert.deepEqual([p2.level, p2.exp_in_level, p2.source], [21, 142621, 'sim']);
  assert.deepEqual(p2.pending, { sea: 1, points: ['J'], exp: 146210 });
  assert.deepEqual([p2.effective_level, p2.effective_exp], [21, 142621]);
  assert.deepEqual(p2.last_route, { sea: 1, points: ['J'] }, '最近一次的路線');
});

test('結算之後、清掉待結算的路線之後,「上次的路線」仍保留', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, sid } = await setup(api);
  await send(api, wid, { progress: { level: 20, route: JK } }, 600);
  advance(t, 11 * HOUR);
  await send(api, wid, { progress: { sim_on: true } }, 600);
  const p = (await progressOf(api, wid))!;
  assert.equal(p.pending, null);
  assert.deepEqual(p.last_route, JK);
  const cleared = await api('PUT', `/api/submarines/${sid}/progress`, { route: null });
  assert.deepEqual((cleared.json() as SubmarineDto).progress!.last_route, JK);
});

test('明確給等級或經驗 = 以那個數字為準,待結算的路線作廢(避免返航後重複加);只改開關或偏好則保留', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20, exp_in_level: 0, route: JK } }, 600);
  await send(api, wid, { progress: { sim_on: true, school: 'half' } }, 590);
  assert.equal((await progressOf(api, wid))!.pending!.exp, 292420, '只改偏好,路線保留');
  await send(api, wid, { progress: { exp_in_level: 500 } }, 580);
  assert.equal((await progressOf(api, wid))!.pending, null, '改經驗,路線作廢');
  await send(api, wid, { progress: { level: 20, exp_in_level: 500, route: JK } }, 570);
  assert.equal((await progressOf(api, wid))!.pending!.exp, 292420, '同一次送新路線則保留新的');
});

test('同一趟重送(探索還沒回來)不結算,新路線取代舊路線', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20, exp_in_level: 0, route: JK } }, 600);
  advance(t, HOUR);
  await send(api, wid, { progress: { route: { sea: 1, points: ['J'] } } }, 500);
  const p = (await progressOf(api, wid))!;
  assert.deepEqual([p.level, p.exp_in_level], [20, 0]);
  assert.equal(p.pending!.exp, 146210);
  await send(api, wid, {}, 450); // 沒帶 progress:待結算的路線不變
  assert.equal((await progressOf(api, wid))!.pending!.exp, 146210);
});

test('送出探索完成:有效等級已套用,待結算仍在,下一次派出才寫回', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20, exp_in_level: 0, route: JK } }, 600);
  await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete' });
  const p = (await progressOf(api, wid))!;
  assert.deepEqual([p.level, p.effective_level, p.effective_exp], [20, 21, 142621]);
  await send(api, wid);
  assert.deepEqual([(await progressOf(api, wid))!.level, (await progressOf(api, wid))!.pending], [21, null]);
});

test('截圖辨識(source: ocr)以辨識為準:清掉待結算的路線;同等級保留經驗、換等級歸 0;沒有列時自動建立(練級輔助關閉)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20, exp_in_level: 7000, sim_on: true, route: JK } }, 600);
  await send(api, wid, { progress: { level: 20, source: 'ocr' } }, 590);
  let p = (await progressOf(api, wid))!;
  assert.deepEqual([p.level, p.exp_in_level, p.source, p.pending, p.sim_on], [20, 7000, 'ocr', null, true]);
  await send(api, wid, { progress: { level: 23, source: 'ocr' } }, 580);
  p = (await progressOf(api, wid))!;
  assert.deepEqual([p.level, p.exp_in_level], [23, 0]);

  const api2 = await asUser(t, ID_B);
  const b = await setup(api2);
  await send(api2, b.wid, { progress: { level: 94, source: 'ocr' } });
  const q = (await progressOf(api2, b.wid))!;
  assert.deepEqual([q.level, q.source, q.sim_on], [94, 'ocr', false]);
});

test('被拒絕:沒有等級就記路線、探索完成記路線、點位不存在或重複、經驗超過升級所需、等級超出範圍 → 400,整筆不生效', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const bad = async (progress: unknown, status: object = {}) => {
    const r = await send(api, wid, { progress, ...status });
    assert.equal(r.statusCode, 400, JSON.stringify(progress));
    assert.ok((r.json() as { fields?: Record<string, string>; items?: { fields: Record<string, string> }[] }).fields?.progress ?? (r.json() as { items: { fields: Record<string, string> }[] }).items[0]!.fields.progress);
  };
  await bad({ route: JK }); // 沒有等級
  await bad({ level: 20, route: { sea: 1, points: ['J', 'J'] } });
  await bad({ level: 20, route: { sea: 1, points: ['ZZ'] } });
  await bad({ level: 20, route: { sea: 3, points: ['A'] } });
  await bad({ level: 20, route: { sea: 1, points: [] } });
  await bad({ level: 20, exp_in_level: 149799 }); // = 升級所需
  await bad({ level: 0 });
  await bad({ level: 131 });
  await bad({ level: 20, school: 'fast' });
  await bad('abc');
  const done = await api('PUT', `/api/workshops/${wid}/submarines/1`, { status: 'complete', progress: { level: 20, route: JK } });
  assert.equal(done.statusCode, 400);
  assert.equal(await progressOf(api, wid), undefined, '被拒絕的更新不留下任何等級資料');
  assert.equal((await api('GET', `/api/workshops/${wid}/submarines`)).statusCode, 200);
});

test('progress: null 清除等級;PUT / DELETE 單獨調整;別人的潛艇 404', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid, sid } = await setup(api);
  await send(api, wid, { progress: { level: 20 } });
  const put = await api('PUT', `/api/submarines/${sid}/progress`, { level: 30, exp_in_level: 10, sim_on: true });
  assert.equal(put.statusCode, 200);
  assert.deepEqual([(put.json() as SubmarineDto).progress!.level, (put.json() as SubmarineDto).progress!.exp_in_level], [30, 10]);
  assert.equal((await api('PUT', `/api/submarines/${sid}/progress`, { level: 0 })).statusCode, 400);
  const cleared = await api('PUT', `/api/submarines/${sid}/progress`, { route: null });
  assert.equal((cleared.json() as SubmarineDto).progress!.pending, null);

  const other = await asUser(t, ID_B);
  assert.equal((await other('PUT', `/api/submarines/${sid}/progress`, { level: 5 })).statusCode, 404);
  assert.equal((await other('DELETE', `/api/submarines/${sid}/progress`)).statusCode, 404);

  assert.equal((await send(api, wid, { progress: null })).statusCode, 200);
  assert.equal(await progressOf(api, wid), undefined);
  assert.equal(((await api('DELETE', `/api/submarines/${sid}/progress`)).json() as SubmarineDto).progress, undefined);
});

test('沒有等級時 PUT progress:要帶 level', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { sid } = await setup(api);
  assert.equal((await api('PUT', `/api/submarines/${sid}/progress`, { sim_on: true })).statusCode, 400);
  const ok = await api('PUT', `/api/submarines/${sid}/progress`, { level: 12, sim_on: true });
  assert.equal(ok.statusCode, 200);
  assert.equal((ok.json() as SubmarineDto).progress!.level, 12);
});

test('刪除潛艇(刪工坊)連帶刪除等級資料', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  await send(api, wid, { progress: { level: 20 } });
  assert.equal((await api('DELETE', `/api/workshops/${wid}`)).statusCode, 204);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM submarine_progress').get() as { n: number }).n, 0);
});

test('截圖辨識的等級不會自動開啟練級輔助;已開著的維持原狀(練級輔助只由使用者手動開關)', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const { wid } = await setup(api);
  const first = await send(api, wid, { progress: { level: 94, source: 'ocr' } });
  assert.equal((first.json() as SubmarinesUpdateResult).submarines[0]!.progress!.sim_on, false);
  await send(api, wid, { progress: { sim_on: true } });
  const again = await send(api, wid, { progress: { level: 95, source: 'ocr' } });
  assert.equal((again.json() as SubmarinesUpdateResult).submarines[0]!.progress!.sim_on, true);
});
