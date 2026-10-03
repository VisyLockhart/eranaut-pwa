import type { NotifyPrefsValidationErrorBody } from '@eranaut/shared';
import { notifyMethodsToPrefs } from '@eranaut/shared';
import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { getNotifyMethods } from '../repo/users.js';
import type { AppDeps } from '../server.js';
import { setNotifyPrefs } from '../services/updates.js';

// 提醒方式設定(D-72):對外用具名布林 `{ dm, channel }`,位元只在 service 層轉換(D-145 ⑦)。
// 全部取消 = 不收任何提醒(D-133 允許)。回應含 push(D-165),請求只收 dm 與 channel。

export function registerNotifyPrefsRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };

  app.get('/api/notify-prefs', opts, async (req) => notifyMethodsToPrefs(getNotifyMethods(db, req.session!.userId)));

  app.put('/api/notify-prefs', opts, async (req, reply) => {
    const b = (typeof req.body === 'object' && req.body !== null && !Array.isArray(req.body) ? req.body : {}) as Record<string, unknown>;
    const fields: NotifyPrefsValidationErrorBody['fields'] = {};
    for (const k of ['dm', 'channel'] as const) {
      if (b[k] === undefined || b[k] === null) fields[k] = 'required';
      else if (typeof b[k] !== 'boolean') fields[k] = 'invalid_type';
    }
    if (Object.keys(fields).length > 0) return reply.code(400).send({ error: 'validation_failed', fields });
    // 推播(push)不在這裡改:body 裡有 push 也忽略,由 /api/push/subscription 管理(D-165)
    const bits = setNotifyPrefs(db, req.session!.userId, { dm: b.dm as boolean, channel: b.channel as boolean }, deps.now());
    return notifyMethodsToPrefs(bits);
  });
}
