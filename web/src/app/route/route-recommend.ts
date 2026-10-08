import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GOALS, type GoalId } from './route-goals';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteExp } from './route-exp';
import { RouteExplore } from './route-explore';
import { RouteLootSearch } from './route-loot-search';
import { RouteSearch } from './route-search';
import { RouteTarget } from './route-target';
import { RouteVariety } from './route-variety';
import { RouteVm } from './route-vm';

/**
 * 推薦頁(D-212,取代原本的「搜尋」分頁):先選目標,再用上面選的配置找路線或配置。
 * 第一版只有「練級」;其餘目標先顯示「即將推出」。原本的數字搜尋是「找配置」裡的「進階」。
 * 目前停在哪個目標放在 root 的 RouteVm(`recGoal`),換分頁不丟。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [RouteCfgBar, RouteExp, RouteExplore, RouteLootSearch, RouteSearch, RouteTarget, RouteVariety],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {
  protected readonly vm = inject(RouteVm);
  protected readonly routeGoals = GOALS.filter((g) => g.family === 'route');
  protected readonly buildGoals = GOALS.filter((g) => g.family === 'build');
  protected readonly title = computed(() => {
    const g = this.vm.recGoal();
    return GOALS.find((x) => x.id === g)?.name ?? '';
  });

  protected open(id: GoalId): void {
    this.vm.recGoal.set(id);
  }
  protected back(): void {
    this.vm.recGoal.set(null);
  }
}
