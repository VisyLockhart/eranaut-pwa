import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatReturnParts, formatTravel } from './route-format';
import { RouteVm } from './route-vm';

/**
 * 路線摘要三格(航行時間、返航時刻、燃料),航點頁使用。
 * 返航時刻日期在上(小)、時間在下(大);長文字換行,不用刪節號截斷。沒選航點時顯示「—」。
 */
@Component({
  selector: 'app-route-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rt-summary">
      <div class="rt-stat rt-stat-wide"><span class="label">航行時間</span><span class="num">{{ travel() }}</span></div>
      <div class="rt-stat">
        <span class="label">返航時刻</span>
        @if (ret(); as r) {
          <span class="num rt-ret"><span class="rt-ret-date">{{ r.date }}</span> <span class="rt-ret-time">{{ r.time }}</span></span>
        } @else {
          <span class="num">—</span>
        }
      </div>
      <div class="rt-stat rt-stat-fuel"><span class="label">燃料</span><span class="num">{{ fuel() }}</span></div>
    </div>
  `,
})
export class RouteStats {
  private readonly vm = inject(RouteVm);
  private readonly has = computed(() => this.vm.seq().length > 0);
  protected readonly travel = computed(() => (this.has() ? formatTravel(this.vm.minutes()) : '—'));
  protected readonly ret = computed(() => {
    const minutes = this.vm.minutes();
    return this.has() ? formatReturnParts(Date.now(), minutes) : null;
  });
  protected readonly fuel = computed(() => (this.has() ? String(this.vm.cost().fuel) : '—'));
}
