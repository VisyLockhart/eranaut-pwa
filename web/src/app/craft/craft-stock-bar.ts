import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { CraftStockVm } from './craft-stock-vm';
import { stockMeta } from './craft-stock-state';

const NONE = '__none__';

/**
 * 配件製作的「庫存組」列(D-329):下拉選一組(載入 = 換掉目前的配件與庫存)+ 儲存 + 管理。
 * 目前有內容、又和那一組不同時,先開「要換掉目前的配件與庫存嗎?」確認;對話框在 `CraftStockDialogs`。
 * 展示模式(沒有伺服器)整列不顯示。
 */
@Component({
  selector: 'app-craft-stock-bar',
  imports: [SelectField, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (sv.enabled) {
      <div class="ct-setbar" role="group" aria-label="庫存組">
        <div class="ct-set-row">
          <span class="ct-set-ic" aria-hidden="true"><app-icon name="stockBox" [size]="18" /><b>庫存組</b></span>
          <app-select #sel class="ct-set-select" size="compact" ariaLabel="庫存組" [collapsible]="true" groupMemory="craft-stocks" [options]="options()" [value]="value()" (valueChange)="onChange($event)" />
          <button type="button" class="rt-save-btn ct-set-save" [class.emph]="sv.modified()" [disabled]="!sv.canSave()" (click)="sv.dialog.set('save')">儲存</button>
          <button type="button" class="rt-link-btn" [disabled]="sv.saved().length === 0" (click)="sv.dialog.set('manage')">管理</button>
        </div>
        @if (sv.loaded() && sv.saved().length === 0) {
          <div class="rt-cap">選好配件、記錄庫存後,可存成庫存組,下次一鍵帶入(各裝置同步,最多 {{ sv.limit }} 組)。</div>
        } @else if (!sv.canSave() && sv.activeId() === null) {
          <div class="rt-cap">要先選配件,並在「記錄庫存」填入數量,才能儲存。</div>
        }
        @if (sv.loadError() && !sv.loaded()) {
          <div class="rt-cap">庫存組暫時載入失敗,稍後會再試。</div>
        }
      </div>
    }
  `,
})
export class CraftStockBar {
  protected readonly sv = inject(CraftStockVm);
  private readonly sel = viewChild(SelectField);

  protected readonly options = computed<SelectOption[]>(() => {
    const active = this.sv.active();
    // 有常用時分成「★ 常用」「其它庫存組」兩組;沒有常用就維持單層清單(同條件組合)
    const saved = this.sv.saved();
    const grouped = saved.some((s) => s.favorite);
    const out: SelectOption[] = [...saved.filter((s) => s.favorite), ...saved.filter((s) => !s.favorite)].map((s) => {
      const dirty = s.id === active?.id && this.sv.modified();
      return {
        value: s.id,
        label: dirty ? `${s.name}(已修改)` : s.name,
        hint: stockMeta(s),
        ...(grouped ? { group: s.favorite ? '★ 常用' : '其它庫存組' } : {}),
      };
    });
    if (active === null) out.unshift({ value: NONE, label: saved.length === 0 ? '尚無庫存組' : '選擇庫存組…' });
    return out;
  });
  protected readonly value = computed<SelectValue>(() => this.sv.activeId() ?? NONE);

  protected onChange(v: SelectValue): void {
    if (v === NONE) return;
    const target = this.sv.saved().find((s) => s.id === v);
    if (!target) return;
    if (this.sv.needsConfirm(target)) {
      this.sv.loadTarget.set(target);
      this.sv.dialog.set('replace');
      // 還沒載入:下拉先退回原本顯示的值
      this.sel()?.value.set(this.value());
    } else {
      this.sv.load(target);
    }
  }
}
