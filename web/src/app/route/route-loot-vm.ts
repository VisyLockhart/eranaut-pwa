import { Injectable, computed, signal } from '@angular/core';
import { ITEMS, ITEM_CATEGORIES, SEAS } from './core/data';

export interface LootItem {
  id: number;
  name: string;
  cat: string | null;
}

/** 資料集的分類代碼有的是數字、有的是字串,統一成字串;沒有分類回 null */
function normCat(c: unknown): string | null {
  return c === null || c === undefined ? null : String(c);
}

/** 「其他」分類:資料集沒有分類的物品(碎晶、水晶、素材等) */
export const CATEGORY_OTHER = 'other';

/** 資料集裡所有「真的會掉落」的物品(沒有出現在任何航點掉落表的物品不列) */
const DROPPABLE: LootItem[] = (() => {
  const seen = new Set<number>();
  for (const sea of SEAS) for (const p of sea.points) for (const id of [...p.drop.low, ...p.drop.mid, ...p.drop.high]) seen.add(id);
  return [...seen]
    .map((id) => ({ id, name: ITEMS[String(id)]?.name ?? '', cat: normCat(ITEMS[String(id)]?.cat) }))
    .filter((i) => i.name !== '')
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
})();

/** 物品 id → 繁中名稱(找不到回 id 字串) */
export function itemName(id: number): string {
  return ITEMS[String(id)]?.name ?? String(id);
}

/**
 * 指定物品(找路線的「想要的物品」,D-222)的挑選狀態:搜尋、分類、已選物品、全部都要 / 任一個。
 * 挑選視窗是否開著放在 `pickerOpen`。root 層級、只存記憶體,換分頁不丟。路線的計算在 `RouteFindVm`。
 */
@Injectable({ providedIn: 'root' })
export class RouteLootVm {
  readonly query = signal('');
  /** null = 全部分類 */
  readonly category = signal<string | null>(null);
  /** 想要的物品(可複選) */
  readonly itemIds = signal<number[]>([]);
  /** all = 路線要拿得到全部物品;any = 任一個即可 */
  readonly match = signal<'all' | 'any'>('all');
  /** 物品挑選視窗是否開著 */
  readonly pickerOpen = signal(false);

  /** 只列真的有可掉落物品的分類(例如「時裝」目前沒有任何掉落物,不顯示) */
  readonly categories = [
    ...Object.entries(ITEM_CATEGORIES).map(([id, label]) => ({ id, label })),
    { id: CATEGORY_OTHER, label: '其他' },
  ].filter((c) => DROPPABLE.some((i) => (c.id === CATEGORY_OTHER ? i.cat === null : i.cat === c.id)));

  readonly matches = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    return DROPPABLE.filter((i) => (cat === null || (cat === CATEGORY_OTHER ? i.cat === null : i.cat === cat)) && (q === '' || i.name.toLowerCase().includes(q)));
  });
  readonly items = computed(() => this.itemIds().map((id) => DROPPABLE.find((i) => i.id === id)).filter((i): i is LootItem => !!i));

  setQuery(q: string): void {
    this.query.set(q);
  }
  setCategory(c: string | null): void {
    this.category.set(c);
  }
  /** 點一下加入、再點一下取消(複選) */
  toggle(id: number): void {
    this.itemIds.update((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }
  isChosen(id: number): boolean {
    return this.itemIds().includes(id);
  }
  clear(): void {
    this.itemIds.set([]);
  }
  setMatch(m: 'all' | 'any'): void {
    this.match.set(m);
  }
  setPickerOpen(open: boolean): void {
    this.pickerOpen.set(open);
  }
}
