import { Injectable, computed, signal } from '@angular/core';
import { readJson, writeJson } from '../core/storage';
import { SEA_INDEXES, SEAS } from './core/data';
import { buildUnlockGraph, closeExplored, markExplored, unmarkExplored, type UnlockGraph } from './core/unlock';

export const EXPLORED_KEY = 'eranaut.route.explored';
/** 航行時間上限的選項(小時);null = 不限 */
export const MAX_HOURS_OPTIONS: readonly (number | null)[] = [null, 6, 12, 24, 36, 48];

export const UNLOCK_GRAPH: UnlockGraph = buildUnlockGraph(SEA_INDEXES);

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

  /** 點一個航點:沒去過 → 標記它和前面的點;去過了 → 取消它和後面的點 */
  toggle(id: number): void {
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
    this.save(u.prev);
    this.undo.set(null);
  }

  dismissUndo(): void {
    this.undo.set(null);
  }

  clearAll(): void {
    if (this.explored().size === 0) return;
    const prev = this.explored();
    this.save(new Set());
    this.undo.set({ text: `已清除全部 ${prev.size} 個去過的航點`, prev });
  }
}
