import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { RouteFilterVm } from './route-filter-vm';

const NONE = '__none__';

/**
 * 找路線的「條件組合」列(D-229):下拉選一組(載入後自動搜尋)+ 儲存 + 管理。
 * 目前有條件、又不是這組本身時,先開「要換掉目前的條件嗎?」確認;對話框在 `RouteFilterDialogs`。
 * 展示模式(沒有伺服器)整列不顯示。
 */
@Component({
  selector: 'app-route-filter-bar',
  imports: [SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (fv.enabled) {
      <div class="rt-cfgbar rt-filterbar" role="group" aria-label="條件組合">
        <div class="rt-cfg-row">
          <app-select #sel class="rt-cfg-select" size="compact" ariaLabel="條件組合" [options]="options()" [value]="value()" (valueChange)="onChange($event)" />
          <button type="button" class="rt-save-btn" [disabled]="fv.isEmpty() && !fv.modified()" (click)="fv.dialog.set('save')">儲存</button>
          <button type="button" class="rt-link-btn" [disabled]="fv.saved().length === 0" (click)="fv.dialog.set('manage')">管理</button>
        </div>
        @if (fv.loaded() && fv.saved().length === 0) {
          <div class="rt-cap">把常用的海域、航點、物品存成條件組合,下次一鍵帶入(各裝置同步)。</div>
        }
        @if (fv.loadError() && !fv.loaded()) {
          <div class="rt-cap">條件組合暫時載入失敗,稍後會再試。</div>
        }
      </div>
    }
  `,
})
export class RouteFilterBar {
  protected readonly fv = inject(RouteFilterVm);
  private readonly sel = viewChild(SelectField);

  protected readonly options = computed<SelectOption[]>(() => {
    const active = this.fv.active();
    // 有常用時分成「★ 常用」「全部條件組合」兩組(D-237);沒有常用就維持單層清單
    const saved = this.fv.saved();
    const grouped = saved.some((s) => s.favorite);
    const out: SelectOption[] = [...saved.filter((s) => s.favorite), ...saved.filter((s) => !s.favorite)].map((s) => ({
      value: s.id,
      label: s.id === active?.id && this.fv.modified() ? `${s.name}(已修改)` : s.name,
      ...(grouped ? { group: s.favorite ? '★ 常用' : '全部條件組合' } : {}),
    }));
    if (active === null) out.unshift({ value: NONE, label: this.fv.saved().length === 0 ? '尚無條件組合' : '選擇條件組合…' });
    return out;
  });
  protected readonly value = computed<SelectValue>(() => this.fv.activeId() ?? NONE);

  protected onChange(v: SelectValue): void {
    if (v === NONE) return;
    const target = this.fv.saved().find((s) => s.id === v);
    if (!target) return;
    if (this.fv.needsConfirm(target)) {
      this.fv.loadTarget.set(target);
      this.fv.dialog.set('replace');
      // 還沒載入:下拉先退回原本顯示的值(使用者取消時不會停在沒載入的那一組,之後可再選同一組)
      this.sel()?.value.set(this.value());
    } else {
      this.fv.load(target);
    }
  }
}
