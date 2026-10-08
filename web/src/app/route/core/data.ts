import partsJson from '../data/parts.json';
import ranksJson from '../data/ranks.json';
import seasJson from '../data/seas.json';
import itemsJson from '../data/items.json';
import { indexSea, type SeaIndex } from './route';
import type { PartsData, RankRow, SeaData, Tables } from './types';

// 資料集(CC BY-NC-SA 3.0,見 ../data/NOTICE.md)打包進航線頁的 lazy chunk(RS-24)。

export const SEAS: readonly SeaData[] = (seasJson as unknown as { seas: SeaData[] }).seas;
export const SEA_INDEXES: readonly SeaIndex[] = SEAS.map(indexSea);

export const TABLES: Tables = {
  parts: partsJson as unknown as PartsData,
  ranks: (ranksJson as unknown as { ranks: RankRow[] }).ranks,
};

export const MAX_LEVEL = Math.max(...TABLES.ranks.map((r) => r.rank));

export interface ItemInfo {
  name: string;
  /** 分類代碼(categories 的鍵),無分類為 null */
  cat: string | null;
}

export const ITEMS: Readonly<Record<string, ItemInfo>> = (itemsJson as unknown as { items: Record<string, ItemInfo> }).items;
export const ITEM_CATEGORIES: Readonly<Record<string, string>> = (itemsJson as unknown as { categories: Record<string, string> }).categories;

export function seaIndex(sea: number): SeaIndex {
  const si = SEA_INDEXES.find((s) => s.sea.sea === sea);
  if (!si) throw new Error(`沒有海域 ${sea}`);
  return si;
}
