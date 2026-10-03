import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
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

  private readonly router = inject(Router);

  constructor() {
    // 從別的頁面進來才從瀏覽模式開始;版面切換(換螢幕等)重建頁面時保留目前的模式與對話框(D-163)
    if (!this.vm.active) this.vm.reset();
    this.vm.active = true;
    // 導到別的頁面才重置(離開頁面不保存草稿,D-145 ⑤)
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (!e.url.startsWith('/workshops')) this.vm.reset();
      });
    effect(() => {
      const title = this.vm.manageMode() ? '工坊管理' : '工坊';
      untracked(() => this.layout.pageTitle.set(title));
    });
  }
}
