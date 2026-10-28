import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ChartOcrResultDto, OverviewDto, WorkshopChartDto, WorkshopDto } from '@eranaut/shared';
import type { OcrService } from '../src/ocr/service.js';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

// 海圖探索紀錄(D-293):PUT / GET /api/workshops/:id/charts、總覽帶 charts、POST /api/charts/ocr。

const ID_A = '555555555555555555';
const ID_B = '666666666666666666';

async function asUser(t: TestApp, discordId: string) {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: `u${discordId.slice(-3)}`, global_name: null, avatar: null } }));
  const cookie = sessionCookie(await loginWith(t, `code-${discordId}`))!;
  const api = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, payload?: unknown) =>
    t.app.inject({ method, url, payload: payload as object, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  return Object.assign(api, { cookie });
}

async function newWorkshop(api: Awaited<ReturnType<typeof asUser>>, name = '貝殼工坊'): Promise<WorkshopDto> {
  const res = await api('POST', '/api/workshops', { name, server: '迦樓羅' });
  assert.equal(res.statusCode, 201);
  return res.json() as WorkshopDto;
}

// 溺沒海 A=1、B=2、AC=29;灰海的點從 32 起
test('儲存、讀回、覆寫與刪除單一海域', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const ws = await newWorkshop(api);
  assert.deepEqual((await api('GET', `/api/workshops/${ws.id}/charts`)).json(), []);

  const put = await api('PUT', `/api/workshops/${ws.id}/charts`, { seas: [{ sea: 1, points: [3, 1, 2, 2] }, { sea: 2, points: [32] }] });
  assert.equal(put.statusCode, 200);
  const list = put.json() as WorkshopChartDto[];
  assert.deepEqual(
    list.map((c) => [c.sea, c.points]),
    [
      [1, [1, 2, 3]],
      [2, [32]],
    ],
  );
  assert.equal(list[0]!.updated_at, '2026-10-01T00:00:00.000Z');

  // 只覆寫列出的海域;空陣列 = 刪除該海域
  t.clock.now = new Date('2026-10-02T00:00:00Z');
  const again = (await api('PUT', `/api/workshops/${ws.id}/charts`, { seas: [{ sea: 2, points: [] }] })).json() as WorkshopChartDto[];
  assert.deepEqual(
    again.map((c) => [c.sea, c.points, c.updated_at]),
    [[1, [1, 2, 3], '2026-10-01T00:00:00.000Z']],
  );
});

test('驗證:海域不存在、點不屬於該海域、重複海域、格式錯誤回 400', async () => {
  const t = makeApp();
  const api = await asUser(t, ID_A);
  const ws = await newWorkshop(api);
  for (const body of [{}, { seas: [] }, { seas: 'x' }, { seas: [{ sea: 99, points: [] }] }, { seas: [{ sea: 1, points: [32] }] }, { seas: [{ sea: 1, points: ['A'] }] }, { seas: [{ sea: 1, points: [] }, { sea: 1, points: [] }] }]) {
    const res = await api('PUT', `/api/workshops/${ws.id}/charts`, body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.equal((res.json() as { error: string }).error, 'validation_failed');
  }
});

test('別人的工坊回 404;總覽帶各工坊的紀錄;刪除工坊連帶刪除紀錄', async () => {
  const t = makeApp();
  const a = await asUser(t, ID_A);
  const b = await asUser(t, ID_B);
  const ws = await newWorkshop(a);
  const other = await newWorkshop(a, '鋼鐵之心');
  assert.equal((await a('PUT', `/api/workshops/${ws.id}/charts`, { seas: [{ sea: 1, points: [1, 2] }] })).statusCode, 200);
  assert.equal((await b('GET', `/api/workshops/${ws.id}/charts`)).statusCode, 404);
  assert.equal((await b('PUT', `/api/workshops/${ws.id}/charts`, { seas: [{ sea: 1, points: [1] }] })).statusCode, 404);

  const ov = (await a('GET', '/api/overview')).json() as OverviewDto;
  const byId = new Map(ov.workshops.map((w) => [w.id, w.charts]));
  assert.deepEqual(byId.get(ws.id)?.map((c) => c.points), [[1, 2]]);
  assert.deepEqual(byId.get(other.id), []);

  assert.equal((await a('DELETE', `/api/workshops/${ws.id}`)).statusCode, 204);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM workshop_charts').get() as { n: number }).n, 0);
});

const CHART: ChartOcrResultDto = { sea: 2, points: [32, 33], filled: [], uncertain: [], screen_count: 2, map_box: { left: 10, top: 20, size: 500, width: 800, height: 900 } };

function multipart(data: Buffer) {
  const boundary = `----eranaut${Math.random().toString(16).slice(2)}`;
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="map.png"\r\nContent-Type: image/png\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { payload: Buffer.concat([head, data, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

test('POST /api/charts/ocr:回辨識結果;認不出來回 422;沒有辨識功能回 503;不寫資料庫', async () => {
  let next: ChartOcrResultDto | null = CHART;
  const service: OcrService = { recognize: async () => null, recognizeChart: async () => next };
  const t = makeApp({ ocr: service });
  const api = await asUser(t, ID_A);
  const send = (app: TestApp, cookie: string) => {
    const body = multipart(Buffer.from('fake'));
    return app.app.inject({ method: 'POST', url: '/api/charts/ocr', payload: body.payload, headers: { origin: ORIGIN, 'content-type': body.contentType }, cookies: { eranaut_session: cookie } });
  };
  const ok = await send(t, api.cookie);
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.json(), CHART);
  assert.equal((t.db.prepare('SELECT COUNT(*) AS n FROM workshop_charts').get() as { n: number }).n, 0);

  next = null;
  const bad = await send(t, api.cookie);
  assert.equal(bad.statusCode, 422);
  assert.deepEqual(bad.json(), { error: 'unrecognized' });

  const t2 = makeApp({ ocr: { recognize: async () => null } });
  const api2 = await asUser(t2, ID_A);
  assert.equal((await send(t2, api2.cookie)).statusCode, 503);
});
