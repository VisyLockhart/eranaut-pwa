import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { Layout } from '../core/layout';
import { WorkshopsVm } from '../core/workshops-vm';
import { IconComponent } from '../ui/icon';
import { WorkshopDeleteDialog } from './workshop-delete-dialog';
import { WorkshopFormDialog } from './workshop-form-dialog';
import { WorkshopList } from './workshop-list';

/** 工坊頁(D-101):瀏覽模式 / 管理模式(排序、新增、編輯、刪除)。手機與桌機共用狀態(WorkshopsVm) */
@Component({
  selector: 'app-workshops-page',
  imports: [IconComponent, WorkshopList, WorkshopFormDialog, WorkshopDeleteDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workshops-page.html',
  host: { style: 'display: contents' },
})
export class WorkshopsPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(WorkshopsVm);

  constructor() {
    this.vm.reset();
    effect(() => {
      const title = this.vm.manageMode() ? '工坊管理' : '工坊';
      untracked(() => this.layout.pageTitle.set(title));
    });
  }
}
