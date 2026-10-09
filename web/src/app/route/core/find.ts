import { MAX_STOPS, permutations, routeCost, shortestOrder, type RouteCost, type SeaIndex } from './route';
import type { BuildStats, SeaPoint } from './types';
import { isAvailable, type UnlockGraph } from './unlock';

// 統一的找路線引擎(D-222):取代練級(recommend.ts)、探索(explore.ts)、距離(variety.ts)、掉落(loot.ts)四支引擎。
// 條件 = 過濾(必選 / 排除航點、海域、最長航行時間、指定物品);排序 = 每分鐘經驗 / 可能解鎖數 / 最多物品 三選一。
// 路線只在單一海域內,所以「必選航點」是各海域各自 AND、結果取聯集(見 `searchSeas`)。
// 航行順序:在耗用不超過距離上限的排列中,總距離(航行時間)最短者。

export const FIND_ROUTE_LIMIT = 100;

/** perMin = 每分鐘經驗(練級);opens = 回來後可能解鎖的新航點數(探索);variety = 撈得到的不同物品種類數(最多物品) */
export type FindSort = 'perMin' | 'opens' | 'variety';

export interface FindQuery {
  level: number;
  stats: Pick<BuildStats, 'surveillance' | 'speed' | 'range'>;
  /** 只找某個海域(`SeaData.sea`);'all' = 全部海域 */
  sea: number | 'all';
  /** 航行時間上限(分鐘);null = 不限 */
  maxMinutes: number | null;
  sort: FindSort;
  /** 必選航點(航點 id):該海域的路線必須全部包含 */
  required: ReadonlySet<number>;
  /** 排除航點(航點 id):任何海域的路線都不能包含 */
  excluded: ReadonlySet<number>;
  /** 指定物品(物品 id);空 = 不指定 */
  itemIds: readonly number[];
  /** all = 路線要拿得到全部指定物品;any = 任一個即可 */
  match: 'all' | 'any';
  /** 去過的航點與解鎖樹:排序為 opens 時用來決定「可去的點」與新解鎖的點 */
  explored: ReadonlySet<number>;
  graph: UnlockGraph;
  limit?: number;
}

export interface FindRoute {
  sea: number;
  /** 航行順序 */
  order: number[];
  cost: RouteCost;
  minutes: number;
  exp: number;
  /** 經驗總和 ÷ 航行時間(分鐘) */
  perMin: number;
  /** 回來之後可能新解鎖的航點(不含已去過、也不含路線內的點;可能在下一個海域) */
  opens: number[];
  /** 這條路線拿得到的不同物品(物品 id,由小到大) */
  items: number[];
  /** 拿得到的「指定物品」(物品 id,依指定順序);沒指定物品時為空 */
  got: number[];
}

/** 這個探索值下,該航點能拿到的物品 id(低階一定有、探索 ≥ 中 / 高階門檻才有中 / 高階) */
export function pointItems(p: SeaPoint, surveillance: number): number[] {
  return [...p.drop.low, ...(surveillance >= p.statReq.surveillanceMid ? p.drop.mid : []), ...(surveillance >= p.statReq.surveillanceHigh ? p.drop.high : [])];
}

/**
 * 這些點全部去過之後,可能新解鎖的點:每個點的子點,去掉已去過的與路線自己的點,依航行順序排列、不重複。
 * (只列「可去的點」時,子點本來就不會是去過的點;一般排序下這樣才不會把早就開了的點算進去。)
 */
export function opensFor(g: UnlockGraph, explored: ReadonlySet<number>, order: readonly number[]): number[] {
  const out: number[] = [];
  const inRoute = new Set(order);
  for (const id of order) for (const c of g.children.get(id) ?? []) if (!explored.has(c) && !inRoute.has(c) && !out.includes(c)) out.push(c);
  return out;
}

/**
 * 要搜尋哪些海域(D-222 ④):先套用海域下拉;如果剩下的海域裡有任何必選航點,只搜尋有必選航點的海域;
 * 都沒有就搜尋全部。回傳 `ignored` = 因為海域下拉而被忽略的必選航點(不在選定海域內)。
 */
