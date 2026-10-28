import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { getActiveMaintenance } from '../repo/maintenance.js';
import { getOverview, getSubmarine, listSubmarines } from '../repo/submarines.js';
import { applyProgressInput, deleteProgress, ProgressRejected } from '../repo/progress.js';
import { deleteUpkeep } from '../repo/upkeep.js';
import type { AppDeps } from '../server.js';
import { validateProgressInput, validateSubmarineInput, validateSubmarinesBatch } from '../services/submarines.js';
import { applyUpkeepPatch, repairSubmarines, UpkeepRejected } from '../services/upkeep.js';
import { updateSubmarines } from '../services/updates.js';

// 路由只處理 HTTP;驗證與時間計算在 services/,SQL 在 repo/(D-131 ③)。

export function registerSubmarineRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const notFound = { error: 'not_found' };

  // 前端總覽一次取得所有工坊與潛艇(D-146)
  // 維護橫幅(D-283)順便帶回總覽,不增加請求;橫幅顯示期間前端改打下面這支輕量端點
  app.get('/api/overview', opts, async (req) => ({ ...getOverview(db, req.session!.userId, deps.now()), maintenance: getActiveMaintenance(db, deps.now()) }));
  app.get('/api/maintenance', opts, async () => ({ maintenance: getActiveMaintenance(db, deps.now()) }));

  app.get<{ Params: { id: string } }>('/api/workshops/:id/submarines', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    return exists ? listSubmarines(db, userId, req.params.id, deps.now()) : reply.code(404).send(notFound);
  });

  // 整個工坊一次更新(D-117、D-122):全成功或全不寫;回該工坊全部潛艇與「不會收到提醒」的位置(D-135 ②b)
  app.put<{ Params: { id: string } }>('/api/workshops/:id/submarines', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!exists) return reply.code(404).send(notFound);
    const v = validateSubmarinesBatch(req.body);
    if (!v.ok) return reply.code(400).send(v.body);
    try {
      return updateSubmarines(db, userId, req.params.id, v.items, deps.now());
    } catch (e) {
      if (!(e instanceof UpkeepRejected) && !(e instanceof ProgressRejected)) throw e;
      const index = v.items.findIndex((i) => i.position === e.position);
      const field = e instanceof UpkeepRejected ? 'upkeep' : 'progress';
      return reply.code(400).send({ error: 'validation_failed', fields: {}, items: [{ index, fields: { [field]: 'invalid_value' } }], [`${field}_reason`]: e.reason });
    }
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
    let result;
    try {
      result = updateSubmarines(db, userId, req.params.id, [v.value], deps.now())!;
    } catch (e) {
      if (!(e instanceof UpkeepRejected) && !(e instanceof ProgressRejected)) throw e;
      const field = e instanceof UpkeepRejected ? 'upkeep' : 'progress';
      return reply.code(400).send({ error: 'validation_failed', fields: { [field]: 'invalid_value' }, [`${field}_reason`]: e.reason });
    }
    return { ...result, submarines: result.submarines.filter((s) => s.position === v.value.position) };
  });
  // 配件維修提醒(D-288):手動調整趟數 / 上限、關閉、標示已維修。回傳更新後的潛艇(含 upkeep)
  app.put<{ Params: { id: string } }>('/api/submarines/:id/upkeep', opts, async (req, reply) => {
    const userId = req.session!.userId;
    if (!getSubmarine(db, userId, req.params.id)) return reply.code(404).send(notFound);
    const r = applyUpkeepPatch(db, req.params.id, req.body, deps.now());
    if (!r.ok) return reply.code(r.error === 'not_found' ? 404 : 400).send(r.error === 'not_found' ? notFound : { error: 'validation_failed', fields: {} });
    return getSubmarine(db, userId, req.params.id);
  });

  app.delete<{ Params: { id: string } }>('/api/submarines/:id/upkeep', opts, async (req, reply) => {
    const userId = req.session!.userId;
    if (!getSubmarine(db, userId, req.params.id)) return reply.code(404).send(notFound);
    deleteUpkeep(db, req.params.id);
    return getSubmarine(db, userId, req.params.id);
  });

  // 等級與練級輔助(D-289):單獨調整(不經過更新潛艇),例如總覽上改等級、清掉待結算的路線。回傳更新後的潛艇
  app.put<{ Params: { id: string } }>('/api/submarines/:id/progress', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const sub = getSubmarine(db, userId, req.params.id, deps.now());
    if (!sub) return reply.code(404).send(notFound);
    const v = validateProgressInput(req.body);
    if (typeof v === 'string') return reply.code(400).send({ error: 'validation_failed', fields: { progress: v } });
    try {
      db.transaction(() => applyProgressInput(db, req.params.id, v, sub.status, deps.now()))();
    } catch (e) {
      if (!(e instanceof ProgressRejected)) throw e;
      return reply.code(400).send({ error: 'validation_failed', fields: { progress: 'invalid_value' }, progress_reason: e.reason });
    }
    return getSubmarine(db, userId, req.params.id, deps.now());
  });

  app.delete<{ Params: { id: string } }>('/api/submarines/:id/progress', opts, async (req, reply) => {
    const userId = req.session!.userId;
    if (!getSubmarine(db, userId, req.params.id)) return reply.code(404).send(notFound);
    deleteProgress(db, req.params.id);
    return getSubmarine(db, userId, req.params.id, deps.now());
  });

  // 面板「標示已維修」:一次處理同工坊勾選的幾艘;回該工坊全部潛艇
  app.post<{ Params: { id: string } }>('/api/workshops/:id/upkeep/repaired', opts, async (req, reply) => {
    const userId = req.session!.userId;
    const subs = listSubmarines(db, userId, req.params.id);
    const exists = db.prepare('SELECT 1 FROM workshops WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!exists) return reply.code(404).send(notFound);
    const ids = typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>).submarine_ids : undefined;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 4 || ids.some((i) => typeof i !== 'string')) {
      return reply.code(400).send({ error: 'validation_failed', fields: { submarine_ids: 'invalid_value' } });
    }
    db.transaction(() => repairSubmarines(db, subs, ids as string[], deps.now()))();
    return { submarines: listSubmarines(db, userId, req.params.id, deps.now()) };
  });
}
