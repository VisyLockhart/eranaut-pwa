import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDiscordClient, DiscordError, resolveProfile } from '../src/discord/client.js';
import { config, GUILD_ID, member } from './helpers.js';

test('名稱優先順序:暱稱 → global_name → username', () => {
  const base = member();
  assert.equal(resolveProfile({ ...base, nick: '暱稱', user: { ...base.user, global_name: 'G' } }, GUILD_ID).displayName, '暱稱');
  assert.equal(resolveProfile({ ...base, user: { ...base.user, global_name: 'G' } }, GUILD_ID).displayName, 'G');
  assert.equal(resolveProfile(base, GUILD_ID).displayName, 'winter');
});

test('頭像優先順序:公會頭像 → 帳號頭像 → null', () => {
  const base = member();
  assert.equal(resolveProfile(base, GUILD_ID).avatarUrl, null);
  assert.equal(
    resolveProfile({ ...base, user: { ...base.user, avatar: 'abc' } }, GUILD_ID).avatarUrl,
    `https://cdn.discordapp.com/avatars/${base.user.id}/abc.png`,
  );
  assert.equal(
    resolveProfile({ ...base, avatar: 'g1', user: { ...base.user, avatar: 'abc' } }, GUILD_ID).avatarUrl,
    `https://cdn.discordapp.com/guilds/${GUILD_ID}/users/${base.user.id}/avatars/g1.png`,
  );
});

type Call = { url: string; init: RequestInit };
function fakeFetch(responses: Response[], calls: Call[]): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return responses.shift()!;
  }) as typeof fetch;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('換 token:POST 表單帶 redirect_uri,再用 Bearer 取 /users/@me', async () => {
  const calls: Call[] = [];
  const client = createDiscordClient(config, fakeFetch([json({ access_token: 'tok' }), json({ id: '42' })], calls));
  assert.equal(await client.exchangeCodeForUserId('the-code'), '42');
  assert.equal(calls[0]!.url, 'https://discord.com/api/v10/oauth2/token');
  const form = new URLSearchParams(String(calls[0]!.init.body));
  assert.equal(form.get('grant_type'), 'authorization_code');
  assert.equal(form.get('code'), 'the-code');
  assert.equal(form.get('client_secret'), 'client-secret');
  assert.equal(form.get('redirect_uri'), 'https://eranaut.example.com/api/auth/callback');
  assert.equal(calls[1]!.url, 'https://discord.com/api/v10/users/@me');
  assert.equal((calls[1]!.init.headers as Record<string, string>).Authorization, 'Bearer tok');
});

test('換 token 失敗丟 DiscordError', async () => {
  const client = createDiscordClient(config, fakeFetch([json({ error: 'invalid_grant' }, 400)], []));
  await assert.rejects(client.exchangeCodeForUserId('x'), DiscordError);
});

test('查成員:用 Bot token;404 → null;其他錯誤丟 DiscordError', async () => {
  const calls: Call[] = [];
  const m = member();
  const client = createDiscordClient(config, fakeFetch([json(m), json({}, 404), json({}, 500)], calls));
  assert.deepEqual(await client.getGuildMember(m.user.id), m);
  assert.equal(calls[0]!.url, `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${m.user.id}`);
  assert.equal((calls[0]!.init.headers as Record<string, string>).Authorization, 'Bot bot-token');
  assert.equal(await client.getGuildMember('1'), null);
  await assert.rejects(client.getGuildMember('2'), DiscordError);
});

test('列出全部成員:每頁 1000 筆,依最後一位的 id 翻頁;任何一頁失敗就丟 DiscordError', async () => {
  const calls: Call[] = [];
  const page1 = Array.from({ length: 1000 }, (_, i) => member({ id: String(100000000000000000n + BigInt(i)) }));
  const page2 = [member({ id: '200000000000000000' })];
  const client = createDiscordClient(config, fakeFetch([json(page1), json(page2)], calls));
  const all = await client.listGuildMembers();
  assert.equal(all.length, 1001);
  assert.equal(calls[0]!.url, `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=0`);
  assert.equal(calls[1]!.url, `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${page1[999]!.user.id}`);
  assert.equal((calls[0]!.init.headers as Record<string, string>).Authorization, 'Bot bot-token');

  const failing = createDiscordClient(config, fakeFetch([json(page1), json({}, 500)], []));
  await assert.rejects(failing.listGuildMembers(), DiscordError);
});

test('公會資訊:取擁有者與身份組權限位元;缺欄位或失敗丟 DiscordError', async () => {
  const calls: Call[] = [];
  const info = { owner_id: '1', roles: [{ id: '2', permissions: '8', name: 'x' }] };
  const client = createDiscordClient(config, fakeFetch([json(info), json({}), json({}, 403)], calls));
  assert.deepEqual(await client.getGuildAdminInfo(), { ownerId: '1', roles: [{ id: '2', permissions: '8' }] });
  assert.equal(calls[0]!.url, `https://discord.com/api/v10/guilds/${GUILD_ID}`);
  await assert.rejects(client.getGuildAdminInfo(), DiscordError);
  await assert.rejects(client.getGuildAdminInfo(), DiscordError);
});
