import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { FieldErrorCode, WorkshopInput, WorkshopWithSubmarines } from '@eranaut/shared';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { isReady } from './format';
import { OverviewVm } from './overview-vm';
import type { WorkshopFormValue } from './workshop-form';

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
  private readonly auth = inject(Auth);

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

  /**
   * 對話框的填寫與送出狀態也放在這裡,不放在對話框元件:視窗換螢幕等造成寬度跨過 768px 時,
   * 手機/桌機版面會整個重建,元件內的狀態會消失(D-163)
   */
  readonly formDraft = signal<WorkshopFormValue | null>(null);
  readonly formSubmitted = signal(false);
  readonly serverErrors = signal<Partial<Record<keyof WorkshopInput, FieldErrorCode>>>({});
  readonly submitError = signal<string | null>(null);
  readonly busy = signal(false);

  /** 頁面目前是否「在使用中」:版面切換重建頁面時為 true,不重置模式與對話框 */
  active = false;

  constructor() {
    // 登出或 session 失效:一律回到初始狀態
    effect(() => {
      if (this.auth.status() !== 'authenticated') untracked(() => this.reset());
    });
  }

  /** 離開工坊頁、或登出時呼叫:回到瀏覽模式、關掉對話框並丟棄草稿 */
  reset(): void {
    this.active = false;
    this.manageMode.set(false);
    this.dialog.set(null);
    this.clearDialogState();
  }

  private clearDialogState(): void {
    this.formDraft.set(null);
    this.formSubmitted.set(false);
    this.serverErrors.set({});
    this.submitError.set(null);
    this.busy.set(false);
  }

  toggleManage(): void {
    this.manageMode.update((v) => !v);
  }
  add(): void {
    this.clearDialogState();
    this.dialog.set({ type: 'form', id: null });
  }
  edit(id: string): void {
    this.clearDialogState();
    this.dialog.set({ type: 'form', id });
  }
  remove(id: string): void {
    this.clearDialogState();
    this.dialog.set({ type: 'delete', id });
  }
  closeDialog(): void {
    this.dialog.set(null);
    this.clearDialogState();
  }

  /** 瀏覽模式點工坊:總覽套用該工坊的過濾(實際導頁由元件做) */
  focusInOverview(id: string): void {
    this.overview.select(id);
  }
}
