import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteFilterBar } from './route-filter-bar';
import { RouteFilterDialogs } from './route-filter-dialogs';
import { RouteFilterVm } from './route-filter-vm';
import { RouteFind } from './route-find';
import { RouteVm } from './route-vm';

/**
 * 航線頁的「找路線」子頁(D-212、D-222、D-224):「‹ 航線」返回 + 配置列 + 找路線。
 * 練級、探索、最多物品、掉落整併成同一頁,用上面選的配置;結果按「模擬路線」回到航線主頁。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [RouteCfgBar, RouteFilterBar, RouteFilterDialogs, RouteFind],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {
  protected readonly vm = inject(RouteVm);

  constructor() {
    // 進入「找路線」才載入條件組合(展示模式不會呼叫 API)
    inject(RouteFilterVm).start();
  }

  protected back(): void {
    this.vm.findOpen.set(false);
  }
}
