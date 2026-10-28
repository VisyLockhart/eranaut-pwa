import {
  LEVELING_POINTS,
  LEVELING_ROUTES,
  LEVELING_SCHOOLS,
  MAX_LEVELING_LEVEL,
  applyExp,
  recommendedRoute,
  type LevelingSchool,
  type ProgressRoute,
  type SubmarineDto,
} from '@eranaut/shared';
import { permutations, MAX_STOPS } from '../route/core/route';
import { seaIndex } from '../route/core/data';
import type { SeaPoint } from '../route/core/types';
import { planRoute, statsFor, type RoutePlan } from './leveling-vm';

// 練級輔助的「出發前派出建議」(D-291)。純函式,不碰畫面與網路,方便測試。
// 流程:目前等級 + 上一趟待結算的經驗 → 返航後(下一趟出發時)的等級 → 該等級、該流派的推薦路線。
// 推薦路線照攻略;艇有綁定配置但走不了攻略路線(距離或等級不夠)時,才用資料集自己找(`calcRoute`)。

export type Parts = readonly [number, number, number, number];
/** 建議面板的檢視:各艇偏好的流派,或暫時看某一個流派(只是檢視,不改各艇的偏好) */
export type ViewSchool = 'pref' | LevelingSchool;

/** 沒設定偏好時用哪個流派 */
export const DEFAULT_SCHOOL: LevelingSchool = 'snap';

/** 下一趟出發時的狀態 */
export interface NextStart {
  /** 出發時的等級與這一級的經驗(上一趟待結算的經驗已加進去) */
  level: number;
  exp: number;
  /** 目前(還沒加上一趟)的等級;沒有待結算時等於 level */
  fromLevel: number;
  /** 已返航(探索完成,或預計返航時間已過)= 現在就能派 */
  returned: boolean;
  /** 還在航行:預計返航的時間戳;已返航為 null */
  returnAt: number | null;
  /** 超過 85 級:練級輔助到此為止,不給建議 */
  over: boolean;
}

/** 與伺服器一致(`hasReturned`):探索完成,或預計返航時間已過 */
export function hasReturned(sub: Pick<SubmarineDto, 'status' | 'expected_return_at'>, now: number): boolean {
  return sub.status === 'complete' || (sub.expected_return_at !== null && Date.parse(sub.expected_return_at) <= now);
}

/** 練級輔助開著的艇才有;沒填等級或沒開回 null */
export function nextStart(sub: Pick<SubmarineDto, 'status' | 'expected_return_at' | 'progress'>, now: number): NextStart | null {
  const p = sub.progress;
  if (!p || !p.sim_on) return null;
  const returned = hasReturned(sub, now);
  // 待結算的路線一律加上去:伺服器讀取時若已返航會先算好 effective,但重新抓資料前也可能剛好跨過返航時間,這裡自己算才一致
  const after = p.pending ? applyExp({ level: p.level, exp_in_level: p.exp_in_level }, p.pending.exp) : { level: p.level, exp_in_level: p.exp_in_level };
  return {
    level: after.level,
    exp: after.exp_in_level,
    fromLevel: p.level,
    returned,
    returnAt: returned || sub.expected_return_at === null ? null : Date.parse(sub.expected_return_at),
    over: after.level > MAX_LEVELING_LEVEL,
  };
}

/** 這艘的偏好流派(面板切到某個流派時,暫時以那個為準) */
export function schoolFor(sub: Pick<SubmarineDto, 'progress'>, view: ViewSchool): LevelingSchool {
  return view !== 'pref' ? view : (sub.progress?.school ?? DEFAULT_SCHOOL);
}

export interface Suggestion {
  school: LevelingSchool;
  plan: RoutePlan;
  /** 跑完這條抵達的等級 */
  after: number;
  /** guide = 攻略路線;calc = 配置走不了攻略路線,改由資料集推算 */
  source: 'guide' | 'calc';
  /** 沒有綁定配置:時間與距離是用攻略的配置推算的 */
  guideConfig: Parts | null;
  /** 這條路線會解鎖下一個潛艇欄位(例:「艇3」);沒有為 null */
  unlock: string | null;
}

/** 「艇3」→「解鎖第 3 艘」 */
export function unlockText(mark: string): string {
  return `解鎖第 ${mark.replace('艇', '')} 艘`;
}

/** 解鎖下一個潛艇欄位的點(溺沒海 J = 艇2、O = 艇3、T = 艇4) */
export interface UnlockTarget {
  code: string;
  mark: string;
  rank: number;
}

