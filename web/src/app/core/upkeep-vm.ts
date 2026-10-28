import { Injectable, computed, inject, signal } from '@angular/core';
import type { SubmarineDto, SubmarineInput, UpkeepDto, UpkeepPatch, WorkshopWithSubmarines } from '@eranaut/shared';
import { UPKEEP_LIMITS, repairMaterialsForSig, upkeepPhase, upkeepRoute, type UpkeepPhase } from '@eranaut/shared';
import { DataStore } from './data-store';
import { displayFor, isReady } from './format';

// 配件維修提醒(D-288)的前端資料:每艘的階段文字、同工坊 4 艘的面板狀態、快速修改的草稿轉成請求。
// 趟數與提醒由 API 計算並推進;這裡只負責顯示與送出使用者的操作。

/** 總覽上的一艘維修狀態(已算好顯示用的字串) */
export interface UpkeepItem {
  id: string;
  workshopId: string;
  position: number;
  upkeep: UpkeepDto;
  phase: UpkeepPhase;
  /** 已返航(探索完成,或預計返航時間已到) */
  returned: boolean;
  /** 還能跑幾趟(用盡為 0) */
  remaining: number;
  /** 整艘四個零件一次維修的預估修理材料;算不出來為 null */
  materials: number | null;
  /** 目前綁定的配置和開啟時不同(換過零件或解除綁定) */
  configChanged: boolean;
  /** 一行簡短說明,例:`維修 2/6 趟`、`最後一趟,返航後需維修`、`需維修才能出航(6/6 趟)` */
  label: string;
  /** 狀態,例:`已返航`、`探索中・02:41 後返航` */
  status: string;
}

export function upkeepItem(sub: SubmarineDto, now: number): UpkeepItem | null {
  const u = sub.upkeep;
  if (!u) return null;
  const returned = isReady(sub, now);
  const phase = upkeepPhase(u.voyages_done, u.limit_voyages, returned);
  const etaMs = sub.expected_return_at === null ? null : Date.parse(sub.expected_return_at);
  const label =
    phase === 'repair_now'
      ? `需維修才能出航(${u.voyages_done}/${u.limit_voyages} 趟)`
      : phase === 'repair_after_return'
        ? '最後一趟,返航後需維修'
        : `維修 ${u.voyages_done}/${u.limit_voyages} 趟`;
  return {
    id: sub.id,
    workshopId: sub.workshop_id,
    position: sub.position,
    upkeep: u,
    phase,
    returned,
    remaining: Math.max(0, u.limit_voyages - u.voyages_done),
    materials: repairMaterialsForSig(u.parts_sig),
    configChanged: u.current_sig !== u.parts_sig,
    label,
    status: returned ? '已返航' : `探索中・${displayFor(false, etaMs, now).time}後返航`,
  };
}

export interface WorkshopUpkeep {
  items: UpkeepItem[];
  /** 沒開啟維修提醒的潛艇 */
  untracked: SubmarineDto[];
  /** 現在就不能出航(用盡且已返航) */
  repairNow: number;
  /** 這趟是最後一趟、返航後需要維修 */
  afterReturn: number;
}

export function workshopUpkeep(ws: Pick<WorkshopWithSubmarines, 'submarines'>, now: number): WorkshopUpkeep {
  const items: UpkeepItem[] = [];
  const untracked: SubmarineDto[] = [];
  for (const s of ws.submarines) {
    const item = upkeepItem(s, now);
    if (item) items.push(item);
    else untracked.push(s);
  }
  return {
    items,
    untracked,
    repairNow: items.filter((i) => i.phase === 'repair_now').length,
    afterReturn: items.filter((i) => i.phase === 'repair_after_return').length,
  };
}

/** 路線的顯示文字(資料集沒有的 key 退回原樣) */
export function upkeepRouteLabel(routeKey: string): string {
  return upkeepRoute(routeKey)?.label ?? routeKey;
}

// ---- 快速修改的草稿 ----

/** 快速修改裡對維修提醒的操作;null(沒碰)= 請求不帶 `upkeep`,維持原狀 */
export interface QuickUpkeepDraft {
  enabled: boolean;
  routeKey: string;
  /** 可跑趟數(預設取資料集,可改) */
  limit: number;
  /** `fresh` = 剛維修完、滿耐久;`ran` = 已經跑過 `ran` 趟 */
  mode: 'fresh' | 'ran';
  ran: number;
}

/** 草稿 → 請求裡的 `upkeep` 欄位:undefined = 不變、null = 關閉、物件 = 開啟 */
export function upkeepRequest(draft: QuickUpkeepDraft | null, tracked: boolean): SubmarineInput['upkeep'] {
  if (draft === null) return undefined;
  if (!draft.enabled) return tracked ? null : undefined;
  return { route_key: draft.routeKey, limit_voyages: draft.limit, already_done: draft.mode === 'ran' ? Math.min(draft.ran, draft.limit - 1) : 0 };
}

