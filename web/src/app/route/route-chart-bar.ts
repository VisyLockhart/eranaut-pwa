import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { seaCounts } from '../core/charts';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectValue } from '../ui/select';
import { RouteExploreVm } from './route-explore-vm';

/**
 * 航線頁的「工坊海圖」選擇(D-293):選了工坊就只畫、只排它已發現的點;不選(預設)照原本的方式顯示全部航點。
 * 選擇只存這台裝置。
 */
@Component({
  selector: 'app-route-chart-bar',
  imports: [SelectField, IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.workshops().length > 0) {
      <div class="rt-block rt-chartbar">
        <app-icon name="seaChart" [size]="16" />
        <label class="rt-chartbar-label" for="rt-chart-ws">工坊海圖</label>
        <app-select inputId="rt-chart-ws" size="compact" class="rt-chartbar-select" [options]="options()" [value]="x.chartWorkshop()?.id ?? ''" (valueChange)="pick($event)" />
        <span class="rt-chartbar-note" role="status">
          @if (!x.chartActive()) {
            不指定:顯示全部航點
          } @else if (!x.found()) {
            {{ x.chartName() }}還沒有海圖紀錄,先顯示全部航點 · <a [routerLink]="['/charts']" [queryParams]="{ ws: x.chartWs() }">更新海圖</a>
          } @else {
            只顯示已發現的點{{ counts() }}
          }
        </span>
      </div>
    }
  `,
})
export class RouteChartBar {
  protected readonly x = inject(RouteExploreVm);
  protected readonly store = inject(DataStore);
  protected readonly options = computed(() => [{ value: '', label: '不指定' }, ...this.store.workshops().map((w) => ({ value: w.id, label: w.name }))]);
  protected readonly counts = computed(() => {
    const f = this.x.found();
    if (!f) return '';
    const seas = seaCounts(f);
    return seas.length ? `(${seas.map((s) => `${s.name} ${s.found}/${s.total}`).join('、')})` : '';
  });

  protected pick(v: SelectValue): void {
    this.x.selectChartWs(v === '' || v === null ? null : String(v));
  }
}
