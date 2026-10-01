import type { OcrResultDto } from '@eranaut/shared';
import { prepareImage, type OcrEngine } from './engine.js';
import { createLimiter, type Limiter } from './limiter.js';
import { parseOcrLines } from './parse.js';

// OCR 服務:縮圖 → 辨識 → 解析。只辨識、不寫資料庫、不存圖(D-49、D-126)。

/** 同時辨識的張數與排隊上限(D-125)。Mac mini M4 實機量測後再調 */
export const OCR_CONCURRENCY = 2;
export const OCR_MAX_QUEUE = 8;

export interface OcrService {
  /** 回 null = 讀得到圖但找不到潛艇列(unrecognized)。圖片無法解碼丟 UnsupportedImageError、太忙丟 BusyError */
  recognize(image: Buffer): Promise<OcrResultDto | null>;
  /** 預先載入模型(啟動時呼叫,不等待) */
  warmup?(): Promise<void>;
}

export function createOcrService(engine: OcrEngine & { warmup?(): Promise<void> }, limiter: Limiter = createLimiter(OCR_CONCURRENCY, OCR_MAX_QUEUE)): OcrService {
  return {
    recognize: (image) =>
      limiter.run(async () => {
        const raw = await prepareImage(image);
        const lines = await engine.detect(raw);
        return parseOcrLines(lines);
      }),
    warmup: engine.warmup ? () => engine.warmup!() : undefined,
  };
}
