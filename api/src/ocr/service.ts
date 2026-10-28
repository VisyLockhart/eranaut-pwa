import type { ChartOcrResultDto, OcrResultDto } from '@eranaut/shared';
import sharp from 'sharp';
import { CROP_MARGIN, CROP_SCALE, cropRect, discoveredFrom, guessesFromLines, isConfident, matchSeaAny, pinScores, PIN_THRESHOLD, readDiscoveredCount, refineSea } from './chart.js';
import { cropRegion, MAX_INPUT_PIXELS, prepareImage, type OcrEngine, type RawImage } from './engine.js';
import { createLimiter, type Limiter } from './limiter.js';
import { parseOcrLines, type OcrLine } from './parse.js';
import { addRowSiblings, boxesInRegion, FIRST_ROW_CANDIDATES, findDialogRegion, MAX_ROW_CANDIDATES, pickRowCandidates, type Region } from './region.js';

// OCR 服務:縮圖 → 辨識 → 解析;必要時再裁出視窗用原圖解析度重辨一次(D-226)。只辨識、不寫資料庫、不存圖(D-49、D-126)。

/** 同時辨識的張數與排隊上限(D-125)。Mac mini M4 實機量測後再調 */
export const OCR_CONCURRENCY = 2;
export const OCR_MAX_QUEUE = 8;
/** 偵測到的框數達此值才啟用兩段式(D-227):實測 10~13 個框的小圖全辨識只要 0.2~0.45 秒,48 個框約 0.9 秒,66 個框(全螢幕)1.9 秒 */
export const TWO_STAGE_MIN_BOXES = 40;

/** 各步驟耗時(毫秒)與走的路徑,供路由寫進 log 判斷瓶頸;不影響結果 */
export type OcrTrace = Record<string, number | string>;

export interface OcrService {
  /** 回 null = 讀得到圖但找不到潛艇列(unrecognized)。圖片無法解碼丟 UnsupportedImageError、太忙丟 BusyError */
  recognize(image: Buffer, trace?: OcrTrace): Promise<OcrResultDto | null>;
  /** 海圖截圖(D-293)。回 null = 找不到可信的海圖(unrecognized);錯誤同 {@link recognize} */
  recognizeChart?(image: Buffer, trace?: OcrTrace): Promise<ChartOcrResultDto | null>;
  /** 預先載入模型(啟動時呼叫,不等待) */
  warmup?(): Promise<void>;
}

export function createOcrService(engine: OcrEngine & { warmup?(): Promise<void> }, limiter: Limiter = createLimiter(OCR_CONCURRENCY, OCR_MAX_QUEUE)): OcrService {
  return {
    recognize: (image, trace) =>
      limiter.run(async () => {
        const mark = stopwatch(trace);
        const raw = await prepareImage(image);
        mark('prepare_ms');
        if (trace) Object.assign(trace, { source: `${raw.sourceWidth ?? raw.width}x${raw.sourceHeight ?? raw.height}`, scaled: `${raw.width}x${raw.height}` });
        if (engine.locate) {
          try {
            return await recognizeTwoStage(engine, engine.locate.bind(engine), image, raw, trace);
          } catch {
            // 兩段式出任何狀況都退回整張辨識(UnsupportedImageError 在 prepareImage 已丟出,不會到這)
          }
        }
        if (trace) trace.path = 'whole';
        return recognizeWhole(engine, image, raw);
      }),
    recognizeChart: (image, trace) => limiter.run(() => recognizeChart(engine, image, trace)),
    warmup: engine.warmup ? () => engine.warmup!() : undefined,
  };
}

/** 介於有無之間、請使用者核對的圖釘分數下限 */
const PIN_UNCERTAIN = 0.5;

/**
 * 海圖辨識(D-293):縮圖 → OCR 找文字錨點 → 比對底圖決定海域與位置 → 回原圖裁出海圖(標準化大小)→ 細調 → 找圖釘。
 * 只辨識、不存圖(D-126)。
 */
