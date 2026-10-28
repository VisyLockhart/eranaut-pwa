import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAINTENANCE_SHOW_AFTER_MS, MAINTENANCE_SHOW_BEFORE_MS } from '@eranaut/shared';
import { validateMaintenanceEvent } from '../src/services/maintenance.js';
import { addUser, config, loginWith, makeApp, member, sessionCookie, type TestApp } from './helpers.js';

// 伺服器維護橫幅(D-283):Eranarch 通知內部端點 → API 存狀態 → 公開端點給前端。

const SECRET = config.internalSecret;
const NOW = new Date('2026-10-01T00:00:00Z');
const H = 60 * 60 * 1000;
const URL_OK = 'https://www.ffxiv.com.tw/web/news/news_content.aspx?id=MAINT00001';

function body(over: Record<string, unknown> = {}) {
  const startMs = NOW.getTime() + 5 * H;
  return { event: 'scheduled', id: 'MAINT00001', title: '10/01 維護更新作業', url: URL_OK, startMs, endMs: startMs + 5 * H, ...over };
}
const post = (t: TestApp, payload: unknown, secret: string | null = SECRET) =>
  t.internal.inject({
    method: 'POST',
    url: '/maintenance',
    headers: secret === null ? {} : { authorization: `Bearer ${secret}` },
    payload: payload as object,
  });

async function login(t: TestApp) {
  const m = member({ id: '555555555555555555' });
  t.discord.grant('code-m', m);
  const res = await loginWith(t, 'code-m');
  return { eranaut_session: sessionCookie(res)! };
}
const maintenance = async (t: TestApp, cookies: Record<string, string>) =>
  (await t.app.inject({ method: 'GET', url: '/api/maintenance', cookies })).json() as { maintenance: null | { id: string; title: string; url: string; start_at: string; end_at: string } };

test('官網維護(標題含「官網」)不收,APP 不會顯示', async () => {
  assert.equal(validateMaintenanceEvent(body({ title: '10/20 官網維護' })).ok, false);
  const t = makeApp();
  const res = await post(t, body({ title: '10/20 官網維護', startMs: NOW.getTime() - H, endMs: NOW.getTime() + H }));
  assert.equal(res.statusCode, 400);
  const cookies = await login(t);
  assert.equal((await maintenance(t, cookies)).maintenance, null);
});

test('validate:正常事件通過;連結只允許官網 https;標題限長;時間要合理', () => {
  assert.equal(validateMaintenanceEvent(body()).ok, true);
  for (const [over, field] of [
    [{ event: 'x' }, 'event'],
    [{ id: 'a b' }, 'id'],
    [{ id: 'abc' }, 'id'],
    [{ title: '   ' }, 'title'],
    [{ title: 'x'.repeat(201) }, 'title'],
    [{ url: 'http://www.ffxiv.com.tw/a' }, 'url'],
    [{ url: 'https://evil.example.com/a' }, 'url'],
    [{ url: 'https://www.ffxiv.com.tw.evil.com/a' }, 'url'],
    [{ url: 'https://user:pw@www.ffxiv.com.tw/a' }, 'url'],
    [{ url: 'javascript:alert(1)' }, 'url'],
    [{ startMs: 'x' }, 'startMs'],
    [{ startMs: 1.5 }, 'startMs'],
    [{ endMs: 0 }, 'endMs'],
    [{ endMs: NOW.getTime() + 5 * H + 15 * 24 * H }, 'endMs'],
  ] as [Record<string, unknown>, string][]) {
    const r = validateMaintenanceEvent(body(over));
    assert.equal(r.ok, false, JSON.stringify(over));
    if (!r.ok) assert.equal(r.field, field, JSON.stringify(over));
  }
  assert.equal(validateMaintenanceEvent(null).ok, false);
});

test('內部端點:需要 Bearer 密鑰;不需要呼叫者標頭;驗證失敗回 400', async () => {
  const t = makeApp();
  assert.equal((await post(t, body(), null)).statusCode, 401);
  assert.equal((await post(t, body(), 'wrong')).statusCode, 401);
  assert.equal((await post(t, body({ url: 'https://evil.example.com/' }))).statusCode, 400);
  const ok = await post(t, body());
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.json(), { ok: true });
});

test('公開端點需要登入;橫幅只在開始前 24 小時起顯示', async () => {
  const t = makeApp();
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/maintenance' })).statusCode, 401);
  const cookies = await login(t);
  assert.equal((await maintenance(t, cookies)).maintenance, null);

  const startMs = NOW.getTime() + 30 * H; // 30 小時後才開始
  await post(t, body({ startMs, endMs: startMs + 5 * H }));
  assert.equal((await maintenance(t, cookies)).maintenance, null); // 還沒到 24 小時內

  t.clock.now = new Date(startMs - MAINTENANCE_SHOW_BEFORE_MS + 1000);
  const shown = (await maintenance(t, cookies)).maintenance;
  assert.equal(shown?.id, 'MAINT00001');
  assert.equal(shown?.start_at, new Date(startMs).toISOString());
  assert.equal(shown?.end_at, new Date(startMs + 5 * H).toISOString());
  assert.equal(shown?.url, URL_OK);
});

