import { Injectable, computed, inject, signal } from '@angular/core';
import { SEA_INDEXES } from './core/data';
import { findExpRoutes, type ExpRoute, type ExpSort, type RouteTier } from './core/recommend';
import type { BuildStats } from './core/types';
import { RouteVm } from './route-vm';

/** 練級查詢的條件;按「找路線」時連同當時的等級與性能一起存下來,結果不會因為之後改了配置而偷偷重算 */
interface ExpSnapshot {
  level: number;
  stats: BuildStats;
  sea: number | 'all';
  maxMinutes: number | null;
  tier: RouteTier;
  sort: ExpSort;
}

/** 航行時間上限的選項(小時);null = 不限 */
export const MAX_HOURS_OPTIONS: readonly (number | null)[] = [null, 6, 12, 24, 36, 48];

/**
 * 練級推薦(D-212)的畫面狀態:海域、航行時間上限、每站要拿到的階層、排序。
 * root 層級,切換分頁不丟輸入;只存在記憶體。按「找路線」才計算(最壞約 0.7 秒),
 * 先讓畫面顯示「計算中」再算,避免按下去像當掉。
 */
@Injectable({ providedIn: 'root' })
export class RouteExpVm {
  private readonly vm = inject(RouteVm);

  readonly sea = signal<number | 'all'>('all');
  readonly maxHours = signal<number | null>(null);
  readonly tier = signal<RouteTier>('any');
  readonly sort = signal<ExpSort>('perMin');
  readonly busy = signal(false);
  private readonly snapshot = signal<ExpSnapshot | null>(null);

  /** 找到的路線;null = 還沒搜尋 */
  readonly result = computed<ExpRoute[] | null>(() => {
    const q = this.snapshot();
    if (!q) return null;
    return findExpRoutes(SEA_INDEXES, { level: q.level, stats: q.stats, sea: q.sea, maxMinutes: q.maxMinutes, tier: q.tier, sort: q.sort });
  });
  /** 搜尋當時的性能(結果卡的燈號依這個判斷) */
  readonly searchedStats = computed(() => this.snapshot()?.stats ?? null);
  readonly searchedSort = computed(() => this.snapshot()?.sort ?? null);
  /** 搜尋之後又改了等級或零件:結果是舊配置算的,提醒重新搜尋 */
  readonly stale = computed(() => {
    const q = this.snapshot();
    if (!q) return false;
    const s = this.vm.stats();
    return q.level !== this.vm.level() || q.stats.surveillance !== s.surveillance || q.stats.speed !== s.speed || q.stats.range !== s.range;
  });

  run(): void {
    if (this.busy()) return;
    this.busy.set(true);
    // 讓「計算中」先畫出來,再做同步的計算
    setTimeout(() => {
      const hours = this.maxHours();
      this.snapshot.set({
        level: this.vm.level(),
        stats: this.vm.stats(),
        sea: this.sea(),
        maxMinutes: hours === null ? null : hours * 60,
        tier: this.tier(),
        sort: this.sort(),
      });
      this.busy.set(false);
    }, 0);
  }
}
