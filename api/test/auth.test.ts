import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashToken, RENEW_THRESHOLD_MS, SESSION_TTL_MS } from '../src/repo/sessions.js';
import { addUser, loginWith, makeApp, member, ORIGIN, ROLE_A, ROLE_C, sessionCookie } from './helpers.js';

const count = (t: ReturnType<typeof makeApp>, table: string) => (t.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
const DAY = 24 * 60 * 60 * 1000;

test('login:302 到 Discord 授權頁,帶 scope=identify 與 state,並設定短命 state cookie', async () => {
  const t = makeApp();
  const res = await t.app.inject({ method: 'GET', url: '/api/auth/login' });
  assert.equal(res.statusCode, 302);
  const url = new URL(res.headers.location as string);
  assert.equal(url.origin + url.pathname, 'https://discord.com/oauth2/authorize');
  assert.equal(url.searchParams.get('scope'), 'identify');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'client-id');
  assert.equal(url.searchParams.get('redirect_uri'), `${ORIGIN}/api/auth/callback`);
  assert.equal(url.searchParams.has('code_challenge'), false, '不加 PKCE');
  const c = res.cookies.find((x) => x.name === 'eranaut_oauth_state')!;
  assert.equal(c.value, url.searchParams.get('state'));
  assert.equal(c.httpOnly, true);
  assert.equal(c.secure, true);
  assert.equal(c.sameSite, 'Lax');
  assert.equal(c.maxAge, 600);
  assert.equal(c.path, '/api/auth/callback');
  assert.equal(count(t, 'users') + count(t, 'sessions'), 0, 'GET 不得有資料副作用');
});

test('成功登入:首次建立使用者、建立 session、302 到 /,cookie 屬性正確', async () => {
  const t = makeApp();
  t.discord.grant('c1', member({ nick: '冬', avatar: 'g1' }));
  const res = await loginWith(t, 'c1');
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, '/');

  const token = sessionCookie(res)!;
  const c = res.cookies.find((x) => x.name === 'eranaut_session')!;
  assert.equal(c.httpOnly, true);
  assert.equal(c.secure, true);
  assert.equal(c.sameSite, 'Lax');
  assert.equal(c.path, '/');
  assert.equal(c.maxAge, SESSION_TTL_MS / 1000);
  assert.equal(c.domain, undefined);
  assert.equal(Buffer.from(token, 'base64url').length, 32);

  // state cookie 用完即清
  assert.equal(res.cookies.find((x) => x.name === 'eranaut_oauth_state')?.value, '');

  // DB 只存雜湊,名稱與頭像暫存在 session、不進 users
  const s = t.db.prepare('SELECT * FROM sessions').get() as Record<string, string>;
  assert.equal(s.token_hash, hashToken(token));
  assert.notEqual(s.token_hash, token);
  assert.equal(s.display_name, '冬');
  assert.match(s.avatar_url!, /\/avatars\/g1\.png$/);
  const u = t.db.prepare('SELECT * FROM users').get() as Record<string, unknown>;
  assert.equal(u.discord_user_id, '555555555555555555');
  assert.equal(u.notify_methods, 1);
  assert.equal(Object.keys(u).some((k) => /name|avatar/.test(k)), false);
});

test('/api/me:登入後回名稱與頭像;沒有 cookie 回 401', async () => {
  const t = makeApp();
  t.discord.grant('c1', member({ user: { id: '555555555555555555', username: 'winter', global_name: 'Winter', avatar: null } }));
  const res = await loginWith(t, 'c1');
  const me = await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: sessionCookie(res)! } });
  assert.equal(me.statusCode, 200);
  assert.deepEqual(me.json(), { displayName: 'Winter', avatarUrl: null });
  assert.equal(me.headers['cache-control'], 'no-store');
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/me' })).statusCode, 401);
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: 'forged' } })).statusCode, 401);
});

test('不在伺服器:not_in_guild,且不建立使用者或 session', async () => {
  const t = makeApp();
  t.discord.grant('c1', null, '777777777777777777');
  const res = await loginWith(t, 'c1');
  assert.equal(res.headers.location, '/?login_error=not_in_guild');
  assert.equal(sessionCookie(res), undefined);
  assert.equal(count(t, 'users') + count(t, 'sessions'), 0);
});

