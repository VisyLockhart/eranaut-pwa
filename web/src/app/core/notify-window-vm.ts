import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ALL_DAYS,
  LIMITS,
  bitsToScope,
  countSlots,
  emptySlots,
  fillSlots,
  formatRanges,
  formatWait,
  formatWhen,
  invertSlots,
  isAllowed,
  nextAllowed,
  rangesFromSlots,
  scopeToBits,
  slotsFromRanges,
  toggleSlot,
  todayRanges,
  type NotifyWindowDto,
  type NotifyWindowScope,
  type NotifyWindowsDto,
} from '@eranaut/shared';
import { HttpErrorResponse } from '@angular/common/http';
import { Api } from './api';
import { newRow, withEnd, withStart, type WindowRow } from './window-rows';

/** 編輯中的時段組;`id = null` 為新增 */
export interface WindowDraft {
  id: string | null;
  name: string;
  days: number;
  slots: string;
  enabled: boolean;
}

export type EditorView = 'grid' | 'list';

/**
 * 通知允許時段(D-348)。設定頁的總開關、套用範圍、時段組清單與編輯器共用這個 VM。
 * 開關與清單操作立即儲存、失敗還原;編輯器按「儲存」才送出。時段全部以台北時間計(shared/window.ts)。
 * 預覽(今天的區間、下一次通知)在前端算,不另外打 API。
 */
@Injectable({ providedIn: 'root' })
export class NotifyWindowVm {
  private readonly api = inject(Api);

  /** null = 還沒載入 */
  readonly data = signal<NotifyWindowsDto | null>(null);
  readonly loadError = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  /** 編輯器:null = 關閉 */
  readonly draft = signal<WindowDraft | null>(null);
  readonly view = signal<EditorView>('grid');
  readonly draftError = signal<string | null>(null);
  readonly confirmDelete = signal(false);
  /** 預覽用的「現在」,由元件每分鐘更新一次 */
  readonly now = signal(Date.now());

  readonly limit = computed(() => this.data()?.limit ?? LIMITS.maxNotifyWindowsPerUser);
  readonly full = computed(() => (this.data()?.groups.length ?? 0) >= this.limit());
  readonly enabledGroups = computed(() => (this.data()?.groups ?? []).filter((g) => g.enabled));
  /** 開著但沒有任何啟用中的組:提醒不會送出,要提示 */
  readonly noneEnabled = computed(() => this.data()?.on === true && this.enabledGroups().length === 0);

  /** 設定頁的狀態列:今天的區間、現在是否勿擾、下一次通知 */
  readonly summary = computed(() => {
    const d = this.data();
    if (!d || !d.on) return null;
    const groups = this.enabledGroups();
    const now = this.now();
    const ranges = todayRanges(groups, now);
    const today = ranges.length > 0 ? `今天 ${formatRanges(ranges)} 會通知` : '今天沒有允許時段';
    if (groups.length === 0) return { today, state: '沒有啟用中的時段', next: null as string | null };
    if (isAllowed(groups, now)) return { today, state: '現在可通知', next: null as string | null };
    const t = nextAllowed(groups, now);
    return { today, state: '現在勿擾中', next: t === null ? null : `${formatWhen(t, now)} 起可通知(${formatWait(t, now)})` };
  });

  /**
   * 清單模式的列(自己保存,不從遮罩反推):新增的一列即使緊貼前一段也不會被合併掉。
   * 遮罩是這些列的聯集;從格子、範本、反轉等其他方式改遮罩時,列重新由遮罩推出(相連的合併)。
   */
  readonly rows = signal<WindowRow[]>([]);
  readonly draftRanges = computed(() => this.rows());
  /** 全部時段都被選滿時不能再新增一列 */
  readonly canAddRow = computed(() => newRow(this.rows()) !== null);
  readonly draftSummary = computed(() => {
    const dr = this.draft();
    if (!dr) return '';
    const n = countSlots(dr.slots);
    if (n === 0) return '還沒有選任何時段';
    const hours = n / 4;
    return `${formatRanges(rangesFromSlots(dr.slots))}(共 ${Number.isInteger(hours) ? hours : hours.toFixed(2).replace(/0$/, '')} 小時)`;
  });
  readonly canSave = computed(() => {
    const dr = this.draft();
    return !!dr && dr.name.trim() !== '' && countSlots(dr.slots) > 0 && !this.busy();
  });

  async load(): Promise<void> {
    this.loadError.set(false);
    try {
      this.data.set(await this.api.notifyWindows());
    } catch {
      this.loadError.set(true);
    }
  }

  private fail(message = '儲存失敗，已還原。請稍後再試。'): void {
    this.error.set(message);
  }

  /** 總開關(第一次開啟時伺服器會自動建立「白天」) */
  async setOn(on: boolean): Promise<void> {
    const before = this.data();
    if (!before || this.busy()) return;
    await this.putPrefs(on, before.scope, before);
  }

  async toggleScope(key: keyof NotifyWindowScope): Promise<void> {
    const before = this.data();
    if (!before || this.busy()) return;
    const scope = { ...before.scope, [key]: !before.scope[key] };
    // 範圍全關等於沒有限制,允許但提示
    await this.putPrefs(before.on, scope, before);
  }

