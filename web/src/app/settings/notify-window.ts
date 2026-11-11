import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  ALL_DAYS,
  DAY_LABELS,
  SLOTS_PER_DAY,
  WEEKDAYS,
  WEEKEND,
  formatDays,
  formatMinute,
  formatRanges,
  rangesFromSlots,
  type NotifyWindowDto,
} from '@eranaut/shared';
import { Layout } from '../core/layout';
import { endOptions, startOptions } from '../core/window-rows';
import { NotifyWindowVm } from '../core/notify-window-vm';
import { IconComponent } from '../ui/icon';

/** 快速套用的範本:分鐘區間 */
export const WINDOW_PRESETS: readonly { label: string; ranges: readonly (readonly [number, number])[] }[] = [
  { label: '全天', ranges: [[0, 1440]] },
  { label: '白天 08–22', ranges: [[480, 1320]] },
  { label: '晚上 19–24', ranges: [[1140, 1440]] },
  { label: '午休＋晚上', ranges: [[720, 810], [1140, 1410]] },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/**
 * 設定頁的「通知時段」區塊與編輯器(D-348)。
 * 編輯器:桌機置中對話框、手機底部面板;格子模式桌機用滑鼠拖曳塗色,手機用「點兩下」填滿範圍(再按一次同一格可取消起點);
 * 清單模式用時間下拉,給不方便拖曳的人與螢幕閱讀器。鍵盤:Tab 到格子按 Enter / 空白鍵切換。
 */
@Component({
  selector: 'app-notify-window',
  imports: [CdkTrapFocus, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notify-window.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class NotifyWindow {
  protected readonly vm = inject(NotifyWindowVm);
  protected readonly layout = inject(Layout);
  private readonly host = inject(ElementRef);

  protected readonly hours = HOURS;
  protected readonly quarters = [0, 1, 2, 3];
  /** 桌機把 24 小時分成上下午兩欄並排(一屏看完);手機直排 */
  protected readonly halves = [0, 1];
  protected hoursOf(half: number): number[] {
    return HOURS.slice(half * 12, half * 12 + 12);
  }
  protected readonly presets = WINDOW_PRESETS;
  protected readonly dayLabels = DAY_LABELS;
  protected readonly dayIndexes = [0, 1, 2, 3, 4, 5, 6];
  protected readonly formatMinute = formatMinute;
  protected readonly slotCount = SLOTS_PER_DAY;

  /** 手機兩段式填滿:第一次點的格子(null = 還沒選起點)與它被設成的值 */
  protected readonly anchor = signal<number | null>(null);
  private anchorValue = true;
  private painting: { value: boolean; last: number } | null = null;
  private downOnOverlay = false;

  protected readonly dayPresets = [
    { label: '每天', mask: ALL_DAYS },
    { label: '平日', mask: WEEKDAYS },
    { label: '假日', mask: WEEKEND },
  ];

  protected readonly rows = computed(() => (this.vm.data()?.groups ?? []).map((g) => this.describe(g)));

  constructor() {
    void this.vm.load();
    // 手機的編輯面板很長:開啟時把第一個已選的格子(沒有就是格子區)捲到視野中間,不用自己往下找
    let lastKey: string | null = null;
    effect(() => {
      const d = this.vm.draft();
      const key = d ? (d.id ?? 'new') : null;
      if (key === lastKey) return;
      lastKey = key;
      if (key === null || untracked(() => this.layout.isDesktop())) return;
      setTimeout(() => (this.host.nativeElement as HTMLElement).querySelector('.nw-cell.on, .nw-grid-wrap')?.scrollIntoView?.({ block: 'center' }), 60);
    });
    const timer = setInterval(() => this.vm.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  private describe(g: NotifyWindowDto): { g: NotifyWindowDto; days: string; ranges: string; cells: boolean[] } {
    return { g, days: formatDays(g.days), ranges: formatRanges(rangesFromSlots(g.slots)), cells: Array.from(g.slots, (c) => c === '1') };
  }

  protected isOn(i: number): boolean {
    return this.vm.draft()?.slots[i] === '1';
  }
  protected dayOn(i: number): boolean {
    return ((this.vm.draft()?.days ?? 0) >> i & 1) === 1;
  }
  protected cellLabel(i: number): string {
    return `${formatMinute(i * 15)} 起 15 分鐘,${this.isOn(i) ? '允許通知' : '勿擾'}`;
  }
  protected daysMatch(mask: number): boolean {
    return this.vm.draft()?.days === mask;
  }

  // ---- 格子:滑鼠拖曳 / 觸控兩點 ----

  private cellOf(el: EventTarget | null): number | null {
    const c = (el as HTMLElement | null)?.closest?.('[data-i]') as HTMLElement | null;
    return c ? Number(c.dataset['i']) : null;
  }

  protected gridDown(e: PointerEvent): void {
    const i = this.cellOf(e.target);
    if (i === null) return;
    if (e.pointerType === 'touch') return; // 觸控在 pointerup 處理(要讓捲動可用)
    e.preventDefault();
    const value = !this.isOn(i);
    this.painting = { value, last: i };
    this.vm.fill(i, i, value);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* 沒有作用中的指標(例如程式模擬的事件)就略過;拖曳仍靠 elementFromPoint 運作 */
    }
  }

  protected gridMove(e: PointerEvent): void {
    if (!this.painting) return;
    const i = this.cellOf(document.elementFromPoint(e.clientX, e.clientY));
    if (i === null || i === this.painting.last) return;
    this.vm.fill(this.painting.last, i, this.painting.value);
    this.painting.last = i;
  }

  protected gridUp(e: PointerEvent): void {
    if (this.painting) {
      this.painting = null;
      return;
    }
    if (e.pointerType !== 'touch') return;
    const i = this.cellOf(e.target);
    if (i === null) return;
    const a = this.anchor();
    if (a === null) {
      this.anchorValue = !this.isOn(i);
      this.vm.fill(i, i, this.anchorValue);
      this.anchor.set(i);
    } else {
      if (a !== i) this.vm.fill(a, i, this.anchorValue);
      this.anchor.set(null);
    }
  }

  /** 鍵盤(Enter / 空白鍵)會觸發 detail = 0 的 click;滑鼠與觸控已在 pointer 事件處理過 */
  protected cellClick(e: MouseEvent, i: number): void {
    if (e.detail === 0) this.vm.toggleCell(i);
  }

  protected closeEditor(): void {
    this.anchor.set(null);
    this.vm.closeEditor();
  }

  // ---- 清單模式:每一列只能選到沒被其他列佔用的時間 ----

  protected startChoices(i: number): number[] {
    return startOptions(this.vm.rows(), i);
  }
  protected endChoices(i: number): number[] {
    return endOptions(this.vm.rows(), i);
  }

  protected applyPreset(ranges: readonly (readonly [number, number])[]): void {
    this.vm.applyRanges(ranges);
  }

  protected onName(e: Event): void {
    this.vm.patchDraft({ name: (e.target as HTMLInputElement).value });
  }

  protected overlayDown(e: Event): void {
    this.downOnOverlay = e.target === e.currentTarget;
  }
  protected overlayClick(e: Event): void {
    if (this.downOnOverlay && e.target === e.currentTarget) this.closeEditor();
    this.downOnOverlay = false;
  }
  protected onEscape(e: Event): void {
    if (this.vm.draft() && !e.defaultPrevented) {
      e.preventDefault();
      this.closeEditor();
    }
  }
}
