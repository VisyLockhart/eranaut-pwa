import {
  MAX_RECORDED_LEVEL,
  applyExp,
  clampExp,
  expSliderStep,
  levelExp,
  levelingPoints,
  routeExp,
  type AssistMode,
  type ProgressInput,
  type ProgressRoute,
  type SubmarineDto,
  type SubmarineInput,
} from '@eranaut/shared';
import { MAX_LEVEL, TABLES, seaIndex } from '../route/core/data';
import { buildStats } from '../route/core/build';
import { routeCost, splitMinutes, travelMinutes } from '../route/core/route';

// 潛艇等級與練級輔助(D-289)的畫面端邏輯:快速修改的草稿、總覽顯示用的資料、更新後「剛派出哪條路線」的詢問佇列。
// 等級是選填:沒填等級的潛艇完全不會出現這裡的任何東西。

// ---- 快速修改的草稿 ----

/**
 * 快速修改裡對「練級輔助」的操作;null(沒碰)= 請求不帶 `progress`,維持原狀。
 * `edited` = 使用者動過等級或經驗:只有動過才把數字送出去,否則(例如飛行中路線尚未結算)不會蓋掉伺服器已記的待結算路線。
 */
export interface QuickProgressDraft {
  enabled: boolean;
  level: number;
  exp: number;
  /** 航線輔助模式與各模式的設定(D-297) */
  mode: AssistMode;
  maxHours: number | null;
  filterId: string | null;
  edited: boolean;
}

/** 草稿 → 請求裡的 `progress` 欄位:undefined = 不變、物件 = 設定 */
export function progressRequest(draft: QuickProgressDraft | null, hasRow: boolean): SubmarineInput['progress'] {
  if (draft === null) return undefined;
  // 關閉:有紀錄只關掉練級輔助;關掉之前改過的等級與經驗照樣記下(等級是潛艇的資料,和有沒有開練級輔助無關)
  if (!draft.enabled) {
    // 沒有紀錄但填了等級:只記等級(不開輔助),等級是潛艇的資料(D-305)
    if (!hasRow && !draft.edited) return undefined;
    return draft.edited ? { assist_on: false, level: draft.level, exp_in_level: clampExp(draft.level, draft.exp) } : { assist_on: false };
  }
  const req: ProgressInput = { assist_on: true, assist_mode: draft.mode, max_hours: draft.maxHours, filter_id: draft.filterId };
  if (draft.edited || !hasRow) {
    req.level = draft.level;
    req.exp_in_level = clampExp(draft.level, draft.exp);
  }
  return req;
}

/** 開啟時的預設值:有紀錄就沿用(含截圖辨識的等級)與它的開關狀態,沒有從 1 級、經驗取中間、輔助關閉(D-305:等級與開關脫鉤) */
export function defaultDraft(sub: SubmarineDto | null): QuickProgressDraft {
  const p = sub?.progress;
  const level = p ? Math.min(p.effective_level, MAX_RECORDED_LEVEL) : 1;
  const exp = p ? p.effective_exp : middleExp(level);
  return { enabled: !!p?.assist_on, level, exp, mode: p?.assist_mode ?? 'level', maxHours: p?.max_hours ?? null, filterId: p?.filter_id ?? null, edited: false };
}

/** 滑桿預設值:這一級所需經驗的中間,對齊到步距 */
export function middleExp(level: number): number {
  const need = levelExp(level);
  if (need === null) return 0;
  const step = expSliderStep(level);
  return clampExp(level, Math.round(need / 2 / step) * step);
}

/** 換等級時把經驗夾回新等級的範圍;之前沒動過的經驗改回中間 */
export function changeLevel(d: QuickProgressDraft, level: number): QuickProgressDraft {
  const lv = Math.min(MAX_RECORDED_LEVEL, Math.max(1, Math.floor(level)));
  // 經驗還停在(舊等級的)預設中間值 = 使用者沒動過它,新等級也取中間;否則夾回新等級的範圍
  const untouched = !d.edited || d.exp === middleExp(d.level);
  return { ...d, level: lv, exp: untouched ? middleExp(lv) : clampExp(lv, d.exp), edited: true };
}

export function changeExp(d: QuickProgressDraft, exp: number): QuickProgressDraft {
  return { ...d, exp: clampExp(d.level, Math.round(exp)), edited: true };
}

