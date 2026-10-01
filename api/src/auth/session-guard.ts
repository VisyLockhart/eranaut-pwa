import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppDeps } from '../server.js';
import { authenticateSession, SESSION_TTL_MS, type SessionInfo } from '../repo/sessions.js';

export const SESSION_COOKIE = 'eranaut_session';
export const SESSION_MAX_AGE_S = SESSION_TTL_MS / 1000;

declare module 'fastify' {
  interface FastifyRequest {
    /** 通過 requireSession 後才有值 */
    session: SessionInfo | null;
  }
}

export function cookieBase(deps: AppDeps) {
  return { httpOnly: true, secure: deps.config.cookieSecure, sameSite: 'lax' as const };
}

export function setSessionCookie(reply: FastifyReply, deps: AppDeps, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, { ...cookieBase(deps), path: '/', maxAge: SESSION_MAX_AGE_S });
}

/**
 * 需要登入的路由用這個 preHandler:沒有或過期的 session 回 401(前端依此顯示 Session 過期,D-142 ⑦)。
 * 需要續期時重送 cookie(D-142 ②)。資料存取一律以 `req.session.userId` 為準,不信任請求內的使用者 ID。
 */
export function registerSessionAuth(app: FastifyInstance, deps: AppDeps) {
  app.decorateRequest('session', null);
  return async function requireSession(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies[SESSION_COOKIE];
    const result = token ? authenticateSession(deps.db, token, deps.now()) : null;
    if (!result || !token) return reply.code(401).send({ error: 'unauthorized' });
    if (result.renewed) setSessionCookie(reply, deps, token);
    req.session = result.session;
  };
}
