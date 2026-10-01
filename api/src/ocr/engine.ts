import Ocr from '@gutenye/ocr-node';
import sharp from 'sharp';
import type { OcrLine } from './parse.js';

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
}

/** 依 EXIF 轉正、縮到長邊 MAX_EDGE、轉成 RGBA 原始像素。不是圖片或格式不支援丟 UnsupportedImageError */
export async function prepareImage(input: Buffer): Promise<RawImage> {
  try {
    const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await base.metadata();
    if (!meta.format || !SUPPORTED_FORMATS.has(meta.format)) throw new UnsupportedImageError();
    const { data, info } = await base
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha(1)
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  } catch (e) {
    if (e instanceof UnsupportedImageError) throw e;
    throw new UnsupportedImageError(e instanceof Error ? e.message : 'unsupported_image');
  }
}

/** 低階引擎:一張原始像素 → 文字行。獨立成介面,測試可以換成假的 */
export interface OcrEngine {
  detect(image: RawImage): Promise<OcrLine[]>;
}

/** 真正的 PP-OCRv4 引擎。模型內含在 npm 套件裡(不連網);第一次呼叫時才載入,載入失敗不會讓服務起不來 */
export function createPaddleEngine(): OcrEngine & { warmup(): Promise<void> } {
  let instance: Promise<Ocr> | null = null;
  const get = () => {
    instance ??= Ocr.create().catch((e: unknown) => {
      instance = null; // 下次再試
      throw e;
    });
    return instance;
  };
  return {
    async warmup() {
      await get();
    },
    async detect(image) {
      const ocr = await get();
      const { texts } = await ocr.detect({ data: image.data, width: image.width, height: image.height });
      return texts.map((t) => ({ text: t.text, mean: t.mean, box: t.box }));
    },
  };
}
