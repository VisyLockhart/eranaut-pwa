import type { OcrLine } from './parse.js';

// 第二階段裁切(D-226):由第一階段(縮圖後整張)的文字行座標,推算「潛水艇選單視窗」的範圍。
// 純函式,不碰影像與模型。座標單位與輸入行的 box 相同(第一階段的像素)。
// 為什麼要裁切:① 整張全螢幕(例如 3440×1440)縮到 1280 後,文字只剩約 14 px 高,辨識品質明顯下降;
// ② 偵測器的門檻很低,同一水平線上相鄰的文字(聊天框、任務列、遊戲內「縮放視窗」選單)會被併成同一行,
// 污染潛艇列。對著原圖只裁出視窗,用原始解析度再辨識一次,兩個問題一起解決。

export interface Region {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** 一行文字的框高(中位數),用來決定放大倍率 */
  lineHeight: number;
}

/** 潛艇列內文「潛水艇-1 [94級] [正在探索:剩餘時間 22小時10分鐘]」寬度約為框高的 22.4 倍(實測 3 張不同縮放),
 *  含「X天」的列更長一些;取 24.5 倍留餘裕 */
const ROW_WIDTH_RATIO = 24.5;
/** 標題「請選擇潛水艇。」到第一列的距離最多約 5 倍框高 */
const TOP_RATIO = 6;
/** 視窗左緣比文字左緣再多約 1 倍框高,取 1.5 倍 */
const LEFT_PAD_RATIO = 1.5;

const ROW_MARK = /完成|\d\s*[天小分]/;
const ROW_HINT = /[水艇蜓潘潜潛探索剩餘余除級级正在]/;
const NON_ROW = /請選|探索機|所持燃料/;

interface Geo {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function toGeo(l: OcrLine): Geo | null {
  const b = l.box;
  if (!b || b.length < 4) return null;
  const xs = b.map((p) => p[0]!);
  const ys = b.map((p) => p[1]!);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  // 框高用左邊那條邊的長度:畫面稍微歪斜時,四個角的 y 範圍會把斜度算進去而高估
  const h = Math.hypot(b[3]![0]! - b[0]![0]!, b[3]![1]! - b[0]![1]!);
  return { text: l.text.replace(/\s/g, ''), x, y, w: Math.max(...xs) - x, h };
}

function median(a: number[]): number {
  const s = [...a].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)]!;
}

/** 找不到視窗(沒有像潛艇列的行)回 null,呼叫端退回第一階段的結果 */
export function findDialogRegion(lines: OcrLine[], imageWidth: number, imageHeight: number): Region | null {
  const geos = lines.map(toGeo).filter((g): g is Geo => g !== null && g.h > 0);
  const cand = geos.filter((g) => ROW_MARK.test(g.text) && ROW_HINT.test(g.text) && !NON_ROW.test(g.text));
  if (cand.length === 0) return null;

  // 潛艇列的左緣一致;被併進聊天框的行左緣會跑到最左邊,用中位數的左緣當基準、丟掉差太多的
  const h0 = median(cand.map((g) => g.h));
  const x0 = median(cand.map((g) => g.x));
  let rows = cand.filter((g) => Math.abs(g.x - x0) <= 1.5 * h0);
  if (rows.length === 0) return null;
  // 由上而下串成連續的一組(列距約 1~2.3 倍框高),與遠處的雜訊分開
  rows = rows.sort((a, b) => a.y - b.y);
  const chain: Geo[] = [rows[0]!];
  for (const r of rows.slice(1)) {
    const prev = chain[chain.length - 1]!;
    if (r.y - prev.y <= 2.5 * h0) chain.push(r);
  }
  const h = median(chain.map((g) => g.h));
  const left = median(chain.map((g) => g.x)) - LEFT_PAD_RATIO * h;
  const first = chain[0]!;
  const last = chain[chain.length - 1]!;
  const top = first.y - TOP_RATIO * h;

  // 下緣:「取消」那一行(被併行的也看它的上緣);找不到就由列距外推(取消 + 餘裕)
  const step = chain.length > 1 ? (last.y - first.y) / (chain.length - 1) : 1.6 * h;
  const cancel = geos.find((g) => /取消/.test(g.text) && g.y > last.y && g.y - last.y <= 2.5 * step + h);
  const bottom = cancel ? cancel.y + cancel.h + 0.4 * h : last.y + last.h + 2.2 * step;

  // 右緣:乾淨(沒被併行)的列的右緣最可靠;沒有就用寬度比例估
  const clean = chain.filter((g) => g.w <= ROW_WIDTH_RATIO * h);
  const est = left + LEFT_PAD_RATIO * h + ROW_WIDTH_RATIO * h;
  const right = clean.length > 0 ? Math.min(est, Math.max(...clean.map((g) => g.x + g.w)) + 0.6 * h) : est;

  const r: Region = {
    left: Math.max(0, Math.floor(left)),
    top: Math.max(0, Math.floor(top)),
    right: Math.min(imageWidth, Math.ceil(right)),
    bottom: Math.min(imageHeight, Math.ceil(bottom)),
    lineHeight: h,
  };
  return r.right - r.left > 4 * h && r.bottom - r.top > 3 * h ? r : null;
}

