import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { cropRegion, ocrThreads, parseCpuMax, prepareImage, type OcrEngine, type RawImage } from '../src/ocr/engine.js';
import { createOcrService, pickBetter } from '../src/ocr/service.js';
import { addRowSiblings, boxesInRegion, pickRowCandidates } from '../src/ocr/region.js';
import type { OcrLine } from '../src/ocr/parse.js';
import type { OcrResultDto } from '@eranaut/shared';

// 兩階段辨識的流程(D-226):假引擎依輸入尺寸回傳第一階段或第二階段的行,不載入真實模型。
interface Sample {
  stage1: { width: number; height: number; sourceWidth: number; sourceHeight: number; lines: OcrLine[] };
  stage2: { width: number; height: number; lines: OcrLine[] };
}
const sample = (JSON.parse(readFileSync(new URL('../../../test/fixtures/ocr-region.json', import.meta.url), 'utf8')) as Record<string, Sample>)['fullscreen_3427x1335']!;

const solidPng = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: '#2040a0' } }).png().toBuffer();

/** 第一階段(縮圖後寬 1280)回 stage1 的行,其餘尺寸(裁切後)回 stage2 的行,並記錄每次呼叫 */
function fakeEngine(calls: RawImage[], opts: { stage2Throws?: boolean; stage2Lines?: OcrLine[] } = {}): OcrEngine {
  return {
    async detect(image) {
      calls.push(image);
      if (image.width === sample.stage1.width) return sample.stage1.lines;
      if (opts.stage2Throws) throw new Error('boom');
      return opts.stage2Lines ?? sample.stage2.lines;
    },
  };
}

test('全螢幕大圖:第一階段結果可疑 → 裁切後第二階段重辨,採用乾淨的結果', async () => {
  const calls: RawImage[] = [];
  const service = createOcrService(fakeEngine(calls));
  const result = await service.recognize(await solidPng(sample.stage1.sourceWidth, sample.stage1.sourceHeight));
  assert.equal(calls.length, 2);
  assert.ok(calls[1]!.width < calls[0]!.width, '第二階段是裁出來的小圖');
  assert.ok(result);
  assert.deepEqual(result.submarines.map((s) => s.remaining_minutes), [1331, 1331, 1331, 1338]);
  assert.ok(result.submarines.every((s) => !s.suspect.name && !s.suspect.time));
});

test('第二階段失敗(丟錯)→ 退回第一階段的結果,不讓整個請求失敗', async () => {
  const calls: RawImage[] = [];
  const service = createOcrService(fakeEngine(calls, { stage2Throws: true }));
  const result = await service.recognize(await solidPng(sample.stage1.sourceWidth, sample.stage1.sourceHeight));
  assert.equal(calls.length, 2);
  assert.ok(result);
  assert.equal(result.submarines.length, 4);
});

test('第二階段讀不到潛艇列 → 退回第一階段', async () => {
  const calls: RawImage[] = [];
  const service = createOcrService(fakeEngine(calls, { stage2Lines: [{ text: '（雜訊）', mean: 0.9, box: [[0, 0], [10, 0], [10, 10], [0, 10]] }] }));
  const result = await service.recognize(await solidPng(sample.stage1.sourceWidth, sample.stage1.sourceHeight));
  assert.ok(result);
  assert.equal(result.submarines.length, 4);
});

test('原圖沒被縮過、第一階段已乾淨 → 只辨識一次', async () => {
  let count = 0;
  const lines: OcrLine[] = [
    { text: '請選擇潛水艇。', mean: 0.95, box: [[40, 20], [200, 20], [200, 48], [40, 48]] },
    { text: '探索機體數:1/1', mean: 0.95, box: [[60, 60], [240, 60], [240, 88], [60, 88]] },
    { text: '潛水艇-1 [94級] [正在探索:剩餘時間 8小時52分鐘]', mean: 0.95, box: [[50, 130], [600, 130], [600, 158], [50, 158]] },
    { text: '取消', mean: 0.99, box: [[50, 170], [100, 170], [100, 198], [50, 198]] },
  ];
  const service = createOcrService({ async detect() { count++; return lines; } });
  const result = await service.recognize(await solidPng(800, 400));
  assert.equal(count, 1);
  assert.equal(result?.submarines[0]?.remaining_minutes, 532);
});

