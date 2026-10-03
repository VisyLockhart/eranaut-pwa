import type { FastifyInstance } from 'fastify';
import type { PushConfigDto, PushSubscriptionInput, PushSubscriptionsDto, PushTestResult, PushValidationErrorBody } from '@eranaut/shared';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { PushSendError } from '../push/sender.js';
import { deletePushSubscriptionById, listPushSubscriptions } from '../repo/push.js';
import type { AppDeps } from '../server.js';
import { clearPushIfNoSubscriptions, registerPushSubscription, removePushSubscription } from '../services/push-subscriptions.js';

// 瀏覽器推播訂閱(D-165):每台裝置各自登記;登記第一台時自動打開推播提醒方式,移除最後一台時關閉。
// 推播沒有設定(`.env` 沒有 VAPID 金鑰)時:config 回 publicKey = null,其餘寫入端點回 503 `push_unavailable`。

const MAX_ENDPOINT = 2048;
const MAX_KEY = 256;
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;
/** 測試通知的最短間隔(每位使用者),避免連按 */
export const TEST_INTERVAL_MS = 10_000;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateInput(body: unknown): { ok: true; value: PushSubscriptionInput } | { ok: false; fields: PushValidationErrorBody['fields'] } {
  const b = isRecord(body) ? body : {};
  const fields: PushValidationErrorBody['fields'] = {};
  const endpoint = b.endpoint;
  if (endpoint === undefined || endpoint === null || endpoint === '') fields.endpoint = 'required';
  else if (typeof endpoint !== 'string') fields.endpoint = 'invalid_type';
  else if (endpoint.length > MAX_ENDPOINT) fields.endpoint = 'too_long';
  else {
    let url: URL | null = null;
    try {
      url = new URL(endpoint);
    } catch {
      /* 下面統一回 invalid_value */
    }
    if (url === null || url.protocol !== 'https:') fields.endpoint = 'invalid_value';
  }
  const keys = b.keys;
  if (keys === undefined || keys === null) fields.keys = 'required';
  else if (!isRecord(keys)) fields.keys = 'invalid_type';
  else if (typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') fields.keys = 'invalid_type';
  else if (!keys.p256dh || !keys.auth) fields.keys = 'required';
  else if (keys.p256dh.length > MAX_KEY || keys.auth.length > MAX_KEY) fields.keys = 'too_long';
  else if (!BASE64URL.test(keys.p256dh) || !BASE64URL.test(keys.auth)) fields.keys = 'invalid_value';
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  const k = keys as { p256dh: string; auth: string };
  return { ok: true, value: { endpoint: endpoint as string, keys: { p256dh: k.p256dh, auth: k.auth } } };
}

export function registerPushRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  const { db } = deps;
  const opts = { preHandler: requireSession };
  const lastTest = new Map<string, number>();

  app.get('/api/push/config', opts, async (): Promise<PushConfigDto> => ({ publicKey: deps.config.push?.publicKey ?? null }));

  app.get('/api/push/subscriptions', opts, async (req): Promise<PushSubscriptionsDto> => ({
    endpoints: listPushSubscriptions(db, req.session!.userId).map((s) => s.endpoint),
  }));

  app.put('/api/push/subscription', opts, async (req, reply) => {
    if (!deps.config.push) return reply.code(503).send({ error: 'push_unavailable' });
    const v = validateInput(req.body);
    if (!v.ok) return reply.code(400).send({ error: 'validation_failed', fields: v.fields } satisfies PushValidationErrorBody);
    const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : null;
    registerPushSubscription(db, req.session!.userId, { endpoint: v.value.endpoint, p256dh: v.value.keys.p256dh, auth: v.value.keys.auth, userAgent: ua }, deps.now());
    return reply.code(204).send();
  });

  app.delete('/api/push/subscription', opts, async (req, reply) => {
    const b = isRecord(req.body) ? req.body : {};
    if (typeof b.endpoint !== 'string' || !b.endpoint) {
      return reply.code(400).send({ error: 'validation_failed', fields: { endpoint: b.endpoint === undefined ? 'required' : 'invalid_type' } } satisfies PushValidationErrorBody);
    }
    // 不存在也回 204(冪等):登出時的「順手移除」不該因為已經被清掉而失敗
    removePushSubscription(db, req.session!.userId, b.endpoint, deps.now());
    return reply.code(204).send();
  });

  app.post('/api/push/test', opts, async (req, reply) => {
    if (!deps.config.push || !deps.push) return reply.code(503).send({ error: 'push_unavailable' });
    const userId = req.session!.userId;
    const now = deps.now().getTime();
    const last = lastTest.get(userId);
    if (last !== undefined && now - last < TEST_INTERVAL_MS) return reply.code(429).send({ error: 'too_fast' });

    const subs = listPushSubscriptions(db, userId);
    if (subs.length === 0) return reply.code(404).send({ error: 'no_subscription' });
    lastTest.set(userId, now);
    let sent = 0;
    let removed = false;
    for (const s of subs) {
      try {
        await deps.push.send({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, { title: '🔔 測試通知', body: '推播運作正常,提醒會像這樣出現。', tag: 'eranaut-test' });
        sent++;
      } catch (e) {
        if (e instanceof PushSendError && e.gone) {
          deletePushSubscriptionById(db, s.id);
          removed = true;
        }
        req.log.warn({ event: 'push_test_failed', userId, error: (e as Error).message });
      }
    }
    if (removed) clearPushIfNoSubscriptions(db, userId, deps.now());
    if (sent === 0) return reply.code(502).send({ error: 'push_failed' });
    return { sent } satisfies PushTestResult;
  });
}
