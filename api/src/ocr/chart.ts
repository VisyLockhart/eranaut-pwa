import { CHART_BOX_MARGIN } from '@eranaut/shared';
import type { OcrLine } from './parse.js';
import { CHART_GRID, CHART_SEAS, type ChartSeaData } from './chart-data.js';

// 海圖辨識(D-293):「選擇航海圖」視窗的截圖 → 是哪一張海圖、出現了哪些航點(已發現)。
// 純函式,不碰檔案與資料庫;影像都是 RGBA 原始像素(engine.prepareImage / sharp 的輸出)。
// 步驟:① 用 OCR 讀到的文字(「已發現目的地數」那一行或海域列表)推估海圖的位置與大小;讀不到字就假設整張圖是海圖。
//      ② 在推估值附近搜尋縮放與平移,把截圖的底圖色塊和各海域的參考色塊比對,最像的就是那張海圖(順便把位置對準)。
//      ③ 在每個航點的位置找「圖釘」:一圈深色外框繞滿一圈、中間有亮色圖案。遊戲的「未發現」點不會畫在海圖上。
// 座標:「資料座標」與航線資料集相同(海圖約 0~1024);圖片像素 = o + s × 資料座標。

export interface RgbaImage {
  data: Uint8Array;
  width: number;
  height: number;
}

/** 資料座標 → 圖片像素:x' = ox + s·x,y' = oy + s·y */
export interface MapTransform {
  s: number;
  ox: number;
  oy: number;
}

export type AnchorKind = 'count_row' | 'sea_rows' | 'whole';

export interface MapGuess extends MapTransform {
  kind: AnchorKind;
}

export interface SeaMatch {
  sea: number;
  score: number;
  /** 第二像的海域的分數;差距越大越確定 */
  runnerUp: number;
  transform: MapTransform;
}

// 文字錨點與海圖的相對位置(以海圖寬 W = 1024 個資料單位換算的像素為準),由 4 張實際截圖量出:
// 「已發現目的地數 N 已探索目的地數 M」這一行的寬度約 1.084 W,海圖原點在它左上角右 0.125 W、下 0.13 W;
// 海域列表第一列(例如「翠浪海 70」)的寬度約 W,原點在它左上角右 0.125 W、下 0.447 W;列高約 W / 17.5。
const COUNT_ROW_WIDTH = 1.084;
const COUNT_ROW_DX = 0.125;
const COUNT_ROW_DY = 0.13;
const SEA_ROW_DX = 0.125;
const SEA_ROW_DY = 0.447;
const SEA_ROW_HEIGHT = 1 / 17.5;

const SEA_NAME = /溺|灰海|翠浪|妖歌|賽蓮|赛莲|塞壬|紫礁|蒼茫|苍茫|北洋/;
const COUNT_ROW = /目的地/;

