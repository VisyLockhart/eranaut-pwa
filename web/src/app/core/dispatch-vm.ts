import { Injectable, inject, signal } from '@angular/core';
import { LEVELING_SCHOOL_LABEL, applyExp, type LevelingSchool, type ProgressInput, type ProgressRoute, type SubmarineDto } from '@eranaut/shared';
import { RouteVm } from '../route/route-vm';
import { hasReturned, nextStart, sameRoute, schoolFor, suggestAll, unlockTarget, type NextStart, type Parts, type Suggestion, type UnlockTarget, type ViewSchool } from './dispatch';
import { DataStore } from './data-store';
import { planRoute, routeText, type RoutePlan } from './leveling-vm';

// 練級輔助「派出建議」的畫面端狀態(D-291):建議面板的流派檢視、每艘的選項、送出時的路線。
// 截圖辨識與手動輸入的列、快速修改共用同一套選項與預設值。

/** 「這次派出」選了什麼:undefined(列上沒有這個欄位)= 用預設建議 */
export type RouteSel = { kind: 'school'; school: LevelingSchool } | { kind: 'last' } | { kind: 'own'; route: ProgressRoute } | { kind: 'none' };

export interface DispatchOption {
  /** snap / half / day / last / own */
  key: string;
  label: string;
  plan: RoutePlan;
  /** 跑完抵達的等級 */
  after: number;
  /** 這艘偏好的流派 */
  pref: boolean;
  /** 與前面某個選項是同一條路線時,那個選項的名稱 */
  sameAs: string | null;
  /** 配置走不了攻略路線,改由資料集推算 */
  calc: boolean;
  /** 會解鎖下一個潛艇欄位(例:「艇3」) */
  unlock: string | null;
}

export interface DispatchInfo {
  sub: SubmarineDto;
  start: NextStart;
  parts: Parts | null;
  /** 三個流派 + 跟上一趟一樣(有記過才有) */
  options: DispatchOption[];
  /** 面板目前檢視下的建議(各艇偏好,或暫時看的流派) */
  current: DispatchOption | null;
  /** 沒有綁定配置時,攻略的配置(時間依它推算) */
  guideConfig: Parts | null;
  /** 跨過 50 級:下一趟起改走灰海 */
  toGray: boolean;
}

/** 選定的路線(送出用) */
export interface ResolvedRoute {
  route: ProgressRoute;
  plan: RoutePlan;
  after: number;
  label: string;
}

function optionOf(s: Suggestion, pref: boolean, label: string): DispatchOption {
  return { key: s.school, label, plan: s.plan, after: s.after, pref, sameAs: null, calc: s.source === 'calc', unlock: s.unlock };
}

/** 一艘的選項;練級輔助沒開、沒填等級、超過 85 級回 null(只有 over 時仍回 start 供顯示) */
export function dispatchInfo(sub: SubmarineDto, parts: Parts | null, view: ViewSchool, now: number, unlock: UnlockTarget | null = null): DispatchInfo | null {
  const start = nextStart(sub, now);
  if (!start) return null;
  if (start.over) return { sub, start, parts, options: [], current: null, guideConfig: null, toGray: false };
  const prefSchool = sub.progress?.school ?? null;
  const sugg = suggestAll(start.level, start.exp, parts, unlock);
  const options: DispatchOption[] = [];
  for (const s of sugg) {
    const o = optionOf(s, s.school === prefSchool, LEVELING_SCHOOL_LABEL[s.school]);
    const twin = options.find((x) => sameRoute(x.plan, o.plan));
    options.push(twin ? { ...o, sameAs: twin.label } : o);
  }
  const last = sub.progress?.last_route;
  if (last) {
    const plan = planRoute(last.sea, last.points, parts ?? (sugg[0]?.guideConfig ?? null), start.level);
    if (plan) {
      const twin = options.find((x) => sameRoute(x.plan, plan));
      options.push({ key: 'last', label: '跟上一趟一樣', plan, after: applyExp({ level: start.level, exp_in_level: start.exp }, plan.exp).level, pref: false, sameAs: twin?.label ?? null, calc: false, unlock: unlock && plan.sea === 1 && plan.points.includes(unlock.code) ? unlock.mark : null });
    }
  }
  const school = schoolFor(sub, view);
  const current = options.find((o) => o.key === school) ?? options[0] ?? null;
  const guideConfig = parts === null ? (sugg.find((s) => s.school === school)?.guideConfig ?? sugg[0]?.guideConfig ?? null) : null;
  const toGray = current !== null && current.plan.sea === 1 && current.after >= 50;
  return { sub, start, parts, options, current, guideConfig, toGray };
}

