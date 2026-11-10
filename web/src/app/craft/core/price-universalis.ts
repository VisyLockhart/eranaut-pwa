import { SERVERS } from '@eranaut/shared';
import { PriceError, type PriceListing, type PriceQuote, type PriceSource } from './price-types';

// Universalis(https://universalis.app)轉接器:全專案只有這個檔案認識它的 API 欄位。
// 公開 API、不需金鑰;由瀏覽器直連(D-343)。繁中服只有一個資料中心「陸行鳥」,寫成常數。
const BASE = 'https://universalis.app/api/v2';
export const DATA_CENTER = '陸行鳥';
export const LISTING_LIMIT = 10;

// 只留繁中服現行的 7 個世界。已停服的「拉姆」,Universalis 仍保留它的舊掛單,要擋掉。
const WORLDS: ReadonlySet<string> = new Set(SERVERS);

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function universalisUrl(itemId: number): string {
  return `${BASE}/${encodeURIComponent(DATA_CENTER)}/${itemId}?listings=${LISTING_LIMIT}&entries=0`;
}

/** 把 Universalis 的回應整理成 PriceQuote;欄位型別不對的掛單丟棄 */
export function parseUniversalis(itemId: number, json: unknown, fetchedAt: number): PriceQuote {
  if (typeof json !== 'object' || json === null) throw new PriceError('format');
  const o = json as Record<string, unknown>;
  if (!Array.isArray(o['listings'])) throw new PriceError('format');
  const listings: PriceListing[] = [];
  for (const raw of o['listings'] as unknown[]) {
    if (typeof raw !== 'object' || raw === null) continue;
    const l = raw as Record<string, unknown>;
    const world = l['worldName'];
    if (typeof world !== 'string' || !WORLDS.has(world)) continue;
    const { pricePerUnit, quantity, total, retainerName, hq } = l;
    if (!isNum(pricePerUnit) || !isNum(quantity) || !isNum(total)) continue;
    listings.push({
      pricePerUnit,
      quantity,
      total,
      retainerName: typeof retainerName === 'string' ? retainerName : '',
      world,
      hq: hq === true,
    });
  }
  listings.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
  const up = o['lastUploadTime'];
  return { itemId, fetchedAt, lastUploadAt: isNum(up) && up > 0 ? up : null, listings };
}

export function createUniversalisSource(fetchFn: typeof fetch = (...a) => fetch(...a), now: () => number = Date.now): PriceSource {
  return {
    async fetchQuote(itemId, signal) {
      let res: Response;
      try {
        res = await fetchFn(universalisUrl(itemId), { signal, headers: { Accept: 'application/json' } });
      } catch (e) {
        if (signal.aborted || (e as { name?: string })?.name === 'AbortError') throw e;
        throw new PriceError('network');
      }
      if (res.status === 429) throw new PriceError('rate-limit');
      if (res.status === 404) throw new PriceError('not-found');
      if (!res.ok) throw new PriceError('server', `HTTP ${res.status}`);
      let json: unknown;
      try { json = await res.json(); } catch (e) {
        if (signal.aborted || (e as { name?: string })?.name === 'AbortError') throw e;
        throw new PriceError('format');
      }
      return parseUniversalis(itemId, json, now());
    },
  };
}
