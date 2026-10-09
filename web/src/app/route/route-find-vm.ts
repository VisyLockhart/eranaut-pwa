import { Injectable, computed, inject, signal } from '@angular/core';
import { SEA_INDEXES } from './core/data';
import { checkRequired, findRoutes, searchSeas, type FindRoute, type FindSort } from './core/find';
import type { FilterState } from './route-map';
import { MAX_HOURS_OPTIONS, RouteExploreVm } from './route-explore-vm';
import { RouteLootVm } from './route-loot-vm';
import { RouteVm } from './route-vm';

export { MAX_HOURS_OPTIONS };

/** 海圖目前的模式(D-222):標記去過(原探索)或篩選航點 */
export type MapMode = 'visit' | 'filter';

/** 每個海域最多列幾條(必選點跨海域時,各海域分開算再合併,避免某個海域把別的海域擠掉) */
export const PER_SEA_LIMIT = 50;
export const FIND_LIMIT = 100;

export interface FindNote {
  kind: 'warn' | 'info';
  text: string;
}

/** 按「找路線」時存下的條件與當時的配置;結果不會因為之後改了配置而偷偷重算 */
interface FindSnapshot {
  sig: string;
  level: number;
  stats: ReturnType<RouteVm['stats']>;
  sea: number | 'all';
  maxMinutes: number | null;
  sort: FindSort;
  required: ReadonlySet<number>;
  excluded: ReadonlySet<number>;
  itemIds: readonly number[];
  match: 'all' | 'any';
  explored: ReadonlySet<number>;
}

function metric(r: FindRoute, sort: FindSort): number {
  return sort === 'perMin' ? r.perMin : sort === 'opens' ? r.opens.length : r.items.length;
}

/**
 * 找路線(D-222)的畫面狀態:海圖模式與篩選(必選 / 排除航點,只放記憶體)、海域、航行時間上限、指定物品、排序。
 * root 層級,換分頁不丟。去過的航點與地圖停在哪個海域放在 `RouteExploreVm`,指定物品的挑選放在 `RouteLootVm`。
 * 按「找路線」才計算(最壞約 1 秒),先讓「計算中」畫出來再算。
 */
@Injectable({ providedIn: 'root' })
export class RouteFindVm {
  private readonly vm = inject(RouteVm);
  readonly x = inject(RouteExploreVm);
  readonly l = inject(RouteLootVm);

  readonly mode = signal<MapMode>('filter');
  /** 「?」說明視窗開哪一個;null = 關 */
  readonly help = signal<MapMode | null>(null);
  readonly required = signal<ReadonlySet<number>>(new Set());
  readonly excluded = signal<ReadonlySet<number>>(new Set());
  /** 「看全部」物品視窗要顯示哪一條路線;null = 關 */
  readonly itemsFor = signal<FindRoute | null>(null);
  /** 點了等級不足的點時顯示的提示(給 aria-live 與畫面) */
  readonly tapNote = signal('');

  readonly sea = signal<number | 'all'>('all');
  readonly maxHours = signal<number | null>(null);
  readonly sort = signal<FindSort>('perMin');
  readonly busy = signal(false);
  private readonly snapshot = signal<FindSnapshot | null>(null);

  /** 地圖用:各點的篩選狀態(沒列出 = 未選) */
  readonly filterMap = computed(() => {
    const m = new Map<number, FilterState>();
    for (const id of this.required()) m.set(id, 'in');
    for (const id of this.excluded()) m.set(id, 'out');
    return m as ReadonlyMap<number, FilterState>;
  });
  /** 篩選模式:目前等級不足的航點(不能選) */
  readonly lockedIds = computed(() => {
    const level = this.vm.level();
    const out = new Set<number>();
    for (const si of SEA_INDEXES) for (const p of si.sea.points) if (p.rankReq > level) out.add(p.id);
    return out as ReadonlySet<number>;
  });
  readonly filterCount = computed(() => ({ required: this.required().size, excluded: this.excluded().size }));

