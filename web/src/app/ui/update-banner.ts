import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppUpdate } from '../core/app-update';

/**
 * 新版本橫幅:固定在畫面上方、不會自動消失,按「立即更新」才換版(見 `AppUpdate`)。
 * service worker 沒回應時改顯示「更新機制異常」,按「修復」才重設並重載、「稍後」先收起(D-267)。
 */
@Component({
  selector: 'app-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (up.ready()) {
      <div class="update-banner" role="status" aria-live="polite">
        <span>已有新版本</span>
        <button type="button" class="primary-btn" [disabled]="up.applying()" (click)="up.apply()">{{ up.applying() ? '更新中…' : '立即更新' }}</button>
      </div>
    } @else if (up.broken() && !up.brokenDismissed()) {
      <div class="update-banner" role="status" aria-live="polite">
        <span>更新機制異常</span>
        <button type="button" class="ghost-btn" [disabled]="up.applying()" (click)="up.dismissBroken()">稍後</button>
        <button type="button" class="primary-btn" [disabled]="up.applying()" (click)="up.repair()">{{ up.applying() ? '修復中…' : '修復' }}</button>
      </div>
    }
  `,
})
export class UpdateBanner {
  protected readonly up = inject(AppUpdate);
}