function boxOf(l: OcrLine): { left: number; right: number; top: number; bottom: number } | null {
  const b = l.box;
  if (!b || b.length < 4) return null;
  const xs = b.map((p) => p[0] ?? 0);
  const ys = b.map((p) => p[1] ?? 0);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

/** 畫面上「已發現目的地數 N」的 N;讀不到為 null */
export function readDiscoveredCount(lines: readonly OcrLine[]): number | null {
  for (const l of lines) {
    const m = /[發发][現现][^\d]{0,8}?(\d{1,3})/.exec(l.text);
    if (m) return Number(m[1]);
  }
  return null;
}

/**
 * 由 OCR 的文字行推估海圖位置(圖片像素)。可能有好幾種推法(「已發現目的地數」那一行、海域列表、整張圖就是海圖),
 * 全部列出來,由比對結果決定用哪一個;最後一個一定是「整張圖」。
 */
export function guessesFromLines(lines: readonly OcrLine[], width: number, height: number): MapGuess[] {
  const out: MapGuess[] = [];
  const rows = lines.map((l) => ({ l, b: boxOf(l) })).filter((x): x is { l: OcrLine; b: NonNullable<ReturnType<typeof boxOf>> } => x.b !== null);
  const inside = (g: MapGuess) => {
    const W = g.s * 1024;
    // 海圖至少要有 3/4 在圖片裡,太小(< 80 px)也不算
    return W >= 80 && g.ox > -W / 4 && g.oy > -W / 4 && g.ox + W < width + W / 4 && g.oy + W < height + W / 4;
  };
  // ① 「已發現目的地數…已探索目的地數…」:可能被拆成兩個框,把同一水平線上的框合起來
  const counts = rows.filter((r) => COUNT_ROW.test(r.l.text) && !SEA_NAME.test(r.l.text));
  if (counts.length) {
    const first = counts.reduce((a, r) => (r.b.top < a.b.top ? r : a));
    const lineH = first.b.bottom - first.b.top;
    const same = counts.filter((r) => Math.abs(r.b.top - first.b.top) < Math.max(4, lineH * 0.8));
    const left = Math.min(...same.map((r) => r.b.left));
    const right = Math.max(...same.map((r) => r.b.right));
    const top = Math.min(...same.map((r) => r.b.top));
    const W = (right - left) / COUNT_ROW_WIDTH;
    const g: MapGuess = { kind: 'count_row', s: W / 1024, ox: left + COUNT_ROW_DX * W, oy: top + COUNT_ROW_DY * W };
    if (inside(g)) out.push(g);
  }
  // ② 海域列表:最上面一列;有「需要等級」數字時框寬約等於海圖寬,沒有就用列高推
  const seaRows = rows.filter((r) => SEA_NAME.test(r.l.text) && !COUNT_ROW.test(r.l.text));
  if (seaRows.length) {
    const top = seaRows.reduce((a, r) => (r.b.top < a.b.top ? r : a));
    const W = /\d/.test(top.l.text) ? top.b.right - top.b.left : (top.b.bottom - top.b.top) / SEA_ROW_HEIGHT;
    const g: MapGuess = { kind: 'sea_rows', s: W / 1024, ox: top.b.left + SEA_ROW_DX * W, oy: top.b.top + SEA_ROW_DY * W };
    if (inside(g)) out.push(g);
  }
  // ③ 只截了海圖:置中、約佔短邊 92%
  const W = 0.92 * Math.min(width, height);
  out.push({ kind: 'whole', s: W / 1024, ox: width / 2 - W / 2, oy: height / 2 - W / 2 });
  return out;
}

// ---- 底圖比對 ----

/** 比對時排除的半徑(資料單位):航點圖釘、起點附近的格子不比(截圖上有圖釘,參考圖上有 wiki 的圓圈) */
const CELL_EXCLUDE_RADIUS = 60;

interface PreparedSea {
  data: ChartSeaData;
  /** 參與比對的格子:中心座標 */
  cx: Float64Array;
  cy: Float64Array;
  /** 參考色塊(每色版標準化:平均 0、標準差 1),依序 r,g,b */
  ref: Float64Array;
}

let prepared: PreparedSea[] | null = null;

function prepareSeas(): PreparedSea[] {
  if (prepared) return prepared;
  prepared = CHART_SEAS.map((data) => {
    const cx: number[] = [];
    const cy: number[] = [];
    const vals: number[][] = [];
    const anchors = [...data.points.map((p) => [p[2], p[3]]), data.home];
    for (let gy = 0; gy < CHART_GRID.n; gy++)
      for (let gx = 0; gx < CHART_GRID.n; gx++) {
        const c = data.cells[gy * CHART_GRID.n + gx];
        if (!c) continue;
        const x = CHART_GRID.start + gx * CHART_GRID.step;
        const y = CHART_GRID.start + gy * CHART_GRID.step;
        if (anchors.some(([px, py]) => Math.hypot(x - px!, y - py!) <= CELL_EXCLUDE_RADIUS)) continue;
        cx.push(x);
        cy.push(y);
        vals.push(c);
      }
    return { data, cx: Float64Array.from(cx), cy: Float64Array.from(cy), ref: zNormalize(vals) };
  });
  return prepared;
}

/** 每個色版各自標準化(平均 0、標準差 1),攤平成 r,g,b 交錯;抵消截圖與參考圖的亮度、色調差 */
function zNormalize(vals: readonly (readonly number[])[]): Float64Array {
  const n = vals.length;
  const out = new Float64Array(n * 3);
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (const v of vals) sum += v[c]!;
    const mean = sum / n;
    let sq = 0;
    for (const v of vals) sq += (v[c]! - mean) ** 2;
    const sd = Math.sqrt(sq / n) || 1;
    for (let i = 0; i < n; i++) out[i * 3 + c] = (vals[i]![c]! - mean) / sd;
  }
  return out;
}

