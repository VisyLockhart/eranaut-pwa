import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { OverviewVm, SORT_FIELDS, SORT_FIELD_LABEL } from '../core/overview-vm';
import { IconComponent } from '../ui/icon';

/**
 * 總覽的排序按鈕組(D-290):工坊 / 編號 / 返航三顆可獨立開關,權重固定;最右邊切換升冪 / 降冪。
 * 開著的條件標上實際套用的順位數字。外觀沿用 `.ct-seg`(各主題已有對應樣式)。
 */
@Component({
  selector: 'app-overview-sort',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ct-seg ov-sort" [class.compact]="compact()" role="group" aria-label="排序方式">
      @for (f of fields; track f) {
        <button
          type="button"
          [class.on]="vm.sort()[f]"
          [attr.aria-pressed]="vm.sort()[f]"
          [disabled]="f === 'ws' && vm.wsSortDisabled()"
          [attr.title]="f === 'ws' && vm.wsSortDisabled() ? '只看一間工坊時不需要依工坊排序' : null"
          (click)="vm.toggleSortField(f)"
        >
          {{ label[f] }}@if (vm.sortRank()[f]; as n) {<span class="ov-sort-n" aria-hidden="true">{{ n }}</span>}
        </button>
      }
      <button
        type="button"
        class="ov-sort-dir"
        [disabled]="vm.sortAllOff()"
        [attr.aria-label]="vm.sortAllOff() ? '未選排序條件' : vm.sort().desc ? '目前降冪，按一下改為升冪' : '目前升冪，按一下改為降冪'"
        (click)="vm.toggleSortDir()"
      >
        <app-icon [name]="vm.sortDesc() ? 'sortDesc' : 'sortAsc'" [size]="15" />
        @if (compact()) { <span>{{ vm.sortDesc() ? '降冪' : '升冪' }}</span> }
      </button>
    </div>
  `,
  host: { style: 'display: contents' },
})
export class OverviewSort {
  protected readonly vm = inject(OverviewVm);
  /** 桌機:較矮,方向鈕附文字 */
  readonly compact = input(false);
  protected readonly fields = SORT_FIELDS;
  protected readonly label = SORT_FIELD_LABEL;
}
