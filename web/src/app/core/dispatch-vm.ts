import { Injectable, inject, signal } from '@angular/core';
import { applyExp, type AssistMode, type ProgressInput, type ProgressRoute, type RouteFilterDto, type SubmarineDto } from '@eranaut/shared';
import { comboSuggest } from './assist-combo';
import { foundCodes, hasReturned, modeFor, nextStart, sameRoute, suggestLevel, suggestTiers, unlockTarget, type AssistView, type FoundCodes, type Goal, type NextStart, type Parts, type Suggestion, type UnlockTarget } from './dispatch';
import { foundOf } from './charts';
import { DataStore } from './data-store';
import { planRoute, routeText, type RoutePlan } from './leveling-vm';
import { RouteExploreVm } from '../route/route-explore-vm';
import { RouteFilterVm } from '../route/route-filter-vm';

// 航線輔助「派出建議」的畫面端狀態(D-291、D-297):建議面板的模式檢視、每艘的選項、送出時的路線。
// 截圖辨識與手動輸入的列、快速修改共用同一套選項與預設值。

/** 「這次派出」選了什麼:undefined(列上沒有這個欄位)= 用預設建議(航線輔助推薦) */
export type RouteSel = { kind: 'assist' } | { kind: 'last' } | { kind: 'own'; route: ProgressRoute } | { kind: 'none' };

export interface DispatchOption {
  /** assist = 航線輔助的推薦;last = 跟上一趟一樣;h<N>/h0 = 比較用的各最長航行時間 */
  key: string;
  label: string;
  plan: RoutePlan;
  /** 跑完抵達的等級 */
  after: number;
  /** 與前面某個選項是同一條路線時,那個選項的名稱 */
  sameAs: string | null;
  /** 由資料集推算(攻略沒有合適的路線) */
  calc: boolean;
  /** 會解鎖下一個潛艇欄位(例:「艇3」) */
  unlock: string | null;
  /** 依工坊海圖避開的攻略點(代號,D-293) */
  avoided?: string[];
  /** 解鎖點還沒發現,這趟先去的點(代號,D-293) */
  prereq?: string;
  /** 練級:設定的上限內沒有路線,放寬到這個小時數 */
  relaxedTo?: number | null;
  /** 條件組合找不到路線時,改用練級推薦,這裡是原因 */
  fallback?: string;
}

/** 條件組合模式的狀態 */
export interface ComboState {
  /** 選的條件名稱;沒選 / 已被刪除為 null */
  name: string | null;
  /** ok = 用條件組合的結果;none = 找不到符合的路線;missing = 沒選條件或條件已被刪除;loading = 條件清單還沒載入 */
  state: 'ok' | 'none' | 'missing' | 'loading';
  reason?: string;
}

