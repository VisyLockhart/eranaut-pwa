import Fastify, { type FastifyInstance } from 'fastify';

// 公開埠與內部埠是兩個薄入口,共用 service/repository 層(D-131)。
// 路由檔不寫業務規則;目前只有健康檢查,業務路由在後續步驟加入。

export function buildPublicServer(): FastifyInstance {
  const app = Fastify({ logger: true });
  // 公開 API 回應一律 no-store(D-142 ⑥、D-83)。不做 CORS(D-142 ①)。
  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
  });
  app.get('/api/healthz', async () => ({ ok: true }));
  return app;
}

export function buildInternalServer(): FastifyInstance {
  const app = Fastify({ logger: true });
  app.get('/healthz', async () => ({ ok: true }));
  return app;
}
