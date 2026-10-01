import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOW_CONFIDENCE, parseOcrLines, type OcrLine } from '../src/ocr/parse.js';

// 真實截圖的 OCR 輸出(PP-OCRv4,縮到長邊 1280 之後)存成 fixture,不需要模型與圖片就能回歸測試解析器。
// 非對話框範圍的雜訊行(Discord 聊天、角色名等)已換成「（雜訊）」。

interface Fixture {
  format: 'menu' | 'info';
  expected: string[];
  lines: OcrLine[];
}
const fixtures = JSON.parse(readFileSync(new URL('../../../test/fixtures/ocr-lines.json', import.meta.url), 'utf8')) as Record<string, Fixture>;

/** "22小時7分" → 分鐘 */
const toMinutes = (s: string) => {
  const m = /^(?:(\d+)天)?(?:(\d+)小時)?(?:(\d+)分)?$/.exec(s)!;
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
};

for (const [file, fx] of Object.entries(fixtures)) {
  test(`真實截圖 ${file}:格式、順序、時間與標準答案一致,且不標可疑`, () => {
    const r = parseOcrLines(fx.lines)!;
    assert.ok(r, '應該解析出結果');
    assert.equal(r.format, fx.format);
    assert.deepEqual(r.submarines.map((s) => s.remaining_minutes), fx.expected.map(toMinutes));
    assert.deepEqual(r.submarines.map((s) => s.position), fx.expected.map((_, i) => i + 1));
    assert.deepEqual(r.submarines.map((s) => s.name), fx.expected.map((_, i) => `潛水艇-${i + 1}`), '前綴字形誤認(潘/蜓)應校正成預設名稱');
    assert.ok(r.submarines.every((s) => s.status === 'exploring' && !s.suspect.name && !s.suspect.time && s.reasons.length === 0));
    assert.deepEqual(r.warnings, []);
  });
}

// ---- 合成案例 ----

let y = 0;
const L = (text: string, mean = 0.95): OcrLine => {
  y += 40;
  return { text, mean, box: [[0, y], [100, y], [100, y + 30], [0, y + 30]] };
};
const menu = (...rows: string[]) => [L('請選擇潛水艇。'), L('探索機體數:' + rows.length + '/4'), L('所持燃料數:桶裝青磷水 64桶'), ...rows.map((r) => L(r)), L('取消')];
const info = (...rows: string[]) => [L('飛空艇探索/潛水艇探索 剩餘時間'), L('飛空艇名'), L('潛水艇名'), ...rows.map((r) => L(r)), L('關閉')];
const row = (n: number, time: string) => `潛水艇-${n} [94級] [正在探索:剩餘時間 ${time}]`;

test('情報頁:飛空艇的列(標題之前)不算,只取「潛水艇名」之後', () => {
  const lines = [L('飛空艇探索/潛水艇探索 剩餘時間'), L('飛空艇名'), L('飛空艇-1 3小時5分鐘'), L('潛水艇名'), L('潛水艇-1 8小時48分鐘'), L('潛水艇-2 8小時47分鐘'), L('關閉')];
  const r = parseOcrLines(lines)!;
  assert.equal(r.format, 'info');
  assert.deepEqual(r.submarines.map((s) => s.remaining_minutes), [528, 527]);
});

test('情報頁:「潛水艇名」的「艇」被誤認成「蜓」仍認得標題與名稱', () => {
  const r = parseOcrLines([L('形空蜓探索/潘水蜓探索 剩余時間'), L('飛空疑名'), L('潘水蜓名'), L('潜水蜓-1 8小時48分鐘'), L('潘水蜓-2 8小時47分幢')])!;
  assert.equal(r.format, 'info');
  assert.deepEqual(r.submarines.map((s) => [s.name, s.remaining_minutes]), [['潛水艇-1', 528], ['潛水艇-2', 527]]);
});

test('「-N」與時間數字黏在一起(潛水艇-18小時48分鐘)只剝掉編號', () => {
  const r = parseOcrLines(info('潘水艇-18小時48分鐘'))!;
  assert.equal(r.submarines[0]!.remaining_minutes, 528);
  assert.equal(r.submarines[0]!.suspect.time, false);
});