export function searchSeas(seas: readonly SeaIndex[], q: Pick<FindQuery, 'sea' | 'required'>): { seas: SeaIndex[]; ignored: number[] } {
  const inScope = seas.filter((s) => q.sea === 'all' || s.sea.sea === q.sea);
  const withReq = inScope.filter((s) => s.sea.points.some((p) => q.required.has(p.id)));
  const ignored = q.sea === 'all' ? [] : [...q.required].filter((id) => !inScope.some((s) => s.byId.has(id)));
  return { seas: withReq.length > 0 ? withReq : inScope, ignored };
}

export interface RequiredCheck {
  /** 必選點超過 5 個 */
  tooMany: boolean;
  /** 等級不足的必選點 */
  rankLocked: number[];
  /** 必選點合起來,最短順序的耗用(超過距離上限就走不完);沒有必選點為 0 */
  range: number;
  /** 走得完:未超過 5 點、沒有等級不足、耗用 ≤ 距離上限 */
  ok: boolean;
}

/** 按「找路線」之前的即時提示:這個海域的必選點合不合理(不跑搜尋) */
export function checkRequired(si: SeaIndex, required: ReadonlySet<number>, level: number, rangeCap: number): RequiredCheck {
  const ids = si.sea.points.filter((p) => required.has(p.id)).map((p) => p.id);
  const tooMany = ids.length > MAX_STOPS;
  const rankLocked = ids.filter((id) => si.byId.get(id)!.rankReq > level);
  if (ids.length === 0) return { tooMany: false, rankLocked: [], range: 0, ok: true };
  if (tooMany) return { tooMany, rankLocked, range: Infinity, ok: false };
  const range = shortestOrder(si, ids).cost.range;
  return { tooMany, rankLocked, range, ok: rankLocked.length === 0 && range <= rangeCap };
}

type Cmp = Pick<FindRoute, 'minutes' | 'exp' | 'perMin' | 'sea' | 'order'> & { opensN: number; itemsN: number };

function metricOf(r: Cmp, sort: FindSort): number {
  return sort === 'perMin' ? r.perMin : sort === 'opens' ? r.opensN : r.itemsN;
}

/** 由好到壞;分數相同時航行時間短者在前,再看經驗,最後依海域與航點編號固定順序 */
function compare(a: Cmp, b: Cmp, sort: FindSort): number {
  const byMetric = metricOf(b, sort) - metricOf(a, sort);
  if (byMetric !== 0) return byMetric;
  if (a.minutes !== b.minutes) return a.minutes - b.minutes;
  if (sort !== 'perMin' && a.exp !== b.exp) return b.exp - a.exp;
  return a.sea - b.sea || a.order.join().localeCompare(b.order.join(), 'en', { numeric: true });
}