/**
 * 工坊目前有幾艘 = 已解鎖幾個潛艇欄位(使用者 2026-10-28)。還沒滿 4 艘時,回傳解鎖下一個欄位的點;
 * 已經有艇正在跑(或上一趟跑過)那個點 → null(欄位其實已解鎖,只是還沒在工坊加入新艇)。
 * 解鎖建議只給 `forSub` 是工坊位置最前面的那艘(潛艇-1,主力探索艇,等級最高);其他艇一律 null。
 */
export function unlockTarget(subs: readonly Pick<SubmarineDto, 'progress' | 'position' | 'id'>[], forSub: Pick<SubmarineDto, 'id'>): UnlockTarget | null {
  const n = subs.length;
  const lead = subs.reduce<(typeof subs)[number] | null>((a, s) => (a === null || s.position < a.position ? s : a), null);
  if (!lead || lead.id !== forSub.id) return null;
  if (n < 1 || n >= 4) return null;
  const mark = `艇${n + 1}`;
  const p = LEVELING_POINTS.find((s) => s.sea === 1)?.points.find((x) => x.mark === mark);
  if (!p) return null;
  const has = (r: Pick<ProgressRoute, 'sea' | 'points'> | null | undefined): boolean => !!r && r.sea === 1 && r.points.includes(p.code);
  if (subs.some((s) => has(s.progress?.pending) || has(s.progress?.last_route))) return null;
  return { code: p.code, mark, rank: p.rank };
}

/**
 * 某流派在這個等級的建議;攻略沒有資料回 null。
 * 有還沒解鎖的潛艇欄位(`unlock`)且等級夠時,路線一定要包含解鎖點(最高優先):
 * 攻略路線剛好包含就用攻略,沒有就以資料集推算(含解鎖點、在該流派時間限制內最好的);推算不出來才退回一般建議。
 */
export function suggest(school: LevelingSchool, level: number, exp: number, parts: Parts | null, unlock: UnlockTarget | null = null): Suggestion | null {
  const r = recommendedRoute(school, level);
  if (!r) return null;
  if (unlock && level >= unlock.rank && !(r.sea === 1 && r.points.includes(unlock.code))) {
    const cfg = parts ?? (r.config as Parts);
    const guideMinutes = planRoute(r.sea, r.points, r.config as Parts, level)?.minutes ?? null;
    const calc = calcRoute(1, level, cfg, school, guideMinutes, unlock.code);
    const plan = calc ? planRoute(1, calc, cfg, level) : null;
    if (plan) {
      return { school, plan, after: applyExp({ level, exp_in_level: exp }, plan.exp).level, source: 'calc', guideConfig: parts === null ? (r.config as Parts) : null, unlock: unlock.mark };
    }
  }
  const viaGuide = !!unlock && level >= unlock.rank && r.sea === 1 && r.points.includes(unlock.code);
  let plan = planRoute(r.sea, r.points, parts ?? (r.config as Parts), level);
  if (!plan) return null;
  let source: Suggestion['source'] = 'guide';
  if (parts !== null && plan.problem !== null) {
    // 時間檔從攻略那條路線(以攻略的配置推算)所屬的檔開始:攻略是兩天的路線就直接找 ≤48h
    const guideMinutes = planRoute(r.sea, r.points, r.config as Parts, level)?.minutes ?? null;
    const calc = calcRoute(r.sea, level, parts, school, guideMinutes, viaGuide ? unlock!.code : null);
    const calcPlan = calc ? planRoute(r.sea, calc, parts, level) : null;
    if (calcPlan) {
      plan = calcPlan;
      source = 'calc';
    }
  }
  const unlocks = !!unlock && plan.sea === 1 && plan.points.includes(unlock.code);
  return { school, plan, after: applyExp({ level, exp_in_level: exp }, plan.exp).level, source, guideConfig: parts === null ? (r.config as Parts) : null, unlock: unlocks ? unlock!.mark : null };
}

/** 三個流派各一條(沒資料的不列) */
export function suggestAll(level: number, exp: number, parts: Parts | null, unlock: UnlockTarget | null = null): Suggestion[] {
  const out: Suggestion[] = [];
  for (const s of LEVELING_SCHOOLS) {
    const x = suggest(s, level, exp, parts, unlock);
    if (x) out.push(x);
  }
  return out;
}

export function sameRoute(a: Pick<ProgressRoute, 'sea' | 'points'>, b: Pick<ProgressRoute, 'sea' | 'points'>): boolean {
  return a.sea === b.sea && a.points.length === b.points.length && a.points.every((c, i) => c === b.points[i]);
}

// ---- 資料集推算(配置走不了攻略路線時) ----

