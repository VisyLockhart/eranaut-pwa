import { buildStats, PART_GRADE_COUNT } from './build';
import { judgeBuild, routeNeed, type BuildJudgement, type RouteNeed } from './need';
import { permutations, routeCost, shortestOrder, travelMinutes, type SeaIndex } from './route';
import type { Build, BuildStats, Tables } from './types';

// 找配置(D-223):固定等級,從 10⁴ 種配件組合找出「走得完這條路線、性能達標、重量不超過上限」的配置。
// 收集 / 恩惠 / 速度只是「由航點需求自動算出最低性能」的預設;自訂 = 使用者自己填最低性能(原「進階」)。
// 取代 D-214 的 `findBuildsForTarget`(target.ts)與 D-219 前的 `searchBuilds`(search.ts)。

export type BuildGoal = 'collect' | 'favor' | 'speed' | 'custom';
export type BuildSort = 'time' | 'range';

export const BUILD_LIMIT = 300;
export const NEAREST_COUNT = 3;

export interface BuildMins {
  surveillance: number;
  retrieval: number;
  speed: number;
  range: number;
  favor: number;
}

export const NO_MINS: BuildMins = { surveillance: 0, retrieval: 0, speed: 0, range: 0, favor: 0 };

/** 各預設目標由路線需求算出的最低性能(收集 = 距離 + 收集最佳;恩惠 = 距離 + 恩惠;速度 = 距離 + 探索中階 + 收集一般 + 恩惠) */
export function minsForGoal(goal: Exclude<BuildGoal, 'custom'>, need: RouteNeed): BuildMins {
  switch (goal) {
    case 'collect': return { ...NO_MINS, range: need.range, retrieval: need.retrievalOptim };
    case 'favor': return { ...NO_MINS, range: need.range, favor: need.favor };
    case 'speed': return { ...NO_MINS, range: need.range, surveillance: need.surveillanceMid, retrieval: need.retrievalNorm, favor: need.favor };
  }
}

/** 自訂「用航點需求帶入」:探索 / 收集取最高階、恩惠、距離(耗用) */
export function minsFromNeed(need: RouteNeed): BuildMins {
  return { ...NO_MINS, surveillance: need.surveillanceHigh, retrieval: need.retrievalOptim, range: need.range, favor: need.favor };
}

export interface BuildQuery {
  level: number;
  /** 航點(單一海域);預設目標至少要 1 個,自訂可以是 0 個 */
  ids: readonly number[];
  goal: BuildGoal;
  /** 只有 goal = 'custom' 用;預設目標由航點需求算出 */
  mins?: BuildMins;
  /** 重量上限;未給或超過該等級上限時取該等級上限 */
  weightLimit?: number | null;
  sort?: BuildSort;
  limit?: number;
}

export interface BuildHit {
  build: Build;
  stats: BuildStats;
  /** 這個配置走的順序:距離走得完的排列中總距離最短;沒選航點時為空 */
  order: number[];
  /** 航行分鐘;沒選航點時為 null */
  minutes: number | null;
  /** 對這條路線的達標判定;沒選航點時為 null */
  judged: BuildJudgement | null;
  /** 離最低性能還差多少(各項不足的數字加總);0 = 達成 */
  shortfall: number;
}

export interface BuildResult {
  /** 實際用的最低性能(預設目標由航點需求算出) */
  mins: BuildMins;
  /** 路線需求;沒選航點時為 null */
  need: RouteNeed | null;
  /** 等級夠不夠去這些航點 */
  levelOk: boolean;
  minLevel: number;
  /** 達成的總組數(不受 limit 影響) */
  total: number;
  hits: BuildHit[];
  /** 沒有任何配置達成時,列出最接近的幾組 */
  nearest: BuildHit[];
}

const gap = (need: number, have: number): number => Math.max(0, need - have);

export function findBuilds(tables: Tables, si: SeaIndex, q: BuildQuery): BuildResult {
  const ids = q.ids;
  const hasRoute = ids.length > 0;
  const base = hasRoute ? shortestOrder(si, ids) : null;
  const need = base ? routeNeed(si, base.order) : null;
  const minLevel = ids.reduce((m, id) => Math.max(m, si.byId.get(id)?.rankReq ?? 0), 0);
  const mins: BuildMins = q.goal === 'custom' ? (q.mins ?? NO_MINS) : need ? minsForGoal(q.goal, need) : NO_MINS;
  const empty: BuildResult = { mins, need, levelOk: q.level >= minLevel, minLevel, total: 0, hits: [], nearest: [] };
  // 預設目標一定要有航點;有航點時等級要夠
  if (q.goal !== 'custom' && !hasRoute) return empty;
  if (hasRoute && q.level < minLevel) return empty;

  // 每種排列的(耗用、距離),每個配置只要挑「耗用 ≤ 距離性能」中距離最短者
  const perms = hasRoute
    ? permutations(ids.length).map((perm) => {
        const order = perm.map((i) => ids[i]!);
        const c = routeCost(si, order);
        return { order, range: c.range, distance: c.distance };
      })
    : [];

  const all: BuildHit[] = [];
  for (let a = 1; a <= PART_GRADE_COUNT; a++)
    for (let b = 1; b <= PART_GRADE_COUNT; b++)
      for (let c = 1; c <= PART_GRADE_COUNT; c++)
        for (let d = 1; d <= PART_GRADE_COUNT; d++) {
          const build: Build = { level: q.level, parts: [a, b, c, d] };
          const stats = buildStats(tables, build);
          const cap = Math.min(stats.weightCap, q.weightLimit ?? stats.weightCap);
          if (stats.weight > cap) continue;
          let best: (typeof perms)[number] | null = null;
          for (const p of perms) if (p.range <= stats.range && (!best || p.distance < best.distance)) best = p;
          const chosen = best ?? (base ? { order: base.order, distance: base.cost.distance } : null);
          all.push({
            build,
            stats,
            order: chosen ? chosen.order : [],
            minutes: chosen ? travelMinutes(chosen.distance, stats.speed) : null,
            judged: need ? judgeBuild(stats, need) : null,
            shortfall:
              gap(mins.surveillance, stats.surveillance) + gap(mins.retrieval, stats.retrieval) + gap(mins.speed, stats.speed) + gap(mins.range, stats.range) + gap(mins.favor, stats.favor),
          });
        }

  const byParts = (x: BuildHit, y: BuildHit): number => x.build.parts.join().localeCompare(y.build.parts.join());
  const byWeight = (x: BuildHit, y: BuildHit): number => x.stats.weight - y.stats.weight;
  const byTime = (x: BuildHit, y: BuildHit): number => (x.minutes !== null && y.minutes !== null ? x.minutes - y.minutes : y.stats.speed - x.stats.speed);
  const ok = all.filter((h) => h.shortfall === 0);
  if (ok.length === 0) {
    const nearest = all.sort((x, y) => x.shortfall - y.shortfall || byWeight(x, y) || byTime(x, y) || byParts(x, y)).slice(0, NEAREST_COUNT);
    return { ...empty, nearest };
  }
  // 時間短優先:航行時間(沒選航點時依巡航速度由快到慢);距離高優先:距離性能由大到小;同分重量輕者在前
  ok.sort(
    (q.sort ?? 'time') === 'range'
      ? (x, y) => y.stats.range - x.stats.range || byWeight(x, y) || byParts(x, y)
      : (x, y) => byTime(x, y) || byWeight(x, y) || byParts(x, y),
  );
  return { ...empty, total: ok.length, hits: ok.slice(0, q.limit ?? BUILD_LIMIT) };
}
