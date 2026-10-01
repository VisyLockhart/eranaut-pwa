import multipart from '@fastify/multipart';
import type { FastifyInstance } from 'fastify';
import type { OcrErrorCode } from '@eranaut/shared';
import type { registerSessionAuth } from '../auth/session-guard.js';
import { UnsupportedImageError } from '../ocr/engine.js';
import { BusyError } from '../ocr/limiter.js';
import type { AppDeps } from '../server.js';

// 截圖辨識(SCHEMA §8.1):POST /api/ocr,multipart 的 `image` 欄位。
// 只辨識、不寫資料庫、不存圖片(D-49、D-126):上傳內容只存在記憶體 buffer,辨識完隨回應結束被回收。
// 路由只處理 HTTP;縮圖、辨識、解析在 ocr/。

/** 上傳大小上限(D-126 建議約 10 MB)。手機原圖約 3 MB、PC 截圖 < 2.5 MB */
export const OCR_MAX_BYTES = 10 * 1024 * 1024;

export function registerOcrRoutes(app: FastifyInstance, deps: AppDeps, requireSession: ReturnType<typeof registerSessionAuth>): void {
  // 只註冊在這個路由所在的封裝範圍內,其他路由的 body 解析不受影響
  app.register(async (scope) => {
    scope.register(multipart, { limits: { fileSize: OCR_MAX_BYTES, files: 1, fields: 0, parts: 2 } });

    // 每位使用者同時只處理一張,避免一個人把佇列塞滿;全站的併發與排隊上限在 OcrService
    const inFlight = new Set<string>();
    const fail = (reply: { code(n: number): { send(b: unknown): unknown } }, status: number, error: OcrErrorCode, headers?: () => void) => {
      headers?.();
      return reply.code(status).send({ error });
    };

    scope.post('/api/ocr', { preHandler: requireSession }, async (req, reply) => {
      const ocr = deps.ocr;
      if (!ocr) return fail(reply, 503, 'ocr_unavailable');
      const userId = req.session!.userId;
      if (inFlight.has(userId)) return fail(reply, 429, 'busy', () => void reply.header('Retry-After', '3'));

      if (!req.isMultipart()) return fail(reply, 400, 'no_file');
      inFlight.add(userId);
      try {
        let buffer: Buffer;
        try {
          const part = await req.file();
          if (!part || part.fieldname !== 'image') return fail(reply, 400, 'no_file');
          buffer = await part.toBuffer(); // 超過上限會丟 RequestFileTooLargeError
        } catch (e) {
          if ((e as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') return fail(reply, 413, 'file_too_large');
          if ((e as { code?: string }).code?.startsWith('FST_')) return fail(reply, 400, 'no_file');
          throw e;
        }
        if (buffer.length === 0) return fail(reply, 400, 'no_file');

        try {
          const result = await ocr.recognize(buffer);
          if (!result) return fail(reply, 422, 'unrecognized');
          req.log.info({ event: 'ocr', format: result.format, rows: result.submarines.length, suspects: result.submarines.filter((s) => s.suspect.name || s.suspect.time).length, bytes: buffer.length });
          return result;
        } catch (e) {
          if (e instanceof BusyError) return fail(reply, 429, 'busy', () => void reply.header('Retry-After', '5'));
          if (e instanceof UnsupportedImageError) return fail(reply, 415, 'unsupported_image');
          // 模型載入失敗、推論錯誤:記 log,對使用者只說暫時不能用,前端改引導手動輸入
          req.log.error({ event: 'ocr_failed', err: e });
          return fail(reply, 503, 'ocr_unavailable');
        }
      } finally {
        inFlight.delete(userId);
      }
    });
  });
}
