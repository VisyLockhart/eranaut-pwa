import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CraftLink } from '../core/craft-link';
import { IconComponent } from '../ui/icon';
import { RouteVm } from './route-vm';

/**
 * 「製作素材」(D-262):把這組配件帶到配件製作頁。
 * `icon` = 只顯示鐵砧圖示(手機收合列、桌機比較表等窄處),名稱放在 aria-label 與 title。
 */
@Component({
  selector: 'app-route-craft-btn',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <button type="button" class="rt-save-btn rt-craft-btn" [class.icon]="icon()" [attr.aria-label]="'製作素材:' + name()" title="製作素材" (click)="go()">
      <app-icon name="anvil" [size]="16" />@if (!icon()) {<span>製作素材</span>}
    </button>
  `,
})
export class RouteCraftBtn {
  private readonly link = inject(CraftLink);
  private readonly vm = inject(RouteVm);

  /** 四個配件,各為 1~10(1~5 原版、6~10 改版) */
  readonly parts = input.required<readonly number[]>();
  readonly name = input.required<string>();
  readonly icon = input(false);

  protected go(): void {
    // 「查看性能」彈窗開著時也能按;離開前先收起,回來才不會又蓋住畫面
    this.vm.perfOpen.set(false);
    this.link.send(this.parts(), this.name());
  }
}
