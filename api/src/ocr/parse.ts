import { LIMITS, type OcrFormat, type OcrResultDto, type OcrSubmarineDto, type OcrSuspectReason, type OcrWarning } from '@eranaut/shared';

// OCR 文字行 → 潛艇資料的解析器(純函式,不碰影像與模型,D-49)。
// 兩種截圖格式(D-61、D-62):
//   menu:「請選擇潛水艇」選單視窗,每列「潛水艇-1 [94級] [正在探索:剩餘時間 8小時52分鐘]」
//   info:「飛空艇探索/潛水艇探索」情報頁,「潛水艇名」標題之後每列「潛水艇-1   8小時48分鐘」,標題之前是飛空艇,要略過
// PP-OCRv4 的已知誤認(STATUS §4):艇名前綴字形(潛→潘/潜/蜓…)、數字之間夾空格(「5 2分」)、
// 「-N」與時間數字黏在一起、簡體字形(级/钟/时/馀)。所以:位置看順序不看名稱、時間用「數字+單位」抽取、
// 名稱前綴校正成預設名稱。無法確定的欄位標為可疑(D-119),不猜。

export interface OcrLine {
  text: string;
  /** 該行的辨識信心 0~1 */
  mean: number;
  /** 四個角 [x, y];用來由上到下排序 */
  box?: number[][];
}

/**
 * 低於此信心的行,名稱與時間都標為可疑(D-119)。
 * 暫定值,由 11 張真實截圖與合成劣化圖校正(見 DECISIONS D-158);真實截圖 29 艘的信心最低 0.869、中位數 0.93;77 張劣化圖的 203 艘全部讀對、無漏標。
 */
export const LOW_CONFIDENCE = 0.85;

const FULLWIDTH = /[！-～]/g;
const SIMPLIFIED: Record<string, string> = { 级: '級', 钟: '鐘', 时: '時', 馀: '餘', 余: '餘', 间: '間' };

function normalize(raw: string): string {
  return raw
    .replace(FULLWIDTH, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .replace(/[级钟时馀余间]/g, (c) => SIMPLIFIED[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

interface Prepared {
  text: string;
  mean: number;
}

function sortTopToBottom(lines: OcrLine[]): Prepared[] {
  return lines
    .map((l, i) => ({ l, i, y: l.box?.[0]?.[1] ?? Number.NaN, x: l.box?.[0]?.[0] ?? 0 }))
    .sort((a, b) => {
      if (!Number.isNaN(a.y) && !Number.isNaN(b.y) && Math.abs(a.y - b.y) > 8) return a.y - b.y;
      return a.i - b.i;
    })
    .map(({ l }) => ({ text: normalize(l.text), mean: l.mean }))
    .filter((l) => l.text.length > 0);
}

// 情報頁:「潛水艇名」標題。「艇」「潛」常被誤認(蜓、潘…),所以只認「水」開頭附近 + 「名」結尾、很短的行;
// 飛空艇的標題「飛空艇名」沒有「水」,不會被當成潛水艇標題
function findSubmarineHeader(lines: Prepared[]): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    const t = lines[i]!.text.replace(/ /g, '');
    if (t.length <= 6 && t.includes('水') && t.endsWith('名')) return i;
  }
  return -1;
}

const MENU_HINT = /探索機|所持燃料|請選|剩[餘余]|正在探索|探索完成/;
// 不是潛艇列的行(選單視窗的標題、取消、情報頁的關閉等)
const NON_ROW = /請選|探索機|所持燃料|^取消$|^關閉$|^close$/i;
// 潛艇列的標誌:有「完成」,或有「數字+天/小/分」——列一定要有時間才算。
// 不能用「有名稱」或「有等級」當標誌:畫面稍微歪斜時,OCR 會把一列拆成「名稱」和「時間」兩行,
// 名稱那行若也算一列,後面的潛艇會全部錯位(實測旋轉 3~4 度的圖)。少讀到的列改由 countMismatch 偵測。
const ROW_MARK = /完成|\d\s*[天小分]/;

function isRow(text: string): boolean {
  return !NON_ROW.test(text.replace(/ /g, '')) && ROW_MARK.test(text);
}

/**
 * 標題行(不含)之後、「取消/關閉」按鈕之前的潛艇列。手機翻拍的照片會把 Discord 聊天、技能列等雜訊一起讀進來,
 * 所以只看對話框範圍內的行(由上到下排序後,按鈕行就是對話框的底)。
 */
function rowsBetween(lines: Prepared[], start: number): { rows: Prepared[]; nameLines: number } {
  const rows: Prepared[] = [];
  let nameLines = 0;
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i]!.text.replace(/ /g, '');
    if (/^(取消|關閉)$/.test(t)) break;
    if (isRow(lines[i]!.text)) rows.push(lines[i]!);
    // 帶預設名稱「潛水艇-N」的行數;比有時間的列多,代表有列的時間整個沒讀到(列少了,後面的位置會錯位)
    if (DEFAULT_NAME.test(t)) nameLines++;
  }
  return { rows, nameLines };
}

