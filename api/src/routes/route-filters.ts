import { LIMITS } from '@eranaut/shared';
import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { countRouteFilters, deleteRouteFilter, insertRouteFilter, listRouteFilters, replaceRouteFilter, setRouteFilterFavorite } from '../repo/route-filters.js';
import type { AppDeps } from '../server.js';
import { parseFavoriteInput } from '../services/route-favorite.js';
import { validateRouteFilterInput } from '../services/route-filters.js';

// 條件組合(D-229)。路由只處理 HTTP;驗證在 services/,SQL 在 repo/。別人的與不存在一律回 404。

export function registerRouteFilterRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };

  app.get('/api/route-filters', opts, async (req) => listRouteFilters(db, req.session!.userId));

  app.post('/api/route-filters', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const v = validateRouteFilterInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    const created = db.transaction(() => {
      if (countRouteFilters(db, userId) >= LIMITS.maxRouteFiltersPerUser) return null;
      return insertRouteFilter(db, userId, v.value, deps.now());
    })();
    return created ? reply.code(201).send(created) : reply.code(409).send({ error: 'limit_reached' });
  });

  app.put<{ Params: { id: string } }>('/api/route-filters/:id', opts, async (req, reply) => {
    const v = validateRouteFilterInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    return replaceRouteFilter(db, req.session!.userId, req.params.id, v.value, deps.now()) ?? reply.code(404).send(notFound);
  });

  // 只切換常用(D-237):不動其他欄位與 updated_at
  app.patch<{ Params: { id: string } }>('/api/route-filters/:id', opts, async (req, reply) => {
    const fav = parseFavoriteInput(req.body);
    if (fav === null) return reply.code(400).send({ error: 'validation_failed', fields: { favorite: 'invalid_type' } });
    return setRouteFilterFavorite(db, req.session!.userId, req.params.id, fav) ?? reply.code(404).send(notFound);
  });

  app.delete<{ Params: { id: string } }>('/api/route-filters/:id', opts, async (req, reply) => {
    return deleteRouteFilter(db, req.session!.userId, req.params.id) ? reply.code(204).send() : reply.code(404).send(notFound);
  });
}
