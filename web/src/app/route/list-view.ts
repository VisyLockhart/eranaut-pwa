import { computed, signal, type Signal } from '@angular/core';

/** 清單項目的最小形狀:配置與條件組合共用(D-237) */
export interface Listable {
  id: string;
  name: string;
  favorite: boolean;
}

/** 總數超過這個數字才顯示搜尋框與「常用」篩選(很少組時維持簡潔) */
export const TOOLS_MIN = 8;
/** 分頁大小:桌機 10、手機 6;對話框裡的清單用 `Infinity`(不分頁,改用捲動) */
export const PAGE_SIZE_DESKTOP = 10;
export const PAGE_SIZE_MOBILE = 6;

/** 工具列(搜尋、常用篩選)需要的部分;`ListView<T>` 都符合,所以工具列元件不必管項目型別 */
export interface ListToolsState {
  readonly query: Signal<string>;
  readonly favOnly: Signal<boolean>;
  readonly showTools: Signal<boolean>;
  readonly favCount: Signal<number>;
  readonly filtering: Signal<boolean>;
  readonly total: Signal<number>;
  readonly filtered: Signal<readonly unknown[]>;
  setQuery(value: string): void;
  setFavOnly(value: boolean): void;
}

/**
 * 清單檢視狀態(D-237):常用排前面(其餘維持原順序)、名稱搜尋、只看常用、分頁。
 * 全部在前端記憶體裡算:整份清單本來就常駐(下拉選單、離線快照、燈號比較都要用),伺服器不分頁。
 * 狀態不存 localStorage,元件重建就回到預設(與 D-222 ③ 一致)。
 *
 * - 項目數 ≤ `TOOLS_MIN` 時,搜尋與常用篩選一律不生效(工具列也不顯示),避免刪到剩幾組還卡在舊的篩選。
 * - 換搜尋字或篩選時回到第 1 頁;頁碼會自動夾在有效範圍內(刪除、取消常用之後不會停在空白頁)。
 */
export class ListView<T extends Listable> {
  readonly query = signal('');
  readonly favOnly = signal(false);
  private readonly rawPage = signal(1);

  constructor(
    private readonly items: () => readonly T[],
    private readonly pageSize: () => number = () => Infinity,
    private readonly haystack: (item: T) => string = (item) => item.name,
  ) {}

  readonly total = computed(() => this.items().length);
  readonly showTools = computed(() => this.total() > TOOLS_MIN);
  readonly favCount = computed(() => this.items().filter((i) => i.favorite).length);
  /** 搜尋或篩選正在生效 */
  readonly filtering = computed(() => this.showTools() && (this.query().trim() !== '' || this.favOnly()));

  /** 常用在前,同組內維持原順序 */
  readonly ordered = computed(() => {
    const all = this.items();
    return [...all.filter((i) => i.favorite), ...all.filter((i) => !i.favorite)];
  });

  readonly filtered = computed<T[]>(() => {
    const all = this.ordered();
    if (!this.filtering()) return all;
    const q = this.query().trim().toLowerCase();
    const fav = this.favOnly();
    return all.filter((i) => (!fav || i.favorite) && (q === '' || this.haystack(i).toLowerCase().includes(q)));
  });

  readonly pages = computed(() => {
    const size = this.pageSize();
    return Number.isFinite(size) && size > 0 ? Math.max(1, Math.ceil(this.filtered().length / size)) : 1;
  });
  readonly page = computed(() => Math.min(Math.max(1, this.rawPage()), this.pages()));
  readonly pageItems = computed<T[]>(() => {
    const size = this.pageSize();
    if (!Number.isFinite(size) || size <= 0) return this.filtered();
    const start = (this.page() - 1) * size;
    return this.filtered().slice(start, start + size);
  });

  setQuery(value: string): void {
    this.query.set(value);
    this.rawPage.set(1);
  }

  setFavOnly(value: boolean): void {
    this.favOnly.set(value);
    this.rawPage.set(1);
  }

  setPage(n: number): void {
    this.rawPage.set(Math.min(Math.max(1, Math.trunc(n) || 1), this.pages()));
  }

  clearFilters(): void {
    this.query.set('');
    this.favOnly.set(false);
    this.rawPage.set(1);
  }

  /** 翻到某一項所在的頁;不在目前的篩選結果裡就先清掉篩選。找不到這一項回 false */
  goTo(id: string): boolean {
    if (!this.items().some((i) => i.id === id)) return false;
    let index = this.filtered().findIndex((i) => i.id === id);
    if (index < 0) {
      this.clearFilters();
      index = this.filtered().findIndex((i) => i.id === id);
    }
    const size = this.pageSize();
    this.rawPage.set(Number.isFinite(size) && size > 0 ? Math.floor(index / size) + 1 : 1);
    return true;
  }
}