test('數字之間夾空格(5 2分)合併成 52', () => {
  const r = parseOcrLines(menu(row(1, '8小時5 2分鐘')))!;
  assert.equal(r.submarines[0]!.remaining_minutes, 8 * 60 + 52);
});

test('簡體與全形字形(级/钟/时/馀、［］：)照樣解析', () => {
  const r = parseOcrLines(menu('潘水艇-1［94级］［正在探索：剩馀时间8小时51分钟］'))!;
  assert.equal(r.submarines[0]!.remaining_minutes, 8 * 60 + 51);
});

test('有「天」:1天3小時5分鐘', () => {
  const r = parseOcrLines(menu(row(1, '1天3小時5分鐘')))!;
  const s = r.submarines[0]!;
  assert.deepEqual([s.days, s.hours, s.minutes, s.remaining_minutes], [1, 3, 5, 1440 + 185]);
});

test('只有分鐘:沒出現的單位為 0', () => {
  const r = parseOcrLines(menu(row(1, '47分鐘')))!;
  const s = r.submarines[0]!;
  assert.deepEqual([s.days, s.hours, s.minutes, s.remaining_minutes], [0, 0, 47, 47]);
});

test('探索完成:狀態 complete、時間欄為 null、不標可疑', () => {
  const r = parseOcrLines(menu('潛水艇-1 [94級] [探索完成]', row(2, '1小時1分鐘')))!;
  const s = r.submarines[0]!;
  assert.deepEqual([s.status, s.days, s.hours, s.minutes, s.remaining_minutes], ['complete', null, null, null, null]);
  assert.equal(s.suspect.time, false);
  assert.equal(r.submarines[1]!.position, 2);
});

test('數字超出範圍(25小時70分)標時間可疑,仍回傳讀到的數字', () => {
  const r = parseOcrLines(menu(row(1, '25小時70分鐘')))!;
  const s = r.submarines[0]!;
  assert.deepEqual([s.hours, s.minutes], [25, 70]);
  assert.deepEqual([s.suspect.time, s.suspect.name], [true, false]);
  assert.deepEqual(s.reasons, ['time_out_of_range']);
});

test('有數字沒對到單位或單位重複:標時間可疑、不猜值', () => {
  const stray = parseOcrLines(menu(row(1, '8小時52')))!.submarines[0]!;
  assert.deepEqual([stray.remaining_minutes, stray.suspect.time, stray.reasons], [null, true, ['time_malformed']]);
  const dup = parseOcrLines(menu(row(1, '8小時5小時')))!.submarines[0]!;
  assert.equal(dup.suspect.time, true);
});

test('某一列的時間整個沒讀到(沒有任何單位):列數對不上,警告並把剩下的每一艘都標時間可疑', () => {
  const r = parseOcrLines(menu(row(1, '8:52'), row(2, '1小時1分鐘')))!;
  assert.deepEqual(r.warnings, ['row_count_mismatch']);
  assert.equal(r.submarines.length, 1);
  const s = r.submarines[0]!;
  assert.deepEqual([s.remaining_minutes, s.suspect.time, s.reasons], [61, true, ['order_uncertain']]);
});

test('畫面歪斜時一列被拆成「名稱」「時間」兩行:名稱那行不算一列,位置不錯位', () => {
  const lines = [L('飛空艇探索/潛水艇探索 剩餘時間'), L('飛空艇名'), L('潛水艇名'), L('潛水艇-1'), L('8小時48分鐘'), L('潛水艇-2'), L('8小時47分鐘'), L('關閉')];
  const r = parseOcrLines(lines)!;
  assert.deepEqual(r.submarines.map((s) => [s.position, s.remaining_minutes]), [[1, 528], [2, 527]]);
  assert.deepEqual(r.warnings, []);
});

test('總和為 0 標可疑', () => {
  assert.equal(parseOcrLines(menu(row(1, '0小時0分鐘')))!.submarines[0]!.suspect.time, true);
});

