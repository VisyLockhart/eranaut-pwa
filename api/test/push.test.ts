import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { WorkshopDto } from '@eranaut/shared';
import { ConfigError, loadConfig } from '../src/config.js';
import { SendError, type ReminderSender, type SendTarget } from '../src/discord/sender.js';
import { PushSendError } from '../src/push/sender.js';
import { MAX_ATTEMPTS, processDueDeliveries, RETRY_INTERVAL_MS, type DeliveryLogger } from '../src/services/deliveries.js';
import { buildPushMessage, buildReminderMessage } from '../src/services/reminder-message.js';
import { suspendUser } from '../src/services/suspension.js';
import { TEST_INTERVAL_MS } from '../src/routes/push.js';
import { FakePush, goneError, loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';
const MIN = 60_000;
const EP1 = 'https://push.example.com/send/aaa';
const EP2 = 'https://push.example.com/send/bbb';
const keys = { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' };
const sub = (endpoint = EP1) => ({ endpoint, keys });

class FakeSender implements ReminderSender {
  sent: { target: SendTarget; content: string }[] = [];
  async send(target: SendTarget, content: string) {
    this.sent.push({ target, content });
  }
}
class MemoryLog implements DeliveryLogger {
  entries: { level: string; obj: Record<string, unknown> }[] = [];
  info(obj: object) { this.entries.push({ level: 'info', obj: obj as Record<string, unknown> }); }
  warn(obj: object) { this.entries.push({ level: 'warn', obj: obj as Record<string, unknown> }); }
}

async function setup(opts: { configured?: boolean } = {}) {
  const push = new FakePush();
  const configured = opts.configured ?? true;
  const t = makeApp({ push: configured ? push : undefined });
  const login = async (id: string, code: string) => {
    t.discord.grant(code, member({ id, user: { id, username: 'u', global_name: null, avatar: null } }));
    const cookie = sessionCookie(await loginWith(t, code))!;
    return (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
      t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  };
  const api = await login(ID_A, 'a');
  const sender = new FakeSender();
  const log = new MemoryLog();
  const run = () => processDueDeliveries({ db: t.db, sender, push: configured ? push : null, reminderChannelId: '888888888888888888', now: () => t.clock.now, log });
  const workshop = async (a = api, over: object = {}) => (await a('POST', '/api/workshops', { name: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜', ...over })).json() as WorkshopDto;
  const putSubs = (wid: string, submarines: object[], a = api) => a('PUT', `/api/workshops/${wid}/submarines`, { submarines });
  return { t, push, api, login, sender, log, run, workshop, putSubs };
}
const exploring = (position: number, remaining_minutes: number, name?: string) => ({ position, name, status: 'exploring', remaining_minutes });
const advance = (t: TestApp, ms: number) => void (t.clock.now = new Date(t.clock.now.getTime() + ms));
const bits = (t: TestApp, discordId = ID_A) => (t.db.prepare('SELECT notify_methods FROM users WHERE discord_user_id = ?').get(discordId) as { notify_methods: number }).notify_methods;
const deliveries = (t: TestApp) =>
  t.db.prepare('SELECT method, status, attempts, last_error FROM reminder_deliveries ORDER BY method').all() as { method: string; status: string; attempts: number; last_error: string | null }[];
const subCount = (t: TestApp) => (t.db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get() as { n: number }).n;

// ---- 設定 ----

const ENV = {
  PUBLIC_ORIGIN: 'https://eranaut.example.com',
  DISCORD_CLIENT_ID: 'a', DISCORD_CLIENT_SECRET: 'b', DISCORD_BOT_TOKEN: 'c', DISCORD_GUILD_ID: 'd',
  GUILD_DISPLAY_NAME: 'x', INTERNAL_API_SECRET: 'x'.repeat(40),
};
const PUB = 'B'.repeat(87);
const PRIV = 'c'.repeat(43);

test('設定:沒設 VAPID = 推播關閉;設了就讀進來,subject 預設為公開來源', () => {
  assert.equal(loadConfig(ENV).push, null);
  assert.deepEqual(loadConfig({ ...ENV, VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV }).push, { publicKey: PUB, privateKey: PRIV, subject: 'https://eranaut.example.com' });
  assert.equal(loadConfig({ ...ENV, VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV, VAPID_SUBJECT: 'mailto:me@example.com' }).push?.subject, 'mailto:me@example.com');
});

test('設定:只設一把金鑰、格式錯誤、subject 不合法 → 啟動失敗,不默默關掉', () => {
  assert.throws(() => loadConfig({ ...ENV, VAPID_PUBLIC_KEY: PUB }), ConfigError);
  assert.throws(() => loadConfig({ ...ENV, VAPID_PRIVATE_KEY: PRIV }), ConfigError);
  assert.throws(() => loadConfig({ ...ENV, VAPID_PUBLIC_KEY: 'short', VAPID_PRIVATE_KEY: PRIV }), ConfigError);
  assert.throws(() => loadConfig({ ...ENV, VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: 'bad key!' }), ConfigError);
  assert.throws(() => loadConfig({ ...ENV, PUBLIC_ORIGIN: 'http://localhost:4200', VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV }), ConfigError, 'http 來源沒有另設 subject');
  assert.equal(loadConfig({ ...ENV, PUBLIC_ORIGIN: 'http://localhost:4200', VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV, VAPID_SUBJECT: 'mailto:me@example.com' }).push !== null, true);
});

// ---- 文案 ----

test('推播文案:標題與內容和 DM 同措辭;預先提醒用台北時間加「約 N 分鐘後」,不含 Discord 時間戳', () => {
  const now = new Date('2026-10-01T13:40:00Z'); // 台北 21:40
  const common = { scope: { kind: 'submarine' as const, position: 2, name: '潛水艇-2' }, workshopName: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜', now, tag: 't' };
  assert.deepEqual(buildPushMessage({ ...common, lead: false, returnAt: now }), {
    title: '⚓ 潛水艇已返航',
    body: '②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)',
    tag: 't',
  });
  const lead = buildPushMessage({ ...common, lead: true, returnAt: new Date(now.getTime() + 5 * MIN) });
  assert.equal(lead.title, '⏳ 潛水艇即將返航');
  assert.equal(lead.body, '②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)\n預計台北時間 21:45 返航(約 5 分鐘後)');
  assert.ok(!lead.body.includes('<t:'));
  const batch = buildPushMessage({ ...common, scope: { kind: 'batch', count: 3 }, lead: false, returnAt: null });
  assert.deepEqual([batch.title, batch.body], ['⚓ 工坊的潛水艇已全部返航', '貝殼工坊(伊弗利特・芙寧娜)・共 3 艘']);
  // 不滿一分鐘也至少顯示 1 分鐘;跨日顯示 00:xx
  assert.match(buildPushMessage({ ...common, lead: true, returnAt: new Date(now.getTime() + 10_000) }).body, /約 1 分鐘後/);
  assert.match(buildPushMessage({ ...common, lead: true, returnAt: new Date('2026-10-01T16:05:00Z') }).body, /台北時間 00:05 /);
});

test('DM / 頻道文案不受推播影響(D-147 不變)', () => {
  const m = buildReminderMessage({ scope: { kind: 'submarine', position: 1, name: null }, workshopName: 'W', server: 'S', captain: null, lead: true, returnAt: new Date('2026-10-01T00:00:00Z'), mentionDiscordUserId: null });
  assert.match(m, /預計 <t:1790812800:t> 返航\(<t:1790812800:R>\)/);
});

// ---- 端點 ----

test('沒設定推播:config 回 null,登記與測試回 503', async () => {
  const s = await setup({ configured: false });
  assert.deepEqual((await s.api('GET', '/api/push/config')).json(), { publicKey: null });
  assert.equal((await s.api('PUT', '/api/push/subscription', sub())).statusCode, 503);
  assert.equal((await s.api('POST', '/api/push/test')).statusCode, 503);
  assert.equal(subCount(s.t), 0);
});

test('需要登入、改資料要同來源', async () => {
  const s = await setup();
  assert.equal((await s.t.app.inject({ method: 'GET', url: '/api/push/config' })).statusCode, 401);
  assert.equal((await s.t.app.inject({ method: 'PUT', url: '/api/push/subscription', payload: sub() })).statusCode, 401);
  assert.equal((await s.t.app.inject({ method: 'PUT', url: '/api/push/subscription', payload: sub(), headers: { origin: 'https://evil.example' } })).statusCode, 403);
});

test('登記裝置:回 204、打開推播位元(其他位元不變)、列出端點;config 回公鑰', async () => {
  const s = await setup();
  assert.equal(((await s.api('GET', '/api/push/config')).json() as { publicKey: string }).publicKey.length, 87);
  assert.equal(bits(s.t), 1);
  assert.equal((await s.api('PUT', '/api/push/subscription', sub(EP1))).statusCode, 204);
  assert.equal(bits(s.t), 5);
  assert.deepEqual((await s.api('GET', '/api/notify-prefs')).json(), { dm: true, channel: false, push: true });
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  assert.deepEqual((await s.api('GET', '/api/push/subscriptions')).json(), { endpoints: [EP1, EP2] });
  // 重複登記同一個 endpoint:不新增、不報錯
  assert.equal((await s.api('PUT', '/api/push/subscription', sub(EP1))).statusCode, 204);
  assert.equal(subCount(s.t), 2);
});

test('登記驗證:缺欄位、型別、非 https、過長、金鑰格式 → 400', async () => {
  const s = await setup();
  assert.deepEqual((await s.api('PUT', '/api/push/subscription', {})).json(), { error: 'validation_failed', fields: { endpoint: 'required', keys: 'required' } });
  assert.deepEqual((await s.api('PUT', '/api/push/subscription', { endpoint: 1, keys: 'x' })).json().fields, { endpoint: 'invalid_type', keys: 'invalid_type' });
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: 'http://push.example.com/x', keys })).json().fields.endpoint, 'invalid_value');
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: 'not a url', keys })).json().fields.endpoint, 'invalid_value');
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: 'https://p.example.com/' + 'a'.repeat(2100), keys })).json().fields.endpoint, 'too_long');
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: EP1, keys: { p256dh: 'a b', auth: 'x' } })).json().fields.keys, 'invalid_value');
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: EP1, keys: { p256dh: 'a'.repeat(300), auth: 'x' } })).json().fields.keys, 'too_long');
  assert.equal((await s.api('PUT', '/api/push/subscription', { endpoint: EP1, keys: { p256dh: '', auth: 'x' } })).json().fields.keys, 'required');
  assert.equal(subCount(s.t), 0);
  assert.equal(bits(s.t), 1, '失敗時不改位元');
});

