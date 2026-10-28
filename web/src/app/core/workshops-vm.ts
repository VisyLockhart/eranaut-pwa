import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { FieldErrorCode, WorkshopInput, WorkshopWithSubmarines } from '@eranaut/shared';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { isReady } from './format';
import { OverviewVm } from './overview-vm';
import type { WorkshopFormValue } from './workshop-form';

/** 新增(id = null)/ 編輯工坊對話框(D-103);刪除在編輯對話框裡二次確認(D-294) */
export interface WorkshopFormState {
  id: string | null;
}

/** 工坊管理視窗的一列:工坊本身加上該工坊目前的潛艇統計 */
export interface WorkshopRow {
  ws: WorkshopWithSubmarines;
  exploring: number;
  ready: number;
}

/**
 * 工坊管理的畫面狀態(D-101~D-105、D-294):總覽「全部」檢視的「工坊管理」視窗(排序、新增)、
 * 單一工坊檢視的「工坊設定」(編輯、刪除)。手機與桌機兩種版面共用,所以放在 service,視窗縮放切換版面時不會丟失。
 */
@Injectable({ providedIn: 'root' })
export class WorkshopsVm {
  private readonly store = inject(DataStore);
  private readonly overview = inject(OverviewVm);
  private readonly auth = inject(Auth);

  /** 「工坊管理」視窗(排序與新增)是否開啟 */
  readonly manageOpen = signal(false);
  /** 新增 / 編輯工坊對話框;null = 沒開 */
  readonly formDialog = signal<WorkshopFormState | null>(null);

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

  constructor() {
    // 登出或 session 失效:一律回到初始狀態
    effect(() => {
      if (this.auth.status() !== 'authenticated') untracked(() => this.reset());
    });
  }

  /** 登出時呼叫:關掉視窗並丟棄草稿 */
  reset(): void {
    this.manageOpen.set(false);
    this.formDialog.set(null);
    this.clearDialogState();
  }

  private clearDialogState(): void {
    this.formDraft.set(null);
    this.formSubmitted.set(false);
    this.serverErrors.set({});
    this.submitError.set(null);
    this.busy.set(false);
  }

  openManage(): void {
    this.manageOpen.set(true);
  }
  closeManage(): void {
    this.manageOpen.set(false);
  }
  /** 從工坊管理視窗新增:先收掉管理視窗,避免兩個對話框疊在一起 */
  add(): void {
    this.manageOpen.set(false);
    this.clearDialogState();
    this.formDialog.set({ id: null });
  }
  edit(id: string): void {
    this.clearDialogState();
    this.formDialog.set({ id });
  }
  closeDialog(): void {
    this.formDialog.set(null);
    this.clearDialogState();
  }

  /** 刪除工坊;刪的是總覽目前檢視的那間,刪完回到「全部」(總覽以位置記目前檢視,不先處理會跳到下一間) */
  async deleteWorkshop(id: string): Promise<void> {
    const viewing = this.overview.currentWorkshop()?.id === id;
    await this.store.deleteWorkshop(id);
    if (viewing) this.overview.goTo(0);
  }
}
