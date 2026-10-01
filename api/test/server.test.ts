import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVERS } from '@eranaut/shared';
import { makeApp } from './helpers.js';

test('公開埠健康檢查回 200、no-store,且不送任何 CORS 標頭', async () => {
  const { app } = makeApp();
  const res = await app.inject({ method: 'GET', url: '/api/healthz' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(Object.keys(res.headers).filter((h) => h.startsWith('access-control-')).length, 0);
  await app.close();
});

test('公開設定:不需登入,只回伺服器顯示名稱(D-123)', async () => {
  const { app } = makeApp();
  const res = await app.inject({ method: 'GET', url: '/api/public-config' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { guildName: '貝殼公會' });
  await app.close();
});

test('內部埠健康檢查回 200', async () => {
  const { internal: app } = makeApp();
  const res = await app.inject({ method: 'GET', url: '/healthz' });
  assert.equal(res.statusCode, 200);
  await app.close();
});

test('可引用 shared 常數', () => {
  assert.equal(SERVERS.length, 7);
});
