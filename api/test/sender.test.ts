import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReminderSender, SendError } from '../src/discord/sender.js';
import { config } from './helpers.js';

type Call = { url: string; body: Record<string, unknown>; headers: Record<string, string> };
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

function make(responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)), headers: init?.headers as Record<string, string> });
    const r = responses.shift()!;
    if (r instanceof Error) throw r;
    return r;
  }) as typeof fetch;
  return { sender: createReminderSender(config, f), calls };
}
const USER = '555555555555555555';
const kindOf = async (p: Promise<void>) => p.then(() => 'ok', (e: SendError) => `${e.kind}${e.retryAfterMs !== undefined ? `:${e.retryAfterMs}` : ''}`);

test('DM:先建立 DM 頻道,再發訊息;用 Bot token;不允許任何提及', async () => {
  const { sender, calls } = make([json({ id: 'dm1' }), json({ id: 'm1' })]);
  await sender.send({ method: 'dm', discordUserId: USER }, 'hello');
  assert.equal(calls[0]!.url, 'https://discord.com/api/v10/users/@me/channels');
  assert.deepEqual(calls[0]!.body, { recipient_id: USER });
  assert.equal(calls[1]!.url, 'https://discord.com/api/v10/channels/dm1/messages');
  assert.deepEqual(calls[1]!.body, { content: 'hello', allowed_mentions: { parse: [] } });
  assert.equal(calls[0]!.headers.Authorization, 'Bot bot-token');
});

test('頻道:直接發到指定頻道,allowed_mentions 只含該使用者(不會 @everyone 或身份組)', async () => {
  const { sender, calls } = make([json({ id: 'm1' })]);
  await sender.send({ method: 'channel', discordUserId: USER, channelId: '888888888888888888' }, '<@x> hi');
  assert.equal(calls[0]!.url, 'https://discord.com/api/v10/channels/888888888888888888/messages');
  assert.deepEqual(calls[0]!.body.allowed_mentions, { parse: [], users: [USER] });
});

test('失敗分類:5xx 與網路錯誤/逾時 → retry', async () => {
  assert.equal(await kindOf(make([json({}, 500)]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'retry');
  assert.equal(await kindOf(make([json({}, 503)]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'retry');
  assert.equal(await kindOf(make([new Error('ECONNRESET')]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'retry');
  assert.equal(await kindOf(make([json({ id: 'dm1' }), json({}, 502)]).sender.send({ method: 'dm', discordUserId: USER }, 'x')), 'retry');
});

test('失敗分類:4xx(關閉 DM、封鎖、無權限、頻道不存在、離開伺服器)→ permanent,錯誤碼寫進訊息', async () => {
  const dmClosed = make([json({ id: 'dm1' }), json({ code: 50007, message: 'Cannot send messages to this user' }, 403)]);
  const err = await dmClosed.sender.send({ method: 'dm', discordUserId: USER }, 'x').catch((e: SendError) => e);
  assert.ok(err instanceof SendError);
  assert.equal(err.kind, 'permanent');
  assert.match(err.message, /403.*50007/);
  assert.equal(await kindOf(make([json({ code: 50013 }, 403)]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'permanent');
  assert.equal(await kindOf(make([json({ code: 10003 }, 404)]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'permanent');
  assert.equal(await kindOf(make([json({ code: 50007 }, 403)]).sender.send({ method: 'dm', discordUserId: USER }, 'x')), 'permanent', '建立 DM 頻道就被拒');
});

test('429:依 retry_after(body 優先,其次 header)回 rate_limited,毫秒向上取整', async () => {
  assert.equal(await kindOf(make([json({ retry_after: 1.5 }, 429)]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'rate_limited:1500');
  assert.equal(await kindOf(make([json({}, 429, { 'retry-after': '3' })]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'rate_limited:3000');
  assert.equal(await kindOf(make([new Response('oops', { status: 429 })]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'rate_limited:1000');
});

test('非 JSON 的錯誤回應也能分類', async () => {
  assert.equal(await kindOf(make([new Response('Bad Gateway', { status: 502 })]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'retry');
  assert.equal(await kindOf(make([new Response('Forbidden', { status: 403 })]).sender.send({ method: 'channel', discordUserId: USER, channelId: '1' }, 'x')), 'permanent');
});
