import type { SeaData, SeaPoint } from './types';

// 路線計算(ROUTE-SIM.md §5 第 1~3、10、11 點)。

/** 一次最多 5 個航點(RS-08) */
export const MAX_STOPS = 5;

export interface SeaIndex {
  sea: SeaData;
  byId: Map<number, SeaPoint>;
  /** 航點 id(含出發點)→ 矩陣索引 */
  at: Map<number, number>;
}

export function indexSea(sea: SeaData): SeaIndex {
  return {
    sea,
    byId: new Map(sea.points.map((p) => [p.id, p])),
    at: new Map(sea.matrix.ids.map((id, i) => [id, i])),
  };
}

export interface RouteCost {
  /** 總距離:Σ surveyDistance + Σ 各段 distance(用來算航行時間) */
  distance: number;
  /** 總耗用:Σ surveyRange + Σ 各段 range(與潛艇「距離」性能比較) */
  range: number;
  /** 燃料(RS-22):Σ tankReq,與順序、配件、等級無關 */
  fuel: number;
  stops: number;
}

function pointOf(si: SeaIndex, id: number): SeaPoint {
  const p = si.byId.get(id);
  if (!p) throw new Error(`航點 ${id} 不在海域 ${si.sea.name}`);
  return p;
}

/** 依序走 home → s1 → s2 …(選取順序就是航行順序,RS-05) */
export function routeCost(si: SeaIndex, seq: readonly number[]): RouteCost {
  const { range, distance } = si.sea.matrix;
  let prev = si.at.get(si.sea.home.id)!;
  let d = 0;
  let r = 0;
  let fuel = 0;
  for (const id of seq) {
    const p = pointOf(si, id);
    const i = si.at.get(id)!;
    d += p.surveyDistance + distance[prev]![i]!;
    r += p.surveyRange + range[prev]![i]!;
    fuel += p.tankReq;
    prev = i;
  }
  return { distance: d, range: r, fuel, stops: seq.length };
}

/** 航行時間(分鐘)= ⌊總距離 ÷ 巡航速度 + 720⌋。速度 ≤ 0 回 Infinity */
export function travelMinutes(distance: number, speed: number): number {
  if (!(speed > 0)) return Infinity;
  return Math.floor(distance / speed + 720);
}

export function splitMinutes(total: number): { days: number; hours: number; minutes: number } {
  const t = Math.max(0, Math.floor(total));
  return { days: Math.floor(t / 1440), hours: Math.floor((t % 1440) / 60), minutes: t % 60 };
}

/** 返航時刻(僅供參考,推算值) */
export function returnAt(nowMs: number, minutes: number): number {
  return nowMs + minutes * 60_000;
}

export type Selectability = 'selected' | 'ok' | 'full' | 'rank' | 'range';

/**
 * 每選一個航點就重新判斷其他航點(RS-06、RS-07、RS-08、RS-23):
 * canAdd(p) = |S| < 5 ∧ 等級 ≥ rankReq ∧ 耗用(S + p) ≤ 距離上限;新點接在序列最後。
 * 連線與燃料都不參與判斷。回傳原因方便畫面顯示(只有 'ok' 可選)。
 */
export function selectability(si: SeaIndex, seq: readonly number[], level: number, rangeCap: number): Map<number, Selectability> {
  const out = new Map<number, Selectability>();
  const chosen = new Set(seq);
  for (const p of si.sea.points) {
    if (chosen.has(p.id)) out.set(p.id, 'selected');
    else if (seq.length >= MAX_STOPS) out.set(p.id, 'full');
    else if (level < p.rankReq) out.set(p.id, 'rank');
    else out.set(p.id, routeCost(si, [...seq, p.id]).range <= rangeCap ? 'ok' : 'range');
  }
  return out;
}

export function canAdd(si: SeaIndex, seq: readonly number[], id: number, level: number, rangeCap: number): boolean {
  return selectability(si, seq, level, rangeCap).get(id) === 'ok';
}

const permCache = new Map<number, number[][]>();

/** 0..n-1 的全部排列(n ≤ 5,最多 120 個),結果快取 */
export function permutations(n: number): number[][] {
  const hit = permCache.get(n);
  if (hit) return hit;
  const res: number[][] = [];
  const rec = (cur: number[], used: boolean[]) => {
    if (cur.length === n) {
      res.push(cur.slice());
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(i);
      rec(cur, used);
      cur.pop();
      used[i] = false;
    }
  };
  rec([], new Array<boolean>(n).fill(false));
  permCache.set(n, res);
  return res;
}

export interface OrderedRoute {
  order: number[];
  cost: RouteCost;
}

/**
 * 「最短順序」(RS-05、RS-23):在這組航點的所有排列中,耗用(range)最小者;
 * 耗用相同時取總距離較小者,再相同則保留輸入的先後。配置搜尋用這個順序判斷。
 */
export function shortestOrder(si: SeaIndex, ids: readonly number[]): OrderedRoute {
  if (ids.length > MAX_STOPS) throw new Error(`最多 ${MAX_STOPS} 個航點`);
  if (ids.length === 0) return { order: [], cost: routeCost(si, []) };
  let best: OrderedRoute | null = null;
  for (const perm of permutations(ids.length)) {
    const order = perm.map((i) => ids[i]!);
    const cost = routeCost(si, order);
    if (!best || cost.range < best.cost.range || (cost.range === best.cost.range && cost.distance < best.cost.distance)) {
      best = { order, cost };
    }
  }
  return best!;
}
