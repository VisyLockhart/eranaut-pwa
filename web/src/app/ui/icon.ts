import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, type IconName } from './icons';

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
  protected readonly html = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]));
}
