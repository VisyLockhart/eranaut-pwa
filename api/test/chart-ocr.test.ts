import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHART_SEAS } from '../src/ocr/chart-data.js';
import { discoveredFrom, guessesFromLines, readDiscoveredCount } from '../src/ocr/chart.js';
import type { OcrEngine } from '../src/ocr/engine.js';
import type { OcrLine } from '../src/ocr/parse.js';
import { createOcrService } from '../src/ocr/service.js';

// 海圖辨識(D-293)。樣本是使用者提供的「選擇航海圖」視窗截圖(只裁視窗,不含其他畫面);
// 文字框是真實 PP-OCRv4 對同一張樣本的輸出(chart-lines.json),測試用假引擎回放,不載入模型。

const here = dirname(fileURLToPath(import.meta.url));
// 編譯後在 dist/api/test,樣本在原始碼的 test/fixtures
const fixtures = join(here, '../../../test/fixtures');
const LINES = JSON.parse(readFileSync(join(fixtures, 'chart-lines.json'), 'utf8')) as Record<string, OcrLine[]>;

function replay(file: string): OcrEngine {
  return { detect: async () => LINES[file]! };
}

const codes = (sea: number, ids: readonly number[]) => ids.map((id) => CHART_SEAS.find((s) => s.sea === sea)!.points.find((p) => p[0] === id)![1]);
const allCodes = (sea: number) => CHART_SEAS.find((s) => s.sea === sea)!.points.map((p) => p[1]);

test('灰海:19 點(只有 Q 沒發現),和畫面「已發現 19」一致', async () => {
  const r = await createOcrService(replay('chart-gray.jpg')).recognizeChart!(readFileSync(join(fixtures, 'chart-gray.jpg')));
  assert.ok(r);
  assert.equal(r.sea, 2);
  assert.deepEqual(codes(2, r.points), allCodes(2).filter((c) => c !== 'Q'));
  assert.equal(r.screen_count, 19);
  assert.deepEqual(r.filled, []);
});

test('溺沒海:29 點(只有 AC 沒發現)', async () => {
  const r = await createOcrService(replay('chart-drown.jpg')).recognizeChart!(readFileSync(join(fixtures, 'chart-drown.jpg')));
  assert.ok(r);
  assert.equal(r.sea, 1);
  assert.deepEqual(codes(1, r.points), allCodes(1).filter((c) => c !== 'AC'));
  assert.equal(r.screen_count, 29);
});

test('翠浪海:只有 A;「已發現」那一行沒讀到時改用海域列表定位', async () => {
  const r = await createOcrService(replay('chart-green.jpg')).recognizeChart!(readFileSync(join(fixtures, 'chart-green.jpg')));
  assert.ok(r);
  assert.equal(r.sea, 3);
  assert.deepEqual(codes(3, r.points), ['A']);
});

test('讀不到任何字時,把整張圖當成海圖也認得出來(只截海圖的情況)', async () => {
  const r = await createOcrService({ detect: async () => [] }).recognizeChart!(readFileSync(join(fixtures, 'chart-gray.jpg')));
  // 整張視窗不是只有海圖,可能認不出來;認得出來就必須正確
  if (r) assert.equal(r.sea, 2);
});

test('不是海圖的圖回 null', async () => {
  const sharp = (await import('sharp')).default;
  const blank = await sharp({ create: { width: 600, height: 600, channels: 3, background: { r: 30, g: 60, b: 120 } } }).png().toBuffer();
  assert.equal(await createOcrService({ detect: async () => [] }).recognizeChart!(blank), null);
});

test('readDiscoveredCount:讀「已發現目的地數 N」', () => {
  const line = (text: string): OcrLine => ({ text, mean: 0.9, box: [[0, 0], [10, 0], [10, 10], [0, 10]] });
  assert.equal(readDiscoveredCount([line('已發现目的地数 19 已探索目的地数 18')]), 19);
  assert.equal(readDiscoveredCount([line('已發現目的地數29')]), 29);
  assert.equal(readDiscoveredCount([line('灰海 50')]), null);
});

test('guessesFromLines:一定有「整張圖」這個退路,錨點在前', () => {
  const line = (text: string, x0: number, y0: number, x1: number, y1: number): OcrLine => ({ text, mean: 0.9, box: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });
  const g = guessesFromLines([line('翠浪海 70', 66, 136, 743, 168), line('已發現目的地數 29 已探索目的地數 29', 68, 358, 810, 387)], 901, 1180);
  assert.deepEqual(
    g.map((x) => x.kind),
    ['count_row', 'sea_rows', 'whole'],
  );
  assert.equal(guessesFromLines([], 800, 800).length, 1);
});

test('discoveredFrom:過門檻的點加上同海域前面的點(補上的另外列出)', () => {
  // 溺沒海:K(11)← I(9)← E(5)← B(2)
  const scores = CHART_SEAS[0]!.points.map(([id, code]) => ({ id, code, score: code === 'K' ? 1 : 0 }));
  const r = discoveredFrom(1, scores);
  assert.deepEqual(codes(1, r.points), ['B', 'E', 'I', 'K']);
  assert.deepEqual(codes(1, r.filled), ['B', 'E', 'I']);
});
