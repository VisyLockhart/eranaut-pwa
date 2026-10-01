import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInternalServer, buildPublicServer } from '../src/server.js';
import { SERVERS } from '@eranaut/shared';

test('公開埠健康檢查回 200 且 Cache-Control: no-store', async () => {
  const app = buildPublicServer();
  const res = await app.inject({ method: 'GET', url: '/api/healthz' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.headers['access-control-allow-origin'], undefined);
  await app.close();
});

test('內部埠健康檢查回 200', async () => {
  const app = buildInternalServer();
  const res = await app.inject({ method: 'GET', url: '/healthz' });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('可引用 shared 常數', () => {
  assert.equal(SERVERS.length, 7);
});