test('更新 DM / 頻道不會動到推播位元;body 裡的 push 被忽略', async () => {
  const s = await setup();
  await s.api('PUT', '/api/push/subscription', sub());
  assert.deepEqual((await s.api('PUT', '/api/notify-prefs', { dm: false, channel: true })).json(), { dm: false, channel: true, push: true });
  assert.equal(bits(s.t), 6);
  assert.deepEqual((await s.api('PUT', '/api/notify-prefs', { dm: true, channel: false, push: false })).json(), { dm: true, channel: false, push: true });
  assert.equal(subCount(s.t), 1);
});

test('移除裝置:還有別台就保持開啟;最後一台移除就關閉推播位元;重複移除也回 204', async () => {
  const s = await setup();
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  assert.equal((await s.api('DELETE', '/api/push/subscription', { endpoint: EP1 })).statusCode, 204);
  assert.equal(bits(s.t), 5);
  assert.equal((await s.api('DELETE', '/api/push/subscription', { endpoint: EP2 })).statusCode, 204);
  assert.equal(bits(s.t), 1);
  assert.equal((await s.api('DELETE', '/api/push/subscription', { endpoint: EP2 })).statusCode, 204);
  assert.equal((await s.api('DELETE', '/api/push/subscription', {})).statusCode, 400);
});

