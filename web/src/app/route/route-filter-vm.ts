import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LIMITS, type RouteFilterDto, type RouteFilterSpec } from '@eranaut/shared';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { readJson, writeJson } from '../core/storage';
import { Toast } from '../core/toast';
import { SEA_INDEXES } from './core/data';
import { DEFAULT_SPEC, autoName, fitToDataset, isDefaultSpec, sameSpec, sanitizeFilters } from './route-filter-state';
import { ROUTE_FILTERS_CACHE_KEY } from './route-cache';
import { RouteFindVm } from './route-find-vm';
import { ROUTE_FEATURES } from './route-features';

export { autoName };

/**
 * 找路線的「條件組合」(D-229):命名、儲存的篩選條件,跨裝置同步。
 * 篩選是查詢條件、配置是參數,所以載入時不判斷「符不符合」:整組套用,衝突由 `RouteFindVm.notes` 即時說明;
 * 從列上選一組(`load`)會整組套用並自動搜尋、收合海圖與條件區(D-230,取代 D-229 ⑤ 的「不自動搜尋」)。內容:必選 / 排除航點、海域、最長航行時間、想要的物品(含全部 / 任一個)、排序。
 * 不存:配置、去過的航點、海圖模式與停在哪個海域。
 *
 * 清單的同步方式和儲存潛艇(`RouteVm`)相同:進頁載入、回前景再抓,不輪詢;最後寫入為準;離線顯示快照,寫入需要網路;
 * 寫入成功才更新畫面,失敗丟出原始的 HttpErrorResponse(409 = 已滿 10 組、400 = 驗證);登出清掉快照。
 */
