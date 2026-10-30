import {
  ASSIST_MAX_HOURS,
  LEVELING_POINTS,
  LEVELING_ROUTES,
  LEVELING_SCHOOLS,
  MAX_LEVELING_LEVEL,
  applyExp,
  recommendedRoute,
  type AssistMode,
  type LevelingRoute,
  type ProgressRoute,
  type SubmarineDto,
} from '@eranaut/shared';
import { permutations, MAX_STOPS } from '../route/core/route';
import { seaIndex } from '../route/core/data';
import type { SeaPoint } from '../route/core/types';
import { planRoute, statsFor, type RoutePlan } from './leveling-vm';

// 練級輔助的「出發前派出建議」(D-291)。純函式,不碰畫面與網路,方便測試。
// 流程:目前等級 + 上一趟待結算的經驗 → 返航後(下一趟出發時)的等級 → 該等級、最長航行時間內的推薦路線(航線輔助「練級」,D-297)。
// 推薦路線照攻略;這艘的配置跑不了攻略、或攻略超過時間上限時,才用資料集自己找(`calcRoute`)。條件組合模式見 assist-combo.ts。

export type Parts = readonly [number, number, number, number];
/** 航線輔助面板的檢視:各艇自己設定的模式,或暫時看某一個模式(只是檢視,不改各艇的設定,D-297) */
export type AssistView = 'pref' | AssistMode;

/** 練級的目標:最長航行時間(小時);null = 不限(每分鐘經驗最高,原「掐點收」) */
export type Goal = number | null;

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
}

/** 與伺服器一致(`hasReturned`):探索完成,或預計返航時間已過 */
export function hasReturned(sub: Pick<SubmarineDto, 'status' | 'expected_return_at'>, now: number): boolean {
  return sub.status === 'complete' || (sub.expected_return_at !== null && Date.parse(sub.expected_return_at) <= now);
}

/** 航線輔助開著的艇才有;沒填等級或沒開回 null */
export function nextStart(sub: Pick<SubmarineDto, 'status' | 'expected_return_at' | 'progress'>, now: number): NextStart | null {
  const p = sub.progress;
  if (!p || !p.assist_on) return null;
  const returned = hasReturned(sub, now);
  // 待結算的路線一律加上去:伺服器讀取時若已返航會先算好 effective,但重新抓資料前也可能剛好跨過返航時間,這裡自己算才一致
  const after = p.pending ? applyExp({ level: p.level, exp_in_level: p.exp_in_level }, p.pending.exp) : { level: p.level, exp_in_level: p.exp_in_level };
  return {
    level: after.level,
    exp: after.exp_in_level,
    fromLevel: p.level,
    returned,
    returnAt: returned || sub.expected_return_at === null ? null : Date.parse(sub.expected_return_at),
  };
}

/** 這艘用哪個模式(面板切到某個模式時,暫時以那個為準) */
export function modeFor(sub: Pick<SubmarineDto, 'progress'>, view: AssistView): AssistMode {
  return view !== 'pref' ? view : (sub.progress?.assist_mode ?? 'level');
}

export interface Suggestion {
  /** 這條是依哪個最長航行時間算的(null = 不限) */
  maxHours: Goal;
  /** 設定的上限內沒有路線,放寬到這個小時數才找到;沒放寬為 null */
  relaxedTo: number | null;
  plan: RoutePlan;
  /** 跑完這條抵達的等級 */
  after: number;
  /** guide = 攻略路線;calc = 配置走不了攻略路線,改由資料集推算 */
  source: 'guide' | 'calc';
  /** 這條路線會解鎖下一個潛艇欄位(例:「艇3」);沒有為 null */
  unlock: string | null;
  /** 依工坊海圖(D-293):攻略路線裡還沒發現、因此避開的點(代號);沒有省略 */
  avoided?: string[];
  /** 依工坊海圖:解鎖點還沒發現,這趟先去它路上的這個點(代號);沒有省略 */
  prereq?: string;
}

