import { MAX_STOPS, permutations, routeCost, type RouteCost, type SeaIndex } from './route';
import type { BuildStats } from './types';
import { isAvailable, type UnlockGraph } from './unlock';

// 探索推薦(D-213):去過的點記在「去過哪些航點」,只有現在可以去的點(上一個點去過、還沒去過)才會出現在路線裡;
// 排序用「這趟回來之後會開出幾個新航點」,一樣多時航行時間短的在前。

export const EXPLORE_ROUTE_LIMIT = 100;

export interface ExploreQuery {
  level: number;
  stats: Pick<BuildStats, 'speed' | 'range'>;
  sea: number | 'all';
  maxMinutes: number | null;
  explored: ReadonlySet<number>;
  limit?: number;
}

export interface ExploreRoute {
  sea: number;
  order: number[];
  cost: RouteCost;
  minutes: number;
  exp: number;
  /** 回來之後新解鎖的航點(可能在下一個海域) */
  opens: number[];
}

function compare(a: ExploreRoute, b: ExploreRoute): number {
  return (
    b.opens.length - a.opens.length ||
    a.minutes - b.minutes ||
    b.exp - a.exp ||
    a.sea - b.sea ||
    a.order.join().localeCompare(b.order.join(), 'en', { numeric: true })
  );
}

/** 這些點全部去過之後,新解鎖的點(不重複、依航行順序排列) */
export function opensOf(g: UnlockGraph, order: readonly number[]): number[] {
  const out: number[] = [];
  for (const id of order) for (const c of g.children.get(id) ?? []) if (!out.includes(c)) out.push(c);
  return out;
}

export function findExploreRoutes(seas: readonly SeaIndex[], g: UnlockGraph, q: ExploreQuery): ExploreRoute[] {
  const limit = q.limit ?? EXPLORE_ROUTE_LIMIT;
  const { speed, range: cap } = q.stats;
  if (!(speed > 0) || limit <= 0) return [];
  const top: ExploreRoute[] = [];
  const insert = (r: ExploreRoute): void => {
    let lo = 0;
    let hi = top.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (compare(top[mid]!, r) <= 0) lo = mid + 1;
      else hi = mid;
    }
    top.splice(lo, 0, r);
    if (top.length > limit) top.pop();
  };

  for (const si of seas) {
    if (q.sea !== 'all' && si.sea.sea !== q.sea) continue;
    const pts = si.sea.points.filter((p) => p.rankReq <= q.level && isAvailable(g, q.explored, p.id)).sort((a, b) => a.id - b.id);
    const n = pts.length;
    if (n === 0) continue;
    const { range: rangeM, distance: distM } = si.sea.matrix;
    const home = si.at.get(si.sea.home.id)!;
    const at = pts.map((p) => si.at.get(p.id)!);
    const pick: number[] = [];

    const evaluate = (sumRange: number, sumDist: number, sumExp: number): void => {
      const k = pick.length;
      let bestDist = Infinity;
      let bestPerm: number[] | null = null;
      for (const perm of permutations(k)) {
        let prev = home;
        let r = sumRange;
        let d = sumDist;
        for (let j = 0; j < k; j++) {
          const cur = at[pick[perm[j]!]!]!;
          r += rangeM[prev]![cur]!;
          d += distM[prev]![cur]!;
          prev = cur;
        }
        if (r <= cap && d < bestDist) {
          bestDist = d;
          bestPerm = perm;
        }
      }
      if (!bestPerm) return;
      const minutes = Math.floor(bestDist / speed + 720);
      if (q.maxMinutes !== null && minutes > q.maxMinutes) return;
      const order = bestPerm.map((j) => pts[pick[j]!]!.id);
      insert({ sea: si.sea.sea, order, cost: routeCost(si, order), minutes, exp: sumExp, opens: opensOf(g, order) });
    };

    const dfs = (start: number, sumRange: number, sumDist: number, sumExp: number): void => {
      for (let i = start; i < n; i++) {
        const p = pts[i]!;
        const r = sumRange + p.surveyRange;
        if (r > cap) continue;
        const d = sumDist + p.surveyDistance;
        if (q.maxMinutes !== null && Math.floor(d / speed + 720) > q.maxMinutes) continue;
        pick.push(i);
        evaluate(r, d, sumExp + p.expReward);
        if (pick.length < MAX_STOPS) dfs(i + 1, r, d, sumExp + p.expReward);
        pick.pop();
      }
    };
    dfs(0, 0, 0, 0);
  }
  return top;
}
