import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LIMITS, type CraftStockDto, type CraftStockSpec } from '@eranaut/shared';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { readJson, removeKey, writeJson } from '../core/storage';
import { Toast } from '../core/toast';
import { calculate } from './core/craft-calc';
import { CRAFT_DATA } from './core/data';
import { missing } from './craft-state';
import { CRAFT_STOCKS_CACHE_KEY, CRAFT_STOCK_ACTIVE_KEY } from './craft-keys';
import { CRAFT_FEATURES } from './craft-features';
import { CraftVm } from './craft-vm';
import { canSaveSpec, isBlank, sameSpec, sanitizeStocks, selCount, selFromSpec, specFrom, stockCount, stockFromSpec } from './craft-stock-state';

/**
 * 庫存組(D-329、D-330):命名、儲存的「配件選擇 + 記錄庫存」,存在伺服器、跨裝置同步,每人 10 組。
 * 只存選擇與庫存;四個開關(分類、晶類、展開骨架、記錄庫存)留在這台裝置,不跟著組走。
 * 載入 = 整組換掉目前的選擇與庫存,並把「記錄庫存」打開(唯一會動的開關)。
 *
 * 清單的同步方式和條件組合(`RouteFilterVm`)相同:進頁載入、回前景再抓,不輪詢;最後寫入為準;
 * 離線顯示快照,寫入需要網路;寫入成功才更新畫面,失敗丟出原始 HttpErrorResponse(409 = 已滿、400 = 驗證、404 = 別台已刪);登出清掉快照。
 * 展示模式沒有伺服器:`enabled` 為 false,整個功能不啟動。
 */