/** 方塊模糊後的 RGB(Float32,寬高同原圖):用積分圖,每個像素是邊長 size 的方塊平均 */
export function boxBlur(img: RgbaImage, size: number): Float32Array {
  const { width: w, height: h, data } = img;
  const half = Math.max(1, Math.round(size / 2));
  const out = new Float32Array(w * h * 3);
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let c = 0; c < 3; c++) {
    integral.fill(0);
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += data[(y * w + x) * 4 + c]!;
        integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1]! + row;
      }
    }
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
        const s = integral[y1 * (w + 1) + x1]! - integral[y0 * (w + 1) + x1]! - integral[y1 * (w + 1) + x0]! + integral[y0 * (w + 1) + x0]!;
        out[(y * w + x) * 3 + c] = s / ((x1 - x0) * (y1 - y0));
      }
    }
  }
  return out;
}

/** 這組轉換下截圖的色塊和參考色塊的差距(越小越像);海圖有一部分在圖外時回 Infinity */
function scoreAt(blur: Float32Array, w: number, h: number, sea: PreparedSea, t: MapTransform, buf: Float64Array): number {
  const n = sea.cx.length;
  for (let i = 0; i < n; i++) {
    const x = t.ox + t.s * sea.cx[i]!;
    const y = t.oy + t.s * sea.cy[i]!;
    if (x < 0 || y < 0 || x > w - 1.001 || y > h - 1.001) return Infinity;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const i00 = (y0 * w + x0) * 3, i10 = i00 + 3, i01 = i00 + w * 3, i11 = i01 + 3;
    for (let c = 0; c < 3; c++) {
      buf[i * 3 + c] = (blur[i00 + c]! * (1 - fx) + blur[i10 + c]! * fx) * (1 - fy) + (blur[i01 + c]! * (1 - fx) + blur[i11 + c]! * fx) * fy;
    }
  }
  // 截圖這一邊也標準化,再算平均絕對差
  let total = 0;
  for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += buf[i * 3 + c]!;
    const mean = sum / n;
    let sq = 0;
    for (let i = 0; i < n; i++) sq += (buf[i * 3 + c]! - mean) ** 2;
    const sd = Math.sqrt(sq / n) || 1;
    for (let i = 0; i < n; i++) total += Math.abs((buf[i * 3 + c]! - mean) / sd - sea.ref[i * 3 + c]!);
  }
  return total / (n * 3);
}

interface SearchRange {
  /** 縮放倍率的上下限(相對推估值)與步數 */
  scale: [number, number, number];
  /** 平移的範圍(相對海圖寬 W,正負)與步數 */
  shift: [number, number];
}

function searchSea(blur: Float32Array, w: number, h: number, sea: PreparedSea, guess: MapTransform, range: SearchRange): { score: number; t: MapTransform } {
  const W = guess.s * 1024;
  const buf = new Float64Array(sea.cx.length * 3);
  let best = { score: Infinity, t: guess };
  const [k0, k1, ks] = range.scale;
  const [sh, ss] = range.shift;
  for (let a = 0; a < ks; a++) {
    const k = ks === 1 ? 1 : k0 + ((k1 - k0) * a) / (ks - 1);
    const s = guess.s * k;
    // 縮放以海圖中心為準,平移才不會跟著縮放跑掉
    const cx = guess.ox + guess.s * 512, cy = guess.oy + guess.s * 512;
    for (let i = 0; i < ss; i++)
      for (let j = 0; j < ss; j++) {
        const dx = ss === 1 ? 0 : -sh + (2 * sh * i) / (ss - 1);
        const dy = ss === 1 ? 0 : -sh + (2 * sh * j) / (ss - 1);
        const t = { s, ox: cx - s * 512 + dx * W, oy: cy - s * 512 + dy * W };
        const score = scoreAt(blur, w, h, sea, t, buf);
        if (score < best.score) best = { score, t };
      }
  }
  return best;
}