async function recognizeChart(engine: OcrEngine, image: Buffer, trace?: OcrTrace): Promise<ChartOcrResultDto | null> {
  const mark = stopwatch(trace);
  const raw = await prepareImage(image);
  mark('prepare_ms');
  const lines = await engine.detect(raw);
  mark('ocr_ms');
  const m = matchSeaAny(raw, guessesFromLines(lines, raw.width, raw.height));
  mark('match_ms');
  if (trace) Object.assign(trace, { anchor: m.kind, sea: m.sea, score: Math.round(m.score * 1000) / 1000, margin: Math.round((m.runnerUp - m.score) * 1000) / 1000 });
  if (!isConfident(m)) return null;

  // 回原圖裁出海圖、縮放成每資料單位 CROP_SCALE 像素(海圖超出圖片的部分直接裁掉,轉換跟著調整)
  const srcW = raw.sourceWidth ?? raw.width;
  const srcH = raw.sourceHeight ?? raw.height;
  const k = srcW / raw.width;
  const rect = cropRect(m.transform);
  const left = Math.max(0, Math.floor(rect.left * k));
  const top = Math.max(0, Math.floor(rect.top * k));
  const right = Math.min(srcW, Math.ceil((rect.left + rect.size) * k));
  const bottom = Math.min(srcH, Math.ceil((rect.top + rect.size) * k));
  const f = CROP_SCALE / (m.transform.s * k);
  const { data, info } = await sharp(image, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .extract({ left, top, width: right - left, height: bottom - top })
    .resize({ width: Math.max(16, Math.round((right - left) * f)), height: Math.max(16, Math.round((bottom - top) * f)), fit: 'fill' })
    .ensureAlpha(1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const crop = { data, width: info.width, height: info.height };
  const fx = info.width / (right - left);
  const fy = info.height / (bottom - top);
  const start = { s: CROP_SCALE, ox: (m.transform.ox * k - left) * fx, oy: (m.transform.oy * k - top) * fy };
  const refined = refineSea(crop, m.sea, start);
  mark('crop_ms');
  const scores = pinScores(crop, m.sea, Number.isFinite(refined.score) ? refined.transform : start);
  const { points, filled } = discoveredFrom(m.sea, scores);
  mark('pins_ms');
  const uncertain = scores.filter((s) => s.score >= PIN_UNCERTAIN && s.score < PIN_THRESHOLD && !points.includes(s.id)).map((s) => s.id);
  // 海圖在原圖的位置:用細調後的轉換換回原圖座標(對照截圖要對得準)
  const t = Number.isFinite(refined.score) ? refined.transform : start;
  const sSrc = t.s / fx;
  const box = {
    left: Math.round(left + t.ox / fx - CROP_MARGIN * sSrc),
    top: Math.round(top + t.oy / fy - CROP_MARGIN * sSrc),
    size: Math.round((1024 + 2 * CROP_MARGIN) * sSrc),
    width: srcW,
    height: srcH,
  };
  return { sea: m.sea, points, filled, uncertain, screen_count: readDiscoveredCount(lines), map_box: box };
}

/**
 * 快速路徑(D-227):偵測文字框 → 只辨識像潛艇列的框 → 推算視窗範圍 → 回原圖裁出視窗,只辨識視窗內的少數幾個框。
 * 整張圖的辨識成本(最大宗)幾乎全省掉。結果有可疑欄位、或找不到視窗時,補辨識其餘的框退回整張流程,準確度不退步。
 */
async function recognizeTwoStage(engine: OcrEngine, locate: NonNullable<OcrEngine['locate']>, image: Buffer, raw: RawImage, trace?: OcrTrace): Promise<OcrResultDto | null> {
  const mark = stopwatch(trace);
  const located = await locate(raw);
  mark('locate_ms');
  if (trace) trace.boxes = located.boxes.length;
  const all = located.boxes.map((_, i) => i);
  // 框不多的圖(例如只截潛艇選單),全部辨識本來就快,先挑候選反而多一道工;直接整張走
  if (all.length < TWO_STAGE_MIN_BOXES) {
    const lines = await located.recognize(all);
    mark('recognize_all_ms');
    if (trace) trace.path = 'small_whole';
    return finishWhole(engine, image, raw, lines, parseOcrLines(lines));
  }
  // 先只辨識最像潛艇列的幾個框(通常就夠);找不到視窗才放寬到更多候選
  const candidates = pickRowCandidates(located.boxes, MAX_ROW_CANDIDATES);
  let partial: OcrLine[] = [];
  let region: Region | null = null;
  for (const n of [FIRST_ROW_CANDIDATES, MAX_ROW_CANDIDATES]) {
    const picked = addRowSiblings(located.boxes, candidates.slice(0, n));
    if (!picked.length) continue;
    partial = await located.recognize(picked);
    mark('partial_ms');
    region = findDialogRegion(partial, raw.width, raw.height);
    if (region || candidates.length <= n) break;
  }
  let second: OcrResultDto | null = null;
  if (region) {
    try {
      if ((raw.sourceWidth ?? raw.width) > raw.width) {
        // 原圖被縮過:回原圖裁出視窗,用原始解析度重新偵測、辨識
        const crop = await cropRegion(image, region, raw);
        mark('crop_ms');
        if (crop) second = parseOcrLines(await engine.detect(crop));
        mark('stage2_ms');
      } else {
        // 原圖沒被縮過:解析度沒有可以多拿的,直接辨識視窗內已偵測到的框,省掉第二次偵測
        const inside = boxesInRegion(located.boxes, region);
        if (inside.length) second = parseOcrLines(await located.recognize(inside));
        mark('stage2_ms');
      }
    } catch {
      second = null;
    }
    if (second && suspectScore(second) === 0) {
      if (trace) trace.path = 'fast';
      return second;
    }
  }
  // 沒找到視窗或結果不夠乾淨:補辨識全部框,走整張流程的擇優
  const lines = await located.recognize(all);
  mark('recognize_all_ms');
  if (trace) trace.path = region ? 'fallback_unclean' : 'fallback_no_region';
  const first = parseOcrLines(lines);
  if (second) return pickBetter(first, second);
  return finishWhole(engine, image, raw, lines, first);
}

/** 整張辨識(沒有兩段式的引擎、或兩段式失敗時):第一階段全辨識,必要時再裁視窗重辨(D-226) */
async function recognizeWhole(engine: OcrEngine, image: Buffer, raw: RawImage): Promise<OcrResultDto | null> {
  const lines = await engine.detect(raw);
  return finishWhole(engine, image, raw, lines, parseOcrLines(lines));
}

async function finishWhole(engine: OcrEngine, image: Buffer, raw: RawImage, lines: OcrLine[], first: OcrResultDto | null): Promise<OcrResultDto | null> {
  // 第一階段已經乾淨、而且原圖沒被縮過(例如 1280 以下的截圖)→ 不必再辨識一次
  const downscaled = (raw.sourceWidth ?? raw.width) > raw.width;
  if (first && !downscaled && suspectScore(first) === 0) return first;
  // 全螢幕大圖被縮到 1280 後文字太小,聊天框等也會被併進潛艇列:裁出視窗回原圖再辨識
  const region = findDialogRegion(lines, raw.width, raw.height);
  if (!region) return first;
  try {
    const crop = await cropRegion(image, region, raw);
    if (!crop) return first;
    const second = parseOcrLines(await engine.detect(crop));
    return pickBetter(first, second);
  } catch {
    return first; // 第二階段失敗不影響第一階段的結果
  }
}

/** 可疑欄位數 + 警告(每個警告算 3 分):分數越低越可信 */
function suspectScore(r: OcrResultDto): number {
  const suspects = r.submarines.reduce((n, s) => n + (s.suspect.name ? 1 : 0) + (s.suspect.time ? 1 : 0), 0);
  return suspects + 3 * r.warnings.length;
}

/** 兩階段的結果擇優:分數低者勝,同分取列數多者,再同分取第二階段(來源是裁切後的原圖解析度) */
export function pickBetter(first: OcrResultDto | null, second: OcrResultDto | null): OcrResultDto | null {
  if (!second) return first;
  if (!first) return second;
  const a = suspectScore(first);
  const b = suspectScore(second);
  if (a !== b) return b < a ? second : first;
  return second.submarines.length >= first.submarines.length ? second : first;
}

/** 每呼叫一次回傳「距離上次呼叫」的毫秒數,寫進 trace;沒有 trace 時什麼都不做 */
function stopwatch(trace?: OcrTrace): (key: string) => void {
  if (!trace) return () => {};
  let last = performance.now();
  return (key) => {
    const now = performance.now();
    trace[key] = Math.round(now - last);
    last = now;
  };
}
