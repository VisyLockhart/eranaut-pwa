import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVERS } from '@eranaut/shared';
import { buildInternalServer } from '../src/server.js';
import { makeApp } from './helpers.js';

test('公開埠健康檢查回 200、no-store,且不送任何 CORS 標頭', async () => {
  const { app } = makeApp();
  const res = await app.inject({ method: 'GET', url: '/api/healthz' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(Object.keys(res.headers).filter((h) => h.startsWith('access-control-')).length, 0);
  await app.close();
});

test('內部埠健康檢查回 200', async () => {
  const app = buildInternalServer({ logger: false });
  const res = await app.inject({ method: 'GET', url: '/healthz' });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('可引用 shared 常數', () => {
  assert.equal(SERVERS.length, 7);
});
