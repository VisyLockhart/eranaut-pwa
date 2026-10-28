// 練級輔助(D-289)。前後端共用:經驗結算、推薦路線、經驗滑桿的步距。
// 資料(每級經驗、練級用點位、攻略路線)在 leveling-data.ts,由 tools/leveling-data/build.mjs 產生。

import { LEVEL_EXP, LEVELING_POINTS, LEVELING_ROUTES, type LevelingPoint, type LevelingRoute, type LevelingSchool } from './leveling-data.js';

export { LEVEL_EXP, LEVELING_POINTS, LEVELING_ROUTES };
export type { LevelingPoint, LevelingRoute, LevelingSchool };

/** 練級輔助只到 85 級;資料庫與截圖辨識可以記到更高的等級 */
export const MAX_LEVELING_LEVEL = 85;
export const MAX_RECORDED_LEVEL = 130;
export const LEVELING_SCHOOLS: readonly LevelingSchool[] = ['snap', 'half', 'day'];
export const LEVELING_SCHOOL_LABEL: Record<LevelingSchool, string> = { snap: '掐點收', half: '半日收', day: '整日收' };

/** 這一級升到下一級要多少經驗;超出資料範圍(86 級以上)回 null */
export function levelExp(level: number): number | null {
  return Number.isInteger(level) && level >= 1 && level <= LEVEL_EXP.length ? LEVEL_EXP[level - 1]! : null;
}

export function levelingPoints(sea: number): readonly LevelingPoint[] {
  return LEVELING_POINTS.find((s) => s.sea === sea)?.points ?? [];
}

/** 路線經驗 = 各點經驗直接加總(使用者確認);點位不在練級資料集、重複選同一點回 null */
export function routeExp(sea: number, codes: readonly string[]): number | null {
  const pts = levelingPoints(sea);
  if (codes.length === 0 || new Set(codes).size !== codes.length) return null;
  let sum = 0;
  for (const c of codes) {
    const p = pts.find((x) => x.code === c);
    if (!p) return null;
    sum += p.exp;
  }
  return sum;
}

export interface LevelState {
  level: number;
  exp_in_level: number;
}

/** 加上經驗並逐級進位。超過 85 級(練級輔助的範圍)就停在 86 級、經驗歸 0 */
export function applyExp(state: LevelState, gain: number): LevelState & { capped: boolean } {
  let { level, exp_in_level } = state;
  exp_in_level += gain;
  for (;;) {
    const need = levelExp(level);
    if (need === null) return { level, exp_in_level: 0, capped: true };
    if (exp_in_level < need) return { level, exp_in_level, capped: false };
    exp_in_level -= need;
    level += 1;
  }
}

/** 經驗滑桿每格的步距:約該級所需的 1%,取 1 / 2 / 5 × 10 的次方(Lv1 約 50、Lv20 約 1,000、Lv85 約 20,000) */
export function expSliderStep(level: number): number {
  const need = levelExp(level);
  if (need === null) return 1;
  const raw = need / 100;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
  return Math.max(1, nice * pow);
}

/** 換等級時,把目前經驗夾回新等級的範圍(< 升級所需) */
export function clampExp(level: number, exp: number): number {
  const need = levelExp(level);
  return Math.max(0, need === null ? 0 : Math.min(exp, need - 1));
}

/** 該等級、該流派的推薦路線:等級 < 50 看溺沒海,≥ 50 看灰海;取「從這個等級起適用」的最後一列;沒有就取第一列 */
export function recommendedRoute(school: LevelingSchool, level: number): LevelingRoute | undefined {
  const sea = level >= 50 ? 2 : 1;
  const rows = LEVELING_ROUTES.filter((r) => r.school === school && r.sea === sea).sort((a, b) => a.level - b.level);
  let pick: LevelingRoute | undefined = rows[0];
  for (const r of rows) if (r.level <= level) pick = r;
  return pick;
}

// --- 進度(後端存、前端顯示)---

export interface PendingRoute {
  sea: number;
  points: string[];
  /** 派出時算好的經驗,返航後才加進等級 */
  exp: number;
}

export interface ProgressCore extends LevelState {
  pending: PendingRoute | null;
}

/** 已返航時,把待結算的路線經驗加進去;沒有待結算或還沒返航則原樣回傳 */
export function settleProgress(p: ProgressCore, returned: boolean): LevelState & { settled: boolean } {
  if (!p.pending || !returned) return { level: p.level, exp_in_level: p.exp_in_level, settled: false };
  const r = applyExp(p, p.pending.exp);
  return { level: r.level, exp_in_level: r.exp_in_level, settled: true };
}