test('第一階段讀不到視窗 → 不做第二階段', async () => {
  let count = 0;
  const service = createOcrService({ async detect() { count++; return [{ text: '一般文字', mean: 0.9, box: [[0, 0], [10, 0], [10, 10], [0, 10]] }]; } });
  const result = await service.recognize(await solidPng(2000, 1000));
  assert.equal(count, 1);
  assert.equal(result, null);
});

const sub = (suspect: boolean): OcrResultDto['submarines'][number] => ({
  position: 1, name: '潛水艇-1', status: 'exploring', days: 0, hours: 1, minutes: 0, remaining_minutes: 60, level: null,
  suspect: { name: false, time: suspect }, reasons: [],
});
const result = (n: number, suspects: number, warnings: OcrResultDto['warnings'] = []): OcrResultDto => ({
  format: 'menu', submarines: Array.from({ length: n }, (_, i) => sub(i < suspects)), warnings,
});

test('pickBetter:可疑少的勝;同分取列數多;再同分取第二階段;任一邊為 null 取另一邊', () => {
  const a = result(4, 2);
  const b = result(4, 0);
  assert.equal(pickBetter(a, b), b);
  assert.equal(pickBetter(b, a), b);
  const c = result(4, 0);
  assert.equal(pickBetter(b, c), c, '同分同列數 → 第二階段');
  const d = result(3, 0);
  assert.equal(pickBetter(b, d), b, '同分 → 列數多者');
  assert.equal(pickBetter(a, result(4, 0, ['row_count_mismatch'])), a, '警告算 3 分');
  assert.equal(pickBetter(a, null), a);
  assert.equal(pickBetter(null, b), b);
  assert.equal(pickBetter(null, null), null);
});

