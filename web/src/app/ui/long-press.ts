import { Directive, ElementRef, inject, input, output } from '@angular/core';

/**
 * 長按(約 0.5 秒)觸發 `longPress`,手機總覽用來「長按一列進入管理模式並選取該列」(D-313)。
 * 手指移動超過 10px、放開或取消就不算;觸發後吃掉緊接著的那一次 click,不會又開快速修改。
 */
@Directive({
  selector: '[appLongPress]',
  host: {
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'cancel()',
    '(pointercancel)': 'cancel()',
    '(pointerleave)': 'cancel()',
    '(contextmenu)': 'menu($event)',
  },
})
export class LongPress {
  readonly longPress = output<void>();
  readonly appLongPressDisabled = input(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private x = 0;
  private y = 0;
  private fired = false;

  constructor() {
    // 捕獲階段先於列本身的 click 處理
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.addEventListener(
      'click',
      (e) => {
        if (!this.fired) return;
        this.fired = false;
        e.stopImmediatePropagation();
        e.preventDefault();
      },
      true,
    );
  }

  protected down(e: PointerEvent): void {
    this.fired = false;
    if (this.appLongPressDisabled() || e.pointerType === 'mouse') return;
    this.x = e.clientX;
    this.y = e.clientY;
    this.cancel();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.fired = true;
      this.longPress.emit();
    }, 500);
  }
  protected move(e: PointerEvent): void {
    if (this.timer !== null && Math.hypot(e.clientX - this.x, e.clientY - this.y) > 10) this.cancel();
  }
  protected cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  /** 長按在手機上會跳出系統選單,吃掉 */
  protected menu(e: Event): void {
    if (!this.appLongPressDisabled()) e.preventDefault();
  }
}
