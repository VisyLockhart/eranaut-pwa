import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { OcrErrorCode, OcrResultDto } from '@eranaut/shared';
import { UnsupportedImageError } from '../src/ocr/engine.js';
import { BusyError } from '../src/ocr/limiter.js';
import type { OcrService } from '../src/ocr/service.js';
import { OCR_MAX_BYTES } from '../src/routes/ocr.js';
import { loginWith, makeApp, member, ORIGIN, sessionCookie, type TestApp } from './helpers.js';

const RESULT: OcrResultDto = {
  format: 'menu',
  warnings: [],
  submarines: [{ position: 1, name: '潛水艇-1', status: 'exploring', days: 0, hours: 8, minutes: 52, remaining_minutes: 532, suspect: { name: false, time: false }, reasons: [] }],
};

function fakeOcr(impl: (image: Buffer) => Promise<OcrResultDto | null> = async () => RESULT) {
  const calls: Buffer[] = [];
  const service: OcrService = {
    recognize: async (image) => {
      calls.push(image);
      return impl(image);
    },
  };
  return { service, calls };
}

function multipart(field: string, data: Buffer, contentType = 'image/png') {
  const boundary = `----eranaut${Math.random().toString(16).slice(2)}`;
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="shot.png"\r\nContent-Type: ${contentType}\r\n\r\n`);
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { payload: Buffer.concat([head, data, tail]), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function login(t: TestApp, discordId = '555555555555555555') {
  t.discord.grant(`code-${discordId}`, member({ id: discordId, user: { id: discordId, username: 'u', global_name: null, avatar: null } }));
  return sessionCookie(await loginWith(t, `code-${discordId}`))!;
}

const upload = (t: TestApp, cookie: string | undefined, body: { payload: Buffer; contentType: string }, headers: Record<string, string> = {}) =>
  t.app.inject({
    method: 'POST',
    url: '/api/ocr',
    payload: body.payload,
    headers: { origin: ORIGIN, 'content-type': body.contentType, ...headers },
    cookies: cookie ? { eranaut_session: cookie } : {},
  });

const PNG = Buffer.from('not-really-a-png-the-fake-service-does-not-look');

test('未登入回 401,而且不會碰辨識服務', async () => {
  const { service, calls } = fakeOcr();
  const t = makeApp({ ocr: service });
  const res = await upload(t, undefined, multipart('image', PNG));
  assert.equal(res.statusCode, 401);
  assert.equal(calls.length, 0);
});

test('登入後上傳:回辨識結果、no-store,上傳內容原樣交給辨識服務', async () => {
  const { service, calls } = fakeOcr();
  const t = makeApp({ ocr: service });
  const res = await upload(t, await login(t), multipart('image', PNG));
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.deepEqual(res.json(), RESULT);
  assert.deepEqual(calls, [PNG]);
});

test('改資料類請求的 Origin 檢查也適用:別的來源回 403', async () => {
  const { service, calls } = fakeOcr();
  const t = makeApp({ ocr: service });
  const res = await upload(t, await login(t), multipart('image', PNG), { origin: 'https://evil.example.com' });
  assert.equal(res.statusCode, 403);
  assert.equal(calls.length, 0);
});

test('不寫資料庫:辨識前後所有資料表筆數不變(D-49)', async () => {
  const { service } = fakeOcr();
  const t = makeApp({ ocr: service });
  const cookie = await login(t);
  const count = () =>
    (t.db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[])
      .map((r) => (t.db.prepare(`SELECT COUNT(*) AS n FROM "${r.name}"`).get() as { n: number }).n)
      .join(',');
  const before = count();
  await upload(t, cookie, multipart('image', PNG));
  assert.equal(count(), before);
});

const errorOf = (res: { json(): unknown }) => (res.json() as { error: OcrErrorCode }).error;

test('錯誤:不是 multipart / 沒有 image 欄位 / 空檔案都是 400 no_file', async () => {
  const { service, calls } = fakeOcr();
  const t = makeApp({ ocr: service });
  const cookie = await login(t);
  const json = await t.app.inject({ method: 'POST', url: '/api/ocr', payload: { a: 1 }, headers: { origin: ORIGIN }, cookies: { eranaut_session: cookie } });
  assert.deepEqual([json.statusCode, errorOf(json)], [400, 'no_file']);
  const wrongField = await upload(t, cookie, multipart('photo', PNG));
  assert.deepEqual([wrongField.statusCode, errorOf(wrongField)], [400, 'no_file']);
  const empty = await upload(t, cookie, multipart('image', Buffer.alloc(0)));
  assert.deepEqual([empty.statusCode, errorOf(empty)], [400, 'no_file']);
  assert.equal(calls.length, 0);
});

test(`錯誤:超過 ${OCR_MAX_BYTES / 1024 / 1024} MB 回 413 file_too_large,不呼叫辨識`, async () => {
  const { service, calls } = fakeOcr();
  const t = makeApp({ ocr: service });
  const res = await upload(t, await login(t), multipart('image', Buffer.alloc(OCR_MAX_BYTES + 1024, 1)));
  assert.deepEqual([res.statusCode, errorOf(res)], [413, 'file_too_large']);
  assert.equal(calls.length, 0);
});

test('錯誤:不是支援的圖片 415、找不到潛艇列 422、服務太忙 429(帶 Retry-After)、引擎壞掉 503', async () => {
  let mode: 'unsupported' | 'none' | 'busy' | 'crash' = 'unsupported';
  const { service } = fakeOcr(async () => {
    if (mode === 'unsupported') throw new UnsupportedImageError();
    if (mode === 'none') return null;
    if (mode === 'busy') throw new BusyError();
    throw new Error('model load failed');
  });
  const t = makeApp({ ocr: service });
  const cookie = await login(t);
  const send = () => upload(t, cookie, multipart('image', PNG));

  let res = await send();
  assert.deepEqual([res.statusCode, errorOf(res)], [415, 'unsupported_image']);
  mode = 'none';
  res = await send();
  assert.deepEqual([res.statusCode, errorOf(res)], [422, 'unrecognized']);
  mode = 'busy';
  res = await send();
  assert.deepEqual([res.statusCode, errorOf(res)], [429, 'busy']);
  assert.ok(Number(res.headers['retry-after']) > 0);
  mode = 'crash';
  res = await send();
  assert.deepEqual([res.statusCode, errorOf(res)], [503, 'ocr_unavailable']);
  assert.ok(!JSON.stringify(res.json()).includes('model load failed'), '內部錯誤訊息不外洩');
});

test('沒有注入辨識服務:503 ocr_unavailable', async () => {
  const t = makeApp();
  const res = await upload(t, await login(t), multipart('image', PNG));
  assert.deepEqual([res.statusCode, errorOf(res)], [503, 'ocr_unavailable']);
});

test('同一位使用者同時只處理一張:第二張回 429,別人不受影響,處理完又可上傳', async () => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const { service, calls } = fakeOcr(async () => {
    await gate;
    return RESULT;
  });
  const t = makeApp({ ocr: service });
  const a = await login(t, '555555555555555555');
  const b = await login(t, '666666666666666666');

  const first = upload(t, a, multipart('image', PNG));
  await new Promise((r) => setTimeout(r, 30));
  const second = await upload(t, a, multipart('image', PNG));
  assert.deepEqual([second.statusCode, errorOf(second)], [429, 'busy']);
  const other = upload(t, b, multipart('image', PNG)); // 另一位使用者照常進辨識服務
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(calls.length, 2);
  release();
  assert.equal((await first).statusCode, 200);
  assert.equal((await other).statusCode, 200);
  assert.equal((await upload(t, a, multipart('image', PNG))).statusCode, 200);
});
