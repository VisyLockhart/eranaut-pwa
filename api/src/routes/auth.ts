import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { redirectUri } from '../config.js';
import { cookieBase, SESSION_COOKIE, setSessionCookie } from '../auth/session-guard.js';
import { deleteSessionByToken } from '../repo/sessions.js';
import { completeLogin, type LoginError } from '../services/login.js';
import type { AppDeps } from '../server.js';
import type { registerSessionAuth } from '../auth/session-guard.js';

// 路由只做 HTTP 與 cookie 的事,業務規則在 services/ 與 repo/(D-131 ③)。

export const STATE_COOKIE = 'eranaut_oauth_state';
const CALLBACK_PATH = '/api/auth/callback';
const STATE_MAX_AGE_S = 10 * 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function registerAuthRoutes(
  app: FastifyInstance,
  deps: AppDeps,
  requireSession: ReturnType<typeof registerSessionAuth>,
): void {
  const { db, config } = deps;
  const cookieOpts = cookieBase(deps);

  // 導去 Discord 授權頁。只設一個短命 state cookie,沒有資料副作用。
  app.get('/api/auth/login', async (_req, reply) => {
    const state = randomBytes(32).toString('base64url');
    reply.setCookie(STATE_COOKIE, state, { ...cookieOpts, path: CALLBACK_PATH, maxAge: STATE_MAX_AGE_S });
    const url = new URL('https://discord.com/oauth2/authorize');
    url.search = new URLSearchParams({
      client_id: config.discord.clientId,
      response_type: 'code',
      redirect_uri: redirectUri(config),
      scope: 'identify',
      state,
    }).toString();
    return reply.redirect(url.toString(), 302);
  });

  // OAuth 回呼:一律 302 回 `/`,失敗原因以分類碼帶回(D-142 ③)
  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(CALLBACK_PATH, async (req, reply) => {
    const { code, state, error } = req.query;
    const expectedState = req.cookies[STATE_COOKIE];
    // state 驗完立即清除
    reply.clearCookie(STATE_COOKIE, { ...cookieOpts, path: CALLBACK_PATH });

    const fail = (e: LoginError) => reply.redirect(`/?login_error=${e}`, 302);

    if (error) return fail(error === 'access_denied' ? 'denied' : 'failed');
    if (!code || !state || !expectedState || !safeEqual(state, expectedState)) return fail('failed');

    const result = await completeLogin(
      { db, discord: deps.discord, permissions: deps.permissions, guildId: config.discord.guildId, now: deps.now, log: req.log },
      code,
    );
    if (!result.ok) return fail(result.error);
    setSessionCookie(reply, deps, result.token);
    return reply.redirect('/', 302);
  });

  // 「我是誰」:名稱與頭像每次載入都由這裡取得(D-134、D-145 ⑥)
  app.get('/api/me', { preHandler: requireSession }, async (req) => ({
    displayName: req.session!.displayName,
    avatarUrl: req.session!.avatarUrl,
  }));

  // 登出用 POST(GET 不得有副作用,D-142 ④)
  app.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) deleteSessionByToken(db, token);
    reply.clearCookie(SESSION_COOKIE, { ...cookieOpts, path: '/' });
    return reply.code(204).send();
  });
}
