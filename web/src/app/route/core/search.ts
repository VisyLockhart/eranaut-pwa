import { buildStats, PART_GRADE_COUNT } from './build';
import type { Build, BuildStats, Tables } from './types';

// 配置搜尋(ROUTE-SIM.md §5 第 8 點):4 零件各 10 種共 10⁴ 組,篩「性能 ≥ 最低要求」且「重量 ≤ 上限」。

export const SEARCH_LIMIT = 300;

export interface SearchMins {
  surveillance: number;
  retrieval: number;
  speed: number;
  range: number;
  favor: number;
}

export type SearchSort = 'time' | 'range';

export interface SearchOptions {
  level: number;
  mins: SearchMins;
  /** 重量上限;未給或超過該等級上限時取該等級上限 */
  weightLimit?: number;
  sort?: SearchSort;
  /** 排序為 'time' 時用:路線總距離(速度越快越好);未給時 'time' 退回依速度由大到小 */
  routeDistance?: number;
  limit?: number;
}

export interface SearchHit {
  build: Build;
  stats: BuildStats;
}

export interface SearchResult {
  /** 符合條件的總組數(不受 limit 影響) */
  total: number;
  hits: SearchHit[];
}

export function searchBuilds(tables: Tables, opt: SearchOptions): SearchResult {
  const limit = opt.limit ?? SEARCH_LIMIT;
  const hits: SearchHit[] = [];
  let total = 0;
  for (let a = 1; a <= PART_GRADE_COUNT; a++)
    for (let b = 1; b <= PART_GRADE_COUNT; b++)
      for (let c = 1; c <= PART_GRADE_COUNT; c++)
        for (let d = 1; d <= PART_GRADE_COUNT; d++) {
          const build: Build = { level: opt.level, parts: [a, b, c, d] };
          const s = buildStats(tables, build);
          const cap = Math.min(s.weightCap, opt.weightLimit ?? s.weightCap);
          if (s.weight > cap) continue;
          if (s.surveillance < opt.mins.surveillance || s.retrieval < opt.mins.retrieval || s.speed < opt.mins.speed) continue;
          if (s.range < opt.mins.range || s.favor < opt.mins.favor) continue;
          total++;
          hits.push({ build, stats: s });
        }
  const sort = opt.sort ?? 'time';
  const key = (h: SearchHit): number[] => {
    if (sort === 'range') return [h.stats.range, h.stats.weight];
    return [opt.routeDistance === undefined ? -h.stats.speed : Math.floor(opt.routeDistance / h.stats.speed + 720), h.stats.weight];
  };
  // 'range' 依距離性能由小到大(越省越好)不合理 → 由大到小;其餘由小到大
  const dir = sort === 'range' ? -1 : 1;
  hits.sort((x, y) => {
    const kx = key(x);
    const ky = key(y);
    for (let i = 0; i < kx.length; i++) {
      const diff = (kx[i]! - ky[i]!) * (i === 0 ? dir : 1);
      if (diff !== 0) return diff;
    }
    return x.build.parts.join().localeCompare(y.build.parts.join());
  });
  return { total, hits: hits.slice(0, limit) };
}
