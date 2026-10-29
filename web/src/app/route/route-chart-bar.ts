import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { seaCounts } from '../core/charts';
import { IconComponent } from '../ui/icon';
import { Tip } from '../ui/tip';
import { SelectField, type SelectValue } from '../ui/select';
import { partLabel } from './core/build';
import { RouteExploreVm } from './route-explore-vm';
import { RouteVm, wsSubLabel } from './route-vm';

/**
 * 航線頁的「工坊(資訊)」選擇(D-293、D-296):選了工坊就只畫、只排它已發現的點(海圖),並帶入它的潛艇(等級與配件)供「找路線」選用;
 * 不選(預設)照原本的方式顯示全部航點。選擇只存這台裝置。
 * 潛艇一列(每艘一張小卡):有等級也有配件 → 顯示 `Lv · 配件`,右上角的圖示鈕:○ 使用(選它當配置來源,與配置範本互斥;已選時實心)、鉛筆 編輯配件配置;還沒有配件的改成高亮的齒輪「設定」(D-298)。與配件清單的套用鈕同一套樣式。
 */
@Component({
  selector: 'app-route-chart-bar',
  imports: [SelectField, IconComponent, RouterLink, Tip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.workshops().length > 0) {
      <div class="rt-block rt-chartbar">
        <app-icon name="seaChart" [size]="16" />
        <label class="rt-chartbar-label" for="rt-chart-ws">工坊(資訊)</label>
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
      @if (x.chartWorkshop() && chips().length > 0) {
        <ul class="rt-wschips" aria-label="工坊的潛艇">
          @for (c of chips(); track c.id) {
            <li class="rt-wschip" [class.unset]="!c.ready" [class.sel]="c.selected">
              <div class="rt-wschip-head">
                <b class="rt-wschip-name">{{ c.label }}@if (c.selected) { <span class="rt-badge on">使用中</span> }</b>
                @if (vm.canSave) {
                  <span class="rt-wschip-acts">
                    @if (c.ready) {
                      <button type="button" class="rt-icon-btn" [class.on]="c.selected" [disabled]="c.selected" [tip]="c.selected ? '使用中' : '使用'" [attr.aria-label]="(c.selected ? '使用中:' : '使用:') + c.label" (click)="vm.useWsSub(c.id)"><app-icon [name]="c.selected ? 'circleFilled' : 'circle'" [size]="16" /></button>
                    }
                    @if (c.hasBuild) {
                      <button type="button" class="rt-icon-btn" tip="編輯配件配置" [attr.aria-label]="'編輯:' + c.label + ' 的配件配置'" (click)="vm.openSubBuild(c.id)"><app-icon name="pencil" [size]="16" /></button>
                    } @else {
                      <button type="button" class="rt-icon-btn hl" tip="設定配件配置" [attr.aria-label]="'設定:' + c.label + ' 的配件配置'" (click)="vm.openSubBuild(c.id)"><app-icon name="settings" [size]="16" /></button>
                    }
                  </span>
                }
              </div>
              <span class="rt-wschip-s">{{ c.info }}</span>
            </li>
          }
        </ul>
      }
    }
  `,
})
export class RouteChartBar {
  protected readonly x = inject(RouteExploreVm);
  protected readonly store = inject(DataStore);
  protected readonly vm = inject(RouteVm);
  /** 這間工坊每艘潛艇的資訊卡 */
  protected readonly chips = computed(() =>
    (this.x.chartWorkshop()?.submarines ?? []).map((s) => {
      const parts = s.build ? [s.build.hull, s.build.stern, s.build.bow, s.build.bridge].map(partLabel).join(' ') : null;
      const lv = s.progress ? `Lv${s.progress.effective_level}` : null;
      return {
        id: s.id,
        label: wsSubLabel(s),
        hasBuild: parts !== null,
        ready: lv !== null && parts !== null,
        selected: this.vm.wsSubId() === s.id,
        info: lv && parts ? `${lv} · ${parts}` : lv ? `${lv} · 未設定配件` : parts ? `未填等級 · ${parts}` : '未填等級 · 未設定配件',
      };
    }),
  );
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
