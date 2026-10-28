import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { UpkeepItem } from '../core/upkeep-vm';
import { IconComponent } from '../ui/icon';

/** 總覽每艘潛艇多的一行小字(D-288)：有開啟維修提醒才畫，沒開的外觀完全不變。紅 = 現在不能出航，琥珀 = 這趟回來後要維修 */
@Component({
  selector: 'app-upkeep-tag',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item(); as i) {
      <span class="uk-tag" [attr.data-phase]="i.phase">
        @if (i.phase !== 'ok') { <app-icon name="wrench" [size]="12" /> }
        {{ i.label }}
      </span>
    }
  `,
  host: { style: 'display: contents' },
})
export class UpkeepTag {
  readonly item = input<UpkeepItem | null>(null);
}