test('overview 順便帶 maintenance 欄位,沒有維護時為 null', async () => {
  const t = makeApp();
  const cookies = await login(t);
  let ov = (await t.app.inject({ method: 'GET', url: '/api/overview', cookies })).json();
  assert.equal(ov.maintenance, null);
  assert.deepEqual(ov.workshops, []);
  await post(t, body());
  ov = (await t.app.inject({ method: 'GET', url: '/api/overview', cookies })).json();
  assert.equal(ov.maintenance.id, 'MAINT00001');
});

test('已開機(finished)→ 橫幅消失;重送冪等;之後才到的 scheduled 不會重新打開', async () => {
  const t = makeApp();
  const cookies = await login(t);
  await post(t, body());
  await post(t, body()); // 重送
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM server_maintenance').get() as { n: number }).n, 1);
  assert.ok((await maintenance(t, cookies)).maintenance);

  await post(t, body({ event: 'finished' }));
  assert.equal((await maintenance(t, cookies)).maintenance, null);
  await post(t, body({ event: 'finished' })); // 重送
  await post(t, body()); // 亂序:finished 之後又收到 scheduled
  assert.equal((await maintenance(t, cookies)).maintenance, null);
});

test('還沒收過 scheduled 就收到 finished(提早完工或 API 當時離線)→ 記下完成,不顯示', async () => {
  const t = makeApp();
  const cookies = await login(t);
  await post(t, body({ event: 'finished' }));
  assert.equal((await maintenance(t, cookies)).maintenance, null);
  await post(t, body());
  assert.equal((await maintenance(t, cookies)).maintenance, null);
});

test('超過預計結束仍未完成:再顯示 6 小時;之後消失', async () => {
  const t = makeApp();
  const cookies = await login(t);
  const startMs = NOW.getTime() + 1 * H;
  const endMs = startMs + 5 * H;
  await post(t, body({ startMs, endMs }));

  t.clock.now = new Date(endMs + MAINTENANCE_SHOW_AFTER_MS - 1000);
  assert.ok((await maintenance(t, cookies)).maintenance);
  t.clock.now = new Date(endMs + MAINTENANCE_SHOW_AFTER_MS + 1000);
  assert.equal((await maintenance(t, cookies)).maintenance, null);
});

test('多筆時取開始最早的一筆;官方改時間(同 ID 再送)會更新;過期很久的資料在寫入時順手刪', async () => {
  const t = makeApp();
  const cookies = await login(t);
  await post(t, body({ id: 'LATER00001', startMs: NOW.getTime() + 10 * H, endMs: NOW.getTime() + 15 * H }));
  await post(t, body({ id: 'EARLY00001', startMs: NOW.getTime() + 2 * H, endMs: NOW.getTime() + 6 * H }));
  assert.equal((await maintenance(t, cookies)).maintenance?.id, 'EARLY00001');

  await post(t, body({ id: 'EARLY00001', title: '改時間', startMs: NOW.getTime() + 3 * H, endMs: NOW.getTime() + 7 * H }));
  const m = (await maintenance(t, cookies)).maintenance;
  assert.equal(m?.title, '改時間');
  assert.equal(m?.start_at, new Date(NOW.getTime() + 3 * H).toISOString());

  t.clock.now = new Date(NOW.getTime() + 5 * 24 * H);
  await post(t, body({ id: 'NEW0000001', startMs: t.clock.now.getTime() + H, endMs: t.clock.now.getTime() + 3 * H }));
  const ids = (t.db.prepare('SELECT id FROM server_maintenance ORDER BY id').all() as { id: string }[]).map((r) => r.id);
  assert.deepEqual(ids, ['NEW0000001']);
});

test('內部 /me/submarines 不帶 maintenance 欄位(只有公開的 overview 才有)', async () => {
  const t = makeApp();
  addUser(t.db, '555555555555555555');
  await post(t, body());
  const res = await t.internal.inject({
    method: 'GET',
    url: '/me/submarines',
    headers: { authorization: `Bearer ${SECRET}`, 'x-caller-id': '555555555555555555', 'x-caller-roles': '111111111111111111,222222222222222222' },
  });
  assert.equal(res.statusCode, 200);
  assert.equal('maintenance' in res.json(), false);
});
