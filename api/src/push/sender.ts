import webpush from 'web-push';
import type { PushConfig } from '../config.js';
import { SendError } from '../discord/sender.js';

// 瀏覽器推播發送端(D-165):用 Web Push(VAPID)。以介面注入,測試用假實作。
// 訊息格式是 Angular service worker 內建支援的 `{ notification: {...} }`:
// 瀏覽器收到後由 ngsw 直接顯示通知,點擊時依 `data.onActionClick` 開啟或聚焦網站,不需要自己寫 service worker 程式。

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushNotification {
  title: string;
  body: string;
  /** 同 tag 的新通知取代舊的(同一艘或同一間工坊重複提醒時不堆疊) */
  tag: string;
}

/**
 * 發送失敗的分類:沿用 `SendError`(`retry` / `rate_limited` / `permanent`),另以 `gone` 旗標標示「訂閱已失效」
 * (推播服務回 404 或 410:使用者撤銷了權限、重新安裝或清除網站資料),呼叫端要刪掉那筆訂閱。
 */
export class PushSendError extends SendError {
  constructor(
    message: string,
    kind: 'retry' | 'rate_limited' | 'permanent',
    readonly gone: boolean,
    retryAfterMs?: number,
  ) {
    super(message, kind, retryAfterMs);
    this.name = 'PushSendError';
  }
}

export interface PushSender {
  send(target: PushTarget, n: PushNotification): Promise<void>;
}

/** 通知存活時間:推播服務在裝置離線時最多代為保留這麼久(與「晚超過 30 分鐘視為錯過」一致,D-129) */
export const PUSH_TTL_SECONDS = 30 * 60;
const TIMEOUT_MS = 10_000;

export function createPushSender(config: PushConfig): PushSender {
  return {
    async send(target, n) {
      const payload = JSON.stringify({
        notification: {
          title: n.title,
          body: n.body,
          tag: n.tag,
          renotify: true, // 同 tag 取代舊通知時仍要提醒(否則 Chrome 會靜默替換,等於沒通知)
          lang: 'zh-TW',
          icon: '/icons/icon-192.png',
          data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: '/' } } },
        },
      });
      try {
        await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, payload, {
          vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey },
          TTL: PUSH_TTL_SECONDS,
          urgency: 'high',
          timeout: TIMEOUT_MS,
        });
      } catch (e) {
        const err = e as { statusCode?: number; headers?: Record<string, string>; message?: string; code?: unknown };
        const status = err.statusCode;
        if (status === undefined) {
          // 沒有 HTTP 狀態:有系統錯誤碼(ECONNRESET、ETIMEDOUT…)或逾時是網路問題,可重試;
          // 其餘(例如金鑰格式無效,web-push 在送出前就丟錯)重試也不會成功,直接標記失敗
          const network = typeof err.code === 'string' || /timeout|timed out/i.test(err.message ?? '');
          throw new PushSendError(`${network ? '網路錯誤或逾時' : '無法送出'}:${err.message ?? e}`, network ? 'retry' : 'permanent', false);
        }
        if (status === 404 || status === 410) throw new PushSendError(`訂閱已失效(HTTP ${status})`, 'permanent', true);
        if (status === 429) {
          const seconds = Number(err.headers?.['retry-after']);
          throw new PushSendError('被推播服務限速(429)', 'rate_limited', false, Math.ceil((Number.isFinite(seconds) && seconds > 0 ? seconds : 1) * 1000));
        }
        throw new PushSendError(`推播服務回應 HTTP ${status}`, status >= 500 ? 'retry' : 'permanent', false);
      }
    },
  };
}
