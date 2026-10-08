import { MAX_STOPS, permutations, routeCost, type RouteCost, type SeaIndex } from './route';
import type { BuildStats, SeaPoint } from './types';

// 距離型推薦(D-215):一趟走多個地點,用目前配置撈到「最多種不同的物品」。
// 每個航點拿得到的物品:低階一定有、探索 ≥ 中階門檻有中階、≥ 高階門檻有高階(與反查 `obtainableTier` 同一套)。
// 排序:不同物品種類由多到少,一樣多時航行時間短的在前。

export const VARIETY_ROUTE_LIMIT = 100;

export interface VarietyQuery {
  level: number;
  stats: Pick<BuildStats, 'surveillance' | 'speed' | 'range'>;
  sea: number | 'all';
  maxMinutes: number | null;
  limit?: number;
}

export interface VarietyRoute {
  sea: number;
  order: number[];
  cost: RouteCost;
  minutes: number;
  exp: number;
  /** 這條路線拿得到的不同物品(物品 id) */
  items: number[];
}

/** 這個探索值下,該航點能拿到的物品 id */
export function pointItems(p: SeaPoint, surveillance: number): number[] {
  return [...p.drop.low, ...(surveillance >= p.statReq.surveillanceMid ? p.drop.mid : []), ...(surveillance >= p.statReq.surveillanceHigh ? p.drop.high : [])];
}

function compare(a: VarietyRoute, b: VarietyRoute): number {
  return b.items.length - a.items.length || a.minutes - b.minutes || b.exp - a.exp || a.sea - b.sea || a.order.join().localeCompare(b.order.join(), 'en', { numeric: true });
}

export function findVarietyRoutes(seas: readonly SeaIndex[], q: VarietyQuery): VarietyRoute[] {
  const limit = q.limit ?? VARIETY_ROUTE_LIMIT;
  const { speed, range: cap, surveillance } = q.stats;
  if (!(speed > 0) || limit <= 0) return [];
  const top: VarietyRoute[] = [];
  const insert = (r: VarietyRoute): void => {
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
    const pts = si.sea.points.filter((p) => p.rankReq <= q.level).sort((a, b) => a.id - b.id);
    const n = pts.length;
    if (n === 0) continue;
    const itemSets = pts.map((p) => pointItems(p, surveillance));
    const { range: rangeM, distance: distM } = si.sea.matrix;
    const home = si.at.get(si.sea.home.id)!;
    const at = pts.map((p) => si.at.get(p.id)!);
    const pick: number[] = [];
    // 每個物品被選到幾次,DFS 進退時維護,不必每個子集重算聯集
    const count = new Map<number, number>();
    let distinct = 0;

    const evaluate = (sumRange: number, sumDist: number, sumExp: number): void => {
      const k = pick.length;
      const lbMinutes = Math.floor(sumDist / speed + 720);
      if (q.maxMinutes !== null && lbMinutes > q.maxMinutes) return;
      if (top.length >= limit) {
        const worst = top[top.length - 1]!;
        if (distinct < worst.items.length) return;
        if (distinct === worst.items.length && lbMinutes > worst.minutes) return;
      }
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
      insert({ sea: si.sea.sea, order, cost: routeCost(si, order), minutes, exp: sumExp, items: [...count.keys()].sort((a, b) => a - b) });
    };

    const add = (i: number): void => {
      for (const it of itemSets[i]!) {
        const c = count.get(it) ?? 0;
        if (c === 0) distinct++;
        count.set(it, c + 1);
      }
    };
    const remove = (i: number): void => {
      for (const it of itemSets[i]!) {
        const c = count.get(it)! - 1;
        if (c === 0) {
          count.delete(it);
          distinct--;
        } else count.set(it, c);
      }
    };

    const dfs = (start: number, sumRange: number, sumDist: number, sumExp: number): void => {
      for (let i = start; i < n; i++) {
        const p = pts[i]!;
        const r = sumRange + p.surveyRange;
        if (r > cap) continue;
        const d = sumDist + p.surveyDistance;
        if (q.maxMinutes !== null && Math.floor(d / speed + 720) > q.maxMinutes) continue;
        pick.push(i);
        add(i);
        evaluate(r, d, sumExp + p.expReward);
        if (pick.length < MAX_STOPS) dfs(i + 1, r, d, sumExp + p.expReward);
        remove(i);
        pick.pop();
      }
    };
    dfs(0, 0, 0, 0);
  }
  return top;
}
