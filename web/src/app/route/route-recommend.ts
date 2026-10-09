import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteFind } from './route-find';
import { RouteVm } from './route-vm';

/**
 * 航線頁的「找路線」子頁(D-212、D-222、D-224):「‹ 航線」返回 + 配置列 + 找路線。
 * 練級、探索、最多物品、掉落整併成同一頁,用上面選的配置;結果按「模擬路線」回到航線主頁。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [RouteCfgBar, RouteFind],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {
  protected readonly vm = inject(RouteVm);

  protected back(): void {
    this.vm.findOpen.set(false);
  }
}