test('不能移除別人的裝置;同一個瀏覽器換人登入,訂閱改掛到新使用者', async () => {
  const s = await setup();
  const b = await s.login(ID_B, 'b');
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await b('DELETE', '/api/push/subscription', { endpoint: EP1 });
  assert.equal(subCount(s.t), 1, 'B 刪不到 A 的');
  await b('PUT', '/api/push/subscription', sub(EP1));
  assert.equal(subCount(s.t), 1);
  assert.deepEqual((await b('GET', '/api/push/subscriptions')).json(), { endpoints: [EP1] });
  assert.deepEqual((await s.api('GET', '/api/push/subscriptions')).json(), { endpoints: [] });
});

test('測試通知:送到所有裝置、有間隔限制、沒裝置 404、全失敗 502、失效的被清掉', async () => {
  const s = await setup();
  assert.equal((await s.api('POST', '/api/push/test')).statusCode, 404);
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  const ok = await s.api('POST', '/api/push/test');
  assert.deepEqual(ok.json(), { sent: 2 });
  assert.deepEqual(s.push.sent.map((x) => x.n.title), ['🔔 測試通知', '🔔 測試通知']);
  assert.equal((await s.api('POST', '/api/push/test')).statusCode, 429);

  advance(s.t, TEST_INTERVAL_MS + 1);
  s.push.script = [goneError(), 'ok'];
  assert.deepEqual((await s.api('POST', '/api/push/test')).json(), { sent: 1 });
  assert.equal(subCount(s.t), 1, '失效的那台被刪掉');
  assert.equal(bits(s.t), 5);

  advance(s.t, TEST_INTERVAL_MS + 1);
  s.push.script = [goneError()];
  assert.equal((await s.api('POST', '/api/push/test')).statusCode, 502);
  assert.equal(subCount(s.t), 0);
  assert.equal(bits(s.t), 1, '最後一台也失效 → 關閉推播位元');
});

