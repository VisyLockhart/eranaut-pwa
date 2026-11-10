import { PriceError, type PriceQuote, type PriceSource } from './price-types';

// 查價服務(D-343):同物品短時間快取、進行中請求合併、逾時、重試、可中止。
// 只放記憶體,不存硬碟(沿用 R-50 精神:不讓人看到過期價格卻不知道)。與框架無關,方便測試。
export interface PriceServiceOptions {
  readonly ttlMs?: number;
  readonly timeoutMs?: number;
  /** 網路錯誤 / 5xx 的重試次數(429 與逾時不重試) */
  readonly retries?: number;
  readonly retryDelayMs?: number;
  readonly now?: () => number;
  readonly sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
}

const abortError = () => new DOMException('Aborted', 'AbortError');
export const isAbortError = (e: unknown): boolean => (e as { name?: string } | null)?.name === 'AbortError';

const defaultSleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const t = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
    const onAbort = () => { clearTimeout(t); reject(abortError()); };
    signal.addEventListener('abort', onAbort, { once: true });
  });

interface InFlight { readonly promise: Promise<PriceQuote>; readonly controller: AbortController; subs: number }

export class PriceService {
  private readonly ttl: number;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  private readonly cache = new Map<number, { quote: PriceQuote; expires: number }>();
  private readonly inflight = new Map<number, InFlight>();

  constructor(private readonly source: PriceSource, opts: PriceServiceOptions = {}) {
    this.ttl = opts.ttlMs ?? 3 * 60_000;
    this.timeout = opts.timeoutMs ?? 8_000;
    this.retries = opts.retries ?? 1;
    this.retryDelay = opts.retryDelayMs ?? 400;
    this.now = opts.now ?? Date.now;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  /** 取價:快取內直接回;否則查詢(同物品進行中的請求合併)。`signal` 中止時丟出 AbortError */
  get(itemId: number, signal?: AbortSignal): Promise<PriceQuote> {
    const hit = this.cache.get(itemId);
    if (hit && hit.expires > this.now()) return Promise.resolve(hit.quote);
    return this.join(itemId, signal);
  }

  /** 略過快取重新查詢(「重新查詢」鈕) */
  refresh(itemId: number, signal?: AbortSignal): Promise<PriceQuote> {
    this.cache.delete(itemId);
    return this.join(itemId, signal);
  }

  private join(itemId: number, signal?: AbortSignal): Promise<PriceQuote> {
    if (signal?.aborted) return Promise.reject(abortError());
    let f = this.inflight.get(itemId);
    if (!f) {
      const controller = new AbortController();
      const promise = this.run(itemId, controller.signal).then(
        (q) => { this.cache.set(itemId, { quote: q, expires: this.now() + this.ttl }); return q; },
      ).finally(() => { if (this.inflight.get(itemId) === f) this.inflight.delete(itemId); });
      promise.catch(() => undefined); // 全部訂閱者都中止時不產生未處理的 rejection
      f = { promise, controller, subs: 0 };
      this.inflight.set(itemId, f);
    }
    const flight = f;
    flight.subs++;
    return new Promise<PriceQuote>((resolve, reject) => {
      let done = false;
      const leave = () => {
        if (done) return;
        done = true;
        signal?.removeEventListener('abort', onAbort);
        if (--flight.subs === 0) { flight.controller.abort(); if (this.inflight.get(itemId) === flight) this.inflight.delete(itemId); }
      };
      const onAbort = () => { const was = done; leave(); if (!was) reject(abortError()); };
      signal?.addEventListener('abort', onAbort, { once: true });
      flight.promise.then(
        (q) => { if (!done) { done = true; signal?.removeEventListener('abort', onAbort); resolve(q); } },
        (e) => { if (!done) { done = true; signal?.removeEventListener('abort', onAbort); reject(e); } },
      );
    });
  }

  private async run(itemId: number, signal: AbortSignal): Promise<PriceQuote> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.attempt(itemId, signal);
      } catch (e) {
        const retryable = e instanceof PriceError && (e.kind === 'network' || e.kind === 'server');
        if (!retryable || attempt >= this.retries) throw e;
        await this.sleep(this.retryDelay, signal);
      }
    }
  }

  private async attempt(itemId: number, outer: AbortSignal): Promise<PriceQuote> {
    const ctl = new AbortController();
    let timedOut = false;
    const onOuter = () => ctl.abort();
    outer.addEventListener('abort', onOuter, { once: true });
    const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, this.timeout);
    try {
      return await this.source.fetchQuote(itemId, ctl.signal);
    } catch (e) {
      if (timedOut && !outer.aborted) throw new PriceError('timeout');
      throw e;
    } finally {
      clearTimeout(timer);
      outer.removeEventListener('abort', onOuter);
    }
  }
}
