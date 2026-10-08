import { Injectable, computed, inject, signal } from '@angular/core';
import { TABLES } from './core/data';
import { SEARCH_LIMIT, searchBuilds, type SearchMins, type SearchResult, type SearchSort } from './core/search';
import { RouteVm } from './route-vm';

export type MinKey = keyof SearchMins;
export const MIN_KEYS: readonly { key: MinKey; label: string }[] = [
  { key: 'surveillance', label: '探索' },
  { key: 'retrieval', label: '收集' },
  { key: 'speed', label: '巡航' },
  { key: 'range', label: '距離' },
  { key: 'favor', label: '恩惠' },
];

interface Query {
  level: number;
  mins: SearchMins;
  weightLimit: number | null;
  sort: SearchSort;
  routeDistance: number;
}

/**
 * 配置搜尋(M4,ROUTE-SIM.md §5 第 8 點)的畫面狀態:六項最低需求(五項性能 + 重量上限)與排序。
 * root 層級,切換分頁不會丟輸入;只存在記憶體(不寫 localStorage)。按「搜尋」才計算(10⁴ 組,數毫秒)。
 */
@Injectable({ providedIn: 'root' })
export class RouteSearchVm {
  private readonly vm = inject(RouteVm);

  readonly mins = signal<SearchMins>({ surveillance: 0, retrieval: 0, speed: 0, range: 0, favor: 0 });
  /** null = 用該等級的重量上限 */
  readonly weightLimit = signal<number | null>(null);
  readonly sort = signal<SearchSort>('time');
  private readonly query = signal<Query | null>(null);

  readonly result = computed<SearchResult | null>(() => {
    const q = this.query();
    if (!q) return null;
    return searchBuilds(TABLES, {
      level: q.level,
      mins: q.mins,
      sort: q.sort,
      limit: SEARCH_LIMIT,
      ...(q.weightLimit === null ? {} : { weightLimit: q.weightLimit }),
      ...(q.sort === 'time' && q.routeDistance > 0 ? { routeDistance: q.routeDistance } : {}),
    });
  });
  /** 搜尋用的等級(按下搜尋當下的畫面等級) */
  readonly searchedLevel = computed(() => this.query()?.level ?? null);
  readonly sortNeedsRoute = computed(() => this.sort() === 'time' && this.vm.cost().distance <= 0);

  setMin(key: MinKey, value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.min(9999, Math.floor(value))) : 0;
    this.mins.update((m) => ({ ...m, [key]: v }));
  }

  setWeightLimit(value: number | null): void {
    this.weightLimit.set(value === null || !Number.isFinite(value) || value <= 0 ? null : Math.min(999, Math.floor(value)));
  }

  setSort(sort: SearchSort): void {
    this.sort.set(sort);
  }

  /** 用目前路線的需求帶入:探索 / 收集取最高階、恩惠、距離(耗用) */
  fillFromRoute(): void {
    const n = this.vm.need();
    this.mins.set({ surveillance: n.surveillanceHigh, retrieval: n.retrievalOptim, speed: 0, range: n.range, favor: n.favor });
  }

  clear(): void {
    this.mins.set({ surveillance: 0, retrieval: 0, speed: 0, range: 0, favor: 0 });
    this.weightLimit.set(null);
    this.query.set(null);
  }

  run(): void {
    this.query.set({
      level: this.vm.level(),
      mins: this.mins(),
      weightLimit: this.weightLimit(),
      sort: this.sort(),
      routeDistance: this.vm.cost().distance,
    });
  }
}