// ---- 總覽顯示 ----

export interface ProgressView {
  level: number;
  /** 這一級的目前經驗與升級所需;沒有資料(146 級以上)為 null */
  exp: number | null;
  need: number | null;
  /** 0~100;沒有資料為 null */
  pct: number | null;
  /** 練級輔助推算:探索中且有待結算的路線 → 返航後增加的經驗與抵達的等級 */
  pending: { gain: number; toLevel: number } | null;
  fromOcr: boolean;
  /** 練級輔助開著:才顯示經驗條與返航後推算(沒開時經驗不是使用者填的,不顯示) */
  sim: boolean;
}

/** 沒填等級回 null(畫面不顯示任何東西) */
export function progressView(sub: Pick<SubmarineDto, 'progress' | 'status'>): ProgressView | null {
  const p = sub.progress;
  if (!p) return null;
  const level = p.effective_level;
  const need = levelExp(level);
  const exp = need === null ? null : p.effective_exp;
  const pending = p.pending && p.effective_level === p.level && p.effective_exp === p.exp_in_level ? p.pending : null;
  const after = pending ? applyExp({ level: p.level, exp_in_level: p.exp_in_level }, pending.exp) : null;
  return {
    level,
    exp,
    need,
    pct: need === null || exp === null ? null : Math.min(100, Math.round((exp / need) * 100)),
    pending: pending && after ? { gain: pending.exp, toLevel: after.level } : null,
    fromOcr: p.source === 'ocr',
    sim: p.assist_on,
  };
}

export const fmtExp = (n: number): string => n.toLocaleString('en-US');

/** 「→ Lv X」:有升級才顯示,不會升級回空字串(D-291 第二次調整) */
export function lvUp(from: number, to: number): string {
  return to > from ? `→ Lv ${to}` : '';
}

// ---- 路線的推算(推薦、自己選點共用) ----

export interface RoutePlan {
  sea: number;
  points: string[];
  exp: number;
  /** 以艇的配置推算(沒有配置為 null);無法推算(點位不存在)也是 null */
  minutes: number | null;
  range: number | null;
  rangeCap: number | null;
  /** 距離(耗用)不足、或等級不夠 */
  problem: 'range' | 'rank' | null;
}

type Parts = readonly [number, number, number, number];

/** 這組配置在 `level` 級的性能;等級超出資料集就用資料集的最高級 */
export function statsFor(parts: Parts, level: number) {
  return buildStats(TABLES, { level: Math.min(Math.max(level, 1), MAX_LEVEL), parts });
}

/** 一條路線(點位代碼,依航行順序)在某配置與等級下的經驗、時間、距離;點位不在資料集回 null */
export function planRoute(sea: number, points: readonly string[], parts: Parts | null, level: number): RoutePlan | null {
  const exp = routeExp(sea, points);
  if (exp === null) return null;
  const si = seaIndex(sea);
  const ids: number[] = [];
  for (const code of points) {
    const p = si.sea.points.find((x) => x.code === code);
    if (!p) return null;
    ids.push(p.id);
  }
  const rankOk = ids.every((id) => (si.byId.get(id)?.rankReq ?? 999) <= level);
  if (parts === null) return { sea, points: [...points], exp, minutes: null, range: null, rangeCap: null, problem: rankOk ? null : 'rank' };
  const stats = statsFor(parts, level);
  const cost = routeCost(si, ids);
  const minutes = travelMinutes(cost.distance, stats.speed);
  return {
    sea,
    points: [...points],
    exp,
    minutes: Number.isFinite(minutes) ? minutes : null,
    range: cost.range,
    rangeCap: stats.range,
    problem: !rankOk ? 'rank' : cost.range > stats.range ? 'range' : null,
  };
}

export function minutesText(minutes: number): string {
  const { days, hours, minutes: m } = splitMinutes(minutes);
  return `${days > 0 ? `${days}日` : ''}${hours}時${m}分`;
}

export function routeText(points: readonly string[]): string {
  return points.join(' → ');
}

/** 溺沒海 / 灰海的選點器按鈕:代碼、需要的等級、解鎖標示 */
export function pickerPoints(sea: number) {
  return levelingPoints(sea);
}
