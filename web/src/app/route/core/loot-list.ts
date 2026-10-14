import { compareNames } from '../../core/name-sort';
import { ITEMS } from './data';
import { lootTiers, TIER_LABEL, type TierKey } from './need';
import type { SeaPoint } from './types';

export interface LootEntry {
  id: number;
  name: string;
  /** 撈到它的航點代號(依航行順序、不重複);未解鎖的項目是「差最少的那一階」的來源 */
  stops: string[];
  /** 未解鎖項目:探索值還差多少(取各來源最小);已解鎖為 0 */
  gap: number;
  /** 是不是使用者指定要找的物品 */
  wanted: boolean;
}

export interface LootSection {
  key: TierKey;
  label: string;
  locked: boolean;
  items: LootEntry[];
}

const RANK: Record<TierKey, number> = { low: 1, mid: 2, high: 3 };
const BY_RANK: TierKey[] = ['low', 'low', 'mid', 'high'];

interface Source {
  rank: number;
  code: string;
  gap: number;
}

/**
 * 一條路線的打撈物清單(D-263,「看全部」):依 高 → 中 → 低 分段,最後接「未解鎖」(高 → 中)。
 * 同一個物品只出現一次:只要有任何一站已解鎖就算已解鎖,放在它已解鎖來源中最高的那一階,
 * 並列出所有已解鎖的來源站;完全沒有已解鎖來源的才進「未解鎖」,放在最高那一階,標出差多少。
 * 段內依 `compareNames`(已解鎖段內,指定的物品排最前)。已解鎖的種類數與 `pointItems` 的聯集相同。
 */
export function aggregateLoot(points: readonly SeaPoint[], surveillance: number, wanted: ReadonlySet<number> = new Set()): LootSection[] {
  const open = new Map<number, Source[]>();
  const shut = new Map<number, Source[]>();
  for (const p of points) {
    const t = lootTiers(p, surveillance);
    for (const key of ['low', 'mid', 'high'] as const) {
      const tier = t[key];
      const into = tier.locked ? shut : open;
      for (const id of tier.ids) {
        const list = into.get(id) ?? [];
        list.push({ rank: RANK[key], code: p.code, gap: tier.gap });
        into.set(id, list);
      }
    }
  }
  const entry = (id: number, src: Source[], locked: boolean): { rank: number; e: LootEntry } => {
    const rank = Math.max(...src.map((x) => x.rank));
    const top = locked ? src.filter((x) => x.rank === rank) : src;
    const stops = [...new Set(top.map((x) => x.code))];
    const gap = locked ? Math.min(...top.map((x) => x.gap)) : 0;
    return { rank, e: { id, name: ITEMS[String(id)]?.name ?? `物品 ${id}`, stops, gap, wanted: !locked && wanted.has(id) } };
  };
  const buckets = new Map<string, LootEntry[]>();
  const put = (k: string, e: LootEntry): void => void buckets.set(k, [...(buckets.get(k) ?? []), e]);
  for (const [id, src] of open) {
    const { rank, e } = entry(id, src, false);
    put(`o${rank}`, e);
  }
  for (const [id, src] of shut) {
    if (open.has(id)) continue;
    const { rank, e } = entry(id, src, true);
    put(`l${rank}`, e);
  }
  const out: LootSection[] = [];
  for (const [locked, ranks] of [[false, [3, 2, 1]], [true, [3, 2]]] as const) {
    for (const rank of ranks) {
      const items = buckets.get(`${locked ? 'l' : 'o'}${rank}`);
      if (!items?.length) continue;
      const key = BY_RANK[rank]!;
      items.sort((a, b) => Number(b.wanted) - Number(a.wanted) || compareNames(a.name, b.name));
      out.push({ key, label: TIER_LABEL[key], locked, items });
    }
  }
  return out;
}