/** 送出後這艘算第幾趟(探索完成只記錄已跑幾趟,下次出航才 +1) */
export function upkeepNote(draft: QuickUpkeepDraft, exploring: boolean): string {
  const done = draft.mode === 'ran' ? Math.min(draft.ran, draft.limit - 1) : 0;
  return exploring
    ? `送出後這趟算第 ${done + 1} 趟;第 ${draft.limit} 趟返航時提醒維修。`
    : `送出後記錄已跑 ${done} 趟;下次出航算第 ${done + 1} 趟,第 ${draft.limit} 趟返航時提醒維修。`;
}

export const clampLimit = (n: number): number => Math.min(UPKEEP_LIMITS.maxVoyages, Math.max(UPKEEP_LIMITS.minVoyages, n));

// ---- 同工坊維修面板 ----

/**
 * 面板的狀態放在 service(換手機/桌機版面重建元件時不會丟失)。
 * 預設勾選「現在就要維修」的潛艇;最後一趟還沒回來的可以手動勾選提前維修。
 */
@Injectable({ providedIn: 'root' })
export class UpkeepVm {
  private readonly store = inject(DataStore);

  /** 面板開啟的工坊 id;null = 關閉 */
  readonly openId = signal<string | null>(null);
  readonly picked = signal<ReadonlySet<string>>(new Set());
  /** 展開「調整趟數」的那一艘 */
  readonly adjustId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly workshop = computed(() => this.store.workshops().find((w) => w.id === this.openId()) ?? null);
  readonly view = computed(() => {
    const ws = this.workshop();
    return ws === null ? null : workshopUpkeep(ws, this.store.now());
  });
  /** 實際生效的勾選(已被標示維修或關閉提醒的艇自動排除) */
  readonly selection = computed(() => {
    const v = this.view();
    return v === null ? [] : v.items.filter((i) => this.picked().has(i.id));
  });
  readonly selectedMaterials = computed(() => this.selection().reduce((sum, i) => sum + (i.materials ?? 0), 0));

  /** 可在面板上左右切換的工坊(總覽有多間工坊需要維修時,D-290);只有一間時面板不顯示切換 */
  readonly openList = signal<readonly string[]>([]);
  /** 目前是清單中的第幾間(0 起算);不在清單為 -1 */
  readonly navIndex = computed(() => this.openList().indexOf(this.openId() ?? ''));

  open(workshopId: string, list?: readonly string[]): void {
    const ws = this.store.workshops().find((w) => w.id === workshopId);
    if (!ws) return;
    this.openList.set(list && list.includes(workshopId) ? [...list] : [workshopId]);
    this.picked.set(new Set(workshopUpkeep(ws, this.store.now()).items.filter((i) => i.phase === 'repair_now').map((i) => i.id)));
    this.adjustId.set(null);
    this.error.set(null);
    this.openId.set(workshopId);
  }

  close(): void {
    if (this.saving()) return;
    this.openId.set(null);
  }

  /** 面板上切到上一間 / 下一間(循環) */
  step(dir: 1 | -1): void {
    const list = this.openList();
    const i = this.navIndex();
    if (this.saving() || list.length < 2 || i < 0) return;
    this.open(list[(i + dir + list.length) % list.length], list);
  }

  toggle(id: string): void {
    this.picked.update((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  toggleAdjust(id: string): void {
    this.adjustId.set(this.adjustId() === id ? null : id);
  }

  /** 標示已維修(勾選的幾艘):趟數歸 0 */
  async markRepaired(): Promise<void> {
    const ws = this.workshop();
    const ids = this.selection().map((i) => i.id);
    if (ws === null || ids.length === 0 || this.saving()) return;
    await this.run(() => this.store.markUpkeepRepaired(ws.id, ids), true);
  }

  /** 手動修正趟數 / 上限 */
  async adjust(id: string, patch: UpkeepPatch): Promise<void> {
    if (this.saving()) return;
    await this.run(() => this.store.adjustUpkeep(id, patch), false);
  }

  /** 關閉這艘的維修提醒 */
  async disable(id: string): Promise<void> {
    if (this.saving()) return;
    this.picked.update((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    await this.run(() => this.store.disableUpkeep(id), false);
  }

  private async run(action: () => Promise<void>, closeAfter: boolean): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    try {
      await action();
      if (closeAfter) this.openId.set(null);
    } catch {
      this.error.set('送出失敗，請稍後再試。');
    } finally {
      this.saving.set(false);
    }
  }
}
