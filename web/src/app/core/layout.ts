import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { readJson, writeJson } from './storage';
import { UiScale } from './ui-scale';

/** 桌機側欄是否收合(各裝置獨立,只存 localStorage,D-166) */
export const SIDEBAR_KEY = 'eranaut.sidebar-collapsed';

/** 版面斷點(CSS 像素):內容的有效寬度達到這個值才用桌機版(D-95、D-164) */
export const DESKTOP_MIN_WIDTH = 768;

/**
 * 手機/桌機以 media query 切換(D-93 UI 原則,不做裝置偵測);同一時間只渲染其中一個外殼。
 * 介面大小放大時(D-164),內容的有效寬度 = 視窗寬度 ÷ 倍率,所以門檻同步乘上倍率:
 * 放大後視窗不夠寬就自動切成手機版面。切換造成的頁面重建,狀態由各 vm 保留(D-163)。
 */
@Injectable({ providedIn: 'root' })
export class Layout {
  readonly isDesktop = signal(false);
  /** 手機版標頭的副標題,由各頁面設定 */
  readonly pageTitle = signal('');
  /** 桌機側欄收合成窄欄(只剩圖示) */
  readonly sidebarCollapsed = signal(readJson<boolean>(SIDEBAR_KEY) === true);

  private readonly scale = inject(UiScale);
  private mq: MediaQueryList | null = null;
  private readonly onChange = (e: MediaQueryListEvent): void => this.isDesktop.set(e.matches);
  private boundFactor = 0;

  constructor() {
    if (typeof matchMedia !== 'function') return;
    this.bind(this.scale.effective());
    // 介面大小改變:重建查詢,立即重新判斷
    effect(() => {
      this.scale.factor();
      untracked(() => this.bind(this.scale.effective()));
    });
  }

  toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    writeJson(SIDEBAR_KEY, next);
  }

  private bind(zoom: number): void {
    if (zoom === this.boundFactor && this.mq) return;
    this.mq?.removeEventListener('change', this.onChange);
    const mq = matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH * zoom}px)`);
    this.mq = mq;
    this.boundFactor = zoom;
    this.isDesktop.set(mq.matches);
    mq.addEventListener('change', this.onChange);
  }
}
