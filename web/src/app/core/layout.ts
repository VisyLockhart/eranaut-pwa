import { Injectable, signal } from '@angular/core';

/** 手機/桌機以 768px 的 media query 切換(D-93 UI 原則,不做裝置偵測);同一時間只渲染其中一個外殼 */
@Injectable({ providedIn: 'root' })
export class Layout {
  readonly isDesktop = signal(false);
  /** 手機版標頭的副標題,由各頁面設定 */
  readonly pageTitle = signal('');

  constructor() {
    if (typeof matchMedia === 'function') {
      const mq = matchMedia('(min-width: 768px)');
      this.isDesktop.set(mq.matches);
      mq.addEventListener('change', (e) => this.isDesktop.set(e.matches));
    }
  }
}