test('沒有符合規則的身份組:no_role(只有 A 不夠,規則是 A+B 或 C)', async () => {
  const t = makeApp();
  t.discord.grant('c1', member({ roles: [ROLE_A] }));
  const res = await loginWith(t, 'c1');
  assert.equal(res.headers.location, '/?login_error=no_role');
  assert.equal(count(t, 'users'), 0);
});

test('只有 C 就通過(OR 規則)', async () => {
  const t = makeApp();
  t.discord.grant('c1', member({ roles: [ROLE_C] }));
  assert.equal((await loginWith(t, 'c1')).headers.location, '/');
});

test('使用者取消授權:denied;其他 Discord 錯誤參數:failed', async () => {
  const t = makeApp();
  const login = await t.app.inject({ method: 'GET', url: '/api/auth/login' });
  const state = login.cookies[0]!.value;
  const denied = await t.app.inject({ method: 'GET', url: `/api/auth/callback?error=access_denied&state=${state}`, cookies: { eranaut_oauth_state: state } });
  assert.equal(denied.headers.location, '/?login_error=denied');
  const other = await t.app.inject({ method: 'GET', url: `/api/auth/callback?error=server_error`, cookies: { eranaut_oauth_state: state } });
  assert.equal(other.headers.location, '/?login_error=failed');
});

test('state 缺少、不符或沒有 state cookie:failed,且不會呼叫 Discord', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const noCookie = await t.app.inject({ method: 'GET', url: '/api/auth/callback?code=c1&state=abc' });
  assert.equal(noCookie.headers.location, '/?login_error=failed');
  const mismatch = await t.app.inject({ method: 'GET', url: '/api/auth/callback?code=c1&state=abc', cookies: { eranaut_oauth_state: 'xyz' } });
  assert.equal(mismatch.headers.location, '/?login_error=failed');
  const noState = await t.app.inject({ method: 'GET', url: '/api/auth/callback?code=c1', cookies: { eranaut_oauth_state: 'xyz' } });
  assert.equal(noState.headers.location, '/?login_error=failed');
  const noCode = await t.app.inject({ method: 'GET', url: '/api/auth/callback?state=xyz', cookies: { eranaut_oauth_state: 'xyz' } });
  assert.equal(noCode.headers.location, '/?login_error=failed');
  assert.equal(count(t, 'users'), 0);
});

test('token 交換或成員查詢失敗:failed', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  t.discord.failExchange = true;
  assert.equal((await loginWith(t, 'c1')).headers.location, '/?login_error=failed');
  t.discord.failExchange = false;
  t.discord.failMember = true;
  assert.equal((await loginWith(t, 'c1')).headers.location, '/?login_error=failed');
  assert.equal(count(t, 'users'), 0);
});

test('重複登入沿用同一個使用者;每次登入覆蓋名稱', async () => {
  const t = makeApp();
  t.discord.grant('c1', member({ nick: '舊名' }));
  await loginWith(t, 'c1');
  t.discord.grant('c2', member({ nick: '新名' }));
  const res = await loginWith(t, 'c2');
  assert.equal(count(t, 'users'), 1);
  const me = await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: sessionCookie(res)! } });
  assert.equal(me.json().displayName, '新名');
});

test('自動停用者重新符合資格:登入即恢復、三欄清空、資料保留', async () => {
  const t = makeApp();
  const id = addUser(t.db, '555555555555555555', { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 1 });
  t.discord.grant('c1', member());
  assert.equal((await loginWith(t, 'c1')).headers.location, '/');
  const u = t.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
  assert.equal(u.suspended_at, null);
  assert.equal(u.suspended_auto, null);
  assert.equal(u.suspended_by, null);
});

test('自動停用者仍不符資格:維持停用', async () => {
  const t = makeApp();
  const id = addUser(t.db, '555555555555555555', { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 1 });
  t.discord.grant('c1', member({ roles: [] }));
  assert.equal((await loginWith(t, 'c1')).headers.location, '/?login_error=no_role');
  assert.notEqual((t.db.prepare('SELECT suspended_at FROM users WHERE id = ?').get(id) as { suspended_at: string | null }).suspended_at, null);
});