/** 工坊已發現的點,依海域分成代號集合(D-293);null = 沒有紀錄(不過濾) */
export type FoundCodes = ReadonlyMap<number, ReadonlySet<string>>;

export function foundCodes(found: ReadonlySet<number> | null): FoundCodes | null {
  if (!found) return null;
  const out = new Map<number, Set<string>>();
  for (const sea of [1, 2, 3, 4, 5, 6]) {
    let si: ReturnType<typeof seaIndex>;
    try {
      si = seaIndex(sea);
    } catch {
      continue;
    }
    const codes = new Set(si.sea.points.filter((p) => found.has(p.id)).map((p) => p.code));
    if (codes.size) out.set(sea, codes);
  }
  return out;
}

/** 解鎖點還沒發現時,先去哪個點:從根往解鎖點走,第一個還沒發現的點的上一個點(已發現);找不到回 null */
export function stepToward(found: FoundCodes, sea: number, code: string): string | null {
  const si = seaIndex(sea);
  const byCode = new Map(si.sea.points.map((p) => [p.code, p]));
  const parent = new Map<number, number>();
  for (const p of si.sea.points) for (const c of p.unlocks) parent.set(c, p.id);
  const target = byCode.get(code);
  if (!target) return null;
  const chain: string[] = [];
  for (let id: number | undefined = target.id; id !== undefined; id = parent.get(id)) {
    const p = si.byId.get(id);
    if (!p) break;
    chain.unshift(p.code);
  }
  const seen = found.get(sea) ?? new Set<string>();
  const i = chain.findIndex((c) => !seen.has(c));
  return i > 0 ? chain[i - 1]! : null;
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
 * 練級用的攻略路線(D-297):不限 = 「掐點收」攻略;有上限 = 三個流派的攻略裡,這艘的配置跑得動、航行時間在上限內、經驗最多的一條。
 * `ok` 可再加條件(例如工坊海圖:路線的點都已發現)。沒有符合的回 undefined。
 */
export function guideFor(goal: Goal, level: number, parts: Parts, ok: (r: LevelingRoute) => boolean = () => true): LevelingRoute | undefined {
  // 攻略路線只寫到 85 級(每級經驗表另外有到 145 級);再高沒有攻略可參考,一律交給系統推算(D-298)
  if (level > MAX_LEVELING_LEVEL) return undefined;
  let best: { r: LevelingRoute; exp: number; minutes: number } | undefined;
  for (const school of goal === null ? (['snap'] as const) : LEVELING_SCHOOLS) {
    const r = recommendedRoute(school, level);
    if (!r || !ok(r)) continue;
    const plan = planRoute(r.sea, r.points, parts, level);
    if (!plan || plan.problem !== null || plan.minutes === null) continue;
    if (goal !== null && plan.minutes > goal * 60) continue;
    if (!best || plan.exp > best.exp || (plan.exp === best.exp && plan.minutes < best.minutes)) best = { r, exp: plan.exp, minutes: plan.minutes };
  }
  return best?.r;
}

/**
 * 練級在這個等級的建議;攻略沒有資料回 null。
 * 有還沒解鎖的潛艇欄位(`unlock`)且等級夠時,路線一定要包含解鎖點(最高優先):攻略路線剛好包含就用攻略,沒有就以資料集推算;推算不出來才退回一般建議。
 * 一般建議:攻略裡這艘的配置跑得動、時間在上限內的最好一條;沒有就用資料集在上限內自己找。
 */
export function suggest(goal: Goal, level: number, exp: number, parts: Parts, unlock: UnlockTarget | null = null, found: FoundCodes | null = null): Suggestion | null {
  if (found) return suggestFound(goal, level, exp, parts, unlock, found);
  const base = recommendedRoute('snap', level);
  if (!base) return null;
  const make = (plan: RoutePlan, source: Suggestion['source'], mark: string | null = null): Suggestion => ({
    maxHours: goal,
    relaxedTo: null,
    plan,
    after: applyExp({ level, exp_in_level: exp }, plan.exp).level,
    source,
    unlock: mark,
  });
  const g = guideFor(goal, level, parts);
  const viaGuide = !!unlock && level >= unlock.rank && !!g && g.sea === 1 && g.points.includes(unlock.code);
  if (unlock && level >= unlock.rank && !viaGuide) {
    const calc = calcRoute(1, level, parts, goal, unlock.code);
    const plan = calc ? planRoute(1, calc, parts, level) : null;
    if (plan) return make(plan, 'calc', unlock.mark);
  }
  if (g) {
    const plan = planRoute(g.sea, g.points, parts, level);
    if (plan) return make(plan, 'guide', unlock && plan.sea === 1 && plan.points.includes(unlock.code) ? unlock.mark : null);
  }
  const calc = calcRoute(base.sea, level, parts, goal);
  const plan = calc ? planRoute(base.sea, calc, parts, level) : null;
  return plan ? make(plan, 'calc') : null;
}

/**
 * 有工坊海圖紀錄時的建議(D-293):先排除含「未發現」點的路線,再照原本的規則。
 * ① 解鎖點(最高優先):已發現 → 路線要含它;還沒發現 → 路線要含它路上第一個未發現點的上一個點(`stepToward`),回來後解鎖點才會出現。
 * ② 有攻略路線的點都已發現 → 照原本的規則。
 * ③ 攻略路線都含未發現的點 → 用資料集在已發現的點裡推算(先限攻略出現過的點,推不出來再放寬到全部已發現的點);
 *    攻略換到的海域還沒開放(例如還沒到灰海)→ 留在已開放、編號最大的海域。都推不出來才照攻略並標出未發現的點。
 */
function suggestFound(goal: Goal, level: number, exp: number, parts: Parts, unlock: UnlockTarget | null, found: FoundCodes): Suggestion | null {
  const base = recommendedRoute('snap', level);
  if (!base) return null;
  const seen = (sea: number) => found.get(sea) ?? new Set<string>();
  const allFound = (r: LevelingRoute) => r.points.every((c) => seen(r.sea).has(c));
  const allows = (sea: number): Set<string>[] => {
    const all = new Set([...seen(sea)].filter((c) => seaIndex(sea).sea.points.some((p) => p.code === c && p.rankReq <= level)));
    const guide = new Set([...allowedCodes(sea, level)].filter((c) => all.has(c)));
    return guide.size && guide.size < all.size ? [guide, all] : [all];
  };
  const make = (plan: RoutePlan, source: Suggestion['source'], extra: Partial<Suggestion> = {}): Suggestion => ({
    maxHours: goal,
    relaxedTo: null,
    plan,
    after: applyExp({ level, exp_in_level: exp }, plan.exp).level,
    source,
    unlock: null,
    ...extra,
  });
  const calcIn = (sea: number, required: string | null): RoutePlan | null => {
    for (const allow of allows(sea)) {
      const calc = calcRoute(sea, level, parts, goal, required, allow);
      const plan = calc ? planRoute(sea, calc, parts, level) : null;
      if (plan) return plan;
    }
    return null;
  };

  // ① 解鎖下一個潛艇欄位(最高優先)
  if (unlock && level >= unlock.rank) {
    const need = seen(1).has(unlock.code) ? unlock.code : stepToward(found, 1, unlock.code);
    if (need) {
      const g = guideFor(goal, level, parts, (r) => r.sea === 1 && r.points.includes(need) && allFound(r));
      const guidePlan = g ? planRoute(1, g.points, parts, level) : null;
      const plan = guidePlan ?? calcIn(1, need);
      if (plan) return make(plan, plan === guidePlan ? 'guide' : 'calc', need === unlock.code ? { unlock: unlock.mark } : { unlock: unlock.mark, prereq: need });
    }
  }

  // ② 攻略路線的點都已發現
  const gOk = guideFor(goal, level, parts, allFound);
  if (gOk) {
    const plan = planRoute(gOk.sea, gOk.points, parts, level);
    if (plan) return make(plan, 'guide');
  }

  // ③ 含未發現的點:在已發現的點裡推算;攻略的海域還沒開放就留在已開放、編號最大的海域
  const gAny = guideFor(goal, level, parts) ?? base;
  const missing = gAny.points.filter((c) => !seen(gAny.sea).has(c));
  const opened = [...found.keys()].filter((sea) => sea <= gAny.sea).sort((a, b) => b - a);
  const sea = seen(gAny.sea).size > 0 ? gAny.sea : (opened[0] ?? 1);
  const plan = calcIn(sea, null);
  if (plan) return make(plan, 'calc', missing.length ? { avoided: missing } : {});
  const guidePlan = planRoute(gAny.sea, gAny.points, parts, level);
  return guidePlan ? make(guidePlan, 'guide', missing.length ? { avoided: missing } : {}) : null;
}

/**
 * 練級的推薦:設定的上限內沒有路線時,依序放寬到更長的上限(D-297;資料集的航行時間至少 12 小時,所以低等級的 12 小時常常剛好不夠),
 * 找到的那條標上 `relaxedTo`。不限本身不放寬。
 */
export function suggestLevel(goal: Goal, level: number, exp: number, parts: Parts, unlock: UnlockTarget | null = null, found: FoundCodes | null = null): Suggestion | null {
  const tries = goal === null ? [null] : ASSIST_MAX_HOURS.filter((h): h is number => h !== null && h >= goal);
  for (const h of tries) {
    const s = suggest(h, level, exp, parts, unlock, found);
    if (s) return h === goal ? s : { ...s, relaxedTo: h };
  }
  return null;
}

/** 各個最長航行時間(不限、12、24、36、48 小時)各一條,面板展開時並排比較;相同的路線不重複列 */
export function suggestTiers(level: number, exp: number, parts: Parts, unlock: UnlockTarget | null = null, found: FoundCodes | null = null): Suggestion[] {
  const out: Suggestion[] = [];
  for (const h of ASSIST_MAX_HOURS) {
    const s = suggest(h, level, exp, parts, unlock, found);
    if (s) out.push(s);
  }
  return out;
}

export function sameRoute(a: Pick<ProgressRoute, 'sea' | 'points'>, b: Pick<ProgressRoute, 'sea' | 'points'>): boolean {
  return a.sea === b.sea && a.points.length === b.points.length && a.points.every((c, i) => c === b.points[i]);
}

// ---- 資料集推算(攻略沒有合適的路線時) ----

/**
 * 練級的目標對應的搜尋方式(D-297):不限 = 不限時間、每分鐘經驗最高;有上限 = 該時間內經驗最多。
 */
export function tierFor(goal: Goal): { max: number | null; by: 'perMin' | 'exp' } {
  return goal === null ? { max: null, by: 'perMin' } : { max: goal * 60, by: 'exp' };
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
  goal: Goal,
  required: string | null = null,
  /** 只從這些點挑(依工坊海圖,D-293);省略 = 攻略到這個等級出現過的點 */
  allowOverride: ReadonlySet<string> | null = null,
): string[] | null {
  const tier = tierFor(goal);
  const key = `${sea}|${level}|${parts.join('')}|${goal ?? '*'}|${required ?? ''}|${allowOverride ? [...allowOverride].sort().join(',') : '*'}`;
  const hit = calcMemo.get(key);
  if (hit !== undefined) return hit;
  const si = seaIndex(sea);
  const allow = allowOverride ?? allowedCodes(sea, level);
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
  const best = bestRoute(si, candidates, stats.range, stats.speed, tier.max, tier.by, fixed);
  const result: string[] | null = best ? best.map((p) => p.code) : null;
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
