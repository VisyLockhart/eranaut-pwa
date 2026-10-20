import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ThemeService } from '../core/theme';
import { ICONS, type IconName } from './icons';
import { NOTEBOOK_ICONS } from './icons-notebook';
import { PIXEL_ICONS } from './icons-pixel';

/** 內嵌 SVG 圖示(來自 demo)。內容是程式內的常數字串,不含任何使用者輸入,所以可略過 sanitizer 對 svg 的過濾 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: {
    '[innerHTML]': 'html()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    style: 'display:inline-flex;flex:0 0 auto',
    'aria-hidden': 'true',
  },
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly theme = inject(ThemeService).theme;
  /** 淺色主題用像素圖示、手札用手繪植物圖示,其餘(含沒有專屬版的圖示)用原本的線條圖示 */
  protected readonly html = computed(() => {
    const n = this.name();
    const t = this.theme();
    // 品牌 logo(D-280):四個主題各一張全彩 SVG(自帶底色),以 <img> 載入 public/icons/logo-<主題>.svg;不隨 CSS 顏色變化
    if (n === 'logo') {
      return this.sanitizer.bypassSecurityTrustHtml(`<img src="icons/logo-${t}.svg" alt="" draggable="false" style="display:block;width:100%;height:100%">`);
    }
    const svg = (t === 'light' ? PIXEL_ICONS[n] : t === 'notebook' ? NOTEBOOK_ICONS[n] : undefined) ?? ICONS[n];
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