/**
 * 各流派的時間限制(分鐘),由短到長試(使用者 2026-10-28);從攻略路線所屬的檔開始(`startTier`):
 * 掐點收 = 不限時間、每分鐘經驗最高;半日收 = 12h,找不到才放寬到 36h;整日收 = 24h → 48h,兩者都取經驗最多。
 */
export const SCHOOL_TIERS: Record<LevelingSchool, readonly { max: number | null; by: 'perMin' | 'exp' }[]> = {
  snap: [{ max: null, by: 'perMin' }],
  half: [
    { max: 12 * 60, by: 'exp' },
    { max: 36 * 60, by: 'exp' },
  ],
  day: [
    { max: 24 * 60, by: 'exp' },
    { max: 48 * 60, by: 'exp' },
  ],
};

/**
 * 從哪一個時間檔開始找(使用者 2026-10-28):攻略路線的航行時間落在哪一檔就從那一檔開始,
 * 例如整日收攻略是約 47 小時的兩天路線 → 直接找 ≤48h,不先找一天內的;不知道攻略時間(null)從最短的檔開始。
 */
export function startTier(school: LevelingSchool, guideMinutes: number | null): number {
  const tiers = SCHOOL_TIERS[school];
  if (guideMinutes === null) return 0;
  const i = tiers.findIndex((t) => t.max === null || guideMinutes <= t.max);
  return i < 0 ? tiers.length - 1 : i;
}

/**
 * 可以用的航點:到這個等級為止,攻略路線(任何流派)出現過的點(使用者 2026-10-28:避免挑到還沒解鎖的點)。
 * 攻略照解鎖順序走,出現過 = 那時已經解鎖。
 */
export function allowedCodes(sea: number, level: number): Set<string> {
  const out = new Set<string>();
  for (const r of LEVELING_ROUTES) if (r.sea === sea && r.level <= level) for (const c of r.points) out.add(c);
  return out;
}

const calcMemo = new Map<string, string[] | null>();

/**
 * 用資料集找這艘配置在該流派時間限制內最好的路線(航點代碼,依航行順序);找不到回 null。結果記憶起來(同條件只算一次)。
 * 只在攻略路線走不了時才會呼叫,候選點也只限攻略出現過的點(溺沒海最多約 25 點、灰海約 17 點),
 * 子集合 DFS 時先用「只算探索本身」的距離與耗用剪枝,只有可能勝過目前最佳時才試排列。
 */
export function calcRoute(
  sea: number,
  level: number,
  parts: Parts,
  school: LevelingSchool,
  guideMinutes: number | null = null,
  required: string | null = null,
): string[] | null {
  const tiers = SCHOOL_TIERS[school].slice(startTier(school, guideMinutes));
  const key = `${sea}|${level}|${parts.join('')}|${school}|${tiers.length}|${required ?? ''}`;
  const hit = calcMemo.get(key);
  if (hit !== undefined) return hit;
  const si = seaIndex(sea);
  const allow = allowedCodes(sea, level);
  // 經驗高的點先試:很快就有不錯的最佳解,之後的組合多半在試排列前就被剪掉
  const fixed = required === null ? null : (si.sea.points.find((p) => p.code === required && p.rankReq <= level) ?? null);
  if (required !== null && !fixed) {
    calcMemo.set(key, null);
    return null;
  }
  const candidates = si.sea.points
    .filter((p) => allow.has(p.code) && p.rankReq <= level && p !== fixed)
    .sort((a, b) => b.expReward - a.expReward || a.id - b.id);
  const stats = statsFor(parts, level);
  let result: string[] | null = null;
  for (const tier of tiers) {
    const best = bestRoute(si, candidates, stats.range, stats.speed, tier.max, tier.by, fixed);
    if (best) {
      result = best.map((p) => p.code);
      break;
    }
  }
  calcMemo.set(key, result);
  return result;
}

/** 測試用:清掉記憶的結果 */
export function clearCalcMemo(): void {
  calcMemo.clear();
}