export interface DispatchInfo {
  sub: SubmarineDto;
  start: NextStart;
  /** 這艘自己的配件;沒設定為 null(此時 `lock` 是 'build',不能用) */
  parts: Parts | null;
  /** 實際用哪個模式(面板暫時切換時以切換的為準) */
  mode: AssistMode;
  /** 練級的最長航行時間(小時);null = 不限 */
  maxHours: Goal;
  /** 條件組合模式才有 */
  combo: ComboState | null;
  /** 不能用的原因(D-297:沒有配置);null = 可用 */
  lock: 'build' | null;
  /** 航線輔助的推薦 + 跟上一趟一樣(有記過才有) */
  options: DispatchOption[];
  /** 面板目前顯示的推薦 */
  current: DispatchOption | null;
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

/** 練級推薦的標籤 */
export const levelLabel = (maxHours: Goal, relaxedTo: number | null = null): string => {
  const h = relaxedTo ?? maxHours;
  return h === null ? '練級・不限' : `練級・${h}h`;
};

function optionOf(key: string, label: string, s: Suggestion): DispatchOption {
  return { key, label, plan: s.plan, after: s.after, sameAs: null, calc: s.source === 'calc', unlock: s.unlock, avoided: s.avoided, prereq: s.prereq, relaxedTo: s.relaxedTo };
}

/** 條件清單的來源(從 `RouteFilterVm` 取;測試直接給) */
export interface FilterSource {
  saved: readonly RouteFilterDto[];
  loaded: boolean;
}

export interface DispatchEnv {
  unlock?: UnlockTarget | null;
  found?: FoundCodes | null;
  /** 工坊海圖已發現的點 id(條件組合用) */
  foundIds?: ReadonlySet<number> | null;
  filters?: FilterSource | null;
  explored?: ReadonlySet<number>;
}

/** 一艘的選項;航線輔助沒開、沒填等級回 null;沒有配置時只回基本資料(不給建議) */
export function dispatchInfo(sub: SubmarineDto, parts: Parts | null, view: AssistView, now: number, env: DispatchEnv = {}): DispatchInfo | null {
  const start = nextStart(sub, now);
  if (!start) return null;
  const mode = modeFor(sub, view);
  const maxHours = sub.progress?.max_hours ?? null;
  const base: DispatchInfo = { sub, start, parts, mode, maxHours, combo: null, lock: null, options: [], current: null, toGray: false };
  if (parts === null) return { ...base, lock: 'build' };

  const unlock = env.unlock ?? null;
  const found = env.found ?? null;
  const options: DispatchOption[] = [];
  let combo: ComboState | null = null;
  let assist: DispatchOption | null = null;

  if (mode === 'combo') {
    const fid = sub.progress?.filter_id ?? null;
    const filter = env.filters?.saved.find((f) => f.id === fid) ?? null;
    if (!env.filters?.loaded && !filter) combo = { name: null, state: 'loading' };
    else if (!filter) combo = { name: null, state: 'missing' };
    else {
      const r = comboSuggest(filter.spec, start.level, start.exp, parts, env.foundIds ?? null, env.explored);
      if (r.ok) {
        combo = { name: filter.name, state: 'ok' };
        assist = { key: 'assist', label: `條件組合・${filter.name}`, plan: r.plan, after: r.after, sameAs: null, calc: false, unlock: null };
      } else combo = { name: filter.name, state: 'none', reason: r.reason };
    }
  }
  if (!assist) {
    const s = suggestLevel(maxHours, start.level, start.exp, parts, unlock, found);
    if (s) {
      assist = optionOf('assist', levelLabel(maxHours, s.relaxedTo), s);
      if (combo && combo.state !== 'ok') assist.fallback = combo.state === 'none' ? (combo.reason ?? '沒有符合條件的路線') : combo.state === 'missing' ? '還沒選條件組合(或條件已被刪除)' : '條件組合還在載入';
    }
  }
  if (assist) options.push(assist);

  const last = sub.progress?.last_route;
  if (last) {
    const plan = planRoute(last.sea, last.points, parts, start.level);
    if (plan) {
      options.push({
        key: 'last',
        label: '跟上一趟一樣',
        plan,
        after: applyExp({ level: start.level, exp_in_level: start.exp }, plan.exp).level,
        sameAs: assist && sameRoute(assist.plan, plan) ? assist.label : null,
        calc: false,
        unlock: unlock && plan.sea === 1 && plan.points.includes(unlock.code) ? unlock.mark : null,
      });
    }
  }
  const toGray = assist !== null && assist.plan.sea === 1 && assist.after >= 50;
  return { ...base, combo, options, current: assist, toGray };
}

/** 練級的各最長航行時間並排比較(面板展開時才算);相同的路線標「與○○相同」 */
export function tierOptions(info: DispatchInfo, env: DispatchEnv = {}): DispatchOption[] {
  if (!info.parts) return [];
  const out: DispatchOption[] = [];
  for (const s of suggestTiers(info.start.level, info.start.exp, info.parts, env.unlock ?? null, env.found ?? null)) {
    const o = optionOf(`h${s.maxHours ?? 0}`, levelLabel(s.maxHours), s);
    const twin = out.find((x) => sameRoute(x.plan, o.plan));
    out.push(twin ? { ...o, sameAs: twin.label } : o);
  }
  return out;
}

/** 選擇 → 實際路線;選「不記經驗」或找不到回 null */
export function resolveRoute(info: DispatchInfo, sel: RouteSel | undefined): ResolvedRoute | null {
  const s: RouteSel = sel ?? { kind: 'assist' };
  if (s.kind === 'none') return null;
  if (s.kind === 'own') {
    if (!info.parts) return null;
    const plan = planRoute(s.route.sea, s.route.points, info.parts, info.start.level);
    if (!plan) return null;
    return { route: s.route, plan, after: applyExp({ level: info.start.level, exp_in_level: info.start.exp }, plan.exp).level, label: '自己選點' };
  }
  const o = info.options.find((x) => x.key === s.kind);
  return o ? { route: { sea: o.plan.sea, points: [...o.plan.points] }, plan: o.plan, after: o.after, label: o.label } : null;
}

/** 下拉 / 面板的選項值 */
export function selKey(sel: RouteSel | undefined, info: DispatchInfo): string {
  if (sel === undefined) return info.current ? 'assist' : 'none';
  return sel.kind;
}

export function selFromKey(key: string, own: ProgressRoute | null = null): RouteSel {
  if (key === 'none') return { kind: 'none' };
  if (key === 'last') return { kind: 'last' };
  if (key === 'own' && own) return { kind: 'own', route: own };
  return { kind: 'assist' };
}

export const routeLine = (r: Pick<ProgressRoute, 'points'>): string => routeText(r.points);

@Injectable({ providedIn: 'root' })
export class DispatchVm {
  private readonly store = inject(DataStore);
  private readonly filters = inject(RouteFilterVm);
  private readonly explore = inject(RouteExploreVm);
  /** 建議面板的模式檢視;只是暫時檢視,不改各艇的設定(D-297) */
  readonly view = signal<AssistView>('pref');

