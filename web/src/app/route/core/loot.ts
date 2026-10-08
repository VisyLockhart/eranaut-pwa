import { MAX_STOPS, routeCost, shortestOrder, travelMinutes, type RouteCost, type SeaIndex } from './route';
import type { SeaPoint } from './types';

// 掉落物反查路線(ROUTE-SIM.md §5 第 9 點)。
// 用 wiki 的階層資料判斷拿不拿得到(不沿用 GitHub 程式用 sec[8] 當第一階門檻的寫法)。

export const CANDIDATE_LIMIT = 25;
/** 多個物品都要時,每個物品至少保留的候選航點數 */
const PER_ITEM_KEEP = 6;

export type DropTier = 'low' | 'mid' | 'high';

/** 在這個探索值下,該航點能拿到目標物品的階層;拿不到回 null */
export function obtainableTier(point: SeaPoint, itemId: number, surveillance: number): DropTier | null {
  if (point.drop.low.includes(itemId)) return 'low';
  if (point.drop.mid.includes(itemId) && surveillance >= point.statReq.surveillanceMid) return 'mid';
  if (point.drop.high.includes(itemId) && surveillance >= point.statReq.surveillanceHigh) return 'high';
  return null;
}

export interface LootQuery {
  /** 想要的物品(1 個以上) */
  itemIds: readonly number[];
  /** `all`(預設):路線要拿得到全部物品;`any`:拿得到任一個即可 */
  match?: 'all' | 'any';
  /** 所用配置的探索、巡航、距離性能與潛艇等級 */
  surveillance: number;
  speed: number;
  rangeCap: number;
  level: number;
}

export interface LootRoute {
  /** 已排成最短順序(耗用最小) */
  order: number[];
  cost: RouteCost;
  minutes: number;
  exp: number;
  /** 每分鐘經驗 = 經驗總和 ÷ ⌊航行時間⌋ */
  score: number;
}

export interface LootResult {
  /** 能拿到目標物品的候選航點(依經驗由大到小,最多 25 個) */
  candidates: number[];
  routes: LootRoute[];
}

/** 從 pool 取 1~max 個的所有組合 */
function* combos(pool: readonly number[], max: number): Generator<number[]> {
  const cur: number[] = [];
  function* rec(start: number): Generator<number[]> {
    if (cur.length > 0) yield cur.slice();
    if (cur.length === max) return;
    for (let i = start; i < pool.length; i++) {
      cur.push(pool[i]!);
      yield* rec(i + 1);
      cur.pop();
    }
  }
  yield* rec(0);
}

/**
 * 對一張海域:取能拿到目標物品的航點,依經驗排序取前 25 個;
 * 組合最多 5 點、最短順序的耗用 ≤ 距離上限,依「經驗 ÷ ⌊航行時間⌋」由大到小排序。
 */
export function findLootRoutes(si: SeaIndex, q: LootQuery, limit = 50): LootResult {
  const match = q.match ?? 'all';
  const byExp = (a: SeaPoint, b: SeaPoint) => b.expReward - a.expReward || a.id - b.id;
  const can = (p: SeaPoint, id: number) => p.rankReq <= q.level && obtainableTier(p, id, q.surveillance) !== null;
  // 全部都要時,每個物品先保留經驗最高的幾個航點,避免冷門物品的唯一航點被擠出前 25 名
  const chosen = new Map<number, SeaPoint>();
  if (match === 'all' && q.itemIds.length > 1) {
    if (q.itemIds.some((id) => !si.sea.points.some((p) => can(p, id)))) return { candidates: [], routes: [] };
    for (const id of q.itemIds) for (const p of si.sea.points.filter((x) => can(x, id)).sort(byExp).slice(0, PER_ITEM_KEEP)) chosen.set(p.id, p);
  }
  for (const p of si.sea.points.filter((x) => q.itemIds.some((id) => can(x, id))).sort(byExp)) {
    if (chosen.size >= CANDIDATE_LIMIT) break;
    chosen.set(p.id, p);
  }
  const candidates = [...chosen.values()].sort(byExp).map((p) => p.id);
  const covers = (set: readonly number[]): boolean => {
    const pts = set.map((id) => si.byId.get(id)!);
    return match === 'any'
      ? true
      : q.itemIds.every((id) => pts.some((p) => can(p, id)));
  };
  const routes: LootRoute[] = [];
  for (const set of combos(candidates, MAX_STOPS)) {
    if (!covers(set)) continue;
    // 先用任意順序的下界快速排除:每站至少要付 surveyRange
    let floor = 0;
    for (const id of set) floor += si.byId.get(id)!.surveyRange;
    if (floor > q.rangeCap) continue;
    const { order, cost } = shortestOrder(si, set);
    if (cost.range > q.rangeCap) continue;
    const minutes = travelMinutes(cost.distance, q.speed);
    const exp = order.reduce((s, id) => s + si.byId.get(id)!.expReward, 0);
    routes.push({ order, cost: routeCost(si, order), minutes, exp, score: exp / Math.floor(minutes) });
  }
  routes.sort((a, b) => b.score - a.score || a.minutes - b.minutes);
  return { candidates, routes: routes.slice(0, limit) };
}
