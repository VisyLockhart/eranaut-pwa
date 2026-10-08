import { buildStats, PART_GRADE_COUNT } from './build';
import { judgeBuild, routeNeed, type BuildJudgement, type RouteNeed } from './need';
import { permutations, routeCost, shortestOrder, travelMinutes, type SeaIndex } from './route';
import type { Build, BuildStats, Tables } from './types';

// 「找配置」(D-214):先選要去的航點,再從 10⁴ 種零件組合(固定等級)找出能達成目標的配置。
// 收集:收集 ≥ 該站最高階門檻(撈到最大量);恩惠:恩惠 ≥ 門檻(有機會再撈一次);速度:能出航又拿得到東西,航行時間最短。
// 三個目標都要求距離性能走得完這條路線、重量不超過該等級上限。

export type BuildGoal = 'collect' | 'favor' | 'speed';
export const TARGET_LIMIT = 100;
export const NEAREST_COUNT = 3;

export interface TargetHit {
  build: Build;
  stats: BuildStats;
  /** 這個配置走的順序:在距離走得完的排列中,總距離最短 */
  order: number[];
  minutes: number;
  judged: BuildJudgement;
  /** 離目標還差多少(各項不足的數字加總);0 = 達成 */
  shortfall: number;
}

export interface TargetResult {
  need: RouteNeed;
  /** 等級夠不夠去這些航點 */
  levelOk: boolean;
  minLevel: number;
  /** 達成目標的總組數(不受 limit 影響) */
  total: number;
  hits: TargetHit[];
  /** 沒有任何配置達成時,列出最接近的幾組 */
  nearest: TargetHit[];
}

const gap = (need: number, have: number): number => Math.max(0, need - have);

/** 各目標的硬性需求:回傳不足的總和(0 = 達成)。距離一律要夠 */
function shortfall(goal: BuildGoal, need: RouteNeed, s: BuildStats): number {
  const r = gap(need.range, s.range);
  switch (goal) {
    case 'collect': return r + gap(need.retrievalOptim, s.retrieval);
    case 'favor': return r + gap(need.favor, s.favor);
    case 'speed': return r + gap(need.surveillanceMid, s.surveillance) + gap(need.retrievalNorm, s.retrieval) + gap(need.favor, s.favor);
  }
}

const fullCount = (j: BuildJudgement): number => [j.surveillance, j.retrieval, j.favor, j.range].filter((x) => x.grade === 'full').length;

export function findBuildsForTarget(tables: Tables, si: SeaIndex, ids: readonly number[], level: number, goal: BuildGoal, limit = TARGET_LIMIT): TargetResult {
  const base = shortestOrder(si, ids);
  const need = routeNeed(si, base.order);
  const minLevel = ids.reduce((m, id) => Math.max(m, si.byId.get(id)?.rankReq ?? 0), 0);
  const empty: TargetResult = { need, levelOk: level >= minLevel, minLevel, total: 0, hits: [], nearest: [] };
  if (ids.length === 0 || level < minLevel) return empty;

  // 每種排列的(耗用、距離),每個配置只要挑「耗用 ≤ 距離性能」中距離最短者
  const perms = permutations(ids.length).map((perm) => {
    const order = perm.map((i) => ids[i]!);
    const c = routeCost(si, order);
    return { order, range: c.range, distance: c.distance };
  });

  const all: TargetHit[] = [];
  for (let a = 1; a <= PART_GRADE_COUNT; a++)
    for (let b = 1; b <= PART_GRADE_COUNT; b++)
      for (let c = 1; c <= PART_GRADE_COUNT; c++)
        for (let d = 1; d <= PART_GRADE_COUNT; d++) {
          const build: Build = { level, parts: [a, b, c, d] };
          const stats = buildStats(tables, build);
          if (stats.weight > stats.weightCap) continue;
          let best: (typeof perms)[number] | null = null;
          for (const p of perms) if (p.range <= stats.range && (!best || p.distance < best.distance)) best = p;
          const chosen = best ?? { order: base.order, distance: base.cost.distance };
          all.push({
            build,
            stats,
            order: chosen.order,
            minutes: travelMinutes(chosen.distance, stats.speed),
            judged: judgeBuild(stats, need),
            shortfall: shortfall(goal, need, stats),
          });
        }

  const byWeight = (x: TargetHit, y: TargetHit): number => x.stats.weight - y.stats.weight;
  const byParts = (x: TargetHit, y: TargetHit): number => x.build.parts.join().localeCompare(y.build.parts.join());
  const ok = all.filter((h) => h.shortfall === 0);
  if (ok.length === 0) {
    const nearest = all.sort((x, y) => x.shortfall - y.shortfall || byWeight(x, y) || x.minutes - y.minutes || byParts(x, y)).slice(0, NEAREST_COUNT);
    return { ...empty, nearest };
  }
  ok.sort(
    goal === 'speed'
      ? (x, y) => x.minutes - y.minutes || byWeight(x, y) || fullCount(y.judged) - fullCount(x.judged) || byParts(x, y)
      : (x, y) => fullCount(y.judged) - fullCount(x.judged) || byWeight(x, y) || x.minutes - y.minutes || byParts(x, y),
  );
  return { ...empty, total: ok.length, hits: ok.slice(0, limit) };
}