  /** 條件組合要用已儲存的條件清單:開始載入(重複呼叫無妨) */
  start(): void {
    this.filters.start();
  }

  /** 這艘自己的配件;還沒設定回 null */
  partsOf(subId: string): Parts | null {
    for (const w of this.store.workshops()) {
      const b = w.submarines.find((s) => s.id === subId)?.build;
      if (b) return [b.hull, b.stern, b.bow, b.bridge] as const;
    }
    return null;
  }

  private env(sub: SubmarineDto): DispatchEnv {
    // 工坊有幾艘 = 已解鎖幾個欄位;還沒滿 4 艘時,潛艇-1 優先推薦解鎖下一個欄位的點(D-291 第二次調整)
    const ws = this.store.workshops().find((w) => w.id === sub.workshop_id);
    const foundIds = foundOf(ws);
    return {
      // 工坊有海圖紀錄時,建議先避開還沒發現的點(D-293)
      unlock: ws ? unlockTarget(ws.submarines, sub) : null,
      found: foundCodes(foundIds),
      foundIds,
      filters: { saved: this.filters.saved(), loaded: this.filters.loaded() },
      explored: this.explore.explored(),
    };
  }

  info(sub: SubmarineDto, now: number, view: AssistView = this.view()): DispatchInfo | null {
    return dispatchInfo(sub, this.partsOf(sub.id), view, now, this.env(sub));
  }

  /** 練級的各最長航行時間比較(展開時才算,計算量較大) */
  tiers(info: DispatchInfo): DispatchOption[] {
    return tierOptions(info, this.env(info.sub));
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
  const route = row.status === 'exploring' && sub && info && info.lock === null && hasReturned(sub, now) ? resolveRoute(info, row.route) : null;
  if (!ocr && !route) return undefined;
  return { ...(ocr ?? {}), ...(route ? { route: route.route } : {}) };
}

/** 這一列會不會記路線(畫面用):練級輔助開著、上一趟已返航、這次填的是探索中 */
export function isDispatch(status: SubmarineDto['status'], sub: SubmarineDto | undefined, info: DispatchInfo | null, now: number): boolean {
  return status === 'exploring' && !!sub && !!info && info.lock === null && hasReturned(sub, now);
}
