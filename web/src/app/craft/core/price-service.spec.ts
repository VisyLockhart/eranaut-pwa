import { afterEach, describe, expect, it, vi } from 'vitest';
import { PriceService, isAbortError } from './price-service';
import { PriceError, type PriceQuote, type PriceSource } from './price-types';

const quote = (itemId: number, n = 0): PriceQuote => ({ itemId, fetchedAt: n, lastUploadAt: null, listings: [] });
const noSleep = () => Promise.resolve();

/** 可控的假來源:每次呼叫記錄,由測試決定何時回應 */
function manualSource() {
  const calls: { id: number; signal: AbortSignal; resolve: (q: PriceQuote) => void; reject: (e: unknown) => void }[] = [];
  const source: PriceSource = {
    fetchQuote: (id, signal) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      calls.push({ id, signal, resolve, reject });
    }),
  };
  return { source, calls };
}

afterEach(() => { vi.useRealTimers(); });

describe('PriceService(D-343)', () => {
  it('快取:TTL 內不重查,過期後重查;refresh 略過快取', async () => {
    let t = 0, n = 0;
    const source: PriceSource = { fetchQuote: async (id) => quote(id, ++n) };
    const s = new PriceService(source, { ttlMs: 1000, now: () => t, sleep: noSleep });
    expect((await s.get(5116)).fetchedAt).toBe(1);
    t = 999; expect((await s.get(5116)).fetchedAt).toBe(1);
    t = 1000; expect((await s.get(5116)).fetchedAt).toBe(2);
    expect((await s.refresh(5116)).fetchedAt).toBe(3);
    expect((await s.get(5106)).fetchedAt).toBe(4); // 不同物品各自快取
  });

  it('失敗不進快取', async () => {
    let fail = true;
    const source: PriceSource = { fetchQuote: async (id) => { if (fail) throw new PriceError('rate-limit'); return quote(id); } };
    const s = new PriceService(source, { sleep: noSleep });
    await expect(s.get(1)).rejects.toMatchObject({ kind: 'rate-limit' });
    fail = false;
    await expect(s.get(1)).resolves.toMatchObject({ itemId: 1 });
  });

  it('同物品進行中的請求合併成一次', async () => {
    const { source, calls } = manualSource();
    const s = new PriceService(source);
    const a = s.get(7), b = s.get(7);
    expect(calls).toHaveLength(1);
    calls[0]!.resolve(quote(7, 9));
    expect((await a).fetchedAt).toBe(9);
    expect((await b).fetchedAt).toBe(9);
  });

  it('網路錯誤與 5xx 重試 1 次;429 與格式錯誤不重試', async () => {
    for (const [kind, expectCalls] of [['network', 2], ['server', 2], ['rate-limit', 1], ['format', 1], ['not-found', 1]] as const) {
      let calls = 0;
      const source: PriceSource = { fetchQuote: async () => { calls++; throw new PriceError(kind); } };
      const s = new PriceService(source, { sleep: noSleep });
      await expect(s.get(1)).rejects.toMatchObject({ kind });
      expect(calls, kind).toBe(expectCalls);
    }
  });

  it('第一次失敗、重試成功就回成功', async () => {
    let calls = 0;
    const source: PriceSource = { fetchQuote: async (id) => { if (++calls === 1) throw new PriceError('network'); return quote(id); } };
    await expect(new PriceService(source, { sleep: noSleep }).get(3)).resolves.toMatchObject({ itemId: 3 });
    expect(calls).toBe(2);
  });

  it('逾時:超過 timeoutMs 丟 timeout,且不重試', async () => {
    vi.useFakeTimers();
    const { source, calls } = manualSource();
    const s = new PriceService(source, { timeoutMs: 8000 });
    const p = s.get(1);
    const assertion = expect(p).rejects.toMatchObject({ kind: 'timeout' });
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
    expect(calls).toHaveLength(1);
    expect(calls[0]!.signal.aborted).toBe(true);
  });

  it('呼叫端中止:丟 AbortError,並中止底層請求', async () => {
    const { source, calls } = manualSource();
    const s = new PriceService(source);
    const ctl = new AbortController();
    const p = s.get(1, ctl.signal);
    ctl.abort();
    await expect(p).rejects.toSatisfy(isAbortError);
    expect(calls[0]!.signal.aborted).toBe(true);
    // 中止後可以重新查
    const p2 = s.get(1);
    expect(calls).toHaveLength(2);
    calls[1]!.resolve(quote(1));
    await expect(p2).resolves.toBeTruthy();
  });

  it('合併中的請求:一人中止不影響另一人;全部中止才中止底層', async () => {
    const { source, calls } = manualSource();
    const s = new PriceService(source);
    const c1 = new AbortController(), c2 = new AbortController();
    const a = s.get(1, c1.signal), b = s.get(1, c2.signal);
    c1.abort();
    await expect(a).rejects.toSatisfy(isAbortError);
    expect(calls[0]!.signal.aborted).toBe(false);
    calls[0]!.resolve(quote(1, 5));
    expect((await b).fetchedAt).toBe(5);

    const { source: s2, calls: calls2 } = manualSource();
    const svc = new PriceService(s2);
    const d1 = new AbortController(), d2 = new AbortController();
    const x = svc.get(2, d1.signal), y = svc.get(2, d2.signal);
    d1.abort(); d2.abort();
    await expect(x).rejects.toSatisfy(isAbortError);
    await expect(y).rejects.toSatisfy(isAbortError);
    expect(calls2[0]!.signal.aborted).toBe(true);
  });

  it('已中止的 signal 直接拒絕,不發請求', async () => {
    const { source, calls } = manualSource();
    const ctl = new AbortController(); ctl.abort();
    await expect(new PriceService(source).get(1, ctl.signal)).rejects.toSatisfy(isAbortError);
    expect(calls).toHaveLength(0);
  });
});