test(`信心低於 ${LOW_CONFIDENCE} 的行,名稱與時間都標可疑,數字照給`, () => {
  const lines = [L('請選擇潛水艇。'), L('探索機體數:1/4'), L(row(1, '8小時52分鐘'), LOW_CONFIDENCE - 0.01), L('取消')];
  const s = parseOcrLines(lines)!.submarines[0]!;
  assert.equal(s.remaining_minutes, 532);
  assert.deepEqual(s.suspect, { name: true, time: true });
  assert.deepEqual(s.reasons, ['low_confidence']);
  const ok = [L('請選擇潛水艇。'), L('探索機體數:1/4'), L(row(1, '8小時52分鐘'), LOW_CONFIDENCE), L('取消')];
  assert.deepEqual(parseOcrLines(ok)!.submarines[0]!.suspect, { name: false, time: false }, '剛好等於門檻不算低');
});

test('自訂潛艇名稱:選單與情報頁都取名稱原文,不是預設名稱就不校正', () => {
  const m = parseOcrLines(menu('我的艇 [94級] [正在探索:剩餘時間 8小時52分鐘]'))!.submarines[0]!;
  assert.deepEqual([m.name, m.remaining_minutes, m.suspect.name], ['我的艇', 532, false]);
  const i = parseOcrLines(info('我的艇 8小時48分鐘'))!.submarines[0]!;
  assert.deepEqual([i.name, i.remaining_minutes], ['我的艇', 528]);
});

test('情報頁讀不到名稱:時間也標可疑(編號數字可能混進時間)', () => {
  const s = parseOcrLines(info('18小時48分鐘'))!.submarines[0]!;
  assert.deepEqual([s.name, s.suspect.name, s.suspect.time], [null, true, true]);
});

test('對話框以外的雜訊(取消/關閉按鈕之後的聊天、技能列)不算潛艇列', () => {
  const m = parseOcrLines([...menu(row(1, '8小時52分鐘')), L('Discord 3小時前'), L('冷卻 50分')])!;
  assert.equal(m.submarines.length, 1);
  const i = parseOcrLines([...info('潛水艇-1 8小時48分鐘'), L('聊天 2小時前')])!;
  assert.equal(i.submarines.length, 1);
});

test('標題「探索機體數」與列數不符:警告但仍回傳', () => {
  const lines = [L('請選擇潛水艇。'), L('探索機體數:3/4'), L(row(1, '1小時1分鐘')), L(row(2, '2小時2分鐘')), L('取消')];
  assert.deepEqual(parseOcrLines(lines)!.warnings, ['row_count_mismatch']);
});

test('超過 4 列只取前 4 列並警告', () => {
  const rows = [1, 2, 3, 4, 5].map((n) => row(n, `${n}小時1分鐘`));
  const r = parseOcrLines(menu(...rows))!;
  assert.equal(r.submarines.length, 4);
  assert.ok(r.warnings.includes('too_many_rows'));
});

test('位置依畫面由上到下排序,不看輸入順序也不看名稱裡的數字', () => {
  const lines = menu(row(1, '1小時1分鐘'), row(2, '2小時2分鐘'), row(3, '3小時3分鐘'));
  const shuffled = [lines[5]!, lines[0]!, lines[3]!, lines[2]!, lines[4]!, lines[1]!, lines[6]!];
  const r = parseOcrLines(shuffled)!;
  assert.deepEqual(r.submarines.map((s) => s.remaining_minutes), [61, 122, 183]);
  // 名稱的編號跟位置無關:改過名/換位的名稱照順序給位置
  const swapped = parseOcrLines(menu(row(3, '1小時1分鐘'), row(1, '2小時2分鐘')))!;
  assert.deepEqual(swapped.submarines.map((s) => s.position), [1, 2]);
});

test('不是這兩種截圖(沒有標題、沒有潛艇列)回 null', () => {
  assert.equal(parseOcrLines([]), null);
  assert.equal(parseOcrLines([L('今天天氣很好'), L('聊天 3小時前')]), null);
  assert.equal(parseOcrLines(info()), null, '有標題沒有列');
  assert.equal(parseOcrLines([L('請選擇潛水艇。'), L('探索機體數:0/4'), L('取消')]), null);
});
