import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Layout } from '../core/layout';
import { WorkshopsVm } from '../core/workshops-vm';
import { IconComponent } from '../ui/icon';
import { WorkshopList } from './workshop-list';

/**
 * 工坊管理視窗(D-294):總覽「全部」檢視的「工坊管理」按鈕開啟,排序(拖曳、▲▼)與新增工坊。
 * 桌機是置中視窗,手機是貼底的面板(沿用航線頁的 rt-sheet 樣式)。
 */
@Component({
  selector: 'app-workshop-manage',
  imports: [CdkTrapFocus, IconComponent, WorkshopList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    <div class="modal-overlay" [class.rt-sheet]="!layout.isDesktop()" [class.rt-compact]="!layout.isDesktop()" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
      <div class="modal-box rt-dlg ws-manage" role="dialog" aria-modal="true" aria-labelledby="wsm-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        <div class="rt-dlg-head">
          <div class="modal-title" id="wsm-title">工坊管理</div>
          <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
        </div>
        <div class="rt-dlg-body">
          <div class="rt-note">{{ layout.isDesktop() ? '拖曳 ⠿ 把手調整順序，或用列尾的 ▲▼ 做精準微調；總覽的工坊切換與排序會跟著變' : '拖曳 ⠿ 或用 ▲▼ 調整順序' }}</div>
          <app-workshop-list [variant]="layout.isDesktop() ? 'desktop' : 'mobile'" />
        </div>
        <div class="rt-dlg-foot">
          <div class="ws-manage-actions">
            <button type="button" class="ws-add-btn" (click)="vm.add()"><app-icon name="plus" [size]="16" />新增工坊</button>
            <button type="button" class="btn-primary-modal" (click)="close()">完成</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WorkshopManageDialog {
  protected readonly vm = inject(WorkshopsVm);
  protected readonly layout = inject(Layout);
  protected downOnOverlay = false;

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
    this.downOnOverlay = false;
  }
  protected close(): void {
    this.vm.closeManage();
  }
}