/** 搜尋範圍:有文字錨點時推估值很準,沒有(只截海圖)時放寬 */
const RANGES: Record<AnchorKind, SearchRange> = {
  count_row: { scale: [0.88, 1.12, 7], shift: [0.08, 9] },
  sea_rows: { scale: [0.88, 1.12, 7], shift: [0.1, 11] },
  whole: { scale: [0.8, 1.2, 9], shift: [0.12, 13] },
};

/**
 * 找出是哪一張海圖並對準位置。`seas` 可限定候選(測試用)。
 * 粗搜(各海域)→ 對最像的兩張細搜。回傳最像的;一張都比不上時 score 為 Infinity。
 */
export function matchSeaAny(img: RgbaImage, guesses: readonly MapGuess[], seas?: readonly number[]): SeaMatch & { kind: AnchorKind } {
  let best: (SeaMatch & { kind: AnchorKind }) | null = null;
  for (const g of guesses) {
    const m = matchSea(img, g, seas);
    if (!best || m.score < best.score) best = { ...m, kind: g.kind };
    if (isConfident(m)) break; // 錨點越前面越準;已經可信就不用再試
  }
  return best!;
}

export function matchSea(img: RgbaImage, guess: MapGuess, seas?: readonly number[]): SeaMatch {
  const all = prepareSeas().filter((p) => !seas || seas.includes(p.data.sea));
  const blur = boxBlur(img, Math.max(2, guess.s * CHART_GRID.step));
  const coarse = all.map((sea) => ({ sea, ...searchSea(blur, img.width, img.height, sea, guess, RANGES[guess.kind]) })).sort((a, b) => a.score - b.score);
  const range = RANGES[guess.kind];
  const step = (2 * range.shift[0]) / (range.shift[1] - 1);
  const fine = coarse.slice(0, 2).map((c) => {
    const kStep = (range.scale[1] - range.scale[0]) / (range.scale[2] - 1);
    const r = searchSea(blur, img.width, img.height, c.sea, c.t, { scale: [1 - kStep, 1 + kStep, 9], shift: [step, 9] });
    return { sea: c.sea, ...(r.score < c.score ? r : { score: c.score, t: c.t }) };
  });
  const ranked = [...fine, ...coarse.slice(2)].sort((a, b) => a.score - b.score);
  const best = ranked[0];
  if (!best || !Number.isFinite(best.score)) return { sea: 0, score: Infinity, runnerUp: Infinity, transform: guess };
  return { sea: best.sea.data.sea, score: best.score, runnerUp: ranked[1]?.score ?? Infinity, transform: best.t };
}

/** 已大致對準後的細調(裁切後的海圖上):縮放 ±3%、平移 ±1.2% */
export function refineSea(img: RgbaImage, sea: number, t: MapTransform): { score: number; transform: MapTransform } {
  const p = prepareSeas().find((x) => x.data.sea === sea);
  if (!p) return { score: Infinity, transform: t };
  const blur = boxBlur(img, Math.max(2, t.s * CHART_GRID.step));
  const r = searchSea(blur, img.width, img.height, p, t, { scale: [0.97, 1.03, 7], shift: [0.012, 9] });
  return { score: r.score, transform: r.t };
}

/** 比對夠可信:差距分數夠小、和第二像的海域拉得夠開(實測正確 0.14~0.20、其他 ≥ 0.87) */
export const MATCH_MAX_SCORE = 0.55;
export const MATCH_MIN_MARGIN = 0.25;

export function isConfident(m: SeaMatch): boolean {
  return m.score <= MATCH_MAX_SCORE && m.runnerUp - m.score >= MATCH_MIN_MARGIN;
}

// ---- 圖釘偵測 ----

/** 圖釘半徑(資料單位)。遊戲的圖釘中心比資料座標略偏左上,所以搜尋範圍不對稱 */
const PIN_RADIUS = 25;
const PIN_SEARCH_X: [number, number] = [-16, 8];
const PIN_SEARCH_Y: [number, number] = [-18, 6];
const DARK = 75;
const BRIGHT = 150;
const SECTORS = 16;

export interface PinScore {
  id: number;
  code: string;
  /** 0~1:外框繞了幾成 × 中間亮色圖案夠不夠(上限 1) */
  score: number;
}

