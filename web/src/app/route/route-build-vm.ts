import { Injectable, computed, inject, signal } from '@angular/core';
import { SEAS, SEA_INDEXES, TABLES } from './core/data';
import { findBuilds, minsForGoal, minsFromNeed, NO_MINS, type BuildGoal, type BuildMins, type BuildResult, type BuildSort } from './core/buildfind';
import { routeNeed, type RouteNeed } from './core/need';
import { selectability, shortestOrder, type Selectability } from './core/route';
import { RouteVm } from './route-vm';

/** 收集、恩惠看「同一個地點」(最多 1 個點);速度與自訂最多 5 個點 */
export const BUILD_MAX_STOPS: Record<BuildGoal, number> = { collect: 1, favor: 1, speed: 5, custom: 5 };

export type MinKey = keyof BuildMins;
export const MIN_KEYS: readonly { key: MinKey; label: string }[] = [
  { key: 'surveillance', label: '探索' },
  { key: 'retrieval', label: '收集' },
  { key: 'speed', label: '巡航' },
  { key: 'range', label: '距離' },
  { key: 'favor', label: '恩惠' },
];

interface Snapshot {
  goal: BuildGoal;
  sea: number;
  ids: number[];
  level: number;
  mins: BuildMins;
  weightLimit: number | null;
  sort: BuildSort;
}

/**
 * 找配置(D-223)的畫面狀態:配置頁內的子畫面是否開著、目標(收集 / 恩惠 / 速度 / 自訂)、想去的航點、
 * 自訂的最低性能與重量上限、排序與搜尋結果。root 層級,換分頁不丟;全部只存記憶體。
 * 用目前配置的等級找零件組合(10⁴ 組,數毫秒);按「找配置」才計算,先讓「計算中」畫出來。
 */
@Injectable({ providedIn: 'root' })
export class RouteBuildVm {
  private readonly vm = inject(RouteVm);

  /** 配置頁是否顯示找配置子畫面 */
  readonly open = signal(false);
  readonly help = signal(false);
  readonly mapOpen = signal(true);
  readonly goal = signal<BuildGoal>('collect');
  readonly sea = signal<number>(SEAS[0]!.sea);
  private readonly picked = signal<number[]>([]);
  /** 自訂的最低性能 */
  readonly mins = signal<BuildMins>({ ...NO_MINS });
  /** null = 用該等級的重量上限 */
  readonly weightLimit = signal<number | null>(null);
  readonly sort = signal<BuildSort>('time');
  readonly busy = signal(false);
  private readonly snapshot = signal<Snapshot | null>(null);

  readonly seaIdx = computed(() => SEA_INDEXES.find((s) => s.sea.sea === this.sea()) ?? SEA_INDEXES[0]!);
  readonly maxStops = computed(() => BUILD_MAX_STOPS[this.goal()]);
  /** 目前目標實際使用的航點(切到點數較少的目標時只用最後選的,選點不丟) */
  readonly ids = computed(() => this.picked().slice(-this.maxStops()));
  /** 被少點數目標暫時擋掉的選點數(切回去會還原) */
  readonly hidden = computed(() => this.picked().length - this.ids().length);

  readonly states = computed<Map<number, Selectability>>(() => {
    const ids = this.ids();
    // 單點目標:再點別的點就是換掉,所以不會有「已選滿」
    const base = this.maxStops() === 1 ? [] : ids;
    const m = selectability(this.seaIdx(), base, this.vm.level(), Infinity);
    for (const id of ids) m.set(id, 'selected');
    return m;
  });

  /** 選的航點的路線需求;沒選時為 null */
  readonly need = computed<RouteNeed | null>(() => {
    const ids = this.ids();
    if (ids.length === 0) return null;
    const si = this.seaIdx();
    return routeNeed(si, shortestOrder(si, ids).order);
  });
  /** 畫面顯示的最低性能:預設目標由航點需求算出(唯讀),自訂用使用者填的 */
  readonly shownMins = computed<BuildMins | null>(() => {
    const g = this.goal();
    if (g === 'custom') return this.mins();
    const n = this.need();
    return n ? minsForGoal(g, n) : null;
  });

  readonly result = computed<BuildResult | null>(() => {
    const q = this.snapshot();
    if (!q) return null;
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    return findBuilds(TABLES, si, { level: q.level, ids: q.ids, goal: q.goal, mins: q.mins, weightLimit: q.weightLimit, sort: q.sort });
  });
  readonly searched = computed(() => this.snapshot());

  readonly stale = computed(() => {
    const q = this.snapshot();
    if (!q) return false;
    return (
      q.goal !== this.goal() ||
      q.sea !== this.sea() ||
      q.level !== this.vm.level() ||
      q.ids.join() !== this.ids().join() ||
      q.sort !== this.sort() ||
      q.weightLimit !== this.weightLimit() ||
      (q.goal === 'custom' && JSON.stringify(q.mins) !== JSON.stringify(this.mins()))
    );
  });

  setGoal(g: BuildGoal): void {
    this.goal.set(g);
  }

  setSea(sea: number): void {
    if (sea === this.sea()) return;
    this.sea.set(sea);
    this.picked.set([]);
  }

  /** 點一個航點;回傳 false = 不能選(等級不足或已選滿) */
  toggle(id: number): boolean {
    const ids = this.ids();
    if (ids.includes(id)) {
      this.picked.set(ids.filter((x) => x !== id));
      return true;
    }
    if (this.states().get(id) !== 'ok') return false;
    this.picked.set(this.maxStops() === 1 ? [id] : [...ids, id]);
    return true;
  }

  clearPicked(): void {
    this.picked.set([]);
  }

  setMin(key: MinKey, value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, Math.min(9999, Math.floor(value))) : 0;
    this.mins.update((m) => ({ ...m, [key]: v }));
  }

  setWeightLimit(value: number | null): void {
    this.weightLimit.set(value === null || !Number.isFinite(value) || value <= 0 ? null : Math.min(999, Math.floor(value)));
  }

  setSort(s: BuildSort): void {
    this.sort.set(s);
  }

  /** 預設目標「改成自訂」:把算出的最低性能複製到自訂再調(還沒選航點就只切換) */
  toCustom(): void {
    const m = this.shownMins();
    if (m) this.mins.set({ ...m });
    this.goal.set('custom');
  }

  /** 自訂「用航點需求帶入」:探索 / 收集取最高階、恩惠、距離 */
  fillFromRoute(): void {
    const n = this.need();
    if (n) this.mins.set(minsFromNeed(n));
  }

  clearCustom(): void {
    this.mins.set({ ...NO_MINS });
    this.weightLimit.set(null);
  }

  run(): void {
    const goal = this.goal();
    const ids = this.ids();
    if (this.busy() || (goal !== 'custom' && ids.length === 0)) return;
    this.busy.set(true);
    setTimeout(() => {
      this.snapshot.set({ goal, sea: this.sea(), ids, level: this.vm.level(), mins: this.mins(), weightLimit: this.weightLimit(), sort: this.sort() });
      this.busy.set(false);
    }, 0);
  }
}
