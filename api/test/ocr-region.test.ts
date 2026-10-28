import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findDialogRegion } from '../src/ocr/region.js';
import { parseOcrLines, type OcrLine } from '../src/ocr/parse.js';

// 第二階段裁切(D-226)的範圍推算。fixture 來自 4 張真實截圖(全螢幕 3427×1335 與三種視窗縮放 + 遊戲內「縮放視窗」選單),
// 聊天框、任務列等雜訊行的文字已換成「（雜訊）」、只留座標(不含個資);stage1 = 縮圖後整張的偵測結果,stage2 = 裁切後的偵測結果。
interface Stage {
  width: number;
  height: number;
  lines: OcrLine[];
}
interface Sample {
  stage1: Stage;
  stage2: Stage;
}
const fixtures = JSON.parse(readFileSync(new URL('../../../test/fixtures/ocr-region.json', import.meta.url), 'utf8')) as Record<string, Sample>;

const box = (l: OcrLine) => {
  const xs = l.box!.map((p) => p[0]!);
  const ys = l.box!.map((p) => p[1]!);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
};

for (const [name, s] of Object.entries(fixtures)) {
  test(`${name}:範圍涵蓋標題到「取消」、不含視窗左邊的聊天框`, () => {
    const r = findDialogRegion(s.stage1.lines, s.stage1.width, s.stage1.height);
    assert.ok(r, '應找得到視窗');
    const rowLines = s.stage1.lines.filter((l) => /正在探|剩[餘余除]/.test(l.text) && /[水艇蜓]/.test(l.text));
    assert.ok(rowLines.length >= 3);
    for (const l of rowLines) {
      const b = box(l);
      assert.ok(b.top >= r.top && b.bottom <= r.bottom, `列在上下範圍內:${l.text}`);
      // 被併進聊天框的列,框的左緣會跑到最左邊,不檢查左緣
      if (b.right - b.left <= 25 * r.lineHeight) assert.ok(b.left >= r.left, `列在左緣內:${l.text}`);
    }
    const title = s.stage1.lines.find((l) => /請選|精坏/.test(l.text))!;
    assert.ok(box(title).top >= r.top, '標題在範圍內');
    const cancel = s.stage1.lines.find((l) => l.text.includes('取消'))!;
    assert.ok(box(cancel).bottom <= r.bottom + 2, '取消在範圍內');
    // 範圍不能大過視窗太多:寬度不超過列寬的 1.1 倍、左邊不超過列左緣 2 倍框高
    assert.ok(r.right - r.left < 28 * r.lineHeight);
    const unmerged = rowLines.filter((l) => box(l).right - box(l).left <= 25 * r.lineHeight);
    assert.ok(r.left >= box(unmerged[0] ?? rowLines[0]!).left - 2 * r.lineHeight);
  });

  test(`${name}:裁切後的行解析成 4 艘、全部不可疑`, () => {
    const result = parseOcrLines(s.stage2.lines);
    assert.ok(result);
    assert.equal(result.submarines.length, 4);
    assert.ok(result.submarines.every((x) => !x.suspect.name && !x.suspect.time && x.remaining_minutes !== null));
    assert.deepEqual(result.warnings, []);
  });
}

test('全螢幕大圖不裁切時,聊天框併進第 4 列造成名稱錯誤並全部標可疑(這是需要第二階段的原因)', () => {
  const s = fixtures['fullscreen_3427x1335']!;
  const result = parseOcrLines(s.stage1.lines)!;
  assert.ok(result.submarines.some((x) => x.suspect.name || x.suspect.time));
});

test('沒有潛艇列、空輸入、沒有座標都回 null', () => {
  assert.equal(findDialogRegion([], 1000, 800), null);
  assert.equal(findDialogRegion([{ text: '一般的文字 12:30', mean: 0.9, box: [[0, 0], [100, 0], [100, 20], [0, 20]] }], 1000, 800), null);
  assert.equal(findDialogRegion([{ text: '潛水艇-1 [94級] [正在探索:剩餘時間 8小時52分鐘]', mean: 0.9 }], 1000, 800), null);
});

test('只有一列也能推算(下緣由列距外推)', () => {
  const lines: OcrLine[] = [
    { text: '請選擇潛水艇。', mean: 0.9, box: [[100, 100], [250, 100], [250, 128], [100, 128]] },
    { text: '潛水艇-1 [94級] [正在探索:剩餘時間 8小時52分鐘]', mean: 0.9, box: [[110, 250], [640, 250], [640, 278], [110, 278]] },
  ];
  const r = findDialogRegion(lines, 1280, 720)!;
  assert.ok(r);
  assert.ok(r.top < 100 + 28 && r.bottom > 278 && r.left < 110 && r.right >= 640);
});
