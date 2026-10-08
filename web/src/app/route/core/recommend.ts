import { MAX_STOPS, permutations, routeCost, type RouteCost, type SeaIndex } from './route';
import type { BuildStats } from './types';

// 練級推薦(ROUTE-SIM-DESIGN D-212):用固定的配置,找出每分鐘經驗(或一趟總經驗)最高的路線。
// 每站經驗 expReward、航行時間 ⌊總距離 ÷ 速度 + 720⌋、每分鐘經驗 = 經驗總和 ÷ 航行時間,都與掉落物反查(loot.ts)同一套。

/** 每一站至少要拿得到哪一階的打撈物:any = 不限、mid = 探索 ≥ 中階門檻、high = 探索 ≥ 高階門檻 */
export type RouteTier = 'any' | 'mid' | 'high';
/** perMin = 每分鐘經驗;total = 一趟總經驗(配合航行時間上限,適合一天只派一次) */
export type ExpSort = 'perMin' | 'total';

export const EXP_ROUTE_LIMIT = 100;

export interface ExpQuery {
  level: number;
  stats: Pick<BuildStats, 'surveillance' | 'speed' | 'range'>;
  /** 只找某個海域(`SeaData.sea`);'all' = 全部海域 */
  sea: number | 'all';
  /** 航行時間上限(分鐘);null = 不限 */
  maxMinutes: number | null;
  tier: RouteTier;
  sort: ExpSort;
  limit?: number;
}

export interface ExpRoute {
  sea: number;
  /** 航行順序:在耗用不超過距離上限的排列中,航行時間最短者 */
  order: number[];
  cost: RouteCost;
  minutes: number;
  exp: number;
  /** 經驗總和 ÷ 航行時間(分鐘) */
  perMin: number;
}

const metric = (r: Pick<ExpRoute, 'perMin' | 'exp'>, sort: ExpSort): number => (sort === 'perMin' ? r.perMin : r.exp);

/** 由好到壞;分數相同時航行時間短者在前,再依海域與航點編號固定順序 */
function compare(a: ExpRoute, b: ExpRoute, sort: ExpSort): number {
  return metric(b, sort) - metric(a, sort) || a.minutes - b.minutes || a.sea - b.sea || a.order.join().localeCompare(b.order.join(), 'en', { numeric: true });
}

/**
 * 列舉每個海域裡 1~5 個航點的組合,留下前 `limit` 條。
 * 剪枝:航點依序加入,耗用的下界(Σ 各站 surveyRange)超過距離上限就整枝丟掉;
 * 航行時間的下界(Σ 各站 surveyDistance,不含路段)超過時間上限也整枝丟掉;
 * 目前的前 `limit` 名已滿時,分數上界低於第 `limit` 名的組合不必再試排列。
 */
export function findExpRoutes(seas: readonly SeaIndex[], q: ExpQuery): ExpRoute[] {
  const limit = q.limit ?? EXP_ROUTE_LIMIT;
  const { speed, range: cap, surveillance } = q.stats;
  if (!(speed > 0) || limit <= 0) return [];
  const top: ExpRoute[] = [];
  const insert = (r: ExpRoute): void => {
    let lo = 0;
    let hi = top.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (compare(top[mid]!, r, q.sort) <= 0) lo = mid + 1;
      else hi = mid;
    }
    top.splice(lo, 0, r);
    if (top.length > limit) top.pop();
  };

  for (const si of seas) {
    if (q.sea !== 'all' && si.sea.sea !== q.sea) continue;
    const pts = si.sea.points
      .filter((p) => {
        if (p.rankReq > q.level) return false;
        if (q.tier === 'mid') return surveillance >= p.statReq.surveillanceMid;
        if (q.tier === 'high') return surveillance >= p.statReq.surveillanceHigh;
        return true;
      })
      .sort((a, b) => a.id - b.id);
    const n = pts.length;
    if (n === 0) continue;
    const { range: rangeM, distance: distM } = si.sea.matrix;
    const home = si.at.get(si.sea.home.id)!;
    const at = pts.map((p) => si.at.get(p.id)!);
    const pick: number[] = [];

    const evaluate = (sumRange: number, sumDist: number, sumExp: number): void => {
      const k = pick.length;
      const lbMinutes = Math.floor(sumDist / speed + 720);
      if (q.maxMinutes !== null && lbMinutes > q.maxMinutes) return;
      if (top.length >= limit) {
        const worst = top[top.length - 1]!;
        const ub = q.sort === 'perMin' ? sumExp / lbMinutes : sumExp;
        if (ub < metric(worst, q.sort)) return;
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
      insert({ sea: si.sea.sea, order, cost: routeCost(si, order), minutes, exp: sumExp, perMin: sumExp / minutes });
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
