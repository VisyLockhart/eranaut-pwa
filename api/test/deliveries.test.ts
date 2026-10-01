import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import type { WorkshopDto } from '@eranaut/shared';
import { SendError, type ReminderSender, type SendTarget } from '../src/discord/sender.js';
import { MAX_ATTEMPTS, MISSED_AFTER_MS, processDueDeliveries, RETRY_INTERVAL_MS, type DeliveryLogger } from '../src/services/deliveries.js';
import { startReminderPoller } from '../src/services/reminder-poller.js';
import { config, loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const ID_A = '555555555555555555';
const MIN = 60_000;

class FakeSender implements ReminderSender {
  sent: { target: SendTarget; content: string }[] = [];
  /** 依序消耗的結果;沒有就成功。Error = 丟出該錯誤 */
  script: (Error | 'ok')[] = [];
  async send(target: SendTarget, content: string) {
    const next = this.script.shift() ?? 'ok';
    if (next !== 'ok') throw next;
    this.sent.push({ target, content });
  }
}
class MemoryLog implements DeliveryLogger {
  entries: { level: string; obj: Record<string, unknown> }[] = [];
  info(obj: object) { this.entries.push({ level: 'info', obj: obj as Record<string, unknown> }); }
  warn(obj: object) { this.entries.push({ level: 'warn', obj: obj as Record<string, unknown> }); }
}

async function setup(opts: { channelId?: string | null } = {}) {
  const t = makeApp();
  t.discord.grant('c', member({ id: ID_A, user: { id: ID_A, username: 'u', global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, 'c'))!;
  const api = (method: 'GET' | 'POST' | 'PUT', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  const sender = new FakeSender();
  const log = new MemoryLog();
  const run = () =>
    processDueDeliveries({ db: t.db, sender, reminderChannelId: opts.channelId === undefined ? '888888888888888888' : opts.channelId, now: () => t.clock.now, log });
  const workshop = async (over: object = {}) => (await api('POST', '/api/workshops', { name: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜', ...over })).json() as WorkshopDto;
  const putSubs = (wid: string, submarines: object[]) => api('PUT', `/api/workshops/${wid}/submarines`, { submarines });
  return { t, api, sender, log, run, workshop, putSubs };
}
const exploring = (position: number, remaining_minutes: number, name?: string) => ({ position, name, status: 'exploring', remaining_minutes });
const advance = (t: TestApp, ms: number) => void (t.clock.now = new Date(t.clock.now.getTime() + ms));
const deliveries = (t: TestApp) =>
  t.db.prepare('SELECT method, status, attempts, next_attempt_at, last_error FROM reminder_deliveries ORDER BY method').all() as {
    method: string; status: string; attempts: number; next_attempt_at: string; last_error: string | null;
  }[];

test('未到期的不發;到期後發 DM(D-147 ① 文案),標記已發送、次數 1;再跑一次不會重複發', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(2, 10, '潛水艇-2')]);

  assert.deepEqual(await s.run(), { sent: 0, retrying: 0, failed: 0, missed: 0, rateLimited: 0 });
  assert.equal(s.sender.sent.length, 0);

  advance(s.t, 10 * MIN);
  assert.equal((await s.run()).sent, 1);
  assert.deepEqual(s.sender.sent, [
    { target: { method: 'dm', discordUserId: ID_A }, content: '⚓ 潛水艇已返航\n②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)' },
  ]);
  assert.deepEqual(deliveries(s.t).map((d) => [d.status, d.attempts, d.last_error]), [['sent', 1, null]]);

  advance(s.t, MIN);
  assert.equal((await s.run()).sent, 0);
  assert.equal(s.sender.sent.length, 1);
});

test('頻道版:第一行有提及,發到設定的頻道;DM 與頻道各自獨立發送', async () => {
  const s = await setup();
  await s.api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  assert.equal((await s.run()).sent, 2);
  const byMethod = Object.fromEntries(s.sender.sent.map((x) => [x.target.method, x]));
  assert.deepEqual(byMethod.channel!.target, { method: 'channel', discordUserId: ID_A, channelId: '888888888888888888' });
  assert.equal(byMethod.channel!.content, `<@${ID_A}> ⚓ 潛水艇已返航\n①・貝殼工坊(伊弗利特・芙寧娜)`);
  assert.equal(byMethod.dm!.content, '⚓ 潛水艇已返航\n①・貝殼工坊(伊弗利特・芙寧娜)');
});

test('預先提醒文案(D-147 ②)與整批文案(③④):艘數與最晚返航時間取發送當下的資料', async () => {
  const s = await setup();
  const w = await s.workshop({ notify_batched: true, notify_lead_minutes: 10, captain: null });
  await s.putSubs(w.id, [exploring(1, 30), exploring(2, 60), { position: 3, status: 'complete' }]);
  advance(s.t, 50 * MIN);
  assert.equal((await s.run()).sent, 1);
  const unix = Math.floor((new Date('2026-10-01T00:00:00Z').getTime() + 60 * MIN) / 1000);
  assert.equal(s.sender.sent[0]!.content, `⏳ 工坊的潛水艇即將全部返航\n貝殼工坊(伊弗利特)・共 2 艘\n預計 <t:${unix}:t> 返航(<t:${unix}:R>)`);
});

test('過期不補發:晚超過 30 分鐘標記「錯過」,剛好 30 分鐘內仍會發', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 10), exploring(2, 10), exploring(3, 5)]);
  advance(s.t, 10 * MIN + MISSED_AFTER_MS + 1);
  const r = await s.run();
  assert.equal(r.missed, 3);
  assert.equal(s.sender.sent.length, 0);
  assert.ok(deliveries(s.t).every((d) => d.status === 'missed'));

  const s2 = await setup();
  const w2 = await s2.workshop();
  await s2.putSubs(w2.id, [exploring(1, 10)]);
  advance(s2.t, 10 * MIN + MISSED_AFTER_MS);
  assert.equal((await s2.run()).sent, 1, '剛好晚 30 分鐘不算過期');
});

