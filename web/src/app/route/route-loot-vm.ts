import { Injectable, computed, inject, signal } from '@angular/core';
import { ITEMS, ITEM_CATEGORIES, SEAS, SEA_INDEXES } from './core/data';
import { findLootRoutes, obtainableTier, type LootRoute } from './core/loot';
import { RouteVm } from './route-vm';

export interface LootItem {
  id: number;
  name: string;
  cat: string | null;
}

export interface LootHit {
  sea: number;
  seaName: string;
  route: LootRoute;
  codes: string[];
  /** 這條路線拿得到的「想要的物品」名稱 */
  got: string[];
}

/** 每張海域最多取幾條,合併後再依每分鐘經驗排序 */
const PER_SEA = 30;

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

/**
 * 掉落物反查(M5,ROUTE-SIM.md §5 第 9 點)的畫面狀態:選了物品,就用目前配置(探索、巡航、距離、等級)
 * 對每張海域找路線,合併後依「經驗 ÷ ⌊航行時間⌋」排序。root 層級、只存記憶體,切分頁不丟。
 */
@Injectable({ providedIn: 'root' })
export class RouteLootVm {
  private readonly vm = inject(RouteVm);

  readonly query = signal('');
  /** null = 全部分類 */
  readonly category = signal<string | null>(null);
  /** 想要的物品(可複選) */
  readonly itemIds = signal<number[]>([]);
  /** all = 路線要拿得到全部物品;any = 任一個即可 */
  readonly match = signal<'all' | 'any'>('all');

  /** 物品挑選區是否展開(D-218);還沒選任何物品時一律展開,見 `pickerExpanded` */
  readonly pickerOpen = signal(true);
  readonly pickerExpanded = computed(() => this.itemIds().length === 0 || this.pickerOpen());

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

  readonly hits = computed<LootHit[]>(() => {
    const ids = this.itemIds();
    if (ids.length === 0) return [];
    const st = this.vm.stats();
    const level = this.vm.level();
    const wanted = this.items();
    const out: LootHit[] = [];
    for (const si of SEA_INDEXES) {
      const r = findLootRoutes(si, { itemIds: ids, match: this.match(), surveillance: st.surveillance, speed: st.speed, rangeCap: st.range, level }, PER_SEA);
      for (const route of r.routes) {
        const pts = route.order.map((pid) => si.byId.get(pid)!);
        const got = wanted.filter((it) => pts.some((p) => obtainableTier(p, it.id, st.surveillance) !== null)).map((it) => it.name);
        out.push({ sea: si.sea.sea, seaName: si.sea.name, route, codes: pts.map((p) => p.code), got });
      }
    }
    return out.sort((a, b) => b.route.score - a.route.score || a.route.minutes - b.route.minutes);
  });

  /** 這個物品在資料集的任何海域都有掉落,但目前配置拿不到(探索 / 等級 / 距離不夠) */
  readonly unreachable = computed(() => this.itemIds().length > 0 && this.hits().length === 0);

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
    this.pickerOpen.set(true);
  }
  setPickerOpen(open: boolean): void {
    this.pickerOpen.set(open);
  }
  setMatch(m: 'all' | 'any'): void {
    this.match.set(m);
  }
}
