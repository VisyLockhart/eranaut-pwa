import { Injectable, computed, inject, signal } from '@angular/core';
import { SEAS, SEA_INDEXES, TABLES } from './core/data';
import { selectability, type Selectability } from './core/route';
import { findBuildsForTarget, type BuildGoal, type TargetResult } from './core/target';
import { RouteVm } from './route-vm';

/** 收集、恩惠看「同一個地點」,速度可以走多個點 */
export const TARGET_MAX_STOPS: Record<BuildGoal, number> = { collect: 1, favor: 1, speed: 5 };

interface Snapshot {
  goal: BuildGoal;
  sea: number;
  ids: number[];
  level: number;
}

/**
 * 找配置(收集 / 恩惠 / 速度,D-214)的畫面狀態:想去的航點(只存記憶體,三個目標共用)與搜尋結果。
 * 用目前配置的等級找零件組合(10⁴ 組,數毫秒);按「找配置」才計算,先顯示「計算中」。
 */
@Injectable({ providedIn: 'root' })
export class RouteTargetVm {
  private readonly vm = inject(RouteVm);

  readonly sea = signal<number>(SEAS[0]!.sea);
  private readonly picked = signal<number[]>([]);
  readonly busy = signal(false);
  private readonly snapshot = signal<Snapshot | null>(null);

  readonly seaIdx = computed(() => SEA_INDEXES.find((s) => s.sea.sea === this.sea()) ?? SEA_INDEXES[0]!);

  ids(goal: BuildGoal): number[] {
    return this.picked().slice(-TARGET_MAX_STOPS[goal]);
  }

  states(goal: BuildGoal): Map<number, Selectability> {
    const ids = this.ids(goal);
    // 單點目標:再點別的點就是換掉,所以不會有「已選滿」
    const base = TARGET_MAX_STOPS[goal] === 1 ? [] : ids;
    const m = selectability(this.seaIdx(), base, this.vm.level(), Infinity);
    for (const id of ids) m.set(id, 'selected');
    return m;
  }

  setSea(sea: number): void {
    if (sea === this.sea()) return;
    this.sea.set(sea);
    this.picked.set([]);
  }

  /** 點一個航點;回傳 false = 不能選(等級不足或已選滿) */
  toggle(goal: BuildGoal, id: number): boolean {
    const ids = this.ids(goal);
    if (ids.includes(id)) {
      this.picked.set(ids.filter((x) => x !== id));
      return true;
    }
    const max = TARGET_MAX_STOPS[goal];
    if (this.states(goal).get(id) !== 'ok') return false;
    this.picked.set(max === 1 ? [id] : [...ids, id]);
    return true;
  }

  clear(): void {
    this.picked.set([]);
  }

  readonly result = computed<TargetResult | null>(() => {
    const q = this.snapshot();
    if (!q) return null;
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    return findBuildsForTarget(TABLES, si, q.ids, q.level, q.goal);
  });
  readonly searched = computed(() => this.snapshot());

  stale(goal: BuildGoal): boolean {
    const q = this.snapshot();
    if (!q) return false;
    const ids = this.ids(goal);
    return q.goal !== goal || q.sea !== this.sea() || q.level !== this.vm.level() || q.ids.join() !== ids.join();
  }

  run(goal: BuildGoal): void {
    const ids = this.ids(goal);
    if (this.busy() || ids.length === 0) return;
    this.busy.set(true);
    setTimeout(() => {
      this.snapshot.set({ goal, sea: this.sea(), ids, level: this.vm.level() });
      this.busy.set(false);
    }, 0);
  }
}
