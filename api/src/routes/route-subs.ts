import { LIMITS } from '@eranaut/shared';
import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { countRouteSubs, deleteRouteSub, insertRouteSub, listRouteSubs, ownsAllSubmarines, replaceRouteSub } from '../repo/route-subs.js';
import type { AppDeps } from '../server.js';
import { validateRouteSubInput } from '../services/route-subs.js';

// 儲存潛艇(RS-25、RS-26)。路由只處理 HTTP;驗證在 services/,SQL 在 repo/(D-131 ③)。
// 資料以 session 的使用者隔離;別人的與不存在一律回 404。

export function registerRouteSubRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };

  app.get('/api/route-subs', opts, async (req) => listRouteSubs(db, req.session!.userId));

  // 檢查上限與寫入放同一個交易(better-sqlite3 為同步,交易內不會被插隊)
  app.post('/api/route-subs', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const v = validateRouteSubInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    if (!ownsAllSubmarines(db, userId, v.value.bound_submarine_ids)) {
      return reply.code(400).send({ error: 'validation_failed', fields: { bound_submarine_ids: 'invalid_value' } });
    }
    const created = db.transaction(() => {
      if (countRouteSubs(db, userId) >= LIMITS.maxRouteSubsPerUser) return null;
      return insertRouteSub(db, userId, v.value, deps.now());
    })();
    return created ? reply.code(201).send(created) : reply.code(409).send({ error: 'limit_reached' });
  });

  // 整筆取代:bound_submarine_ids 省略或空陣列 = 解除全部綁定;已綁在別組的艇會搬過來
  app.put<{ Params: { id: string } }>('/api/route-subs/:id', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const v = validateRouteSubInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    if (!ownsAllSubmarines(db, userId, v.value.bound_submarine_ids)) {
      return reply.code(400).send({ error: 'validation_failed', fields: { bound_submarine_ids: 'invalid_value' } });
    }
    return replaceRouteSub(db, userId, req.params.id, v.value, deps.now()) ?? reply.code(404).send(notFound);
  });

  app.delete<{ Params: { id: string } }>('/api/route-subs/:id', opts, async (req, reply) => {
    return deleteRouteSub(db, req.session!.userId, req.params.id) ? reply.code(204).send() : reply.code(404).send(notFound);
  });
}