/** 選擇 → 實際路線;選「不記經驗」或找不到回 null */
export function resolveRoute(info: DispatchInfo, sel: RouteSel | undefined): ResolvedRoute | null {
  const s: RouteSel = sel ?? { kind: 'school', school: (info.current?.key as LevelingSchool | undefined) ?? 'snap' };
  if (s.kind === 'none') return null;
  if (s.kind === 'own') {
    const plan = planRoute(s.route.sea, s.route.points, info.parts ?? info.guideConfig, info.start.level);
    if (!plan) return null;
    return { route: s.route, plan, after: applyExp({ level: info.start.level, exp_in_level: info.start.exp }, plan.exp).level, label: '自己選點' };
  }
  const key = s.kind === 'last' ? 'last' : s.school;
  const o = info.options.find((x) => x.key === key) ?? (sel === undefined ? info.current : null);
  return o ? { route: { sea: o.plan.sea, points: [...o.plan.points] }, plan: o.plan, after: o.after, label: o.label } : null;
}

/** 下拉 / 面板的選項值 */
export function selKey(sel: RouteSel | undefined, info: DispatchInfo): string {
  if (sel === undefined) return info.current?.key ?? 'none';
  return sel.kind === 'school' ? sel.school : sel.kind;
}

export function selFromKey(key: string, own: ProgressRoute | null = null): RouteSel {
  if (key === 'none') return { kind: 'none' };
  if (key === 'last') return { kind: 'last' };
  if (key === 'own' && own) return { kind: 'own', route: own };
  return { kind: 'school', school: key as LevelingSchool };
}

export const routeLine = (r: Pick<ProgressRoute, 'points'>): string => routeText(r.points);

@Injectable({ providedIn: 'root' })
export class DispatchVm {
  private readonly routeVm = inject(RouteVm);
  private readonly store = inject(DataStore);
  /** 建議面板的流派檢視;只是暫時檢視,不改各艇的偏好(D-291 ④) */
  readonly view = signal<ViewSchool>('pref');

  /** 需要各艇綁定的配置才能依配置推算:載入儲存的配置(已載入則不重複) */
  start(): void {
    this.routeVm.start();
  }

  partsOf(subId: string): Parts | null {
    const bound = this.routeVm.saved().find((r) => r.bound_submarine_ids.includes(subId));
    return bound ? ([bound.hull, bound.stern, bound.bow, bound.bridge] as const) : null;
  }

  info(sub: SubmarineDto, now: number, view: ViewSchool = this.view()): DispatchInfo | null {
    // 工坊有幾艘 = 已解鎖幾個欄位;還沒滿 4 艘時,潛艇-1 優先推薦解鎖下一個欄位的點(D-291 第二次調整)
    const ws = this.store.workshops().find((w) => w.id === sub.workshop_id);
    return dispatchInfo(sub, this.partsOf(sub.id), view, now, ws ? unlockTarget(ws.submarines, sub) : null);
  }
}

/**
 * 一列送出時的 `progress`(D-291):截圖辨識到的等級 + 這次派出的路線,合成一個請求。
 * - 只有「上一趟已返航、這次又派出」的艇才記路線(與伺服器 `settleOnDispatch` 判斷相同);還在航行中的只是修正時間,不動待結算的路線。
 * - 截圖等級:還在航行且等級與記錄相同 → 不送(否則伺服器會清掉還沒回來的那趟);
 *   已返航且等級等於「加上那趟之後」的等級 → 連同推算的經驗一起送,不讓這一級的經驗歸 0;其餘以辨識為準。
 */
export function rowProgress(
  row: { status: SubmarineDto['status']; ocrLevel?: number | null; route?: RouteSel },
  sub: SubmarineDto | undefined,
  info: DispatchInfo | null,
  now: number,
): ProgressInput | undefined {
  let ocr: ProgressInput | undefined;
  if (typeof row.ocrLevel === 'number') {
    const p = sub?.progress;
    const out = sub !== undefined && !hasReturned(sub, now);
    const after = p?.pending ? applyExp({ level: p.level, exp_in_level: p.exp_in_level }, p.pending.exp) : null;
    if (p && out && row.ocrLevel === p.level) ocr = undefined;
    else if (p && after && !out && row.ocrLevel === after.level) ocr = { level: after.level, exp_in_level: after.exp_in_level, source: 'ocr' };
    else ocr = { level: row.ocrLevel, source: 'ocr' };
  }
  const route = row.status === 'exploring' && sub && info && !info.start.over && hasReturned(sub, now) ? resolveRoute(info, row.route) : null;
  if (!ocr && !route) return undefined;
  return { ...(ocr ?? {}), ...(route ? { route: route.route } : {}) };
}

/** 這一列會不會記路線(畫面用):練級輔助開著、上一趟已返航、這次填的是探索中 */
export function isDispatch(status: SubmarineDto['status'], sub: SubmarineDto | undefined, info: DispatchInfo | null, now: number): boolean {
  return status === 'exploring' && !!sub && !!info && !info.start.over && hasReturned(sub, now);
}