/** 每個航點的圖釘分數(影像建議是裁切後的海圖,s 約 0.6) */
export function pinScores(img: RgbaImage, sea: number, t: MapTransform): PinScore[] {
  const data = CHART_SEAS.find((s) => s.sea === sea);
  if (!data) return [];
  const { width: w, height: h } = img;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = (img.data[i * 4]! + img.data[i * 4 + 1]! + img.data[i * 4 + 2]!) / 3;
  const step = 2; // 資料單位
  return data.points.map(([id, code, px, py]) => {
    let best = 0;
    for (let dx = PIN_SEARCH_X[0]; dx <= PIN_SEARCH_X[1]; dx += step)
      for (let dy = PIN_SEARCH_Y[0]; dy <= PIN_SEARCH_Y[1]; dy += step)
        for (const kr of [0.9, 1, 1.1]) {
          const v = pinAt(lum, w, h, t.ox + t.s * (px + dx), t.oy + t.s * (py + dy), PIN_RADIUS * t.s * kr);
          if (v > best) best = v;
          if (best >= 1) break;
        }
    return { id, code, score: best };
  });
}

/** 以 (cx, cy) 為中心、半徑 r 的圓:外圈 16 個方向有幾成有深色像素 × 圈內亮色像素比例(到 6% 算滿分) */
function pinAt(lum: Float32Array, w: number, h: number, cx: number, cy: number, r: number): number {
  const R = r * 1.15;
  const x0 = Math.floor(cx - R), x1 = Math.ceil(cx + R), y0 = Math.floor(cy - R), y1 = Math.ceil(cy + R);
  if (x0 < 0 || y0 < 0 || x1 >= w || y1 >= h) return 0;
  let sectors = 0;
  let inner = 0, bright = 0;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) / r;
      const L = lum[y * w + x]!;
      if (d < 0.7) {
        inner++;
        if (L > BRIGHT) bright++;
      } else if (d > 0.8 && d < 1.15 && L < DARK) {
        const k = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * SECTORS) % SECTORS;
        sectors |= 1 << k;
      }
    }
  let cov = 0;
  for (let k = 0; k < SECTORS; k++) if (sectors & (1 << k)) cov++;
  return (cov / SECTORS) * Math.min(1, inner ? bright / inner / 0.06 : 0);
}

/** 圖釘分數達此值算「有出現」(實測有出現的都是 1.0,沒出現的最高約 0.63) */
export const PIN_THRESHOLD = 0.85;

/** 同一海域內的上一個點(沒有或在別的海域為 null) */
export function parentOf(sea: number, id: number): number | null {
  const p = CHART_SEAS.find((s) => s.sea === sea)?.points.find((q) => q[0] === id);
  return p ? p[4] : null;
}

/**
 * 把偵測結果整理成已發現的點:分數過門檻的點,加上它們在同一海域內前面的所有點(已發現的點,前一個點一定已探索過)。
 * 回傳 `filled` = 因此補上的點(畫面上可能被擋住或沒認出來)。
 */
export function discoveredFrom(sea: number, scores: readonly PinScore[], threshold = PIN_THRESHOLD): { points: number[]; filled: number[] } {
  const seen = new Set(scores.filter((s) => s.score >= threshold).map((s) => s.id));
  const filled: number[] = [];
  for (const id of [...seen]) {
    for (let p = parentOf(sea, id); p !== null; p = parentOf(sea, p)) {
      if (!seen.has(p)) {
        seen.add(p);
        filled.push(p);
      }
    }
  }
  const order = CHART_SEAS.find((s) => s.sea === sea)?.points.map((p) => p[0]) ?? [];
  return { points: order.filter((id) => seen.has(id)), filled: order.filter((id) => filled.includes(id)) };
}

/** 標準化後的海圖裁切範圍:資料座標 -40~1064,每單位 0.6 像素(約 662 px 見方) */
export const CROP_SCALE = 0.6;
export const CROP_MARGIN = CHART_BOX_MARGIN;
export const CROP_SIZE = Math.round((1024 + 2 * CROP_MARGIN) * CROP_SCALE);

/** 某組轉換下,裁切範圍在圖片上的矩形(像素,可能超出邊界) */
export function cropRect(t: MapTransform): { left: number; top: number; size: number } {
  return { left: t.ox - CROP_MARGIN * t.s, top: t.oy - CROP_MARGIN * t.s, size: (1024 + 2 * CROP_MARGIN) * t.s };
}