function bestRoute(
  si: ReturnType<typeof seaIndex>,
  pts: readonly SeaPoint[],
  cap: number,
  speed: number,
  maxMinutes: number | null,
  by: 'perMin' | 'exp',
  fixed: SeaPoint | null = null,
): SeaPoint[] | null {
  if (!(speed > 0)) return null;
  const { range: rangeM, distance: distM } = si.sea.matrix;
  const home = si.at.get(si.sea.home.id)!;
  const minutesOf = (dist: number): number => Math.floor(dist / speed + 720);
  const chosen: SeaPoint[] = [];
  let best: { order: SeaPoint[]; minutes: number; exp: number } | null = null;

  // 已知目前組合的探索距離(不含航段)= 時間下限;勝不過目前最佳就不必試排列
  const mayBeat = (exp: number, lbMinutes: number): boolean => {
    if (!best) return true;
    if (by === 'perMin') return exp / lbMinutes > best.exp / best.minutes;
    return exp > best.exp || (exp === best.exp && lbMinutes < best.minutes);
  };

  // 每個點至少要有一段航程進來:取「從出發點或其他候選點過來」最短的一段當下限,剪枝時加上(只會低估,不會剪錯)
  // 必經點(解鎖用)也算進「可能的來源」
  const sources = (fixed ? [...pts, fixed] : pts).map((p) => si.at.get(p.id)!);
  const legTo = (i: number) => {
    let r = rangeM[home]![i]!;
    let d = distM[home]![i]!;
    for (const j of sources) {
      if (j === i) continue;
      r = Math.min(r, rangeM[j]![i]!);
      d = Math.min(d, distM[j]![i]!);
    }
    return { r, d };
  };
  const minLeg = pts.map((p) => legTo(si.at.get(p.id)!));

  const evaluate = (sumRange: number, sumDist: number, lbDist: number, sumExp: number): void => {
    if (!mayBeat(sumExp, minutesOf(lbDist))) return;
    const k = chosen.length;
    let bestDist = Infinity;
    let bestPerm: number[] | null = null;
    for (const perm of permutations(k)) {
      let prev = home;
      let r = sumRange;
      let d = sumDist;
      for (let j = 0; j < k; j++) {
        const cur = si.at.get(chosen[perm[j]!]!.id)!;
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
    const minutes = minutesOf(bestDist);
    if (maxMinutes !== null && minutes > maxMinutes) return;
    const better = !best || (by === 'perMin' ? sumExp / minutes > best.exp / best.minutes : sumExp > best.exp || (sumExp === best.exp && minutes < best.minutes));
    if (better) best = { order: bestPerm.map((j) => chosen[j]!), minutes, exp: sumExp };
  };

  // sr / sd = 探索本身的耗用與距離(試排列時再加航程);lr / ld = 加上每點最短進場航程的下限,用來剪枝
  const dfs = (start: number, sr: number, sd: number, lr: number, ld: number, sumExp: number): void => {
    for (let i = start; i < pts.length; i++) {
      if (chosen.length >= MAX_STOPS) return;
      const p = pts[i]!;
      const nlr = lr + p.surveyRange + minLeg[i]!.r;
      if (nlr > cap) continue;
      const nld = ld + p.surveyDistance + minLeg[i]!.d;
      if (maxMinutes !== null && minutesOf(nld) > maxMinutes) continue;
      chosen.push(p);
      evaluate(sr + p.surveyRange, sd + p.surveyDistance, nld, sumExp + p.expReward);
      dfs(i + 1, sr + p.surveyRange, sd + p.surveyDistance, nlr, nld, sumExp + p.expReward);
      chosen.pop();
    }
  };
  if (fixed) {
    // 必經點先放進去,其餘點照常挑
    const leg = legTo(si.at.get(fixed.id)!);
    const lr = fixed.surveyRange + leg.r;
    const ld = fixed.surveyDistance + leg.d;
    if (lr > cap || (maxMinutes !== null && minutesOf(ld) > maxMinutes)) return null;
    chosen.push(fixed);
    evaluate(fixed.surveyRange, fixed.surveyDistance, ld, fixed.expReward);
    dfs(0, fixed.surveyRange, fixed.surveyDistance, lr, ld, fixed.expReward);
  } else {
    dfs(0, 0, 0, 0, 0, 0);
  }
  return best ? (best as { order: SeaPoint[] }).order : null;
}

// ---- 剩餘時間比對(截圖辨識的列) ----

/** 剛派出不久:遊戲顯示的剩餘時間比航行時間少 0~45 分鐘(攻略與資料集偶有 1~3 分鐘誤差,下限放寬到 -5) */
export const MATCH_WINDOW = { before: 5, after: 45 } as const;

/** 剩餘時間與哪一條路線的航行時間吻合;回傳最接近的那一條在 `plans` 裡的索引,沒有吻合回 -1 */
export function matchByTime(plans: readonly Pick<RoutePlan, 'minutes'>[], remaining: number | null): number {
  if (remaining === null || remaining <= 0) return -1;
  let pick = -1;
  let gap = Infinity;
  plans.forEach((p, i) => {
    if (p.minutes === null) return;
    const diff = p.minutes - remaining;
    if (diff < -MATCH_WINDOW.before || diff > MATCH_WINDOW.after) return;
    if (Math.abs(diff) < gap) {
      gap = Math.abs(diff);
      pick = i;
    }
  });
  return pick;
}
