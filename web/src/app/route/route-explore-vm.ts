import { Injectable, computed, inject, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { Toast } from '../core/toast';
import { readJson, writeJson } from '../core/storage';
import { SEAS } from './core/data';
import { closeExplored, markExplored, unmarkExplored, type UnlockGraph } from './core/unlock';
import { UNLOCK_GRAPH as GRAPH, changedSeas, foundOf } from '../core/charts';

export const EXPLORED_KEY = 'eranaut.route.explored';
/** 航線頁選的工坊(套用它的海圖,D-293);只存這台裝置 */
export const CHART_WS_KEY = 'eranaut.route.chart-ws';
/** 航行時間上限的選項(小時);null = 不限 */
export const MAX_HOURS_OPTIONS: readonly (number | null)[] = [null, 6, 12, 24, 36, 48];

export const UNLOCK_GRAPH: UnlockGraph = GRAPH;

/** 剛剛標記 / 取消的紀錄,給「復原」用 */
export interface ExploreUndo {
  text: string;
  prev: ReadonlySet<number>;
}

/**
 * 「標記去過」(D-213,D-222 併入找路線頁的海圖)的狀態:去過哪些航點(只存這台裝置的 localStorage,各裝置獨立)、
 * 海圖目前停在哪個海域與是否展開。去過的點永遠包含它前面的所有點(單親樹),標記與取消都由 core/unlock 維持這個不變條件。
 * 「去過」= 派出去並且收艇回來(遊戲收艇之後總覽報告才會寫出開啟的新航點)。路線的搜尋在 `RouteFindVm`。
 */
@Injectable({ providedIn: 'root' })
export class RouteExploreVm {
  readonly graph = UNLOCK_GRAPH;

  readonly explored = signal<ReadonlySet<number>>(closeExplored(UNLOCK_GRAPH, readJson<unknown[]>(EXPLORED_KEY) ?? []));
  /** 海圖目前看的海域(標記去過與篩選航點共用) */
  readonly viewSea = signal<number>(SEAS[0]!.sea);
  readonly mapOpen = signal(true);
  readonly undo = signal<ExploreUndo | null>(null);

  // ---- 依工坊的海圖(D-293):選了工坊時,海圖只畫該工坊已發現的點、找路線只用已發現的點;
  // 「標記去過」改成標記已發現,存到工坊(跨裝置)。沒選工坊時照原本的方式(全部航點、本機的「去過」)。
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);
  readonly chartWs = signal<string | null>(readJson<string>(CHART_WS_KEY));
  readonly chartWorkshop = computed(() => {
    const id = this.chartWs();
    return id ? (this.store.workshops().find((w) => w.id === id) ?? null) : null;
  });
  /** 選了工坊(不管有沒有紀錄) */
  readonly chartActive = computed(() => this.chartWorkshop() !== null);
  readonly chartName = computed(() => this.chartWorkshop()?.name ?? '');
  /** 儲存中的草稿:畫面先改、存好後以伺服器回應為準 */
  private readonly chartDraft = signal<ReadonlySet<number> | null>(null);
  /** 選的工坊已發現的點;沒選工坊、或那間工坊還沒有紀錄回 null(= 不過濾) */
  readonly found = computed<ReadonlySet<number> | null>(() => this.chartDraft() ?? foundOf(this.chartWorkshop()));
  /** 海圖上不畫的點:選的工坊還沒發現的點 */
  readonly hiddenIds = computed<ReadonlySet<number>>(() => {
    const f = this.found();
    if (!f) return new Set();
    return new Set(SEAS.flatMap((s) => s.points.map((p) => p.id)).filter((id) => !f.has(id)));
  });

  selectChartWs(id: string | null): void {
    this.chartDraft.set(null);
    this.undo.set(null);
    this.chartWs.set(id);
    writeJson(CHART_WS_KEY, id);
  }

  /** 改工坊的海圖:畫面先改,背景存;失敗就還原 */
  private saveChart(next: ReadonlySet<number>): void {
    const ws = this.chartWorkshop();
    if (!ws) return;
    const prev = this.found() ?? new Set<number>();
    const seas = changedSeas(prev, next);
    if (seas.length === 0) return;
    this.chartDraft.set(next);
    this.store
      .saveCharts(ws.id, seas)
      .then(() => {
        if (this.chartDraft() === next) this.chartDraft.set(null);
      })
      .catch(() => {
        if (this.chartDraft() === next) this.chartDraft.set(null);
        this.toast.show('海圖儲存失敗,請稍後再試', { tone: 'warn' });
      });
  }

  readonly exploredCount = computed(() => this.explored().size);
  readonly totalCount = SEAS.reduce((n, s) => n + s.points.length, 0);

  private save(next: ReadonlySet<number>): void {
    this.explored.set(next);
    writeJson(EXPLORED_KEY, [...next].sort((a, b) => a - b));
  }

  private name(id: number): string {
    const p = this.graph.seaOf.get(id)?.byId.get(id);
    return p ? `${this.graph.seaOf.get(id)!.sea.name} ${p.code}` : String(id);
  }

  /** 點一個航點:沒去過 → 標記它和前面的點;去過了 → 取消它和後面的點(選了工坊時改成標記已發現,存到工坊) */
  toggle(id: number): void {
    if (this.chartActive()) {
      const prev = this.found() ?? new Set<number>();
      if (prev.has(id)) {
        const { next, removed } = unmarkExplored(this.graph, prev, id);
        this.saveChart(next);
        this.undo.set({ text: removed.length > 1 ? `已取消 ${this.name(id)},後面的 ${removed.length - 1} 個點也一起取消` : `已取消 ${this.name(id)}`, prev });
      } else {
        const { next, added } = markExplored(this.graph, prev, id);
        this.saveChart(next);
        this.undo.set({ text: added.length > 1 ? `已標記 ${this.name(id)} 已發現,前面的 ${added.length - 1} 個點也一起標記` : `已標記 ${this.name(id)} 已發現`, prev });
      }
      return;
    }
    const prev = this.explored();
    if (prev.has(id)) {
      const { next, removed } = unmarkExplored(this.graph, prev, id);
      this.save(next);
      this.undo.set({ text: removed.length > 1 ? `已取消 ${this.name(id)},後面的 ${removed.length - 1} 個航點也一起取消` : `已取消 ${this.name(id)}`, prev });
    } else {
      const { next, added } = markExplored(this.graph, prev, id);
      this.save(next);
      this.undo.set({ text: added.length > 1 ? `已標記 ${this.name(id)},前面的 ${added.length - 1} 個航點也一起標記為去過` : `已標記 ${this.name(id)} 為去過`, prev });
    }
  }

  undoLast(): void {
    const u = this.undo();
    if (!u) return;
    if (this.chartActive()) {
      this.saveChart(u.prev);
      this.undo.set(null);
      return;
    }
    this.save(u.prev);
    this.undo.set(null);
  }

  dismissUndo(): void {
    this.undo.set(null);
  }

  clearAll(): void {
    if (this.chartActive()) {
      const prev = this.found();
      if (!prev || prev.size === 0) return;
      this.saveChart(new Set());
      this.undo.set({ text: `已清除${this.chartName()}全部 ${prev.size} 個已發現的點`, prev });
      return;
    }
    if (this.explored().size === 0) return;
    const prev = this.explored();
    this.save(new Set());
    this.undo.set({ text: `已清除全部 ${prev.size} 個去過的航點`, prev });
  }
}