@Injectable({ providedIn: 'root' })
export class CraftStockVm {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);
  private readonly craft = inject(CraftVm);
  readonly enabled = inject(CRAFT_FEATURES).stockSets;

  readonly saved = signal<CraftStockDto[]>([]);
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  readonly pending = signal(0);
  /** 目前載入的那一組(改了內容之後仍保留,用來問「更新」還是「另存」)。id 記在這台裝置(`CRAFT_STOCK_ACTIVE_KEY`),重開 APP 後接回;配件與庫存本身另存在 `eranaut.craft.sel` / `.stock` */
  readonly activeId = signal<string | null>(null);
  /** 對話框:null = 關;save = 儲存、manage = 管理、replace = 載入前確認要換掉目前的內容 */
  readonly dialog = signal<'save' | 'manage' | 'replace' | null>(null);
  readonly loadTarget = signal<CraftStockDto | null>(null);

  readonly limit = LIMITS.maxCraftStocksPerUser;
  readonly isFull = computed(() => this.saved().length >= this.limit);
  readonly active = computed(() => this.saved().find((s) => s.id === this.activeId()) ?? null);

  /** 畫面上目前的選擇與庫存 */
  readonly current = computed<CraftStockSpec>(() => specFrom(this.craft.sel(), this.craft.stock()));
  /** 可以儲存:有選配件、而且記錄庫存裡有填東西(開關關著也算,D-330) */
  readonly canSave = computed(() => canSaveSpec(this.current()));
  readonly selCount = computed(() => selCount(this.current()));
  readonly stockCount = computed(() => stockCount(this.current()));
  /** 目前這份內容還缺幾項(以儲存內容計算,不看「記錄庫存」開關) */
  readonly missingCount = computed(() => {
    const sels = this.craft.selections();
    if (sels.length === 0) return 0;
    const st = this.craft.stock();
    const r = calculate(sels, { expandFrames: this.craft.view().expandedFrames }, CRAFT_DATA, st);
    return [...r.finals, ...r.directs, ...r.bases].filter((x) => missing(x, st) > 0).length;
  });
  /** 載入過某一組之後,內容又被改過 */
  readonly modified = computed(() => {
    const a = this.active();
    return a !== null && !sameSpec(this.current(), a.spec);
  });

  private started = false;
  /** 啟動時從這台裝置讀到的 id,等清單載入後接回(伺服器清單確認後清掉) */
  private restoreId: string | null = null;
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
    const storedActive = readJson<unknown>(CRAFT_STOCK_ACTIVE_KEY);
    this.restoreId = typeof storedActive === 'string' ? storedActive : null;
    const cached = sanitizeStocks(readJson<unknown>(CRAFT_STOCKS_CACHE_KEY));
    if (cached.length > 0) {
      this.saved.set(cached);
      this.loaded.set(true);
      this.applyRestore();
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
      this.setSaved(sanitizeStocks(await this.api.craftStocks()));
      this.applyRestore();
      this.restoreId = null; // 伺服器清單已確認:記的那組還在就已接回,不在就不再嘗試
      if (this.activeId() === null) removeKey(CRAFT_STOCK_ACTIVE_KEY);
      this.loaded.set(true);
      this.loadError.set(false);
    } catch {
      if (this.auth.status() === 'authenticated') this.loadError.set(true);
    }
  }

  /** 載入某一組會換掉目前的選擇與庫存;目前有內容、又和這一組不同、而且不是「已載入沒改過」的那一組時,先讓使用者確認 */
  needsConfirm(target: CraftStockDto): boolean {
    const cur = this.current();
    // 目前就是已載入、沒改過的那一組:換走不會丟東西,不用確認
    if (this.active() !== null && !this.modified()) return false;
    return !isBlank(cur) && !sameSpec(cur, target.spec);
  }

  /** 整組換掉目前的選擇與庫存,並打開「記錄庫存」(其它開關不動)。回傳因資料集已沒有而略過的庫存項數 */
  load(dto: CraftStockDto): number {
    const stock = stockFromSpec(dto.spec);
    const dropped = stockCount(dto.spec) - Object.keys(stock).length;
    const c = this.craft;
    c.sel.set(selFromSpec(dto.spec));
    c.stock.set(stock);
    c.pin.set(null);
    c.pinKind.set(null);
    c.treeFor.set(null);
    c.patchView({ stockMode: true });
    this.setActive(dto.id);
    if (dropped > 0) this.toast.show(`已略過 ${dropped} 個已不存在的庫存項目`, { tone: 'info' });
    return dropped;
  }

  async saveCurrent(name: string): Promise<CraftStockDto> {
    const created = await this.write(() => this.api.createCraftStock({ name: name.trim(), spec: this.current() }));
    this.setSaved([...this.saved(), created]);
    this.setActive(created.id);
    return created;
  }

  /** 用目前的內容覆蓋某一組(可同時改名) */
  async overwrite(id: string, name?: string): Promise<CraftStockDto> {
    const old = this.saved().find((s) => s.id === id);
    const updated = await this.write(() => this.api.updateCraftStock(id, { name: (name ?? old?.name ?? '').trim(), spec: this.current() }));
    this.replace(updated);
    this.setActive(updated.id);
    return updated;
  }

  /** 只改名稱,內容用已儲存的 */
  async rename(id: string, name: string): Promise<CraftStockDto> {
    const old = this.saved().find((s) => s.id === id);
    if (!old) throw new Error('not found');
    const updated = await this.write(() => this.api.updateCraftStock(id, { name: name.trim(), spec: old.spec }));
    this.replace(updated);
    return updated;
  }

  private favChain: Promise<void> = Promise.resolve();

  /** 切換常用:樂觀更新後依序送 PATCH;失敗改回並提示,404 重抓清單(同 `RouteFilterVm.toggleFavorite`) */
  toggleFavorite(id: string): void {
    if (!this.enabled) return;
    const cur = this.saved().find((s) => s.id === id);
    if (!cur) return;
    const next = !cur.favorite;
    this.setFavoriteLocal(id, next);
    this.favChain = this.favChain
      .then(() => this.api.setCraftStockFavorite(id, next))
      .then(
        () => undefined,
        (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            void this.refresh();
            return;
          }
          if (this.saved().find((s) => s.id === id)?.favorite === next) this.setFavoriteLocal(id, !next);
          this.toast.show('設定常用失敗,稍後再試', { tone: 'warn' });
        },
      );
  }

  private setFavoriteLocal(id: string, favorite: boolean): void {
    this.setSaved(this.saved().map((s) => (s.id === id ? { ...s, favorite } : s)));
  }

  async remove(id: string): Promise<void> {
    await this.write(() => this.api.deleteCraftStock(id));
    this.setSaved(this.saved().filter((s) => s.id !== id));
  }

  private async write<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) throw new Error('展示模式不儲存庫存組');
    this.pending.update((n) => n + 1);
    try {
      return await fn();
    } finally {
      this.pending.update((n) => Math.max(0, n - 1));
    }
  }

  private replace(updated: CraftStockDto): void {
    this.setSaved(this.saved().map((s) => (s.id === updated.id ? updated : s)));
  }

  private setSaved(list: CraftStockDto[]): void {
    this.saved.set(list);
    writeJson(CRAFT_STOCKS_CACHE_KEY, list);
    const id = this.activeId();
    if (id !== null && !list.some((s) => s.id === id)) this.setActive(null);
  }

  /** 換目前這一組,並記在這台裝置(null = 清掉) */
  private setActive(id: string | null): void {
    this.activeId.set(id);
    if (id === null) removeKey(CRAFT_STOCK_ACTIVE_KEY);
    else writeJson(CRAFT_STOCK_ACTIVE_KEY, id);
  }

  /** 啟動後接回上次選的那一組(內容不動:配件與庫存本來就由本機記錄還原,不能被清單覆蓋) */
  private applyRestore(): void {
    const id = this.restoreId;
    if (id !== null && this.activeId() === null && this.saved().some((s) => s.id === id)) this.activeId.set(id);
  }
}
