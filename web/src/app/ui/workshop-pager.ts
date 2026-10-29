import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon';
import { SelectField, type SelectOption } from './select';

/**
 * 工坊切換列(‹ 下拉 ›):選項第 0 項慣例為「全部」,前後鈕循環翻頁(D-298)。
 * 樣式與總覽的工坊切換同一組(`pager-btn`、`size="pager"` 下拉);狀態由呼叫端持有,所以各頁的選擇互不影響。
 */
@Component({
  selector: 'app-workshop-pager',
  imports: [IconComponent, SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div class="rt-pager ws-pager">
      <button type="button" class="pager-btn" (click)="step(-1)" aria-label="上一間工坊"><app-icon name="chevronLeft" [size]="16" /></button>
      <app-select size="pager" ariaLabel="選擇工坊" [listMax]="380" [options]="options()" [value]="index()" (valueChange)="indexChange.emit(+$event)" />
      <button type="button" class="pager-btn" (click)="step(1)" aria-label="下一間工坊"><app-icon name="chevronRight" [size]="16" /></button>
    </div>
  `,
})
export class WorkshopPager {
  /** value 為序號(0 = 全部) */
  readonly options = input.required<readonly SelectOption[]>();
  readonly index = input.required<number>();
  readonly indexChange = output<number>();

  protected step(delta: number): void {
    const n = this.options().length;
    if (n > 0) this.indexChange.emit((this.index() + delta + n) % n);
  }
}
