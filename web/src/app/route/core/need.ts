import { routeCost, type SeaIndex } from './route';
import type { BuildStats, SeaPoint } from './types';

// 路線需求、達標判定與打撈物階層(ROUTE-SIM.md §5 第 5~7 點)。

export interface RouteNeed {
  surveillanceMid: number;
  surveillanceHigh: number;
  retrievalNorm: number;
  retrievalOptim: number;
  favor: number;
  /** 總耗用 */
  range: number;
}

/** 逐站取各階門檻的最大值;距離需求 = 總耗用 */
export function routeNeed(si: SeaIndex, seq: readonly number[]): RouteNeed {
  const need: RouteNeed = { surveillanceMid: 0, surveillanceHigh: 0, retrievalNorm: 0, retrievalOptim: 0, favor: 0, range: routeCost(si, seq).range };
  for (const id of seq) {
    const r = si.byId.get(id)!.statReq;
    need.surveillanceMid = Math.max(need.surveillanceMid, r.surveillanceMid);
    need.surveillanceHigh = Math.max(need.surveillanceHigh, r.surveillanceHigh);
    need.retrievalNorm = Math.max(need.retrievalNorm, r.retrievalNorm);
    need.retrievalOptim = Math.max(need.retrievalOptim, r.retrievalOptim);
    need.favor = Math.max(need.favor, r.favor);
  }
  return need;
}

/** full = 綠(達到最高階)、partial = 黃(只達到較低階)、none = 紅(未達) */
export type Grade = 'full' | 'partial' | 'none';

export interface StatJudge {
  have: number;
  grade: Grade;
  /** 距離下一個未達門檻還差多少(已全達為 0) */
  gapToNext: number;
  /** 距離最高階還差多少(畫面的「差 N」用這個;已達為 0) */
  gapToTop: number;
}

function tiered(have: number, low: number, top: number): StatJudge {
  const grade: Grade = have >= top ? 'full' : have >= low ? 'partial' : 'none';
  return {
    have,
    grade,
    gapToNext: have >= top ? 0 : have >= low ? top - have : low - have,
    gapToTop: Math.max(0, top - have),
  };
}

function single(have: number, need: number): StatJudge {
  const gap = Math.max(0, need - have);
  return { have, grade: have >= need ? 'full' : 'none', gapToNext: gap, gapToTop: gap };
}

export interface BuildJudgement {
  surveillance: StatJudge;
  retrieval: StatJudge;
  favor: StatJudge;
  range: StatJudge;
  /** 速度沒有門檻,只顯示 */
  speed: number;
  /** 探索、收集、恩惠、距離全部達到最高階 */
  allFull: boolean;
  /** 四項都至少達到最低階(可出航、只是拿不到高階) */
  allPass: boolean;
}

export function judgeBuild(stats: BuildStats, need: RouteNeed): BuildJudgement {
  const surveillance = tiered(stats.surveillance, need.surveillanceMid, need.surveillanceHigh);
  const retrieval = tiered(stats.retrieval, need.retrievalNorm, need.retrievalOptim);
  const favor = single(stats.favor, need.favor);
  const range = single(stats.range, need.range);
  const all = [surveillance, retrieval, favor, range];
  return {
    surveillance,
    retrieval,
    favor,
    range,
    speed: stats.speed,
    allFull: all.every((j) => j.grade === 'full'),
    allPass: all.every((j) => j.grade !== 'none'),
  };
}

export interface LootTiers {
  /** 低階無門檻 */
  low: { ids: number[]; locked: false; gap: 0 };
  mid: { ids: number[]; locked: boolean; gap: number };
  high: { ids: number[]; locked: boolean; gap: number };
}

/** 該站探索值 ≥ mid 門檻才拿得到中階、≥ high 才拿得到高階(RS-14);locked 時 gap 為「差 N」 */
export function lootTiers(point: SeaPoint, surveillance: number): LootTiers {
  const midGap = Math.max(0, point.statReq.surveillanceMid - surveillance);
  const highGap = Math.max(0, point.statReq.surveillanceHigh - surveillance);
  return {
    low: { ids: point.drop.low, locked: false, gap: 0 },
    mid: { ids: point.drop.mid, locked: midGap > 0, gap: midGap },
    high: { ids: point.drop.high, locked: highGap > 0, gap: highGap },
  };
}
