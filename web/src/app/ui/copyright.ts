import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { IconComponent } from './icon';

// 版權/非官方聲明(D-112):署名只顯示 `Winter@迦樓羅`;不加素材版權句、不加聯絡方式。
export const COPYRIGHT_NAME = 'Winter@迦樓羅';
export const COPYRIGHT_DISCLAIMER = '非官方粉絲工具，與 SQUARE ENIX CO., LTD. 無關，僅供社群內部使用，不得用於商業用途。';

@Component({
  selector: 'app-copyright',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'footer') {
      <div class="copyright-footer-d">
        <div>Eranaut · Created by <span class="copyright-name">{{ name }}</span> · FFXIV 繁體中文版</div>
        <div>{{ disclaimer }}</div>
      </div>
    } @else {
      <!-- 手機:固定在導覽列下方的小字列,點擊展開完整聲明(不依賴捲動位置,D-112) -->
      <div class="copyright-bar" (click)="expanded.set(true)">
        Eranaut · Created by <span class="copyright-name">{{ name }}</span> · FFXIV 繁體中文版
      </div>
      @if (expanded()) {
        <div class="copyright-overlay" (click)="expanded.set(false)">
          <div class="copyright-panel" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div style="font-size:14px;font-weight:700;">關於 Eranaut</div>
              <button class="modal-close" (click)="expanded.set(false)" aria-label="關閉"><app-icon name="close" [size]="14" /></button>
            </div>
            <div style="font-size:12.5px;color:var(--text-muted);line-height:1.7;">
              Eranaut · Created by <span class="copyright-name">{{ name }}</span> · FFXIV 繁體中文版
            </div>
            <div style="font-size:11.5px;color:var(--text-dim);line-height:1.7;margin-top:8px;">{{ disclaimer }}</div>
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