// 預設名稱「潛水艇-N」:「潛」「艇」常被誤認(潘、蜓…),所以只認「水」加一個非數字字;前面至多一個字。
// 預設名稱的編號只有 1~4,所以只吃一位數字——「潛水艇-1」與時間數字黏在一起("潛水艇-18小時")時才不會被吃掉
const DEFAULT_NAME = /^.?水[^\d\s]\s*[-－—–]?\s*(\d)\s*/;

interface RowParse {
  name: string | null;
  status: OcrSubmarineDto['status'];
  days: number | null;
  hours: number | null;
  minutes: number | null;
  remaining: number | null;
  reasons: OcrSuspectReason[];
}

function parseTime(rest: string): { d: number; h: number; m: number } | { error: 'unreadable' | 'malformed' } {
  const compact = rest.replace(/[\s\[\]()]/g, '');
  const seen: Record<string, number> = {};
  let dup = false;
  for (const m of compact.matchAll(/(\d{1,3})(天|小|分)/g)) {
    const unit = m[2]!;
    if (unit in seen) dup = true;
    seen[unit] = Number(m[1]);
  }
  if (Object.keys(seen).length === 0) return { error: 'unreadable' };
  // 單位後面最多跟一個尾字(時/鐘);去掉已對到的「數字+單位+尾字」後還剩數字,代表有數字沒對到單位
  const leftover = compact.replace(/(\d{1,3})(?:天|小[^\d]?|分[^\d]?)/g, '');
  if (dup || /\d/.test(leftover)) return { error: 'malformed' };
  return { d: seen['天'] ?? 0, h: seen['小'] ?? 0, m: seen['分'] ?? 0 };
}

