import { describe, expect, it } from 'vitest';
import { SERVERS } from '@eranaut/shared';
import { PriceError } from './price-types';
import { createUniversalisSource, parseUniversalis, universalisUrl } from './price-universalis';

const listing = (o: Record<string, unknown> = {}) => ({
  pricePerUnit: 118, quantity: 90, total: 10620, worldName: '巴哈姆特', worldID: 4035, retainerName: '芳吉', hq: false, ...o,
});
const res = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('Universalis 轉接器(D-343)', () => {
  it('網址:資料中心「陸行鳥」、listings=10、entries=0', () => {
    expect(universalisUrl(5116)).toBe('https://universalis.app/api/v2/%E9%99%B8%E8%A1%8C%E9%B3%A5/5116?listings=10&entries=0');
  });

  it('整理欄位:單價 / 數量 / 總計 / 雇員 / 伺服器 / HQ,並帶出最新上傳時間', () => {
    const q = parseUniversalis(5116, { lastUploadTime: 1731200000000, listings: [listing({ hq: true })] }, 42);
    expect(q).toEqual({
      itemId: 5116, fetchedAt: 42, lastUploadAt: 1731200000000,
      listings: [{ pricePerUnit: 118, quantity: 90, total: 10620, retainerName: '芳吉', world: '巴哈姆特', hq: true }],
    });
  });

  it('只留繁中服 7 個世界;已停服的拉姆被擋掉', () => {
    const q = parseUniversalis(1, { listings: [listing({ worldName: '拉姆', pricePerUnit: 1 }), ...SERVERS.map((w, i) => listing({ worldName: w, pricePerUnit: 100 + i }))] }, 0);
    expect(q.listings.map((l) => l.world)).toEqual([...SERVERS]);
  });

  it('濾掉後不足 10 筆就少列;全部濾掉是空陣列', () => {
    const q = parseUniversalis(1, { listings: [listing({ worldName: '拉姆' }), listing()] }, 0);
    expect(q.listings).toHaveLength(1);
    expect(parseUniversalis(1, { listings: [listing({ worldName: '拉姆' })] }, 0).listings).toEqual([]);
  });

  it('依單價由低到高排序(同價維持原順序)', () => {
    const q = parseUniversalis(1, { listings: [listing({ pricePerUnit: 135, retainerName: 'c' }), listing({ pricePerUnit: 118, retainerName: 'a' }), listing({ pricePerUnit: 118, retainerName: 'b' })] }, 0);
    expect(q.listings.map((l) => l.retainerName)).toEqual(['a', 'b', 'c']);
  });

  it('欄位型別不對的掛單丟棄;沒有 lastUploadTime 為 null', () => {
    const q = parseUniversalis(1, { listings: [listing({ pricePerUnit: '118' }), listing({ quantity: null }), listing({ total: NaN }), null, 5, listing()] }, 0);
    expect(q.listings).toHaveLength(1);
    expect(q.lastUploadAt).toBeNull();
  });

  it('回應不是物件或沒有 listings 陣列 → format 錯誤', () => {
    for (const bad of [null, 'x', 5, {}, { listings: 'no' }]) expect(() => parseUniversalis(1, bad, 0)).toThrow(PriceError);
    try { parseUniversalis(1, {}, 0); } catch (e) { expect((e as PriceError).kind).toBe('format'); }
  });

  it('HTTP 狀態對應:429 rate-limit、404 not-found、5xx server、連不上 network、壞 JSON format', async () => {
    const kind = async (f: typeof fetch) => {
      try { await createUniversalisSource(f).fetchQuote(1, new AbortController().signal); return 'ok'; } catch (e) { return (e as PriceError).kind; }
    };
    expect(await kind(async () => res(429, {}))).toBe('rate-limit');
    expect(await kind(async () => res(404, {}))).toBe('not-found');
    expect(await kind(async () => res(503, {}))).toBe('server');
    expect(await kind(async () => { throw new TypeError('Failed to fetch'); })).toBe('network');
    expect(await kind(async () => new Response('<html>', { status: 200 }))).toBe('format');
    expect(await kind(async () => res(200, { listings: [] }))).toBe('ok');
  });

  it('使用 now() 當查詢時間,並把 signal 傳給 fetch;中止時原樣丟出 AbortError', async () => {
    let seen: RequestInit | undefined;
    const src = createUniversalisSource(async (_u, init) => { seen = init; return res(200, { listings: [] }); }, () => 777);
    const ctl = new AbortController();
    expect((await src.fetchQuote(1, ctl.signal)).fetchedAt).toBe(777);
    expect(seen?.signal).toBe(ctl.signal);

    ctl.abort();
    const aborting = createUniversalisSource(async () => { throw new DOMException('Aborted', 'AbortError'); });
    await expect(aborting.fetchQuote(1, ctl.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
