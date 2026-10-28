import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import Ocr from '@gutenye/ocr-node';
import sharp from 'sharp';
import type { OcrLine } from './parse.js';
import type { Region } from './region.js';

// 影像前處理與 PP-OCRv4 推論(D-125)。全程只在記憶體(D-126):收到的 buffer 縮圖後轉成原始像素餵給引擎,
// 不寫入磁碟。引擎(onnxruntime-node)與縮圖(sharp)的二進位在 Windows x64(開發)與 linux/arm64 glibc(Docker,D-127)
// 都有內含,不需要編譯或下載。

/** 縮圖後的長邊上限(D-125):不放大;實測縮到 1280 準確度不變、手機大圖快 3 倍以上、記憶體小很多 */
export const MAX_EDGE = 1280;
/** 單張圖的像素上限,防止極大的壓縮炸彈圖;一般手機照片約 1200 萬像素 */
const MAX_INPUT_PIXELS = 80_000_000;
const SUPPORTED_FORMATS = new Set(['png', 'jpeg', 'webp']);

export class UnsupportedImageError extends Error {
  constructor(message = 'unsupported_image') {
    super(message);
    this.name = 'UnsupportedImageError';
  }
}

export interface RawImage {
  data: Uint8Array;
  width: number;
  height: number;
  /** 轉正後、縮圖前的原圖尺寸(第二階段裁切要回原圖取像素,D-226);裁切出來的圖不帶 */
  sourceWidth?: number;
  sourceHeight?: number;
}

/** 依 EXIF 轉正、縮到長邊 MAX_EDGE、轉成 RGBA 原始像素。不是圖片或格式不支援丟 UnsupportedImageError */
export async function prepareImage(input: Buffer): Promise<RawImage> {
  try {
    const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await base.metadata();
    if (!meta.format || !SUPPORTED_FORMATS.has(meta.format)) throw new UnsupportedImageError();
    // EXIF 方向 5~8 是轉 90 度,轉正後寬高對調
    const swap = (meta.orientation ?? 1) >= 5;
    const sourceWidth = (swap ? meta.height : meta.width) ?? 0;
    const sourceHeight = (swap ? meta.width : meta.height) ?? 0;
    const { data, info } = await base
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha(1)
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, sourceWidth, sourceHeight };
  } catch (e) {
    if (e instanceof UnsupportedImageError) throw e;
    throw new UnsupportedImageError(e instanceof Error ? e.message : 'unsupported_image');
  }
}

/** 第二階段裁切後文字框高的目標值(像素):太小辨識變差,太大浪費時間;只在 {@link CROP_MIN_SCALE}~{@link CROP_MAX_SCALE} 之間調整 */
const CROP_TARGET_LINE_HEIGHT = 32;
const CROP_MIN_SCALE = 0.6;
const CROP_MAX_SCALE = 2;

/**
 * 第二階段(D-226):依第一階段(縮圖後)座標算出的視窗範圍,回**原圖**裁出來再轉成原始像素。
 * 原圖解析度高的時候(例如 3440×1440 全螢幕)文字不會像第一階段那樣被縮到難以辨識;
 * 裁掉視窗以外的聊天框等,偵測器也不會把它們併進潛艇列。裁出來的範圍太小或超出邊界回 null。
 */