test('5xx/網路錯誤:每次間隔 1 分鐘重試,總共 3 次嘗試,仍失敗標記失敗', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = Array.from({ length: MAX_ATTEMPTS }, () => new SendError('HTTP 500', 'retry'));

  for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
    const r = await s.run();
    assert.equal(r.retrying, 1, `第 ${attempt} 次嘗試失敗後排入重試`);
    const d = deliveries(s.t)[0]!;
    assert.deepEqual([d.status, d.attempts, d.last_error], ['pending', attempt, 'HTTP 500']);
    assert.equal(d.next_attempt_at, new Date(s.t.clock.now.getTime() + RETRY_INTERVAL_MS).toISOString());
    assert.equal((await s.run()).retrying, 0, '還沒到下次嘗試時間,不會再發');
    advance(s.t, RETRY_INTERVAL_MS);
  }
  assert.equal((await s.run()).failed, 1);
  assert.deepEqual(deliveries(s.t).map((d) => [d.status, d.attempts]), [['failed', MAX_ATTEMPTS]]);
  assert.equal(s.sender.sent.length, 0);
});

test('重試後成功:標記已發送,次數為實際嘗試次數', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = [new SendError('HTTP 502', 'retry')];
  await s.run();
  advance(s.t, RETRY_INTERVAL_MS);
  assert.equal((await s.run()).sent, 1);
  assert.deepEqual(deliveries(s.t).map((d) => [d.status, d.attempts, d.last_error]), [['sent', 2, null]]);
});

test('永久性錯誤(關閉 DM、封鎖 bot、離開伺服器…):不重試,立刻標記失敗並寫 log', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = [new SendError('HTTP 403(Discord code 50007)', 'permanent')];
  assert.equal((await s.run()).failed, 1);
  assert.deepEqual(deliveries(s.t).map((d) => [d.status, d.attempts, d.last_error]), [['failed', 1, 'HTTP 403(Discord code 50007)']]);
  advance(s.t, 10 * MIN);
  assert.equal((await s.run()).failed, 0, '不會再嘗試');
  const entry = s.log.entries.find((e) => e.obj.outcome === 'failed')!;
  assert.equal(entry.level, 'warn');
  assert.equal(entry.obj.event, 'reminder_delivery');
  assert.equal(entry.obj.error, 'HTTP 403(Discord code 50007)');
});

test('DM 永久失敗時不會自動改發頻道;DM 與頻道各自記錄', async () => {
  const s = await setup();
  await s.api('PUT', '/api/notify-prefs', { dm: true, channel: false });
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = [new SendError('HTTP 403', 'permanent')];
  await s.run();
  assert.equal(s.sender.sent.length, 0, '沒有任何頻道訊息被送出');

  // 兩種方式都勾:DM 失敗不影響頻道
  const s2 = await setup();
  await s2.api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  const w2 = await s2.workshop();
  await s2.putSubs(w2.id, [exploring(1, 5)]);
  advance(s2.t, 5 * MIN);
  s2.sender.script = [new SendError('HTTP 403', 'permanent')];
  const r = await s2.run();
  assert.deepEqual([r.failed, r.sent], [1, 1]);
  assert.deepEqual(deliveries(s2.t).map((d) => [d.method, d.status]), [['channel', 'sent'], ['dm', 'failed']]);
});