test('手動停權者即使仍有身份組也不能登入、不會被恢復', async () => {
  const t = makeApp();
  const id = addUser(t.db, '555555555555555555', { suspended_at: '2026-09-20T00:00:00Z', suspended_auto: 0, suspended_by: '888888888888888888' });
  t.discord.grant('c1', member());
  const res = await loginWith(t, 'c1');
  assert.equal(res.headers.location, '/?login_error=no_role');
  assert.equal(sessionCookie(res), undefined);
  assert.notEqual((t.db.prepare('SELECT suspended_at FROM users WHERE id = ?').get(id) as { suspended_at: string | null }).suspended_at, null);
});

test('已停用使用者的既有 session 立即失效(保險)', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const token = sessionCookie(await loginWith(t, 'c1'))!;
  t.db.prepare("UPDATE users SET suspended_at = '2026-10-01T00:00:00Z', suspended_auto = 0").run();
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: token } })).statusCode, 401);
});

test('session 過期:401 並刪除該列', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const token = sessionCookie(await loginWith(t, 'c1'))!;
  t.clock.now = new Date(t.clock.now.getTime() + SESSION_TTL_MS + 1000);
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: token } })).statusCode, 401);
  assert.equal(count(t, 'sessions'), 0);
});

test('滑動續期:剛登入不續期;不足 29 天才重設為「現在 + 30 天」並重送 cookie', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const token = sessionCookie(await loginWith(t, 'c1'))!;
  const expiresOf = () => (t.db.prepare('SELECT expires_at FROM sessions').get() as { expires_at: string }).expires_at;
  const initial = expiresOf();

  // 隔 12 小時:剩 29.5 天,不重設、不重送 cookie
  t.clock.now = new Date(t.clock.now.getTime() + 12 * 60 * 60 * 1000);
  const r1 = await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: token } });
  assert.equal(r1.statusCode, 200);
  assert.equal(expiresOf(), initial);
  assert.equal(sessionCookie(r1), undefined);

  // 再過 2 天:剩不足 29 天,重設為「現在 + 30 天」(不是累加)
  t.clock.now = new Date(t.clock.now.getTime() + 2 * DAY);
  const r2 = await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: token } });
  assert.equal(expiresOf(), new Date(t.clock.now.getTime() + SESSION_TTL_MS).toISOString());
  assert.equal(sessionCookie(r2), token);
  assert.equal(r2.cookies.find((c) => c.name === 'eranaut_session')!.maxAge, SESSION_TTL_MS / 1000);
  assert.ok(RENEW_THRESHOLD_MS < SESSION_TTL_MS);
});

test('登出:POST 刪除 session 並清 cookie;之後 /api/me 回 401', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const token = sessionCookie(await loginWith(t, 'c1'))!;
  const out = await t.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin: ORIGIN }, cookies: { eranaut_session: token } });
  assert.equal(out.statusCode, 204);
  assert.equal(out.cookies.find((c) => c.name === 'eranaut_session')?.value, '');
  assert.equal(count(t, 'sessions'), 0);
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/me', cookies: { eranaut_session: token } })).statusCode, 401);
});

test('GET 不能登出(GET 無副作用)', async () => {
  const t = makeApp();
  assert.equal((await t.app.inject({ method: 'GET', url: '/api/auth/logout' })).statusCode, 404);
});

test('Origin 檢查:非 GET/HEAD 帶了別的來源回 403;沒帶或相符則放行', async () => {
  const t = makeApp();
  t.discord.grant('c1', member());
  const token = sessionCookie(await loginWith(t, 'c1'))!;
  const evil = await t.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin: 'https://evil.example' }, cookies: { eranaut_session: token } });
  assert.equal(evil.statusCode, 403);
  assert.equal(count(t, 'sessions'), 1, '被擋下就不得執行');
  assert.equal((await t.app.inject({ method: 'POST', url: '/api/auth/logout', cookies: { eranaut_session: token } })).statusCode, 204);
});
