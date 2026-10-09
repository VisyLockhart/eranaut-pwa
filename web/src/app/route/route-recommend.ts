import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteFind } from './route-find';

/**
 * 「找路線」分頁(D-212、D-222、D-223;內部代號仍是 `recommend`,舊的本機記錄不必搬):配置列加上找路線。
 * 練級、探索、最多物品、掉落整併成同一頁,用上面選的配置;找配置已移到配置頁的子畫面。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [RouteCfgBar, RouteFind],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {}
