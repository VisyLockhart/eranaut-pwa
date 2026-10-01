import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import type { AppConfig } from './config.js';
import type { Db } from './db/index.js';
import type { Permissions } from './auth/permissions.js';
import type { DiscordClient } from './discord/client.js';
import { registerSessionAuth } from './auth/session-guard.js';
import { registerAuthRoutes } from './routes/auth.js';
import { createGuildCache } from './services/guild-cache.js';
import { registerInternalRoutes } from './routes/internal.js';
import { registerNotifyPrefsRoutes } from './routes/notify-prefs.js';
import { registerSubmarineRoutes } from './routes/submarines.js';
import { registerWorkshopRoutes } from './routes/workshops.js';

// 公開埠與內部埠是兩個薄入口,共用 service/repository 層(D-131)。
// 路由檔不寫業務規則。

export interface AppDeps {
  db: Db;
  config: AppConfig;
  discord: DiscordClient;
  permissions: Permissions;
  /** 注入時鐘,測試用 */
  now: () => Date;
}

export function buildPublicServer(deps: AppDeps, opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? true });
  app.register(cookie);

  // 回應一律 no-store(D-142 ⑥、D-83)。不做 CORS,不送任何 Access-Control-*(D-142 ①)。
  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  // 改資料的請求(非 GET/HEAD)檢查 Origin:有帶且不等於公開來源就 403(D-142 ④)
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'GET' || req.method === 'HEAD') return;
    const origin = req.headers.origin;
    if (origin !== undefined && origin !== deps.config.publicOrigin) {
      return reply.code(403).send({ error: 'forbidden_origin' });
    }
  });

  app.get('/api/healthz', async () => ({ ok: true }));
  // 登入前就要用的公開設定(登入失敗畫面的伺服器名稱,D-123);不含任何機密
  app.get('/api/public-config', async () => ({ guildName: deps.config.guildName }));
  const requireSession = registerSessionAuth(app, deps);
  registerAuthRoutes(app, deps, requireSession);
  registerWorkshopRoutes(app, deps, requireSession);
  registerSubmarineRoutes(app, deps, requireSession);
  registerNotifyPrefsRoutes(app, deps, requireSession);
  return app;
}

export function buildInternalServer(deps: AppDeps, opts: { logger?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opts.logger ?? true });
  app.get('/healthz', async () => ({ ok: true }));
  registerInternalRoutes(app, deps, createGuildCache(deps.discord, deps.now));
  return app;
}
