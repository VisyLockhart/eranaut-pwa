import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon';

// 版權/非官方聲明(D-112、D-308):頁尾只留署名與「非官方」兩句;資料授權、隱私權政策、服務條款各自獨立成頁(/licenses、/privacy、/terms)。
// 「僅供社群內部使用、不得商業使用」的字樣放在服務條款與資料授權頁,不放在頁尾。
export const COPYRIGHT_NAME = 'Winter@迦樓羅';
export const COPYRIGHT_DISCLAIMER = '非官方工具，與 SQUARE ENIX CO., LTD. 無關';

@Component({
  selector: 'app-copyright',
  imports: [IconComponent, RouterLink, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #links>
      <a routerLink="/licenses" (click)="expanded.set(false)">資料授權</a> · <a routerLink="/privacy" (click)="expanded.set(false)">隱私權政策</a> · <a routerLink="/terms" (click)="expanded.set(false)">服務條款</a>
    </ng-template>
    @if (variant() === 'footer') {
      <div class="copyright-footer-d">
        <div>Created by <span class="copyright-name">{{ name }}</span></div>
        <div>{{ disclaimer }}</div>
        <div class="copyright-links"><ng-container *ngTemplateOutlet="links" /></div>
      </div>
    } @else {
      <!-- 手機:固定在導覽列下方的小字列,點擊展開完整聲明與三個連結(不依賴捲動位置,D-112) -->
      <div class="copyright-bar" (click)="expanded.set(true)">
        Created by <span class="copyright-name">{{ name }}</span> · 非官方工具 · 聲明與授權 ›
      </div>
      @if (expanded()) {
        <div class="copyright-overlay" (click)="expanded.set(false)">
          <div class="copyright-panel" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="font-size:14px;font-weight:700;">關於 Eranaut</div>
              <button class="modal-close" (click)="expanded.set(false)" aria-label="關閉"><app-icon name="close" [size]="14" /></button>
            </div>
            <div style="font-size:12.5px;color:var(--text-muted);line-height:1.7;">Created by <span class="copyright-name">{{ name }}</span></div>
            <div style="font-size:11.5px;color:var(--text-dim);line-height:1.7;margin-top:2px;">{{ disclaimer }}</div>
            <div class="copyright-links-m"><ng-container *ngTemplateOutlet="links" /></div>
          </div>
        </div>
      }
    }
  `,
})
export class CopyrightComponent {
  readonly variant = input<'bar' | 'footer'>('bar');
  protected readonly expanded = signal(false);
  protected readonly name = COPYRIGHT_NAME;
  protected readonly disclaimer = COPYRIGHT_DISCLAIMER;
}