  /** 篩選的即時提示:必選點走不完、被海域下拉忽略、探索排序下不是可去的點 */
  readonly notes = computed<FindNote[]>(() => {
    const out: FindNote[] = [];
    const req = this.required();
    if (req.size === 0 && this.excluded().size === 0) return out;
    const stats = this.vm.stats();
    const level = this.vm.level();
    const { seas, ignored } = searchSeas(SEA_INDEXES, { sea: this.sea(), required: req });
    if (ignored.length > 0) out.push({ kind: 'info', text: `${ignored.length} 個選中的航點不在所選海域內,已忽略` });
    for (const si of seas) {
      const c = checkRequired(si, req, level, stats.range);
      if (c.tooMany) out.push({ kind: 'warn', text: `${si.sea.name}:選中的航點超過 5 個,一趟最多只能去 5 個` });
      else if (c.rankLocked.length > 0) out.push({ kind: 'warn', text: `${si.sea.name}:有選中的航點等級不足` });
      else if (!c.ok) out.push({ kind: 'warn', text: `${si.sea.name}:選中的航點合起來走不完(耗用 ${c.range},距離上限 ${stats.range})` });
    }
    if (this.sort() === 'opens') {
      const ex = this.x.explored();
      const g = this.x.graph;
      const bad = [...req].filter((id) => ex.has(id) || (g.parent.has(id) && !ex.has(g.parent.get(id)!)));
      if (bad.length > 0) out.push({ kind: 'warn', text: '排序為「可能解鎖」時只列可去的點(前一個點已去過、自己還沒去過),有選中的航點不在其中,不會有結果' });
    }
    return out;
  });

  /** 目前的條件組成的簽名;和按「找路線」當時不同就表示結果過時 */
  private readonly sig = computed(() => {
    const s = this.vm.stats();
    return JSON.stringify([
      this.vm.level(),
      s.speed,
      s.range,
      s.surveillance,
      this.sea(),
      this.maxHours(),
      this.sort(),
      [...this.required()].sort((a, b) => a - b),
      [...this.excluded()].sort((a, b) => a - b),
      this.l.itemIds(),
      this.l.match(),
      this.sort() === 'opens' ? [...this.x.explored()].sort((a, b) => a - b) : null,
    ]);
  });

  readonly result = computed<FindRoute[] | null>(() => {
    const q = this.snapshot();
    if (!q) return null;
    const base = {
      level: q.level,
      stats: q.stats,
      maxMinutes: q.maxMinutes,
      sort: q.sort,
      required: q.required,
      excluded: q.excluded,
      itemIds: q.itemIds,
      match: q.match,
      explored: q.explored,
      graph: this.x.graph,
    };
    const { seas } = searchSeas(SEA_INDEXES, { sea: q.sea, required: q.required });
    if (seas.length <= 1 || q.required.size === 0) return findRoutes(SEA_INDEXES, { ...base, sea: q.sea, limit: FIND_LIMIT });
    // 必選點跨海域:各海域分開算再合併,避免某個海域把別的海域擠掉
    const merged = seas.flatMap((si) => findRoutes(SEA_INDEXES, { ...base, sea: si.sea.sea, limit: PER_SEA_LIMIT }));
    return merged.sort((a, b) => metric(b, q.sort) - metric(a, q.sort) || a.minutes - b.minutes || a.sea - b.sea);
  });
  /** 搜尋當時的性能(結果卡的燈號依這個判斷) */
  readonly searchedStats = computed(() => this.snapshot()?.stats ?? null);
  readonly searchedSort = computed(() => this.snapshot()?.sort ?? null);
  /** 搜尋之後又改了條件或配置:結果是舊的,提醒重新搜尋 */
  readonly stale = computed(() => {
    const q = this.snapshot();
    return !!q && q.sig !== this.sig();
  });

  setMode(m: MapMode): void {
    this.mode.set(m);
    this.tapNote.set('');
  }

  /** 篩選模式點一個航點:未選 → 選中 → 排除 → 未選(點三次回到未選);等級不足的點不能選 */
  cycleFilter(id: number): void {
    if (this.lockedIds().has(id)) {
      const si = SEA_INDEXES.find((s) => s.byId.has(id))!;
      const p = si.byId.get(id)!;
      this.tapNote.set(`${p.code} ${p.name} 需要 ${p.rankReq} 級,目前等級不足,不能選`);
      return;
    }
    this.tapNote.set('');
    const req = new Set(this.required());
    const exc = new Set(this.excluded());
    if (req.has(id)) {
      req.delete(id);
      exc.add(id);
    } else if (exc.has(id)) {
      exc.delete(id);
    } else {
      req.add(id);
    }
    this.required.set(req);
    this.excluded.set(exc);
  }

  clearFilter(): void {
    this.required.set(new Set());
    this.excluded.set(new Set());
    this.tapNote.set('');
  }

  setSort(s: FindSort): void {
    this.sort.set(s);
  }

  run(): void {
    if (this.busy()) return;
    this.busy.set(true);
    // 讓「計算中」先畫出來,再做同步的計算
    setTimeout(() => {
      const hours = this.maxHours();
      this.snapshot.set({
        sig: this.sig(),
        level: this.vm.level(),
        stats: this.vm.stats(),
        sea: this.sea(),
        maxMinutes: hours === null ? null : hours * 60,
        sort: this.sort(),
        required: this.required(),
        excluded: this.excluded(),
        itemIds: this.l.itemIds(),
        match: this.l.match(),
        explored: this.x.explored(),
      });
      this.busy.set(false);
    }, 0);
  }
}
