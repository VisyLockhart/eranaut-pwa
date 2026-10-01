import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { getOverview, listSubmarines } from '../repo/submarines.js';
import type { AppDeps } from '../server.js';
import { validateSubmarineInput, validateSubmarinesBatch } from '../services/submarines.js';
import { updateSubmarines } from '../services/updates.js';

// 路由只處理 HTTP;驗證與時間計算在 services/,SQL 在 repo/(D-131 ③)。

export function registerSubmarineRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };

  // 前端總覽一次取得所有工坊與潛艇(D-146)
  app.get('/api/overview', opts, async (req) => getOverview(db, req.session!.userId));

  app.get<{ Params: { id: string } }>('/api/workshops/:id/submarines', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    return exists ? listSubmarines(db, userId, req.params.id) : reply.code(404).send(notFound);
  });

  // 整個工坊一次更新(D-117、D-122):全成功或全不寫;回該工坊全部潛艇與「不會收到提醒」的位置(D-135 ②b)
  app.put<{ Params: { id: string } }>('/api/workshops/:id/submarines', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!exists) return reply.code(404).send(notFound);
    const v = validateSubmarinesBatch(req.body);
    if (!v.ok) return reply.code(400).send(v.body);
    return updateSubmarines(db, userId, req.params.id, v.items, deps.now());
  });

  // 單艘快速修改(D-117),回應格式同上但 submarines 只有那一艘;位置在網址,body 的 position 省略時以網址為準,有帶則必須一致
  app.put<{ Params: { id: string; position: string } }>('/api/workshops/:id/submarines/:position', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!exists) return reply.code(404).send(notFound);
    const urlPosition = Number(req.params.position);
    const body = typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body) ? (req.body as Record<string, unknown>) : {};
    if (body.position !== undefined && body.position !== urlPosition) {
      return reply.code(400).send({ error: 'validation_failed', fields: { position: 'invalid_value' } });
    }
    const v = validateSubmarineInput({ ...body, position: urlPosition });
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    const result = updateSubmarines(db, userId, req.params.id, [v.value], deps.now())!;
    return { ...result, submarines: result.submarines.filter((s) => s.position === v.value.position) };
  });
}
