import type { NotifyPrefsValidationErrorBody } from '@eranaut/shared';
import { notifyMethodsToPrefs } from '@eranaut/shared';
import type { FastifyInstance } from 'fastify';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { getNotifyMethods } from '../repo/users.js';
import type { AppDeps } from '../server.js';
import { setNotifyPrefs } from '../services/updates.js';

// 提醒方式設定(D-72):對外用具名布林 `{ dm, channel }`,位元只在 service 層轉換(D-145 ⑦)。
// 全部取消 = 不收任何提醒(D-133 允許)。

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
    const prefs = { dm: b.dm as boolean, channel: b.channel as boolean };
    setNotifyPrefs(db, req.session!.userId, prefs, deps.now());
    return prefs;
  });
}
