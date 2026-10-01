import type { AppConfig } from '../config.js';

// 提醒發送端:透過 Discord REST 發送,不另開第二條 gateway(D-129)。以介面注入,測試用假實作。

export type SendTarget =
  | { method: 'dm'; discordUserId: string }
  | { method: 'channel'; discordUserId: string; channelId: string };

export interface ReminderSender {
  send(target: SendTarget, content: string): Promise<void>;
}

/**
 * 發送失敗的分類(D-129):
 * - `retry`:5xx、網路錯誤、逾時 → 重試
 * - `rate_limited`:429 → 依 `retryAfterMs` 等待,不算一次失敗
 * - `permanent`:其他 4xx(使用者關閉 DM、封鎖 bot、已離開伺服器、頻道不存在或無權限…)→ 不重試
 */
export class SendError extends Error {
  constructor(
    message: string,
    readonly kind: 'retry' | 'rate_limited' | 'permanent',
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'SendError';
  }
}

const API = 'https://discord.com/api/v10';
const TIMEOUT_MS = 10_000;

export function createReminderSender(config: AppConfig, fetchImpl: typeof fetch = fetch): ReminderSender {
  async function call(path: string, body: unknown): Promise<unknown> {
    let res: Response;
    try {
      res = await fetchImpl(`${API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bot ${config.discord.botToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      throw new SendError(`網路錯誤或逾時:${(e as Error).message}`, 'retry');
    }
    if (res.ok) return res.json();

    const text = await res.text().catch(() => '');
    let code: number | undefined;
    let retryAfter: number | undefined;
    try {
      const j = JSON.parse(text) as { code?: number; retry_after?: number };
      code = j.code;
      retryAfter = j.retry_after;
    } catch {
      /* 非 JSON 回應 */
    }
    if (res.status === 429) {
      const header = Number(res.headers.get('retry-after'));
      const seconds = retryAfter ?? (Number.isFinite(header) && header > 0 ? header : 1);
      throw new SendError(`被限速(429),${seconds} 秒後重試`, 'rate_limited', Math.ceil(seconds * 1000));
    }
    const detail = `HTTP ${res.status}${code !== undefined ? `(Discord code ${code})` : ''}`;
    throw new SendError(detail, res.status >= 500 ? 'retry' : 'permanent');
  }

  return {
    async send(target, content) {
      if (target.method === 'dm') {
        const ch = (await call('/users/@me/channels', { recipient_id: target.discordUserId })) as { id?: string };
        if (!ch.id) throw new SendError('建立 DM 頻道的回應沒有 id', 'retry');
        // DM 不需要任何提及
        await call(`/channels/${ch.id}/messages`, { content, allowed_mentions: { parse: [] } });
      } else {
        // 頻道是公開訊息:只允許提及該使用者,不會觸發 @everyone 或身份組提及
        await call(`/channels/${target.channelId}/messages`, { content, allowed_mentions: { parse: [], users: [target.discordUserId] } });
      }
    },
  };
}
