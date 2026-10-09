import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InstallPrompt } from '../core/install-prompt';

/** 「加入主畫面」小卡片(非模態,浮在底部導覽上方,不擋住內容);內容與時機見 `InstallPrompt` */
@Component({
  selector: 'app-install-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ip.visible()) {
      <div class="install-prompt" role="dialog" aria-label="加入主畫面" aria-describedby="ip-text">
        @if (ip.platform === 'android') {
          <p id="ip-text">您正在使用行動裝置,是否要將 Eranaut 加入主畫面,以獲得最佳體驗?</p>
          <div class="ip-actions">
            <button type="button" class="ghost-btn" (click)="ip.dismiss()">否</button>
            <button type="button" class="primary-btn" (click)="accept()">是</button>
          </div>
        } @else {
          <p id="ip-text">您正在使用行動裝置,建議將 Eranaut 加入主畫面,以獲得最佳體驗。</p>
          <p class="ip-steps">
            點瀏覽器的「分享」按鈕
            <svg class="ip-share" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m8 7 4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>
            →「加入主畫面」
          </p>
          <div class="ip-actions"><button type="button" class="primary-btn" (click)="ip.dismiss()">OK</button></div>
        }
      </div>
    }
  `,
})
export class InstallPromptCard {
  protected readonly ip = inject(InstallPrompt);

  protected accept(): void {
    void this.ip.accept();
  }
}