// ---- 發送 ----

test('登記裝置後,提醒多一筆 push delivery;取消最後一台就消失;DM 不受影響', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  assert.deepEqual(deliveries(s.t).map((d) => d.method), ['dm']);
  await s.api('PUT', '/api/push/subscription', sub());
  assert.deepEqual(deliveries(s.t).map((d) => d.method), ['dm', 'push']);
  await s.api('DELETE', '/api/push/subscription', { endpoint: sub().endpoint });
  assert.deepEqual(deliveries(s.t).map((d) => d.method), ['dm']);
});

test('到期:push 發給每一台裝置,DM 同時照舊發(文案不變)', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(2, 10, '潛水艇-2')]);
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  advance(s.t, 10 * MIN);
  assert.equal((await s.run()).sent, 2);
  assert.deepEqual(s.sender.sent.map((x) => x.content), ['⚓ 潛水艇已返航\n②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)']);
  assert.deepEqual(s.push.sent.map((x) => x.target.endpoint), [EP1, EP2]);
  assert.deepEqual(s.push.sent[0]!.n, { title: '⚓ 潛水艇已返航', body: '②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)', tag: s.push.sent[0]!.n.tag });
  assert.match(s.push.sent[0]!.n.tag, /^sub-/);
  assert.deepEqual(deliveries(s.t).map((d) => [d.method, d.status, d.attempts]), [['dm', 'sent', 1], ['push', 'sent', 1]]);
  advance(s.t, MIN);
  assert.equal((await s.run()).sent, 0, '不重複發');
});

test('預先提醒:推播內容含台北時間與約幾分鐘後;整批用最晚返航', async () => {
  const s = await setup();
  const w = await s.workshop(s.api, { notify_lead_minutes: 15 });
  await s.putSubs(w.id, [exploring(1, 20), exploring(2, 40)]);
  await s.api('PUT', '/api/push/subscription', sub());
  advance(s.t, 5 * MIN); // 逐艘:艇 1 的提醒在 20-15 = 第 5 分鐘
  await s.run();
  assert.equal(s.push.sent.length, 1);
  assert.equal(s.push.sent[0]!.n.title, '⏳ 潛水艇即將返航');
  assert.match(s.push.sent[0]!.n.body, /預計台北時間 \d\d:\d\d 返航\(約 15 分鐘後\)/);
  assert.ok(!s.push.sent[0]!.n.body.includes('<t:'));
});

