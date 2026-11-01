import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { circled, isPlaced } from '../core/format';
import { IconComponent } from './icon';
import { Tip } from './tip';

/**
 * 潛艇編號(D-323):位置 1~4 顯示圓圈數字;未排入(位置 5 以後)不給編號,改用空心的「禁止」圖示,
 * 提示這艘沒有列入編號(不提醒、不算待收)。圖示在四個主題各有一版(線條 / 像素 / 手繪),顏色走 `--text-dim`。
 */
@Component({
  selector: 'app-sub-no',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, Tip],
  template: `@if (placed()) {{{ text() }}} @else { <span class="no-ban" role="img" aria-label="未列入編號" [tip]="hint"><app-icon name="ban" [size]="size()" /></span> }`,
})
export class SubNo {
  readonly position = input.required<number>();
  readonly size = input(18);
  protected readonly hint = '未列入編號：不提醒、不算待收，可到「編排位置」排入';
  protected readonly placed = computed(() => isPlaced(this.position()));
  protected readonly text = computed(() => circled(this.position()));
}
