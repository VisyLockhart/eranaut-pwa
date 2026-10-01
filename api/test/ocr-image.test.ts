import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { MAX_EDGE, prepareImage, UnsupportedImageError } from '../src/ocr/engine.js';

const solid = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#2040a0' } });

test('大圖縮到長邊 1280、保持比例,輸出 RGBA 原始像素', async () => {
  const img = await prepareImage(await solid(2880, 2160).png().toBuffer());
  assert.deepEqual([img.width, img.height], [MAX_EDGE, 960]);
  assert.equal(img.data.length, img.width * img.height * 4);
});

test('直式大圖以高度為長邊', async () => {
  const img = await prepareImage(await solid(2160, 2880).jpeg().toBuffer());
  assert.deepEqual([img.width, img.height], [960, MAX_EDGE]);
});

test('小圖不放大', async () => {
  const img = await prepareImage(await solid(777, 421).png().toBuffer());
  assert.deepEqual([img.width, img.height], [777, 421]);
});

test('依 EXIF 方向轉正(手機直拍橫存的照片)', async () => {
  // 橫向 400x200、EXIF orientation = 6(順時針轉 90 度顯示)→ 轉正後 200x400
  const buf = await solid(400, 200).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const img = await prepareImage(buf);
  assert.deepEqual([img.width, img.height], [200, 400]);
});

test('支援 png / jpeg / webp', async () => {
  for (const make of [() => solid(50, 50).png(), () => solid(50, 50).jpeg(), () => solid(50, 50).webp()]) {
    assert.equal((await prepareImage(await make().toBuffer())).width, 50);
  }
});

test('不是圖片、其他圖片格式(gif)、壞掉的檔案都丟 UnsupportedImageError', async () => {
  await assert.rejects(prepareImage(Buffer.from('hello world')), UnsupportedImageError);
  await assert.rejects(prepareImage(Buffer.alloc(0)), UnsupportedImageError);
  await assert.rejects(prepareImage(await solid(20, 20).gif().toBuffer()), UnsupportedImageError);
  const png = await solid(300, 300).png().toBuffer();
  await assert.rejects(prepareImage(png.subarray(0, 40)), UnsupportedImageError);
});