function parseRow(text: string, mean: number, format: OcrFormat): RowParse {
  const reasons: OcrSuspectReason[] = [];
  const complete = /完成/.test(text);

  // --- 名稱與「時間所在的剩餘字串」 ---
  let name: string | null = null;
  let rest = text;
  const def = DEFAULT_NAME.exec(text);
  if (def) {
    name = `潛水艇-${def[1]}`;
    rest = text.slice(def[0].length);
  } else if (format === 'menu') {
    // 自訂名稱:取等級括號 / 「數字+級」之前
    const cut = text.search(/[\[(]\s*\d+\s*級|\d+\s*級|[\[(]/);
    if (cut > 0) {
      name = text.slice(0, cut).trim() || null;
      rest = text.slice(cut);
    }
  } else {
    // 情報頁自訂名稱:名稱在左、時間在右;時間 = 第一個「(前面不是數字或連字號)數字+單位」起的尾巴
    const m = /(?<![\d-])\d{1,3}\s*[天小分]/.exec(text);
    if (m && m.index > 0) {
      name = text.slice(0, m.index).trim() || null;
      rest = text.slice(m.index);
    }
  }
  if (name === null) reasons.push('name_unreadable');

  if (format === 'menu') {
    // 時間在「剩餘時間」之後;沒讀到就退而取最後一個冒號之後、再退而用整段(去掉等級的「數字+級」)
    const m = /剩[餘余]?時?間/.exec(rest);
    if (m) rest = rest.slice(m.index + m[0].length);
    else if (rest.includes(':')) rest = rest.slice(rest.lastIndexOf(':') + 1);
    else rest = rest.replace(/\d+\s*級/g, '');
  }

  if (complete) {
    if (mean < LOW_CONFIDENCE) reasons.push('low_confidence');
    return { name, status: 'complete', days: null, hours: null, minutes: null, remaining: null, reasons };
  }

  const t = parseTime(rest);
  if ('error' in t) {
    reasons.push(t.error === 'unreadable' ? 'time_unreadable' : 'time_malformed');
    if (mean < LOW_CONFIDENCE) reasons.push('low_confidence');
    return { name, status: 'exploring', days: null, hours: null, minutes: null, remaining: null, reasons };
  }
  const remaining = t.d * 1440 + t.h * 60 + t.m;
  if (t.h > 23 || t.m > 59 || t.d > 99 || remaining <= 0 || remaining > LIMITS.maxRemainingMinutes) reasons.push('time_out_of_range');
  if (mean < LOW_CONFIDENCE) reasons.push('low_confidence');
  return { name, status: 'exploring', days: t.d, hours: t.h, minutes: t.m, remaining, reasons };
}

/**
 * 把 OCR 文字行解析成潛艇列表。找不到任何潛艇列時回 null(呼叫端回 422 `unrecognized`)。
 * 位置依畫面由上到下的順序(D-62),最多取 4 列。
 */
export function parseOcrLines(rawLines: OcrLine[]): OcrResultDto | null {
  const lines = sortTopToBottom(rawLines);
  const warnings: OcrWarning[] = [];

  let format: OcrFormat;
  let candidates: Prepared[];
  let nameLines: number;
  const header = findSubmarineHeader(lines);
  if (header >= 0) {
    format = 'info';
    ({ rows: candidates, nameLines } = rowsBetween(lines, header));
  } else {
    // 選單視窗:標題區的最後一行(探索機體數 / 所持燃料數)之後、「取消」之前
    let start = -1;
    lines.forEach((l, i) => {
      if (/探索機|所持燃料/.test(l.text.replace(/ /g, ''))) start = i;
    });
    if (start < 0 && !lines.some((l) => MENU_HINT.test(l.text.replace(/ /g, '')))) return null;
    format = 'menu';
    ({ rows: candidates, nameLines } = rowsBetween(lines, start));
  }
  if (candidates.length === 0) return null;

  let countMismatch = false;
  // 選單視窗標題「探索機體數:N/M」:N 應等於潛艇列數(1/4 → 1 艘,4/4 → 4 艘)
  if (format === 'menu') {
    const countLine = lines.find((l) => /探索機/.test(l.text.replace(/ /g, '')));
    const m = countLine ? /(\d)\s*\/\s*\d/.exec(countLine.text) : null;
    if (m && Number(m[1]) !== Math.min(candidates.length, LIMITS.maxSubmarinesPerWorkshop)) countMismatch = true;
  }
  if (nameLines > candidates.length) countMismatch = true;
  if (countMismatch) warnings.push('row_count_mismatch');
  if (candidates.length > LIMITS.maxSubmarinesPerWorkshop) {
    warnings.push('too_many_rows');
    candidates = candidates.slice(0, LIMITS.maxSubmarinesPerWorkshop);
  }

  const submarines = candidates.map((c, i): OcrSubmarineDto => {
    const r = parseRow(c.text, c.mean, format);
    // 列數對不上時,不知道少的是哪一列,每一艘的位置都不可信 → 時間一律請使用者核對
    if (countMismatch) r.reasons.push('order_uncertain');
    const low = r.reasons.includes('low_confidence');
    return {
      position: i + 1,
      name: r.name,
      status: r.status,
      days: r.days,
      hours: r.hours,
      minutes: r.minutes,
      remaining_minutes: r.remaining,
      suspect: {
        name: low || r.reasons.includes('name_unreadable'),
        // 情報頁讀不到名稱時,名稱裡的編號數字可能被當成時間的一部分(「-1 8小時」→ 18),所以時間也要核對
        time:
          low ||
          r.reasons.some((x) => x === 'time_unreadable' || x === 'time_out_of_range' || x === 'time_malformed' || x === 'order_uncertain') ||
          (format === 'info' && r.reasons.includes('name_unreadable')),
      },
      reasons: r.reasons,
    };
  });
  return { format, submarines, warnings };
}
