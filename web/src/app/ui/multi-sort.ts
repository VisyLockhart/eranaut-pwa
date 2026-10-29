import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/** 多重排序的一個條件 */
export interface SortField {
  id: string;
  label: string;
  /** 說明(滑過 / 長按時的提示) */
  title?: string;
  /** 不能開關(例如只看一間工坊時不需要依工坊排序) */
  disabled?: boolean;
}

/**
 * 多重排序按鈕組(D-290 總覽、D-297 航線輔助 / 條件組合共用):每顆可獨立開關,權重固定(就是 `fields` 的順序);
 * 開著的條件標上實際套用的順位數字。外觀沿用 `.ct-seg`(各主題已有對應樣式)。
 * 最右邊的方向鈕等額外按鈕由呼叫端用內容投影放進來(條件組合不需要方向,就不放)。
 */
@Component({
  selector: 'app-multi-sort',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ct-seg ov-sort" [class.compact]="compact()" role="group" [attr.aria-label]="label()">
      @for (f of fields(); track f.id) {
        <button
          type="button"
          [class.on]="isOn(f.id)"
          [attr.aria-pressed]="isOn(f.id)"
          [disabled]="f.disabled"
          [attr.title]="f.title ?? null"
          (click)="toggled.emit(f.id)"
        >
          {{ f.label }}@if (rank()[f.id]; as n) {<span class="ov-sort-n" aria-hidden="true">{{ n }}</span>}
        </button>
      }
      <ng-content />
    </div>
  `,
  host: { style: 'display: contents' },
})
export class MultiSort {
  readonly fields = input.required<readonly SortField[]>();
  /** 開著的條件 id(順序無關,權重看 `fields`) */
  readonly on = input.required<readonly string[]>();
  readonly compact = input(false);
  /** true = 順位照 `on` 的順序(使用者點選的先後);預設照 `fields` 的固定順序 */
  readonly ordered = input(false);
  readonly label = input('排序方式');
  readonly toggled = output<string>();

  protected readonly isOn = (id: string): boolean => this.on().includes(id);
  /** 開著的條件依 `fields`(或 `ordered` 時依 `on`)順序編號;被停用的不算 */
  protected readonly rank = computed<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    let n = 0;
    if (this.ordered()) {
      for (const id of this.on()) if (this.fields().some((f) => f.id === id && !f.disabled)) out[id] = ++n;
      return out;
    }
    for (const f of this.fields()) if (this.isOn(f.id) && !f.disabled) out[f.id] = ++n;
    return out;
  });
}
