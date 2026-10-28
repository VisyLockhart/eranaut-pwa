import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { listCharts, saveCharts } from '../repo/charts.js';
import type { AppDeps } from '../server.js';
import { validateChartsInput } from '../services/charts.js';

// 海圖探索紀錄(D-293)。路由只處理 HTTP;驗證在 services/,SQL 在 repo/。別人的與不存在的工坊一律回 404。
// 截圖辨識(POST /api/charts/ocr)在 routes/ocr.ts,和潛艇截圖共用上傳設定與排隊。

export function registerChartRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };
  const owns = (userId: string, id: string) => !!db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(id, userId);

  app.get<{ Params: { id: string } }>('/api/workshops/:id/charts', opts, async (req, reply) => {
    const userId = req.session!.userId;
    return owns(userId, req.params.id) ? listCharts(db, userId, req.params.id) : reply.code(404).send(notFound);
  });

  // 只覆寫列出的海域;回該工坊全部紀錄
  app.put<{ Params: { id: string } }>('/api/workshops/:id/charts', opts, async (req, reply) => {
    const userId = req.session!.userId;
    if (!owns(userId, req.params.id)) return reply.code(404).send(notFound);
    const v = validateChartsInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields });
    saveCharts(db, req.params.id, v.value, deps.now());
    return listCharts(db, userId, req.params.id);
  });
}