  private async putPrefs(on: boolean, scope: NotifyWindowScope, before: NotifyWindowsDto): Promise<void> {
    this.data.set({ ...before, on, scope });
    this.busy.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.setNotifyWindowPrefs({ on, scope: bitsToScope(scopeToBits(scope)) }));
    } catch {
      this.data.set(before);
      this.fail();
    } finally {
      this.busy.set(false);
    }
  }

  async toggleGroup(g: NotifyWindowDto): Promise<void> {
    const before = this.data();
    if (!before || this.busy()) return;
    this.data.set({ ...before, groups: before.groups.map((x) => (x.id === g.id ? { ...x, enabled: !g.enabled } : x)) });
    this.busy.set(true);
    this.error.set(null);
    try {
      const saved = await this.api.setNotifyWindowEnabled(g.id, !g.enabled);
      this.data.update((d) => (d ? { ...d, groups: d.groups.map((x) => (x.id === saved.id ? saved : x)) } : d));
    } catch {
      this.data.set(before);
      this.fail();
    } finally {
      this.busy.set(false);
    }
  }

  // ---- 編輯器 ----

  openNew(): void {
    if (this.full()) return;
    this.draft.set({ id: null, name: '', days: ALL_DAYS, slots: emptySlots(), enabled: true });
    this.open();
  }

  openEdit(g: NotifyWindowDto): void {
    this.draft.set({ id: g.id, name: g.name, days: g.days, slots: g.slots, enabled: g.enabled });
    this.open();
  }

  private open(): void {
    this.rows.set(rangesFromSlots(this.draft()?.slots ?? emptySlots()));
    this.draftError.set(null);
    this.confirmDelete.set(false);
    this.view.set('grid');
  }

  closeEditor(): void {
    this.draft.set(null);
    this.confirmDelete.set(false);
  }

  patchDraft(p: Partial<WindowDraft>): void {
    this.draft.update((d) => (d ? { ...d, ...p } : d));
  }
  setSlots(slots: string): void {
    this.patchDraft({ slots });
    this.rows.set(rangesFromSlots(slots));
  }

  // ---- 清單模式的列 ----

  private setRows(rows: readonly WindowRow[]): void {
    this.rows.set([...rows]);
    this.patchDraft({ slots: slotsFromRanges(rows) });
  }
  addRow(): void {
    const r = newRow(this.rows());
    if (r) this.setRows([...this.rows(), r]);
  }
  removeRow(i: number): void {
    this.setRows(this.rows().filter((_, k) => k !== i));
  }
  setRowStart(i: number, start: number): void {
    this.setRows(withStart(this.rows(), i, start));
  }
  setRowEnd(i: number, end: number): void {
    this.setRows(withEnd(this.rows(), i, end));
  }
  toggleCell(i: number): void {
    const d = this.draft();
    if (d) this.setSlots(toggleSlot(d.slots, i));
  }
  fill(a: number, b: number, value: boolean): void {
    const d = this.draft();
    if (d) this.setSlots(fillSlots(d.slots, a, b, value));
  }
  invert(): void {
    const d = this.draft();
    if (d) this.setSlots(invertSlots(d.slots));
  }
  applyRanges(ranges: readonly (readonly [number, number])[]): void {
    this.setSlots(slotsFromRanges(ranges));
  }
  toggleDay(i: number): void {
    const d = this.draft();
    if (!d) return;
    const next = d.days ^ (1 << i);
    if (next !== 0) this.patchDraft({ days: next }); // 至少要有一天
  }

  async save(): Promise<void> {
    const d = this.draft();
    if (!d || !this.canSave()) return;
    this.busy.set(true);
    this.draftError.set(null);
    const body = { name: d.name.trim(), days: d.days, slots: d.slots, enabled: d.enabled };
    try {
      if (d.id === null) {
        const created = await this.api.createNotifyWindow(body);
        this.data.update((x) => (x ? { ...x, groups: [...x.groups, created] } : x));
      } else {
        const saved = await this.api.replaceNotifyWindow(d.id, body);
        this.data.update((x) => (x ? { ...x, groups: x.groups.map((g) => (g.id === saved.id ? saved : g)) } : x));
      }
      this.closeEditor();
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      this.draftError.set(status === 409 ? `最多 ${this.limit()} 組，請先刪除不用的。` : status === 400 ? '內容有誤，請檢查名稱與時段。' : '儲存失敗，請稍後再試。');
    } finally {
      this.busy.set(false);
    }
  }

  async remove(): Promise<void> {
    const d = this.draft();
    if (!d || d.id === null || this.busy()) return;
    this.busy.set(true);
    this.draftError.set(null);
    try {
      await this.api.deleteNotifyWindow(d.id);
      this.data.update((x) => (x ? { ...x, groups: x.groups.filter((g) => g.id !== d.id) } : x));
      this.closeEditor();
    } catch {
      this.draftError.set('刪除失敗，請稍後再試。');
    } finally {
      this.busy.set(false);
    }
  }
}
