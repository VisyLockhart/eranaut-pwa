import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { Tip } from '../ui/tip';
import { CraftStockVm } from './craft-stock-vm';
import { CraftVm } from './craft-vm';

/**
 * 「複製」鈕(D-337,原「複製清單」):複製畫面上目前的清單(桌機全部分頁,手機目前分頁;輸出格式不變)。
 * 庫存組列開啟時放在列內(儲存、管理旁);展示版沒有庫存組列,放回工具列,所以獨立成元件。
 * 載入庫存組又改過內容時,複製的是畫面上目前的內容,提示文字會標「已修改」。
 * 沒選配件時停用;複製成功後只把圖示換成勾(寬度不變)。
 */
@Component({
  selector: 'app-craft-copy',
  imports: [IconComponent, Tip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button type="button" class="ct-tool ct-copy" [class.ok]="vm.copied()" [disabled]="!vm.hasSelection()" [tip]="label()" [attr.aria-label]="label()" (click)="copy()">
      @if (icon()) {
        <app-icon [name]="vm.copied() ? 'check' : 'copy'" [size]="16" />
      }
      <span>複製</span>
    </button>
  `,
})
export class CraftCopyButton {
  protected readonly vm = inject(CraftVm);
  private readonly sv = inject(CraftStockVm);
  private readonly layout = inject(Layout);
  /** 手機的庫存組列太擠,只顯示文字 */
  readonly icon = input(true);

  protected readonly label = computed(() => {
    if (this.vm.copied()) return '已複製';
    return this.sv.modified() ? '複製目前(已修改)' : '複製目前清單';
  });

  protected copy(): void {
    void this.vm.copy(this.layout.isDesktop() ? this.vm.tabs : [this.vm.view().tab]);
  }
}
