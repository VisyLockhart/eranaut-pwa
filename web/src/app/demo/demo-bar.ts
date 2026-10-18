import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DemoStore } from './demo-store';

const LOGIN_ERRORS = [
  { code: 'denied', label: '取消授權' },
  { code: 'not_in_guild', label: '不在伺服器' },
  { code: 'no_role', label: '沒有資格身份組' },
  { code: 'failed', label: '連線失敗' },
] as const;

/** 展示模式的小標籤:說明這是展示、資料是假的,並提供重設、登出與檢視登入失敗畫面的捷徑 */
@Component({
  selector: 'app-demo-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="demo-tag" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="demo-panel">展示模式</button>
    @if (open()) {
      <div id="demo-panel" class="demo-panel" role="dialog" aria-label="展示模式說明">
        <p class="demo-lead">這是 Eranaut 的線上展示。資料是假的,只存在這個瀏覽器裡,不會送到任何伺服器;截圖辨識也只會回傳固定的示範結果。</p>
        <div class="demo-actions">
          <button type="button" (click)="reset()">重設資料</button>
          <button type="button" (click)="signOut()">登出(看迎賓頁)</button>
        </div>
        <div class="demo-sub">登入失敗畫面</div>
        <div class="demo-actions">
          @for (e of errors; track e.code) {
            <button type="button" (click)="showLoginError(e.code)">{{ e.label }}</button>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host { position: fixed; bottom: 10px; right: 10px; z-index: 2000; display: block; }
    /* 手機版底部有導覽列與版權列,浮在它們上方 */
    @media (max-width: 767px) { :host { bottom: calc(100px + env(safe-area-inset-bottom)); right: 8px; } }
    .demo-tag { font: 600 11px/1 inherit; letter-spacing: 0.06em; color: var(--on-amber); background: var(--amber); border: 0; border-radius: var(--r-pill); padding: 5px 10px; cursor: pointer; opacity: 0.92; }
    .demo-tag:hover { opacity: 1; }
    .demo-panel { position: absolute; bottom: 32px; right: 0; width: min(300px, calc(100vw - 20px)); box-sizing: border-box; padding: 14px; border-radius: calc(12px * var(--rs)); background: var(--bg-elevated-2); color: var(--text); border: var(--bw) solid var(--border-strong); box-shadow: 0 10px 30px color-mix(in srgb, var(--shade) 50%, transparent); }
    .demo-lead { margin: 0 0 12px; font-size: 12px; line-height: 1.6; color: var(--text-muted); }
    .demo-sub { margin: 12px 0 6px; font-size: 11px; color: var(--text-dim); }
    .demo-actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .demo-actions button { font: 500 12px/1 inherit; color: var(--text); background: var(--bg-elevated); border: var(--bw) solid var(--border-strong); border-radius: calc(8px * var(--rs)); padding: 8px 10px; cursor: pointer; }
    .demo-actions button:hover { background: var(--surface-raise); }
    /* 淺色:像素風粗框 + 硬陰影、標籤直角有框;深色:金框 */
    :host-context(html[data-theme='light']) .demo-tag { border: 2px solid var(--line); opacity: 1; font-family: var(--font-cap); font-weight: 400; }
    :host-context(html[data-theme='light']) .demo-panel { border: 3px solid var(--line); box-shadow: 6px 6px 0 0 var(--drop); background: var(--bg-elevated); }
    :host-context(html[data-theme='light']) .demo-actions button { border: 2px solid var(--line); }
    :host-context(html[data-theme='dark']) .demo-tag { border: 1px solid var(--gold-b); font-family: var(--font-head); letter-spacing: 0.1em; }
    :host-context(html[data-theme='dark']) .demo-panel { border: 1px solid var(--gold-d); box-shadow: inset 0 0 0 3px var(--bg-elevated-2), inset 0 0 0 4px var(--gl), 0 12px 24px color-mix(in srgb, var(--shade) 50%, transparent); }
    :host-context(html[data-theme='dark']) .demo-actions button { border-color: var(--gold-d); color: var(--gold-b); font-family: var(--font-head); }
  `,
})
export class DemoBar {
  private readonly store = inject(DemoStore);
  readonly open = signal(false);
  readonly errors = LOGIN_ERRORS;

  reset(): void {
    this.store.reset();
    this.reload('/');
  }
  signOut(): void {
    this.store.setSignedIn(false);
    this.reload('/');
  }
  showLoginError(code: string): void {
    this.store.setSignedIn(false);
    this.reload(`/?login_error=${code}`);
  }
  private reload(url: string): void {
    window.location.assign(url);
  }
}
