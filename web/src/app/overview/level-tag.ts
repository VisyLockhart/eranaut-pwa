import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { fmtExp, lvUp, type ProgressView } from '../core/leveling-vm';
import type { NextRoute } from '../core/overview-vm';
import { unlockText } from '../core/dispatch';

/** 名稱旁的等級徽章(D-289)：只要填了等級就顯示(手動輸入或截圖更新都算)，不論有沒有開啟練級輔助；名稱太長時隨名稱換行 */
@Component({
  selector: 'app-level-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (item(); as v) { <b class="lv-badge lv-inline">Lv {{ v.level }}</b> }`,
  host: { style: 'display: contents' },
})
export class LevelBadge {
  readonly item = input<ProgressView | null>(null);
}

/** 練級輔助開著才畫的經驗條與「返航後 +經驗 → Lv」(D-289)；沒開就什麼都不畫 */
@Component({
  selector: 'app-level-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item(); as v) {
      @if (v.sim && v.pct !== null && v.exp !== null && v.need !== null) {
        <span class="lv-tag">
          @if (v.pending; as p) { <small class="lv-gain">返航後 +{{ fmt(p.gain) }} {{ up(v.level, p.toLevel) }}</small> }
          <span class="lv-bar" role="progressbar" [attr.aria-valuenow]="v.pct" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'經驗 ' + fmt(v.exp) + ' / ' + fmt(v.need)">
            <i [style.width.%]="v.pct"></i>
          </span>
          <small class="lv-exp mono">經驗 {{ fmt(v.exp) }} / {{ fmt(v.need) }}</small>
        </span>
      }
    }
  `,
  host: { style: 'display: contents' },
})
export class LevelTag {
  readonly item = input<ProgressView | null>(null);
  protected readonly fmt = fmtExp;
  protected readonly up = lvUp;
}

/** 可收艇的「下一趟」派出建議(D-291):潛艇名稱下方一行,依該艇偏好的流派;練級輔助開著才有 */
@Component({
  selector: 'app-next-route',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (item(); as n) {
      <span class="ov-next-route" [attr.aria-label]="'下一趟建議 ' + n.label + ' ' + n.points.join(' ') + (n.after > n.from ? '，抵達 Lv ' + n.after : '')">
        <small class="ov-next-k">下一趟</small>
        <b class="mono">{{ n.points.join(' → ') }}</b>
        @if (n.unlock) { <i class="dp-tag unlock">{{ unlockText(n.unlock) }}</i> }
        @if (n.sea === 2) { <i class="dp-tag sea">灰海</i> }
        @if (n.after > n.from) { <small class="ov-next-lv">→ Lv {{ n.after }}</small> }
      </span>
    }
  `,
  host: { style: 'display: contents' },
})
export class NextRouteTag {
  readonly item = input<NextRoute | null>(null);
  protected readonly unlockText = unlockText;
}