test('prepareImage 帶回轉正後的原圖尺寸(EXIF 方向 6 寬高對調)', async () => {
  const buf = await sharp({ create: { width: 400, height: 200, channels: 3, background: '#000' } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const img = await prepareImage(buf);
  assert.deepEqual([img.sourceWidth, img.sourceHeight, img.width, img.height], [200, 400, 200, 400]);
});

test('cropRegion:回原圖裁出範圍並依框高放大;座標由縮圖座標換回原圖', async () => {
  // 3000×1500,左上 (900,300) 起 600×300 是紅色;縮圖後寬 1280,倍率 k = 3000/1280
  const k = 3000 / 1280;
  const buf = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#0000ff' } })
    .composite([{ input: await sharp({ create: { width: 600, height: 300, channels: 3, background: '#ff0000' } }).png().toBuffer(), left: 900, top: 300 }])
    .png().toBuffer();
  const prepared = await prepareImage(buf);
  const region = { left: 900 / k, top: 300 / k, right: 1500 / k, bottom: 600 / k, lineHeight: 16 / k };
  const crop = await cropRegion(buf, region, prepared);
  assert.ok(crop);
  // 框高在原圖是 16 px → 放大到目標 32 px 高,倍率 2(上限),寬 600 → 1200
  assert.deepEqual([crop.width, crop.height], [1200, 600]);
  const px = (x: number, y: number) => [...crop.data.subarray((y * crop.width + x) * 4, (y * crop.width + x) * 4 + 3)];
  assert.deepEqual(px(5, 5), [255, 0, 0]);
  assert.deepEqual(px(crop.width - 5, crop.height - 5), [255, 0, 0]);
});

test('cropRegion:範圍太小或缺原圖尺寸 → null;超出邊界會被截在圖內', async () => {
  const buf = await solidPng(2000, 1000);
  const prepared = await prepareImage(buf);
  assert.equal(await cropRegion(buf, { left: 10, top: 10, right: 12, bottom: 12, lineHeight: 10 }, prepared), null);
  assert.equal(await cropRegion(buf, { left: 0, top: 0, right: 500, bottom: 300, lineHeight: 20 }, { ...prepared, sourceWidth: undefined }), null);
  const crop = await cropRegion(buf, { left: 1000, top: 500, right: 5000, bottom: 5000, lineHeight: 20 }, prepared);
  assert.ok(crop && crop.width > 0 && crop.height > 0);
});

test('cropRegion:EXIF 方向 6 的照片,範圍座標是轉正後的座標', async () => {
  // 儲存 400×200、方向 6 → 轉正後 200×400;左半(轉正後座標 y < 200)的像素原本在檔案的哪一側不重要,
  // 這裡檢查:轉正後上半部畫紅、下半部畫藍,裁上半部要得到紅色
  const upright = await sharp({ create: { width: 200, height: 400, channels: 3, background: '#0000ff' } })
    .composite([{ input: await sharp({ create: { width: 200, height: 200, channels: 3, background: '#ff0000' } }).png().toBuffer(), left: 0, top: 0 }])
    .png().toBuffer();
  // 把它逆時針轉 90 度存成「橫向 400×200 + 方向 6」,讀出來轉正後就是 upright
  const stored = await sharp(upright).rotate(-90).withMetadata({ orientation: 6 }).jpeg({ quality: 100 }).toBuffer();
  const prepared = await prepareImage(stored);
  assert.deepEqual([prepared.width, prepared.height], [200, 400]);
  const crop = await cropRegion(stored, { left: 20, top: 20, right: 180, bottom: 180, lineHeight: 32 }, prepared);
  assert.ok(crop);
  const mid = (crop.height >> 1) * crop.width * 4 + (crop.width >> 1) * 4;
  assert.ok(crop.data[mid]! > 200 && crop.data[mid + 2]! < 60, '應為紅色');
});

// ── 兩段式快速路徑(D-227):先偵測框、只辨識像潛艇列的框 ──
const rect = (x: number, y: number, w: number, h: number): number[][] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

function fakeLocateEngine(log: { recognized: number[][]; detects: number }, opts: { locateThrows?: boolean; filler?: number } = {}): OcrEngine {
  // 補一些雜訊小框,讓框數達到兩段式的啟用門檻
  const filler = Array.from({ length: opts.filler ?? 20 }, (_, i): OcrLine => ({ text: '（雜訊）', mean: 0.9, box: rect(5, 5 + i * 12, 30, 10) }));
  const lines = [...sample.stage1.lines, ...filler];
  return {
    async detect(image) {
      log.detects++;
      return image.width === sample.stage1.width ? lines : sample.stage2.lines;
    },
    async locate() {
      if (opts.locateThrows) throw new Error('boom');
      return {
        boxes: lines.map((l) => l.box),
        recognize: async (indices) => {
          log.recognized.push(indices);
          return indices.map((i) => lines[i]!);
        },
      };
    },
  };
}

test('兩段式:大圖只辨識候選框,視窗裁切重辨一次,不辨識全部框', async () => {
  const log = { recognized: [] as number[][], detects: 0 };
  const svc = createOcrService(fakeLocateEngine(log));
  const png = await sharp({ create: { width: sample.stage1.sourceWidth, height: sample.stage1.sourceHeight, channels: 3, background: '#2040a0' } }).png().toBuffer();
  const r = await svc.recognize(png);
  assert.equal(r?.submarines.length, 4);
  assert.equal(log.recognized.length, 1, '只做了一次(部分)辨識');
  assert.ok(log.recognized[0]!.length < sample.stage1.lines.length / 2, '候選框遠少於全部框');
  assert.ok(log.recognized[0]!.every((i) => i < sample.stage1.lines.length), '雜訊小框沒有被辨識');
  assert.equal(log.detects, 1, '只有裁切後的圖走完整 detect');
});

test('兩段式:locate 丟錯誤時退回整張辨識', async () => {
  const log = { recognized: [] as number[][], detects: 0 };
  const svc = createOcrService(fakeLocateEngine(log, { locateThrows: true }));
  const png = await sharp({ create: { width: sample.stage1.sourceWidth, height: sample.stage1.sourceHeight, channels: 3, background: '#2040a0' } }).png().toBuffer();
  const r = await svc.recognize(png);
  assert.equal(r?.submarines.length, 4);
  assert.equal(log.recognized.length, 0);
  assert.ok(log.detects >= 1);
});

test('pickRowCandidates:只挑寬高比大的框,由大到小,且有數量上限', () => {
  const boxes = [rect(0, 0, 40, 20), rect(0, 30, 400, 20), rect(0, 60, 250, 20), rect(0, 90, 600, 20), undefined];
  assert.deepEqual(pickRowCandidates(boxes), [3, 1, 2]);
  assert.deepEqual(pickRowCandidates(boxes, 2), [3, 1]);
  assert.deepEqual(pickRowCandidates([rect(0, 0, 10, 0)]), []);
});

test('addRowSiblings:納入同一列、高度相近、距離近的框;排除遠處與不同列的框', () => {
  const boxes = [
    rect(300, 100, 250, 20), // 0 候選(列右半)
    rect(100, 101, 180, 20), // 1 同列左半,間距 20 → 納入
    rect(5, 100, 60, 20), // 2 同列但太遠(聊天框)→ 排除
    rect(300, 140, 250, 20), // 3 不同列 → 排除
    rect(100, 100, 150, 60), // 4 高度差太多 → 排除
  ];
  assert.deepEqual(addRowSiblings(boxes, [0]).sort(), [0, 1]);
});

test('boxesInRegion:取中心落在範圍內的框', () => {
  const region = { left: 100, top: 100, right: 400, bottom: 300, lineHeight: 20 };
  const boxes = [rect(150, 150, 100, 20), rect(10, 150, 50, 20), rect(150, 400, 100, 20), rect(395, 290, 30, 20)];
  assert.deepEqual(boxesInRegion(boxes, region), [0, 3]);
});

test('兩段式:框數少的圖直接全部辨識(不挑候選)', async () => {
  const log = { recognized: [] as number[][], detects: 0 };
  const svc = createOcrService(fakeLocateEngine(log, { filler: 0 }));
  const png = await sharp({ create: { width: sample.stage1.sourceWidth, height: sample.stage1.sourceHeight, channels: 3, background: '#2040a0' } }).png().toBuffer();
  await svc.recognize(png);
  assert.equal(log.recognized[0]!.length, sample.stage1.lines.length, '第一次呼叫就是全部框');
});

test('parseCpuMax:cgroup v2 的 cpu.max', () => {
  assert.equal(parseCpuMax('200000 100000\n'), 2);
  assert.equal(parseCpuMax('50000 100000'), 0.5);
  assert.equal(parseCpuMax('max 100000'), null);
  assert.equal(parseCpuMax(''), null);
});

test('ocrThreads:環境變數優先,其次 cgroup 配額,限制在 1~8', () => {
  assert.equal(ocrThreads({ OCR_THREADS: '3' }, () => '200000 100000'), 3);
  assert.equal(ocrThreads({}, () => '200000 100000'), 2);
  assert.equal(ocrThreads({}, () => '50000 100000'), 1, '不足 1 顆仍取 1');
  assert.equal(ocrThreads({ OCR_THREADS: '64' }, () => null), 8, '上限 8');
  assert.equal(ocrThreads({ OCR_THREADS: 'abc' }, () => '400000 100000'), 4, '無效的環境變數忽略');
  const auto = ocrThreads({}, () => null);
  assert.ok(auto >= 1 && auto <= 8);
});
