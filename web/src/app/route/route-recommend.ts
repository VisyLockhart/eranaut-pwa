import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GOALS, type GoalId } from './route-goals';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteFind } from './route-find';
import { RouteSearch } from './route-search';
import { RouteTarget } from './route-target';
import { RouteVm } from './route-vm';

/**
 * 推薦頁(D-212、D-222):頂端「找路線 | 找配置」分段,預設進找路線(練級、探索、最多物品、掉落整併成同一頁,用上面選的配置);
 * 找配置是先選目標(收集、恩惠、速度、進階)再找零件組合。原本的數字搜尋是找配置裡的「進階」。
 * 目前停在哪放在 root 的 RouteVm(`recGoal`:`find`、某個找配置目標、或 null = 找配置的目標選擇頁),換分頁不丟。
 */
@Component({
  selector: 'app-route-recommend',
  imports: [RouteCfgBar, RouteFind, RouteSearch, RouteTarget],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-recommend.html',
})
export class RouteRecommend {
  protected readonly vm = inject(RouteVm);
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
  protected showFind(): void {
    this.vm.recGoal.set('find');
  }
  protected showBuild(): void {
    if (this.vm.recGoal() === 'find') this.vm.recGoal.set(null);
  }
}
