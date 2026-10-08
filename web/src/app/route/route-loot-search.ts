import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatTravel } from './route-format';
import { RouteLootVm } from './route-loot-vm';
import { RouteVm } from './route-vm';

const ITEM_PAGE = 40;
const ROUTE_PAGE = 20;

/**
 * 掉落物反查(M5):搜尋並選擇想要的物品,列出能拿到它、依每分鐘經驗排序的路線。
 * 併入推薦頁的「掉落」(D-218),配置由上方的配置列提供;點「帶到航點」把路線放進航點頁。
 * 物品挑選區可收合:選完按「看路線」收起並捲到結果。
 */
@Component({
  selector: 'app-route-loot-search',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-loot-search.html',
})
export class RouteLootSearch {
  protected readonly vm = inject(RouteVm);
  protected readonly l = inject(RouteLootVm);

  protected readonly itemsShown = signal(ITEM_PAGE);
  protected readonly routesShown = signal(ROUTE_PAGE);
  protected readonly items = computed(() => this.l.matches().slice(0, this.itemsShown()));
  protected readonly routes = computed(() => this.l.hits().slice(0, this.routesShown()));
  protected readonly fmt = formatTravel;

  protected onQuery(q: string): void {
    this.itemsShown.set(ITEM_PAGE);
    this.l.setQuery(q);
  }
  protected onCategory(c: string | null): void {
    this.itemsShown.set(ITEM_PAGE);
    this.l.setCategory(c);
  }
  protected toggle(id: number): void {
    this.routesShown.set(ROUTE_PAGE);
    this.l.toggle(id);
  }
  protected clear(): void {
    this.routesShown.set(ROUTE_PAGE);
    this.l.clear();
  }
  protected setMatch(m: 'all' | 'any'): void {
    this.routesShown.set(ROUTE_PAGE);
    this.l.setMatch(m);
  }
  protected showRoutes(): void {
    this.l.setPickerOpen(false);
    // 等收合後的版面更新完再捲,否則會捲到收合前的位置
    setTimeout(() => document.getElementById('rt-loot-results')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }));
  }
  protected openPicker(): void {
    this.l.setPickerOpen(true);
  }
  protected moreItems(): void {
    this.itemsShown.update((n) => n + ITEM_PAGE);
  }
  protected moreRoutes(): void {
    this.routesShown.update((n) => n + ROUTE_PAGE);
  }
  protected load(sea: number, order: readonly number[]): void {
    this.vm.requestLoad(sea, order);
  }
}
