import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconComponent } from '../ui/icon';
import { partLabel } from './core/build';
import { RouteChartBar } from './route-chart-bar';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteFilterBar } from './route-filter-bar';
import { RouteFilterDialogs } from './route-filter-dialogs';
import { RouteFilterVm } from './route-filter-vm';
import { RouteFind } from './route-find';
import { RouteVm, wsSubLabel } from './route-vm';

/**
 * 航線頁的「找路線」子頁(D-212、D-222、D-224):「‹ 航線」返回 + 配置列 + 找路線。
 * 練級、探索、最多物品、掉落整併成同一頁,用上面選的配置;結果按「模擬路線」回到航線主頁。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [IconComponent, RouteChartBar, RouteCfgBar, RouteFilterBar, RouteFilterDialogs, RouteFind],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {
  protected readonly vm = inject(RouteVm);
  private readonly fv = inject(RouteFilterVm);

  /** 設定區收合時的一行摘要:配置來源 + 等級 + 配件 */
  protected readonly summary = computed(() => {
    const ws = this.vm.wsSub();
    const cfg = this.vm.saved().find((c) => c.id === this.vm.subId());
    const src = ws ? `${ws.workshop.name} ${wsSubLabel(ws.sub)}` : cfg ? cfg.name : this.vm.subId() === null ? '臨時配置' : '配置';
    return `${src} · Lv${this.vm.level()} · ${this.vm.parts().map(partLabel).join(' ')}`;
  });
  protected readonly filterName = computed(() => this.fv.active()?.name ?? null);

  constructor() {
    // 進入「找路線」才載入條件組合(展示模式不會呼叫 API)
    this.fv.start();
  }

  protected back(): void {
    this.vm.findOpen.set(false);
  }
}
