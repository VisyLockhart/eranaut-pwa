import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ManageVm } from '../core/manage-vm';
import { IconComponent } from '../ui/icon';

/**
 * 管理模式的操作列(D-313):桌機在表格上方,手機黏在畫面底部。
 * 複製 = 本工坊原地複製;搬移 = 原艇換工坊;複製到... = 原艇留著、複本放進勾選的工坊。沒勾選時這幾顆停用。
 */
@Component({
  selector: 'app-manage-bar',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mg.active()) {
      <div class="mg-bar" [class.mobile]="mobile()" role="toolbar" aria-label="管理潛水艇">
        <div class="mg-count" aria-live="polite">
          @if (mg.count() > 0) { 已選 <b class="mono">{{ mg.count() }}</b> / {{ mg.items().length }} 艘 } @else { 點選要處理的潛水艇 }
        </div>
        <div class="mg-actions">
          <button type="button" class="mg-act" [disabled]="mg.count() === 0 || mg.busy()" (click)="mg.copyHere()" title="在這間工坊原地複製一份">複製</button>
          <button type="button" class="mg-act" [disabled]="mg.count() === 0 || mg.busy() || mg.otherWorkshops().length === 0" (click)="mg.openTransfer('move')" [title]="mg.otherWorkshops().length === 0 ? '沒有其他工坊可搬移' : '原艇換到另一間工坊'">搬移</button>
          <button type="button" class="mg-act" [disabled]="mg.count() === 0 || mg.busy() || mg.otherWorkshops().length === 0" (click)="mg.openTransfer('copymove')" [title]="mg.otherWorkshops().length === 0 ? '沒有其他工坊可複製過去' : '原艇留著，複本放進其他工坊'">複製到...</button>
          <button type="button" class="mg-act danger" [disabled]="mg.count() === 0 || mg.busy()" (click)="mg.openDelete()"><app-icon name="trash" [size]="15" />刪除</button>
          <span class="mg-sep" aria-hidden="true"></span>
          <button type="button" class="mg-act" [disabled]="mg.busy()" (click)="mg.addSubmarine()"><app-icon name="plus" [size]="15" />新增潛艇</button>
          <button type="button" class="mg-act" [class.hot]="mg.needsLayout()" [disabled]="mg.busy()" (click)="mg.openLayout()">
            <app-icon name="dragDots" [size]="15" />編排位置@if (mg.unplacedCount() > 0) { <b class="mg-badge mono">{{ mg.unplacedCount() }}</b> }
          </button>
        </div>
      </div>
    }
  `,
  host: { style: 'display: contents' },
})
export class ManageBar {
  protected readonly mg = inject(ManageVm);
  readonly mobile = input(false);
}
