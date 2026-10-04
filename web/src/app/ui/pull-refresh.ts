import { Directive, ElementRef, OnDestroy, inject, output } from '@angular/core';

/** 拉到這個距離(螢幕像素,已套用阻力)放手才會重新整理 */
export const PULL_THRESHOLD = 64;
/** 指示區最高可拉到的距離 */
export const PULL_MAX = 110;

/** 手指移動距離 → 指示區高度:有阻力(0.5)、有上限 */
export function pullDistance(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(PULL_MAX, deltaY * 0.5);
}

/**
 * 下拉重新整理(D-166):加在可捲動的清單容器上。只有清單已捲到最上面、手指往下拉時才接手;
 * 拉的過程發出 `pullChange`(指示區高度),放手時距離達門檻就發出 `refreshRequested`。
 * 主畫面 App 沒有瀏覽器的重新整理鈕,所以需要這個手勢。
 */
@Directive({ selector: '[appPullRefresh]' })
export class PullRefresh implements OnDestroy {
  readonly pullChange = output<number>();
  readonly refreshRequested = output<void>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private startY = 0;
  private tracking = false;
  private pulling = false;
  private dist = 0;

  private readonly onStart = (e: TouchEvent): void => {
    this.tracking = e.touches.length === 1 && this.el.scrollTop <= 0;
    this.pulling = false;
    this.dist = 0;
    if (this.tracking) this.startY = e.touches[0].clientY;
  };

  private readonly onMove = (e: TouchEvent): void => {
    if (!this.tracking) return;
    if (e.touches.length !== 1 || this.el.scrollTop > 0) return this.finish(false);
    const delta = e.touches[0].clientY - this.startY;
    if (delta <= 0) {
      if (this.pulling) this.finish(false);
      return;
    }
    this.pulling = true;
    if (e.cancelable) e.preventDefault(); // 已在最上面,不讓頁面跟著橡皮筋拉動
    this.dist = pullDistance(delta);
    this.pullChange.emit(this.dist);
  };

  private readonly onEnd = (): void => this.finish(true);

  constructor() {
    this.el.addEventListener('touchstart', this.onStart, { passive: true });
    this.el.addEventListener('touchmove', this.onMove, { passive: false });
    this.el.addEventListener('touchend', this.onEnd, { passive: true });
    this.el.addEventListener('touchcancel', this.onEnd, { passive: true });
  }

  private finish(allowRefresh: boolean): void {
    const was = this.pulling;
    const reached = this.dist >= PULL_THRESHOLD;
    this.tracking = false;
    this.pulling = false;
    this.dist = 0;
    if (!was) return;
    this.pullChange.emit(0);
    if (allowRefresh && reached) this.refreshRequested.emit();
  }

  ngOnDestroy(): void {
    this.el.removeEventListener('touchstart', this.onStart);
    this.el.removeEventListener('touchmove', this.onMove);
    this.el.removeEventListener('touchend', this.onEnd);
    this.el.removeEventListener('touchcancel', this.onEnd);
  }
}
