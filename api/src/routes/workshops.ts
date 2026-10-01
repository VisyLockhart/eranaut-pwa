import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { deleteWorkshop, getWorkshop, insertWorkshop, listWorkshops } from '../repo/workshops.js';
import type { AppDeps } from '../server.js';
import { updateWorkshop } from '../services/updates.js';
import { validateWorkshopInput } from '../services/workshops.js';

// 路由只處理 HTTP;驗證在 services/,SQL 在 repo/(D-131 ③)。
// 資料一律以 session 的 user id 隔離;別人的工坊與不存在一律回 404。

export function registerWorkshopRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };

  app.get('/api/workshops', opts, async (req) => listWorkshops(db, req.session!.userId));

  app.get<{ Params: { id: string } }>('/api/workshops/:id', opts, async (req, reply) => {
    const w = getWorkshop(db, req.session!.userId, req.params.id);
    return w ?? reply.code(404).send(notFound);
  });

  app.post('/api/workshops', opts, async (req, reply) => {
    const v = validateWorkshopInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    return reply.code(201).send(insertWorkshop(db, req.session!.userId, v.value, deps.now()));
  });

  // 整筆取代:選填欄位省略或 null = 清空
  app.put<{ Params: { id: string } }>('/api/workshops/:id', opts, async (req, reply) => {
    const v = validateWorkshopInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    // 整批/預先提醒設定改變時,同一交易內重算提醒(D-139)
    const w = updateWorkshop(db, req.session!.userId, req.params.id, v.value, deps.now());
    return w ?? reply.code(404).send(notFound);
  });

  app.delete<{ Params: { id: string } }>('/api/workshops/:id', opts, async (req, reply) => {
    return deleteWorkshop(db, req.session!.userId, req.params.id) ? reply.code(204).send() : reply.code(404).send(notFound);
  });
}