/** 兩段式第一階段先辨識的候選框數:4 列潛艇加標題、取消不到 8 個框;找不到視窗再放寬到 {@link MAX_ROW_CANDIDATES} */
export const FIRST_ROW_CANDIDATES = 8;
export const MAX_ROW_CANDIDATES = 14;
/** 潛艇列併成一整行後的寬高比約 18~22(實測),聊天框等散落的文字多半 < 15;低於此值的框不當候選 */
const MIN_ROW_ASPECT = 8;

/**
 * 兩段式(D-227)第一階段:偵測完文字框、還沒辨識之前,先挑出「長得像潛艇列」的框(寬高比大的)來辨識。
 * 辨識每框約 30 毫秒,整張全螢幕有 60 多個框、其中絕大多數是聊天框與介面小字,全辨識是浪費。
 * 只用幾何、不看文字,所以挑錯只會多辨識或找不到視窗(呼叫端會退回全部辨識),不會產生錯誤結果。
 * 回傳索引,寬高比由大到小。
 */
export function pickRowCandidates(boxes: (number[][] | undefined)[], max = MAX_ROW_CANDIDATES): number[] {
  const scored: { i: number; ar: number }[] = [];
  boxes.forEach((b, i) => {
    if (!b || b.length < 4) return;
    const w = Math.hypot(b[1]![0]! - b[0]![0]!, b[1]![1]! - b[0]![1]!);
    const h = Math.hypot(b[3]![0]! - b[0]![0]!, b[3]![1]! - b[0]![1]!);
    if (h < 1) return;
    const ar = w / h;
    if (ar >= MIN_ROW_ASPECT) scored.push({ i, ar });
  });
  return scored.sort((a, b) => b.ar - a.ar).slice(0, max).map((x) => x.i);
}

/** 中心落在視窗範圍內(四邊各放寬半個框高)的框索引;兩段式在原圖沒被縮過時,用它取代「裁切後重新偵測」 */
export function boxesInRegion(boxes: (number[][] | undefined)[], region: Region): number[] {
  const pad = region.lineHeight / 2;
  const out: number[] = [];
  boxes.forEach((b, i) => {
    if (!b || b.length < 4) return;
    const cx = (b[0]![0]! + b[2]![0]!) / 2;
    const cy = (b[0]![1]! + b[2]![1]!) / 2;
    if (cx >= region.left - pad && cx <= region.right + pad && cy >= region.top - pad && cy <= region.bottom + pad) out.push(i);
  });
  return out;
}

/**
 * 候選框的「同一列夥伴」:偵測器常把一列拆成好幾個框(例如「潛水艇-1 [94級]」與「[正在探索:剩餘時間…]」),
 * 只辨識寬高比大的那一塊會漏掉列左半,推出的視窗左緣就偏右。把與候選框垂直中線對齊、高度相近、
 * 水平間距不超過 3 倍框高的框一併納入(只擴一輪)。回傳含原候選的索引(去重)。
 */
export function addRowSiblings(boxes: (number[][] | undefined)[], picked: number[]): number[] {
  const geo = (b: number[][]) => ({
    l: Math.min(...b.map((p) => p[0]!)),
    r: Math.max(...b.map((p) => p[0]!)),
    cy: (b[0]![1]! + b[2]![1]!) / 2,
    h: Math.hypot(b[3]![0]! - b[0]![0]!, b[3]![1]! - b[0]![1]!),
  });
  const out = new Set(picked);
  for (const i of picked) {
    const a = boxes[i];
    if (!a || a.length < 4) continue;
    const ga = geo(a);
    boxes.forEach((b, j) => {
      if (out.has(j) || !b || b.length < 4) return;
      const gb = geo(b);
      if (Math.abs(gb.cy - ga.cy) > ga.h * 0.5) return;
      if (gb.h < ga.h * 0.6 || gb.h > ga.h * 1.6) return;
      const gap = gb.r < ga.l ? ga.l - gb.r : gb.l > ga.r ? gb.l - ga.r : 0;
      if (gap <= ga.h * 3) out.add(j);
    });
  }
  return [...out];
}