test('429 限速:算一次嘗試,等 retry_after 之後再發;連續限速超過上限則標記失敗', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = [new SendError('被限速', 'rate_limited', 4000)];
  assert.equal((await s.run()).rateLimited, 1);
  const d = deliveries(s.t)[0]!;
  assert.deepEqual([d.status, d.attempts], ['pending', 1]);
  assert.equal(d.next_attempt_at, new Date(s.t.clock.now.getTime() + 4000).toISOString());
  assert.equal((await s.run()).sent, 0);
  advance(s.t, 4000);
  assert.equal((await s.run()).sent, 1);
  assert.deepEqual(deliveries(s.t).map((x) => [x.status, x.attempts]), [['sent', 2]]);
});

test('429 連續限速達嘗試上限:標記失敗', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = Array.from({ length: MAX_ATTEMPTS }, () => new SendError('被限速', 'rate_limited', 1000));
  for (let i = 1; i < MAX_ATTEMPTS; i++) {
    assert.equal((await s.run()).rateLimited, 1);
    advance(s.t, 1000);
  }
  assert.equal((await s.run()).failed, 1);
  assert.deepEqual(deliveries(s.t).map((d) => [d.status, d.attempts]), [['failed', MAX_ATTEMPTS]]);
});

test('未預期的例外視為可重試,不會讓整個輪詢中斷;其他提醒照常發送', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5), exploring(2, 5)]);
  advance(s.t, 5 * MIN);
  s.sender.script = [new Error('boom')];
  const r = await s.run();
  assert.deepEqual([r.retrying, r.sent], [1, 1]);
});

test('頻道未設定:頻道提醒標記失敗,DM 不受影響', async () => {
  const s = await setup({ channelId: null });
  await s.api('PUT', '/api/notify-prefs', { dm: true, channel: true });
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  const r = await s.run();
  assert.deepEqual([r.sent, r.failed], [1, 1]);
  assert.deepEqual(deliveries(s.t).map((d) => [d.method, d.status, d.last_error]), [['channel', 'failed', 'channel_not_configured'], ['dm', 'sent', null]]);
});

test('重新更新潛艇後,舊的已發送提醒被新的待發取代,到期會再發一次(新的返航時間)', async () => {
  const s = await setup();
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  await s.run();
  await s.putSubs(w.id, [exploring(1, 20)]);
  advance(s.t, 20 * MIN);
  await s.run();
  assert.equal(s.sender.sent.length, 2);
});

test('每次輪詢最多處理 100 筆,其餘留到下一輪', async () => {
  const s = await setup();
  const uid = (s.t.db.prepare('SELECT id FROM users').get() as { id: string }).id;
  const due = new Date(s.t.clock.now.getTime() - MIN).toISOString();
  for (let i = 0; i < 105; i++) {
    // 整批提醒每間工坊最多一筆,所以每筆用不同的工坊
    s.t.db.prepare("INSERT INTO workshops (id, user_id, name, server, notify_batched, created_at) VALUES (?, ?, 'W', '迦樓羅', 1, ?)").run(`w${i}`, uid, due);
    s.t.db.prepare('INSERT INTO reminders (id, user_id, workshop_id, submarine_id, scheduled_at, created_at) VALUES (?, ?, ?, NULL, ?, ?)').run(`r${i}`, uid, `w${i}`, due, due);
    s.t.db.prepare("INSERT INTO reminder_deliveries (id, reminder_id, method, status, next_attempt_at) VALUES (?, ?, 'dm', 'pending', ?)").run(`d${i}`, `r${i}`, due);
  }
  assert.equal((await s.run()).sent, 100);
  assert.equal((await s.run()).sent, 5);
  assert.equal((await s.run()).sent, 0);
});

test('輪詢排程:註冊後會週期性執行,關閉 Fastify 時停止', async () => {
  const s = await setup();
  const app = Fastify({ logger: false });
  let ticks = 0;
  const sender: ReminderSender = { send: async () => void ticks++ };
  const w = await s.workshop();
  await s.putSubs(w.id, [exploring(1, 5)]);
  advance(s.t, 5 * MIN);
  await startReminderPoller(app, { db: s.t.db, sender, reminderChannelId: config.reminderChannelId, now: () => s.t.clock.now, log: new MemoryLog() }, 50);
  await app.ready();
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(ticks, 1, '第一輪就發出提醒,之後沒有待發就不再發');
  assert.deepEqual(deliveries(s.t).map((d) => d.status), ['sent']);
  await app.close();
});