@Injectable({ providedIn: 'root' })
export class RouteFilterVm {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);
  private readonly f = inject(RouteFindVm);
  /** 展示模式沒有伺服器,不顯示條件組合 */
  readonly enabled = inject(ROUTE_FEATURES).saving;

  readonly saved = signal<RouteFilterDto[]>([]);
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  readonly pending = signal(0);
  /** 目前載入的那一組(只在記憶體;改了條件之後仍保留,用來問「更新」還是「另存」) */
  readonly activeId = signal<string | null>(null);
  /** 對話框:null = 關;save = 儲存、manage = 管理、replace = 載入前確認要換掉目前的條件 */
  readonly dialog = signal<'save' | 'manage' | 'replace' | null>(null);
  /** 'replace' 對話框要載入的那一組(目前有條件時先確認) */
  readonly loadTarget = signal<RouteFilterDto | null>(null);

  readonly isFull = computed(() => this.saved().length >= LIMITS.maxRouteFiltersPerUser);
  readonly active = computed(() => this.saved().find((s) => s.id === this.activeId()) ?? null);

  /** 畫面上目前的條件 */
  readonly current = computed<RouteFilterSpec>(() => ({
    v: 1,
    sea: this.f.sea(),
    max_hours: this.f.maxHours(),
    sort: this.f.sort(),
    required: [...this.f.required()].sort((a, b) => a - b),
    excluded: [...this.f.excluded()].sort((a, b) => a - b),
    item_ids: [...this.f.l.itemIds()],
    match: this.f.l.match(),
  }));
  /** 目前條件完全沒有限制(儲存沒有意義) */
  readonly isEmpty = computed(() => isDefaultSpec(this.current()));
  /** 載入過某一組之後,條件又被改過 */
  readonly modified = computed(() => {
    const a = this.active();
    return a !== null && !sameSpec(this.current(), a.spec);
  });

  private started = false;
  private readonly visibilityHandler = (): void => {
    if (document.visibilityState === 'visible') void this.refresh();
  };

  constructor() {
    effect(() => {
      const status = this.auth.status();
      if (status === 'anonymous' || status === 'expired') untracked(() => this.stop());
    });
  }

  start(): void {
    if (this.started || !this.enabled) return;
    this.started = true;
    const cached = sanitizeFilters(readJson<unknown>(ROUTE_FILTERS_CACHE_KEY));
    if (cached.length > 0) {
      this.saved.set(cached);
      this.loaded.set(true);
    }
    document.addEventListener('visibilitychange', this.visibilityHandler);
    void this.refresh();
  }

  stop(): void {
    if (this.started) document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.started = false;
    this.saved.set([]);
    this.loaded.set(false);
    this.loadError.set(false);
    this.pending.set(0);
    this.activeId.set(null);
    this.dialog.set(null);
    this.loadTarget.set(null);
  }

  async refresh(): Promise<void> {
    if (!this.enabled) return;
    try {
      this.setSaved(sanitizeFilters(await this.api.routeFilters()));
      this.loaded.set(true);
      this.loadError.set(false);
    } catch {
      if (this.auth.status() === 'authenticated') this.loadError.set(true);
    }
  }

  /** 載入某一組會換掉目前的條件;目前有條件、又不是這一組本身時,需要先讓使用者確認 */
  needsConfirm(target: RouteFilterDto): boolean {
    const cur = this.current();
    return !isDefaultSpec(cur) && !sameSpec(cur, target.spec);
  }

  /** 把整組條件套到畫面上(不搜尋)。回傳因資料集已沒有而略過的項目數 */
  apply(dto: RouteFilterDto): number {
    const { spec, dropped } = fitToDataset(dto.spec);
    const f = this.f;
    f.sea.set(spec.sea);
    f.maxHours.set(spec.max_hours);
    f.sort.set(spec.sort);
    f.required.set(new Set(spec.required));
    f.excluded.set(new Set(spec.excluded));
    f.l.itemIds.set([...spec.item_ids]);
    f.l.match.set(spec.match);
    f.tapNote.set('');
    f.mode.set('filter');
    // 海圖跳到最相關的海域:第一個必選點所在的海域,否則所選的海域
    const first = spec.required[0];
    const bySeaOfPoint = first !== undefined ? SEA_INDEXES.find((s) => s.byId.has(first))?.sea.sea : undefined;
    const target = bySeaOfPoint ?? (spec.sea === 'all' ? undefined : spec.sea);
    if (target !== undefined) f.x.viewSea.set(target);
    this.activeId.set(dto.id);
    if (dropped > 0) this.toast.show(`已略過 ${dropped} 個已不存在的項目`, { tone: 'info' });
    return dropped;
  }

  /**
   * 使用者從條件組合列選一組:整組套用後**自動搜尋**,並把海圖與條件區收合,讓結果直接出現在眼前(D-230)。
   * 套用本身(`apply`)不搜尋。
   */
  load(dto: RouteFilterDto): void {
    this.apply(dto);
    this.f.x.mapOpen.set(false);
    this.f.condOpen.set(false);
    this.f.scrollPending = true;
    this.f.run();
  }

  /** 清掉目前的條件(不動去過的航點與配置) */
  reset(): void {
    this.apply({ id: '', name: '', spec: DEFAULT_SPEC, created_at: '', updated_at: '' });
    this.activeId.set(null);
  }

  async saveCurrent(name: string): Promise<RouteFilterDto> {
    const created = await this.write(() => this.api.createRouteFilter({ name: name.trim(), spec: this.current() }));
    this.setSaved([...this.saved(), created]);
    this.activeId.set(created.id);
    return created;
  }

  /** 用目前的條件覆蓋某一組(可同時改名) */
  async overwrite(id: string, name?: string): Promise<RouteFilterDto> {
    const old = this.saved().find((s) => s.id === id);
    const updated = await this.write(() => this.api.updateRouteFilter(id, { name: (name ?? old?.name ?? '').trim(), spec: this.current() }));
    this.replace(updated);
    this.activeId.set(updated.id);
    return updated;
  }

  /** 只改名稱,條件用已儲存的 */
  async rename(id: string, name: string): Promise<RouteFilterDto> {
    const old = this.saved().find((s) => s.id === id);
    if (!old) throw new Error('not found');
    const updated = await this.write(() => this.api.updateRouteFilter(id, { name: name.trim(), spec: old.spec }));
    this.replace(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.write(() => this.api.deleteRouteFilter(id));
    this.setSaved(this.saved().filter((s) => s.id !== id));
  }

  private async write<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) throw new Error('展示模式不儲存條件組合');
    this.pending.update((n) => n + 1);
    try {
      return await fn();
    } finally {
      this.pending.update((n) => Math.max(0, n - 1));
    }
  }

  private replace(updated: RouteFilterDto): void {
    this.setSaved(this.saved().map((s) => (s.id === updated.id ? updated : s)));
  }

  private setSaved(list: RouteFilterDto[]): void {
    this.saved.set(list);
    writeJson(ROUTE_FILTERS_CACHE_KEY, list);
    const id = this.activeId();
    if (id !== null && !list.some((s) => s.id === id)) this.activeId.set(null);
  }
}
