import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import type { ListToolsState } from './list-view';

/**
 * 清單工具列(D-237):名稱搜尋 + 「★ 常用」篩選晶片 + 符合筆數。
 * 項目不多(≤ TOOLS_MIN)時整列不顯示。配置清單、條件組合管理與各覆蓋清單共用。
 */
@Component({
  selector: 'app-route-list-tools',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    @if (view().showTools()) {
      <div class="rt-listtools" role="search">
        <input
          class="rt-text-input rt-lt-q"
          type="search"
          [attr.aria-label]="'搜尋' + noun()"
          [placeholder]="'搜尋' + noun() + '名稱'"
          [value]="view().query()"
          (input)="view().setQuery($any($event.target).value)"
          autocomplete="off"
          enterkeyhint="search"
        />
        <button type="button" class="rt-chip" [class.active]="view().favOnly()" [attr.aria-pressed]="view().favOnly()" (click)="view().setFavOnly(!view().favOnly())">★ 常用 {{ view().favCount() }}</button>
      </div>
      @if (view().filtering()) {
        <div class="rt-cap rt-lt-count" role="status">符合 {{ view().filtered().length }} / 共 {{ view().total() }} 組</div>
      }
    }
  `,
})
export class RouteListTools {
  readonly view = input.required<ListToolsState>();
  /** 項目的名稱,例如「配置」「條件組合」 */
  readonly noun = input('');
}

/** 星號按鈕(常用):在列表每一列使用;切換由外層處理 */
@Component({
  selector: 'app-route-star',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex' },
  template: `
    <button
      type="button"
      class="rt-star"
      [class.on]="on()"
      [attr.aria-pressed]="on()"
      [attr.aria-label]="(on() ? '取消常用 ' : '加入常用 ') + name()"
      [attr.title]="on() ? '取消常用' : '加入常用'"
      (click)="toggle.emit(); $event.stopPropagation()"
    >{{ on() ? '★' : '☆' }}</button>
  `,
})
export class RouteStar {
  readonly on = input.required<boolean>();
  readonly name = input('');
  readonly toggle = output<void>();
}

/**
 * 分頁列(D-237):‹ 上一頁、「2 / 5」(點開用自製下拉跳頁)、下一頁 › 與總筆數。
 * 只有一頁時不顯示。跳頁用 `app-select`,不用原生 select(D-160)。
 */
@Component({
  selector: 'app-route-pager',
  imports: [IconComponent, SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    @if (pages() > 1) {
      <nav class="rt-listpager" aria-label="分頁">
        <button type="button" class="pager-btn" [disabled]="page() <= 1" (click)="go(page() - 1)" aria-label="上一頁"><app-icon name="chevronLeft" [size]="16" /></button>
        <app-select class="rt-pg-sel" size="compact" ariaLabel="目前頁碼,點開可跳頁" [options]="options()" [value]="page()" (valueChange)="onSelect($event)" />
        <button type="button" class="pager-btn" [disabled]="page() >= pages()" (click)="go(page() + 1)" aria-label="下一頁"><app-icon name="chevronRight" [size]="16" /></button>
        <span class="rt-pg-count">共 {{ count() }} 組</span>
      </nav>
    }
  `,
})
export class RoutePager {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly count = input(0);
  readonly pageChange = output<number>();

  protected readonly options = computed<SelectOption[]>(() => Array.from({ length: this.pages() }, (_, i) => ({ value: i + 1, label: `${i + 1} / ${this.pages()}` })));

  protected go(n: number): void {
    if (n >= 1 && n <= this.pages() && n !== this.page()) this.pageChange.emit(n);
  }

  protected onSelect(v: SelectValue): void {
    this.go(Number(v));
  }
}