test('部分裝置成功就算已發送(重試不會重複發給成功的);失效裝置被刪除', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  advance(s.t, 10 * MIN);
  s.push.script = [new PushSendError('HTTP 503', 'retry', false), 'ok'];
  assert.equal((await s.run()).sent, 2); // dm + push
  assert.equal(s.push.sent.length, 1);
  assert.equal(subCount(s.t), 2);
});

test('全部裝置暫時失敗 → 重試;3 次都失敗 → failed', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  await s.api('PUT', '/api/push/subscription', sub());
  advance(s.t, 10 * MIN);
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    s.push.script = [new PushSendError('HTTP 503', 'retry', false)];
    const r = await s.run();
    assert.equal(i < MAX_ATTEMPTS ? r.retrying : r.failed, i < MAX_ATTEMPTS ? 1 : 1);
    advance(s.t, RETRY_INTERVAL_MS);
  }
  assert.deepEqual(deliveries(s.t).filter((d) => d.method === 'push').map((d) => [d.status, d.attempts]), [['failed', MAX_ATTEMPTS]]);
});

test('限速:依 retry-after 延後,算一次嘗試', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  await s.api('PUT', '/api/push/subscription', sub());
  advance(s.t, 10 * MIN);
  s.push.script = [new PushSendError('429', 'rate_limited', false, 5000)];
  assert.equal((await s.run()).rateLimited, 1);
  const row = t(s).prepare("SELECT status, attempts, next_attempt_at FROM reminder_deliveries WHERE method = 'push'").get() as { status: string; attempts: number; next_attempt_at: string };
  assert.equal(row.status, 'pending');
  assert.equal(row.attempts, 1);
  assert.equal(row.next_attempt_at, new Date(s.t.clock.now.getTime() + 5000).toISOString());
});
const t = (s: { t: TestApp }) => s.t.db;

test('訂閱已失效(410):刪除該訂閱;最後一台也失效 → 關閉推播位元、不再產生 push delivery;DM 不受影響', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10), exploring(2, 20)]);
  await s.api('PUT', '/api/push/subscription', sub());
  advance(s.t, 10 * MIN);
  s.push.script = [goneError()];
  const r = await s.run();
  assert.equal(r.failed, 1);
  assert.equal(r.sent, 1, 'DM 照發');
  assert.equal(subCount(s.t), 0);
  assert.equal(bits(s.t), 1);
  assert.deepEqual(deliveries(s.t).map((d) => d.method), ['dm', 'dm'], '艇 2 的 push delivery 也被清掉');
});

test('沒有訂閱 / 伺服器沒設定推播 → push delivery 標記失敗,不丟例外、DM 照發', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  await s.api('PUT', '/api/push/subscription', sub());
  s.t.db.prepare('DELETE FROM push_subscriptions').run(); // 訂閱被直接清掉,位元還在
  advance(s.t, 10 * MIN);
  const r = await s.run();
  assert.deepEqual([r.sent, r.failed], [1, 1]);
  assert.equal(deliveries(s.t).find((d) => d.method === 'push')!.last_error, 'no_subscription');

  const s2 = await setup();
  const w2 = await s2.workshop();
  await s2.putSubs(w2.id, [exploring(1, 10)]);
  await s2.api('PUT', '/api/push/subscription', sub());
  advance(s2.t, 10 * MIN);
  const r2 = await processDueDeliveries({ db: s2.t.db, sender: s2.sender, push: null, reminderChannelId: null, now: () => s2.t.clock.now, log: s2.log });
  assert.equal(r2.failed, 1);
  assert.equal(deliveries(s2.t).find((d) => d.method === 'push')!.last_error, 'push_not_configured');
  assert.ok(SendError);
});

test('停用使用者:撤銷全部推播訂閱並關閉位元(D-130)', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10)]);
  await s.api('PUT', '/api/push/subscription', sub(EP1));
  await s.api('PUT', '/api/push/subscription', sub(EP2));
  const uid = (s.t.db.prepare('SELECT id FROM users').get() as { id: string }).id;
  suspendUser(s.t.db, uid, { kind: 'auto' }, s.t.clock.now);
  assert.equal(subCount(s.t), 0);
  assert.equal(bits(s.t), 1);
  assert.equal((s.t.db.prepare('SELECT COUNT(*) AS n FROM reminders').get() as { n: number }).n, 0);
});
