import { Injectable, computed, inject, signal } from '@angular/core';
import { SEA_INDEXES } from './core/data';
import { findVarietyRoutes, type VarietyRoute } from './core/variety';
import type { BuildStats } from './core/types';
import { RouteVm } from './route-vm';

interface VarietySnapshot {
  level: number;
  stats: BuildStats;
  sea: number | 'all';
  maxMinutes: number | null;
}

/**
 * 距離型推薦(D-215)的畫面狀態:海域、航行時間上限。root 層級、只存在記憶體;
 * 按「找路線」才計算,結果依按下當時的等級與性能,之後改配置只會顯示「已過時」提醒。
 */
@Injectable({ providedIn: 'root' })
export class RouteVarietyVm {
  private readonly vm = inject(RouteVm);

  readonly sea = signal<number | 'all'>('all');
  readonly maxHours = signal<number | null>(null);
  readonly busy = signal(false);
  private readonly snapshot = signal<VarietySnapshot | null>(null);

  readonly result = computed<VarietyRoute[] | null>(() => {
    const q = this.snapshot();
    if (!q) return null;
    return findVarietyRoutes(SEA_INDEXES, { level: q.level, stats: q.stats, sea: q.sea, maxMinutes: q.maxMinutes });
  });
  readonly searchedStats = computed(() => this.snapshot()?.stats ?? null);
  readonly stale = computed(() => {
    const q = this.snapshot();
    if (!q) return false;
    const s = this.vm.stats();
    return q.level !== this.vm.level() || q.stats.surveillance !== s.surveillance || q.stats.speed !== s.speed || q.stats.range !== s.range;
  });

  run(): void {
    if (this.busy()) return;
    this.busy.set(true);
    setTimeout(() => {
      const hours = this.maxHours();
      this.snapshot.set({ level: this.vm.level(), stats: this.vm.stats(), sea: this.sea(), maxMinutes: hours === null ? null : hours * 60 });
      this.busy.set(false);
    }, 0);
  }
}
