import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ManageVm } from '../core/manage-vm';
import { OverviewVm, SORT_FIELDS, SORT_FIELD_LABEL } from '../core/overview-vm';
import { IconComponent } from '../ui/icon';
import { MultiSort, type SortField as Field } from '../ui/multi-sort';

/**
 * 總覽的排序按鈕組(D-290):工坊 / 編號 / 返航三顆可獨立開關,權重固定;最右邊切換升冪 / 降冪。
 * 開著的條件標上實際套用的順位數字。外觀沿用 `.ct-seg`(各主題已有對應樣式)。
 */
@Component({
  selector: 'app-overview-sort',
  imports: [IconComponent, MultiSort],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (vm.currentWorkshop() && showManage()) {
      <button type="button" class="ov-manage-btn" [class.on]="mg.active()" [attr.aria-pressed]="mg.active()" [attr.aria-label]="mg.active() ? '完成管理' : '管理潛水艇：勾選後新增、刪除、搬移、複製'" (click)="mg.toggleMode()">
        <app-icon name="list" [size]="15" />{{ mg.active() ? '完成' : '管理' }}
      </button>
    }
    <app-multi-sort [fields]="fields()" [on]="on()" [compact]="compact()" (toggled)="vm.toggleSortField($any($event))">
      <button
        type="button"
        class="ov-sort-dir"
        [disabled]="vm.sortAllOff()"
        [attr.aria-label]="vm.sortAllOff() ? '未選排序條件' : vm.sort().desc ? '目前降冪，按一下改為升冪' : '目前升冪，按一下改為降冪'"
        (click)="vm.toggleSortDir()"
      >
        <app-icon [name]="vm.sortDesc() ? 'sortDesc' : 'sortAsc'" [size]="15" />
      </button>
    </app-multi-sort>
  `,
  host: { style: 'display: contents' },
})
export class OverviewSort {
  protected readonly vm = inject(OverviewVm);
  protected readonly mg = inject(ManageVm);
  /** 桌機:較矮 */
  readonly compact = input(false);
  /** 手機的管理鈕放在工坊資訊列,不放在收合的排序區 */
  readonly showManage = input(true);
  protected readonly fields = computed<Field[]>(() =>
    SORT_FIELDS.filter((f) => !(f === 'ws' && this.vm.wsSortDisabled())).map((f) => ({
      id: f,
      label: SORT_FIELD_LABEL[f],
    })),
  );
  protected readonly on = computed(() => SORT_FIELDS.filter((f) => this.vm.sort()[f]));
}
