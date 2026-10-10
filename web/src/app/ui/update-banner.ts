import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppUpdate } from '../core/app-update';

/** 新版本橫幅:固定在畫面上方、不會自動消失,按「立即更新」才換版(見 `AppUpdate`) */
@Component({
  selector: 'app-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (up.ready()) {
      <div class="update-banner" role="status" aria-live="polite">
        <span>已有新版本</span>
        <button type="button" class="primary-btn" [disabled]="up.applying()" (click)="up.apply()">{{ up.applying() ? '更新中…' : '立即更新' }}</button>
      </div>
    }
  `,
})
export class UpdateBanner {
  protected readonly up = inject(AppUpdate);
}
