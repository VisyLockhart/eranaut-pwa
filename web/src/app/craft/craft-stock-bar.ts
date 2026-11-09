import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectFooter, type SelectOption, type SelectValue } from '../ui/select';
import { Tip } from '../ui/tip';
import { CraftCopyButton } from './craft-copy-btn';
import { CraftStockVm } from './craft-stock-vm';
import { stockMeta } from './craft-stock-state';

const NONE = '__none__';

/**
 * 配件製作的「庫存組」列(D-329、D-337):下拉選一組(載入 = 換掉目前的配件與庫存)+ 儲存 + 管理 + 複製。
 * 目前有內容、又和那一組不同時,先開「要換掉目前的配件與庫存嗎?」確認;對話框在 `CraftStockDialogs`。
 * 放在工具列右側(手機獨立一整列);說明文字不另佔一行:改為下拉預設文字與「儲存」鈕的提示。
 * 展示模式(沒有伺服器)整列不顯示,「複製」改由工具列提供。
 */
@Component({
  selector: 'app-craft-stock-bar',
  imports: [SelectField, IconComponent, Tip, CraftCopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (sv.enabled) {
      <div class="ct-setbar" role="group" aria-label="庫存組">
        <div class="ct-set-row">
          <span class="ct-set-ic" aria-hidden="true"><app-icon name="stockBox" [size]="18" /></span>
          <app-select #sel class="ct-set-select" size="compact" ariaLabel="庫存組" [collapsible]="true" groupMemory="craft-stocks" [listMax]="300" [panelMinWidth]="300" [footer]="footer()" [options]="options()" [value]="value()" (valueChange)="onChange($event)" />
          <span class="ct-set-tip" [tip]="saveTip()">
            <button type="button" class="rt-save-btn ct-set-save" [class.emph]="sv.modified()" [disabled]="!sv.canSave()" (click)="sv.dialog.set('save')">儲存</button>
          </span>
          <button type="button" class="rt-link-btn" [disabled]="sv.saved().length === 0" (click)="sv.dialog.set('manage')">管理</button>
          <span class="ct-set-sep" aria-hidden="true"></span>
          <app-craft-copy [icon]="layout.isDesktop()" />
        </div>
      </div>
    }
  `,
})
export class CraftStockBar {
  protected readonly sv = inject(CraftStockVm);
  protected readonly layout = inject(Layout);
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
    if (active === null) {
      const label = this.sv.loadError() && !this.sv.loaded() ? '庫存組載入失敗' : saved.length === 0 ? '尚無庫存組' : '選擇庫存組…';
      out.unshift({ value: NONE, label });
    }
    return out;
  });
  /** 「儲存」鈕的提示(原本列下方的說明小字,D-337):停用時說明要先做什麼 */
  protected readonly saveTip = computed(() => {
    if (!this.sv.canSave()) return '要先選配件,並在「記錄庫存」填入數量,才能儲存';
    return this.sv.activeId() !== null ? '更新這一組,或另存新組' : `存成庫存組,下次一鍵帶入(各裝置同步,最多 ${this.sv.limit} 組)`;
  });
  /** 面板底部固定列:已用 N / 上限 組(沒有任何一組時不顯示);9 組轉琥珀、滿了轉紅 */
  protected readonly footer = computed<SelectFooter | null>(() => {
    const used = this.sv.saved().length;
    const max = this.sv.limit;
    if (used === 0) return null;
    if (used >= max) return { text: `已滿 ${used} / ${max} 組 · 只能覆蓋`, used, max, tone: 'danger' };
    if (used === max - 1) return { text: `已用 ${used} / ${max} 組 · 剩 1 組`, used, max, tone: 'amber' };
    return { text: `已用 ${used} / ${max} 組`, used, max };
  });
  protected readonly value = computed<SelectValue>(() => this.sv.activeId() ?? NONE);

  protected onChange(v: SelectValue): void {
    if (v === NONE) return;
    // 確認視窗開著時,下拉被程式退回原值也會觸發這裡;不能讓它把載入目標蓋成目前這一組
    if (this.sv.dialog() === 'replace') return;
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