export function findRoutes(seas: readonly SeaIndex[], q: FindQuery): FindRoute[] {
  const limit = q.limit ?? FIND_ROUTE_LIMIT;
  const { speed, range: cap, surveillance } = q.stats;
  if (!(speed > 0) || limit <= 0) return [];
  const top: (FindRoute & Cmp)[] = [];
  const insert = (r: FindRoute & Cmp): void => {
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
  const wanted = q.itemIds;
  const { seas: scope } = searchSeas(seas, q);

  for (const si of scope) {
    const reqPts = si.sea.points.filter((p) => q.required.has(p.id)).sort((a, b) => a.id - b.id);
    if (reqPts.length > MAX_STOPS) continue;
    const usable = (p: SeaPoint): boolean => p.rankReq <= q.level && !q.excluded.has(p.id) && (q.sort !== 'opens' || isAvailable(q.graph, q.explored, p.id));
    // 必選點本身不能用(等級不足、排除、不是可去的點)→ 這個海域沒有路線
    if (reqPts.some((p) => !usable(p))) continue;
    const optional = si.sea.points.filter((p) => !q.required.has(p.id) && usable(p)).sort((a, b) => a.id - b.id);
    const n = optional.length;
    const { range: rangeM, distance: distM } = si.sea.matrix;
    const home = si.at.get(si.sea.home.id)!;

    // 目前選中的點:前 reqPts.length 個是必選點,後面是 DFS 挑的
    const pts: SeaPoint[] = [...reqPts];
    const itemSets = new Map<number, number[]>();
    const itemsOfPoint = (p: SeaPoint): number[] => {
      let s = itemSets.get(p.id);
      if (!s) itemSets.set(p.id, (s = pointItems(p, surveillance)));
      return s;
    };
    // 每個物品被選到幾次,DFS 進退時維護,不必每個子集重算聯集
    const count = new Map<number, number>();
    let distinct = 0;
    const add = (p: SeaPoint): void => {
      for (const it of itemsOfPoint(p)) {
        const c = count.get(it) ?? 0;
        if (c === 0) distinct++;
        count.set(it, c + 1);
      }
    };
    const remove = (p: SeaPoint): void => {
      for (const it of itemsOfPoint(p)) {
        const c = count.get(it)! - 1;
        if (c === 0) {
          count.delete(it);
          distinct--;
        } else count.set(it, c);
      }
    };
    for (const p of reqPts) add(p);

    const evaluate = (sumRange: number, sumDist: number, sumExp: number): void => {
      const k = pts.length;
      if (k === 0) return;
      // 與順序無關的條件先檢查,不必試排列
      if (wanted.length > 0 && (q.match === 'all' ? !wanted.every((id) => count.has(id)) : !wanted.some((id) => count.has(id)))) return;
      const lbMinutes = Math.floor(sumDist / speed + 720);
      if (q.maxMinutes !== null && lbMinutes > q.maxMinutes) return;
      let opensN = 0;
      if (q.sort === 'opens') opensN = opensFor(q.graph, q.explored, pts.map((p) => p.id)).length;
      if (top.length >= limit) {
        const worst = top[top.length - 1]!;
        if (q.sort === 'perMin') {
          if (sumExp / lbMinutes < worst.perMin) return;
        } else {
          const m = q.sort === 'opens' ? opensN : distinct;
          const wm = q.sort === 'opens' ? worst.opensN : worst.itemsN;
          if (m < wm) return;
          if (m === wm && lbMinutes > worst.minutes) return;
        }
      }
      let bestDist = Infinity;
      let bestPerm: number[] | null = null;
      for (const perm of permutations(k)) {
        let prev = home;
        let r = sumRange;
        let d = sumDist;
        for (let j = 0; j < k; j++) {
          const cur = si.at.get(pts[perm[j]!]!.id)!;
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
      const order = bestPerm.map((j) => pts[j]!.id);
      const opens = opensFor(q.graph, q.explored, order);
      const items = [...count.keys()].sort((a, b) => a - b);
      insert({
        sea: si.sea.sea,
        order,
        cost: routeCost(si, order),
        minutes,
        exp: sumExp,
        perMin: sumExp / minutes,
        opens,
        items,
        got: wanted.filter((id) => count.has(id)),
        opensN: opens.length,
        itemsN: items.length,
      });
    };

    const dfs = (start: number, sumRange: number, sumDist: number, sumExp: number): void => {
      for (let i = start; i < n; i++) {
        if (pts.length >= MAX_STOPS) return;
        const p = optional[i]!;
        const r = sumRange + p.surveyRange;
        if (r > cap) continue;
        const d = sumDist + p.surveyDistance;
        if (q.maxMinutes !== null && Math.floor(d / speed + 720) > q.maxMinutes) continue;
        pts.push(p);
        add(p);
        evaluate(r, d, sumExp + p.expReward);
        dfs(i + 1, r, d, sumExp + p.expReward);
        remove(p);
        pts.pop();
      }
    };

    let r0 = 0;
    let d0 = 0;
    let e0 = 0;
    for (const p of reqPts) {
      r0 += p.surveyRange;
      d0 += p.surveyDistance;
      e0 += p.expReward;
    }
    if (r0 > cap || (q.maxMinutes !== null && Math.floor(d0 / speed + 720) > q.maxMinutes)) continue;
    // 只有必選點時,先評估必選點本身;再在它之上加選填的點
    if (reqPts.length > 0) evaluate(r0, d0, e0);
    dfs(0, r0, d0, e0);
  }
  return top.map(({ opensN: _o, itemsN: _i, ...r }) => r);
}
