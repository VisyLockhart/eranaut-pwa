import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { WorkshopDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { Auth } from './auth';
import { DispatchVm, type DispatchInfo } from './dispatch-vm';
import { DataStore } from './data-store';
import { chartSummary, type ChartSummary } from './charts';
import type { SubRow } from './submarine-form';
import { circled, displayFor, isReady, type SubDisplay } from './format';
import { readJson, writeJson } from './storage';
import { leadLabel } from './workshop-form';
import type { SelectMeta, SelectOption } from '../ui/select';
import { progressView, type ProgressView, type QuickProgressDraft } from './leveling-vm';
import { upkeepItem, workshopUpkeep, type QuickUpkeepDraft, type UpkeepItem, type WorkshopUpkeep } from './upkeep-vm';

/** 手機總覽統計區是否展開(各裝置獨立,只存 localStorage,D-166) */
export const STATS_OPEN_KEY = 'eranaut.stats-open';

/** 總覽上的一艘潛艇(已算好顯示用的字串與排序鍵) */
export interface OverviewItem {
  id: string;
  workshop: WorkshopWithSubmarines;
  position: number;
  name: string;
  ready: boolean;
  etaMs: number | null;
  display: SubDisplay;
  /** 配件維修提醒(D-288);沒開啟為 null */
  upkeep: UpkeepItem | null;
  /** 等級(D-289);沒填等級為 null,畫面不顯示任何東西 */
  level: ProgressView | null;
  /** 可收艇的下一趟派出建議(D-291,練級輔助開著才有,依該艇偏好的流派) */
  next: NextRoute | null;
}

export interface NextRoute {
  label: string;
  sea: number;
  points: string[];
  /** 出發時的等級;after > from 才顯示「→ Lv」 */
  from: number;
  after: number;
  /** 會解鎖下一個潛艇欄位(例:「艇3」) */
  unlock: string | null;
}

/** 總覽頂端的工坊維修摘要:該工坊有潛艇現在就要維修,或這趟回來後要維修 */
export interface UpkeepAlert extends WorkshopUpkeep {
  workshop: WorkshopWithSubmarines;
}

function nextRoute(info: DispatchInfo | null): NextRoute | null {
  const o = info && !info.start.over ? info.current : null;
  return o && info ? { label: o.label, sea: o.plan.sea, points: o.plan.points, from: info.start.level, after: o.after, unlock: o.unlock } : null;
}

/** 「伺服器 · 代表角色」(有設定的才顯示,D-99) */
export function wsMeta(w: Pick<WorkshopDto, 'server' | 'captain'>): string {
  const parts: string[] = [];
  if (w.server) parts.push(w.server);
  if (w.captain) parts.push(w.captain);
  return parts.length ? ' · ' + parts.join(' · ') : '';
}

/** 地址一行字:住宅區 · N 區 · 細節(D-53:只在 hover 提示泡泡顯示,不在總覽主畫面) */
export function addressLine(w: Pick<WorkshopDto, 'address_district' | 'address_ward' | 'address_detail'>): string {
  const parts: string[] = [];
  if (w.address_district) parts.push(w.address_district);
  if (w.address_ward !== null) parts.push(`${w.address_ward} 區`);
  let line = parts.join(' · ');
  if (w.address_detail) line += (line ? ' · ' : '') + w.address_detail;
  return line || '尚未設定地址';
}

/** 總覽的排序偏好(D-290,只存這台裝置) */
export const SORT_KEY = 'eranaut.overview-sort';

/** 三個可獨立開關的排序條件(權重固定:工坊 → 編號 → 返航)+ 方向 */
export interface OverviewSort {
  ws: boolean;
  pos: boolean;
  eta: boolean;
  desc: boolean;
}
export type SortField = 'ws' | 'pos' | 'eta';
export const SORT_FIELDS: readonly SortField[] = ['ws', 'pos', 'eta'];
export const SORT_FIELD_LABEL: Record<SortField, string> = { ws: '工坊', pos: '編號', eta: '返航' };
export const DEFAULT_SORT: OverviewSort = { ws: false, pos: false, eta: true, desc: false };

function readSort(): OverviewSort {
  const raw = readJson<Partial<OverviewSort>>(SORT_KEY);
  if (raw === null || typeof raw !== 'object') return { ...DEFAULT_SORT };
  const b = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
  return { ws: b(raw.ws, DEFAULT_SORT.ws), pos: b(raw.pos, DEFAULT_SORT.pos), eta: b(raw.eta, DEFAULT_SORT.eta), desc: b(raw.desc, DEFAULT_SORT.desc) };
}

/**
 * 依排序條件排列(D-290)。`keys` 依權重先後;方向套用到所有條件。
 * 返航:可收艇視為最早;沒有返航時間的艇不論方向一律排最後。全部同分時維持原順序(工坊順序、位置)。
 */
export function sortItems(items: readonly OverviewItem[], keys: readonly SortField[], desc: boolean, wsOrder: ReadonlyMap<string, number>): OverviewItem[] {
  const dir = desc ? -1 : 1;
  const cmp = (a: OverviewItem, b: OverviewItem): number => {
    for (const k of keys) {
      if (k === 'eta') {
        const na = !a.ready && a.etaMs === null;
        const nb = !b.ready && b.etaMs === null;
        if (na !== nb) return na ? 1 : -1;
        if (na) continue;
        const va = a.ready ? -1 : a.etaMs!;
        const vb = b.ready ? -1 : b.etaMs!;
        if (va !== vb) return (va - vb) * dir;
      } else {
        const va = k === 'ws' ? (wsOrder.get(a.workshop.id) ?? 0) : a.position;
        const vb = k === 'ws' ? (wsOrder.get(b.workshop.id) ?? 0) : b.position;
        if (va !== vb) return (va - vb) * dir;
      }
    }
    return 0;
  };
  return items.map((item, i) => ({ item, i })).sort((a, b) => cmp(a.item, b.item) || a.i - b.i).map((x) => x.item);
}

/** 依工坊分組時的一組 */
export interface OverviewGroup {
  workshop: WorkshopWithSubmarines;
  items: OverviewItem[];
  ready: number;
  /** 這間工坊需要維修(現在或返航後)的艘數 */
  upkeep: number;
}

/** 列表的一段:分組時每間工坊一段(帶 `group`),不分組時只有一段 */
export interface OverviewSection {
  key: string;
  group: OverviewGroup | null;
  items: OverviewItem[];
}

/** 「伺服器・代表角色」(分組標題、下拉選單的次要文字用;都沒填為空字串) */
export function wsInfo(w: Pick<WorkshopDto, 'server' | 'captain'>): string {
  return [w.server, w.captain].filter(Boolean).join('・');
}

/** 摘要列的維修文字:`2 艘需維修`、`1 艘返航後需維修`、`2 艘需維修、1 艘返航後` */
export function upkeepText(repairNow: number, afterReturn: number): string {
  if (repairNow > 0 && afterReturn > 0) return `${repairNow} 艘需維修、${afterReturn} 艘返航後`;
  return repairNow > 0 ? `${repairNow} 艘需維修` : `${afterReturn} 艘返航後需維修`;
}

/** 摘要列的配件維修狀態:none = 範圍內沒有艇開啟維修提醒(整格不顯示)、ok = 都還不用修、alert = 有要修的 */
export type UpkeepSummaryState = 'none' | 'ok' | 'alert';

/**
 * 總覽的畫面狀態與衍生資料:工坊切換(含「全部」)、排序與分組(D-290)、統計。
 * 手機與桌機兩種版面共用,所以放在 service,切換版面時不會丟失目前選的工坊。
 */
@Injectable({ providedIn: 'root' })
export class OverviewVm {
  private readonly store = inject(DataStore);
  private readonly dispatch = inject(DispatchVm);
  private readonly auth = inject(Auth);

  private readonly requestedIndex = signal(0);

  /** 手機版「統計 + 排序 + 檢視切換」區塊展開與否;預設收起(D-166、D-290) */
  readonly statsOpen = signal(readJson<boolean>(STATS_OPEN_KEY) === true);

  toggleStats(): void {
    const next = !this.statsOpen();
    this.statsOpen.set(next);
    writeJson(STATS_OPEN_KEY, next);
  }

  readonly pagerLabels = computed(() => ['全部', ...this.store.workshops().map((w) => w.name)]);
  /** 0 = 全部;工坊被刪除導致超出範圍時退回「全部」 */
  readonly index = computed(() => (this.requestedIndex() <= this.store.workshops().length ? this.requestedIndex() : 0));
  readonly currentWorkshop = computed(() => (this.index() === 0 ? null : (this.store.workshops()[this.index() - 1] ?? null)));
  /** 目前檢視的工坊的海圖探索摘要(D-293);「全部」為 null */
  readonly chart = computed<ChartSummary | null>(() => {
    const ws = this.currentWorkshop();
    return ws ? chartSummary(ws, this.store.now()) : null;
  });

  /** 目前檢視的工坊的提醒設定(整批、預先提醒),總覽的「提醒」區塊用(D-294);「全部」為 null */
  readonly reminder = computed<{ batched: boolean; lead: string | null } | null>(() => {
    const ws = this.currentWorkshop();
    if (!ws) return null;
    return { batched: ws.notify_batched, lead: ws.notify_lead_minutes > 0 ? leadLabel(ws.notify_lead_minutes) : null };
  });

  // ---- 排序(D-290) ----

  readonly sort = signal<OverviewSort>(readSort());

  toggleSortField(field: SortField): void {
    this.setSort({ ...this.sort(), [field]: !this.sort()[field] });
  }
  toggleSortDir(): void {
    this.setSort({ ...this.sort(), desc: !this.sort().desc });
  }
  private setSort(next: OverviewSort): void {
    this.sort.set(next);
    writeJson(SORT_KEY, next);
  }

  /** 只看單一工坊時「工坊」條件沒有作用(按鈕停用,但保留開關狀態) */
  readonly wsSortDisabled = computed(() => this.currentWorkshop() !== null);
  /** 三個條件都關 = 使用預設(返航時間由近到遠),方向鈕停用 */
  readonly sortAllOff = computed(() => {
    const s = this.sort();
    return !s.ws && !s.pos && !s.eta;
  });
  /** 實際套用的條件(依權重);沒有任何條件時退回返航 */
  readonly sortKeys = computed<SortField[]>(() => {
    const s = this.sort();
    const keys = SORT_FIELDS.filter((f) => s[f] && !(f === 'ws' && this.wsSortDisabled()));
    return keys.length > 0 ? keys : ['eta'];
  });
  readonly sortDesc = computed(() => !this.sortAllOff() && this.sort().desc);
  /** 開著的條件各是第幾順位(按鈕上的小數字);沒套用為 0 */
  readonly sortRank = computed<Record<SortField, number>>(() => {
    const s = this.sort();
    const out: Record<SortField, number> = { ws: 0, pos: 0, eta: 0 };
    if (this.sortAllOff()) return out;
    let n = 0;
    for (const f of this.sortKeys()) if (s[f]) out[f] = ++n;
    return out;
  });
  /** 排序說明:`依 工坊 → 編號，由小到大`;短版給手機收合列用:`工坊→編號 ↑` */
  readonly sortSummary = computed(() => {
    if (this.sortAllOff()) return { long: '依返航時間，由近到遠（預設）', short: '返航 ↑', fields: ['返航'] };
    const fields = this.sortKeys().map((f) => SORT_FIELD_LABEL[f]);
    const desc = this.sortDesc();
    return { long: `依 ${fields.join(' → ')}，${desc ? '由大到小' : '由小到大'}`, short: `${fields.join('→')} ${desc ? '↓' : '↑'}`, fields };
  });

  /** 全部潛艇(未排序,依工坊順序與位置) */
  private readonly allItems = computed<OverviewItem[]>(() => {
    const now = this.store.now();
    const items: OverviewItem[] = [];
    for (const w of this.store.workshops()) {
      for (const s of w.submarines) {
        const ready = isReady(s, now);
        const etaMs = s.expected_return_at === null ? null : Date.parse(s.expected_return_at);
        items.push({
          id: s.id,
          workshop: w,
          position: s.position,
          name: s.name ?? `潛水艇 ${circled(s.position)}`,
          ready,
          etaMs,
          display: displayFor(ready, etaMs, now),
          upkeep: upkeepItem(s, now),
          level: progressView(s),
          next: ready ? nextRoute(this.dispatch.info(s, now, 'pref')) : null,
        });
      }
    }
    return items;
  });

  private readonly wsOrder = computed(() => new Map(this.store.workshops().map((w, i) => [w.id, i])));

  /** 全部潛艇依預設排序(待收艇在前,其餘依預計返航時間由近到遠) */
  readonly sortedAll = computed(() => sortItems(this.allItems(), ['eta'], false, this.wsOrder()));

  /** 目前範圍(單一工坊或全部)內、依使用者排序的潛艇 */
  readonly items = computed(() => {
    const cur = this.currentWorkshop();
    const scoped = cur === null ? this.allItems() : this.allItems().filter((i) => i.workshop.id === cur.id);
    return sortItems(scoped, this.sortKeys(), this.sortDesc(), this.wsOrder());
  });

  /** 「工坊」條件有套用(檢視全部時)就依工坊分組;否則 null */
  readonly groups = computed<OverviewGroup[] | null>(() => {
    if (!this.sortKeys().includes('ws')) return null;
    const out: OverviewGroup[] = [];
    for (const item of this.items()) {
      let g = out[out.length - 1];
      if (!g || g.workshop.id !== item.workshop.id) {
        g = { workshop: item.workshop, items: [], ready: 0, upkeep: 0 };
        out.push(g);
      }
      g.items.push(item);
      if (item.ready) g.ready++;
      if (item.upkeep && item.upkeep.phase !== 'ok') g.upkeep++;
    }
    return out;
  });

  readonly sections = computed<OverviewSection[]>(() => {
    const groups = this.groups();
    return groups === null ? [{ key: 'all', group: null, items: this.items() }] : groups.map((g) => ({ key: g.workshop.id, group: g, items: g.items }));
  });

  /** 目前檢視範圍(單一工坊或全部)內需要提醒維修的工坊,依工坊順序 */
  readonly upkeepAlerts = computed<UpkeepAlert[]>(() => {
    const cur = this.currentWorkshop();
    const now = this.store.now();
    return (cur === null ? this.store.workshops() : [cur])
      .map((workshop) => ({ workshop, ...workshopUpkeep(workshop, now) }))
      .filter((a) => a.repairNow + a.afterReturn > 0);
  });

  /** 摘要列的配件維修格 */
  readonly upkeepSummary = computed(() => {
    const alerts = this.upkeepAlerts();
    const repairNow = alerts.reduce((n, a) => n + a.repairNow, 0);
    const afterReturn = alerts.reduce((n, a) => n + a.afterReturn, 0);
    const tracked = this.items().some((i) => i.upkeep !== null);
    const state: UpkeepSummaryState = alerts.length > 0 ? 'alert' : tracked ? 'ok' : 'none';
    return { state, repairNow, afterReturn, total: repairNow + afterReturn, alerts };
  });

  /** 統計(依目前範圍:選了單一工坊就只算那間) */
  readonly stats = computed(() => {
    const items = this.items();
    const ready = items.filter((i) => i.ready).length;
    return {
      workshops: this.store.workshops().length,
      submarines: items.length,
      ready,
      /** 待收比例(%),摘要列的細條用 */
      readyPct: items.length === 0 ? 0 : Math.round((ready / items.length) * 1000) / 10,
    };
  });

  /** 下一艘返航:目前範圍內還在探索中、最早回來的一艘(已可收的由待收數表示);沒有為 null */
  readonly nextReturn = computed<OverviewItem | null>(() => {
    let best: OverviewItem | null = null;
    for (const i of this.items()) if (!i.ready && i.etaMs !== null && (best === null || i.etaMs < best.etaMs!)) best = i;
    return best;
  });

  /** 工坊下拉選單每個選項需要的計數 */
  readonly workshopCounts = computed(() => {
    const map = new Map<string, { total: number; ready: number; upkeep: number }>();
    for (const w of this.store.workshops()) map.set(w.id, { total: 0, ready: 0, upkeep: 0 });
    for (const i of this.allItems()) {
      const c = map.get(i.workshop.id)!;
      c.total++;
      if (i.ready) c.ready++;
      if (i.upkeep && i.upkeep.phase !== 'ok') c.upkeep++;
    }
    return map;
  });

  /** 工坊下拉選單(D-290):值為 index(0 = 全部),附次要文字與右側計數 */
  readonly workshopOptions = computed<SelectOption[]>(() => {
    const ws = this.store.workshops();
    const counts = this.workshopCounts();
    const all = this.allItems();
    const allReady = all.filter((i) => i.ready).length;
    const allUpkeep = all.filter((i) => i.upkeep && i.upkeep.phase !== 'ok').length;
    const meta = (ready: number, upkeep: number, total: number): SelectMeta[] => [
      ...(upkeep > 0 ? [{ text: `維修 ${upkeep}`, tone: 'danger' as const }] : []),
      ...(ready > 0 ? [{ text: `${ready} 待收`, tone: 'amber' as const }] : []),
      { text: `${total} 艘` },
    ];
    return [
      { value: 0, label: '全部', display: `全部 (${ws.length})`, hint: `${ws.length} 間工坊`, meta: meta(allReady, allUpkeep, all.length) },
      ...ws.map((w, i) => {
        const c = counts.get(w.id)!;
        return { value: i + 1, label: w.name, hint: wsInfo(w) || '未設定伺服器', meta: meta(c.ready, c.upkeep, c.total) };
      }),
    ];
  });

  goTo(index: number): void {
    this.requestedIndex.set(index >= 0 && index <= this.store.workshops().length ? index : 0);
  }

  /** 單艘快速修改的對象(D-117);null = 沒有開啟 */
  readonly quickEdit = signal<{ workshopId: string; position: number } | null>(null);

  /**
   * 快速修改對話框的填寫狀態也放在這裡,不放在對話框元件:視窗換螢幕等造成寬度跨過 768px 時,
   * 手機/桌機版面會整個重建,元件內的狀態會消失(D-163)
   */
  readonly quickRow = signal<SubRow | null>(null);
  readonly quickError = signal<string | null>(null);
  readonly quickFormError = signal<string | null>(null);
  readonly quickSaving = signal(false);
  /** 快速修改裡對維修提醒的操作(D-288);null = 沒碰,送出時不帶 `upkeep` */
  readonly quickUpkeep = signal<QuickUpkeepDraft | null>(null);
  /** 快速修改裡對練級輔助(D-289)的操作;null = 沒碰 */
  readonly quickProgress = signal<QuickProgressDraft | null>(null);

  constructor() {
    // 登出或 session 失效:關掉對話框、丟棄填到一半的內容
    effect(() => {
      if (this.auth.status() !== 'authenticated') untracked(() => this.closeQuickEdit());
    });
  }

  openQuickEdit(item: Pick<OverviewItem, 'workshop' | 'position'>): void {
    this.resetQuick();
    this.quickEdit.set({ workshopId: item.workshop.id, position: item.position });
  }
  closeQuickEdit(): void {
    this.quickEdit.set(null);
    this.resetQuick();
  }
  private resetQuick(): void {
    this.quickRow.set(null);
    this.quickError.set(null);
    this.quickFormError.set(null);
    this.quickSaving.set(false);
    this.quickUpkeep.set(null);
    this.quickProgress.set(null);
  }

  /** 從工坊管理點某間工坊:跳到總覽並套用該工坊過濾(D-101) */
  select(workshopId: string): void {
    const i = this.store.workshops().findIndex((w) => w.id === workshopId);
    this.requestedIndex.set(i >= 0 ? i + 1 : 0);
  }

  prev(): void {
    const n = this.pagerLabels().length;
    this.requestedIndex.set((this.index() - 1 + n) % n);
  }
  next(): void {
    this.requestedIndex.set((this.index() + 1) % this.pagerLabels().length);
  }
}
