import { Injectable, computed, inject, signal } from '@angular/core';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { DataStore } from './data-store';
import { isReady } from './format';
import { OverviewVm } from './overview-vm';

export type WorkshopDialog = { type: 'form'; id: string | null } | { type: 'delete'; id: string };

/** 工坊管理頁的一列:工坊本身加上該工坊目前的潛艇統計 */
export interface WorkshopRow {
  ws: WorkshopWithSubmarines;
  exploring: number;
  ready: number;
}

/**
 * 工坊管理頁的畫面狀態(D-101~D-105):管理/瀏覽模式、目前開啟的對話框。
 * 手機與桌機兩種版面共用,所以放在 service,視窗縮放切換版面時不會丟失。
 */
@Injectable({ providedIn: 'root' })
export class WorkshopsVm {
  private readonly store = inject(DataStore);
  private readonly overview = inject(OverviewVm);

  readonly manageMode = signal(false);
  readonly dialog = signal<WorkshopDialog | null>(null);
  readonly formDialog = computed(() => {
    const d = this.dialog();
    return d?.type === 'form' ? d : null;
  });
  readonly deleteDialog = computed(() => {
    const d = this.dialog();
    return d?.type === 'delete' ? d : null;
  });

  readonly rows = computed<WorkshopRow[]>(() => {
    const now = this.store.now();
    return this.store.workshops().map((ws) => {
      let ready = 0;
      let exploring = 0;
      for (const s of ws.submarines) {
        if (isReady(s, now)) ready++;
        else exploring++;
      }
      return { ws, exploring, ready };
    });
  });

  /** 進入頁面時呼叫:一律從瀏覽模式開始 */
  reset(): void {
    this.manageMode.set(false);
    this.dialog.set(null);
  }

  toggleManage(): void {
    this.manageMode.update((v) => !v);
  }
  add(): void {
    this.dialog.set({ type: 'form', id: null });
  }
  edit(id: string): void {
    this.dialog.set({ type: 'form', id });
  }
  remove(id: string): void {
    this.dialog.set({ type: 'delete', id });
  }
  closeDialog(): void {
    this.dialog.set(null);
  }

  /** 瀏覽模式點工坊:總覽套用該工坊的過濾(實際導頁由元件做) */
  focusInOverview(id: string): void {
    this.overview.select(id);
  }
}