export async function cropRegion(input: Buffer, region: Region, prepared: RawImage): Promise<RawImage | null> {
  const { sourceWidth, sourceHeight } = prepared;
  if (!sourceWidth || !sourceHeight) return null;
  const k = sourceWidth / prepared.width;
  const left = Math.max(0, Math.round(region.left * k));
  const top = Math.max(0, Math.round(region.top * k));
  const width = Math.min(sourceWidth - left, Math.round((region.right - region.left) * k));
  const height = Math.min(sourceHeight - top, Math.round((region.bottom - region.top) * k));
  if (width < 16 || height < 16) return null;
  const scale = Math.min(CROP_MAX_SCALE, Math.max(CROP_MIN_SCALE, CROP_TARGET_LINE_HEIGHT / (region.lineHeight * k)));
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .extract({ left, top, width, height })
    .resize({ width: Math.max(16, Math.round(width * scale)) })
    .ensureAlpha(1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** 解析 cgroup v2 的 `cpu.max`(例如 "200000 100000" = 2 顆;"max 100000" = 不限)。無法解析回 null */
export function parseCpuMax(text: string): number | null {
  const [quota, period] = text.trim().split(/\s+/);
  const q = Number(quota);
  const p = Number(period);
  if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p <= 0) return null;
  return q / p;
}

/**
 * onnxruntime 推論執行緒數(D-228)。預設值是「主機」的核心數,但容器常被限制只能用 2 顆(compose 的 `cpus: 2`):
 * 執行緒遠多於可用 CPU 時,每次推論都在互相等待、被節流,實測 2 核配 8 執行緒,逐框辨識慢 8 倍、偵測慢 2.6 倍。
 * 順序:環境變數 `OCR_THREADS` → cgroup 的 CPU 配額 → 系統回報的核心數;限制在 1~8。
 */
export function ocrThreads(env: NodeJS.ProcessEnv = process.env, readCpuMax: () => string | null = defaultReadCpuMax): number {
  const fromEnv = Number(env.OCR_THREADS);
  const raw = Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : null;
  const cpus = raw ?? (() => {
    const text = readCpuMax();
    const quota = text ? parseCpuMax(text) : null;
    return quota ?? availableParallelism();
  })();
  return Math.min(8, Math.max(1, Math.floor(cpus)));
}

function defaultReadCpuMax(): string | null {
  try {
    return readFileSync('/sys/fs/cgroup/cpu.max', 'utf8');
  } catch {
    return null; // 不是 cgroup v2 或不在容器內
  }
}

/** 偵測到、但還沒辨識的一個文字框(座標同 {@link OcrLine.box}:偵測器輸入圖的像素) */
export interface LocatedImage {
  boxes: OcrLine['box'][];
  /** 只辨識指定索引的框(順序不拘);同一水平線上相鄰的框會依原本規則併成一行 */
  recognize(indices: number[]): Promise<OcrLine[]>;
}

/** 低階引擎:一張原始像素 → 文字行。獨立成介面,測試可以換成假的 */
export interface OcrEngine {
  detect(image: RawImage): Promise<OcrLine[]>;
  /**
   * 兩段式(D-227):只做文字框偵測(約 0.4 秒),辨識(每框約 30 毫秒,是整體最大宗)留給呼叫端挑要辨識的框。
   * 沒有這個方法的引擎(例如測試用的假引擎)走 {@link detect}
   */
  locate?(image: RawImage): Promise<LocatedImage>;
}

interface LineImageLike {
  box: OcrLine['box'];
}
interface Parts {
  det: { run(image: { data: Uint8Array; width: number; height: number }): Promise<{ lineImages: LineImageLike[] }> };
  rec: { run(lineImages: LineImageLike[]): Promise<OcrLine[]> };
}

/**
 * 取得 @gutenye/ocr-common 內部的偵測/辨識模型(套件的 Ocr 把兩者藏在私有欄位,沒辦法分開呼叫)。
 * 版本鎖在 package.json;失敗(套件改版、路徑不同)時回 null,引擎退回整套 Ocr.detect,只是少了兩段式的加速。
 */
async function loadParts(): Promise<Parts | null> {
  try {
    await import('@gutenye/ocr-node'); // 註冊 onnxruntime 後端與內建模型
    const req = createRequire(import.meta.url);
    const common = createRequire(req.resolve('@gutenye/ocr-node')).resolve('@gutenye/ocr-common');
    const models = (await import(pathToFileURL(join(dirname(common), 'models', 'index.js')).href)) as {
      Detection: { create(o: object): Promise<Parts['det']> };
      Recognition: { create(o: object): Promise<Parts['rec']> };
    };
    const options = { onnxOptions: { intraOpNumThreads: ocrThreads(), interOpNumThreads: 1 } };
    const [det, rec] = await Promise.all([models.Detection.create(options), models.Recognition.create(options)]);
    return { det, rec };
  } catch {
    return null;
  }
}

/** 真正的 PP-OCRv4 引擎。模型內含在 npm 套件裡(不連網);第一次呼叫時才載入,載入失敗不會讓服務起不來 */
export function createPaddleEngine(): OcrEngine & { warmup(): Promise<void> } {
  let instance: Promise<{ parts: Parts | null; ocr: Ocr | null }> | null = null;
  const get = () => {
    instance ??= (async () => {
      const parts = await loadParts();
      return { parts, ocr: parts ? null : await Ocr.create({ onnxOptions: { intraOpNumThreads: ocrThreads(), interOpNumThreads: 1 } }) };
    })().catch((e: unknown) => {
      instance = null; // 下次再試
      throw e;
    });
    return instance;
  };
  const toLines = (texts: OcrLine[]) => texts.map((t) => ({ text: t.text, mean: t.mean, box: t.box }));
  const input = (image: RawImage) => ({ data: image.data, width: image.width, height: image.height });
  return {
    async warmup() {
      await get();
    },
    async detect(image) {
      const { parts, ocr } = await get();
      if (parts) {
        const { lineImages } = await parts.det.run(input(image));
        return toLines(await parts.rec.run(lineImages));
      }
      return toLines((await ocr!.detect(input(image))).texts);
    },
    async locate(image) {
      const { parts } = await get();
      if (!parts) throw new Error('two_stage_unavailable');
      const { lineImages } = await parts.det.run(input(image));
      return {
        boxes: lineImages.map((l) => l.box),
        recognize: async (indices) => toLines(await parts.rec.run(indices.map((i) => lineImages[i]!))),
      };
    },
  };
}
