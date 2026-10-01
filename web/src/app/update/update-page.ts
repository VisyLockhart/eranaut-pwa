import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { wsMeta } from '../core/overview-vm';
import { UpdateVm } from '../core/update-vm';
import { IconComponent } from '../ui/icon';
import { SubRowEditor } from './sub-row-editor';

/** 更新潛艇(D-117):選工坊 → 整個工坊一次更新(手動輸入);D-124 每分鐘自動補正。截圖辨識待 OCR 完成後接上 */
@Component({
  selector: 'app-update-page',
  imports: [NgTemplateOutlet, RouterLink, IconComponent, SubRowEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './update-page.html',
  host: { style: 'display: contents' },
})
export class UpdatePage implements OnDestroy {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(UpdateVm);
  protected readonly store = inject(DataStore);
  private readonly router = inject(Router);
  protected readonly wsMeta = wsMeta;

  constructor() {
    this.layout.pageTitle.set('更新潛水艇');
    this.vm.open();
    // 資料晚到(直接開此頁、尚無快照)或選的工坊被刪掉時,補選一間
    effect(() => {
      this.store.workshops();
      this.vm.workshopId();
      untracked(() => this.vm.ensureSelection());
    });
  }

  ngOnDestroy(): void {
    this.vm.close();
  }

  protected onSelect(event: Event): void {
    this.vm.selectWorkshop((event.target as HTMLSelectElement).value || null);
  }

  protected async submit(): Promise<void> {
    const outcome = await this.vm.submit();
    if (outcome === 'ok' || outcome === 'gone') await this.router.navigateByUrl('/');
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/');
  }
}
