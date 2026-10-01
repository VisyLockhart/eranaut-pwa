import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { wsMeta } from '../core/overview-vm';
import { flagText } from '../core/submarine-form';
import { UpdateVm } from '../core/update-vm';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectValue } from '../ui/select';
import { SubRowEditor } from './sub-row-editor';

/** 更新潛艇(D-117):選工坊 → 截圖辨識或手動輸入 → 整個工坊一次更新;D-124 每分鐘自動補正 */
@Component({
  selector: 'app-update-page',
  imports: [NgTemplateOutlet, RouterLink, IconComponent, SelectField, SubRowEditor],
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
  protected readonly flagText = flagText;
  protected readonly dragging = signal(false);
  protected readonly wsOptions = computed(() => this.store.workshops().map((w) => ({ value: w.id, label: w.name })));

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

  protected onSelect(value: SelectValue): void {
    this.vm.selectWorkshop(String(value) || null);
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // 同一張圖可以再選一次
    if (file) void this.vm.recognize(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.vm.recognize(file);
  }

  protected async submit(): Promise<void> {
    const outcome = await this.vm.submit();
    if (outcome === 'ok' || outcome === 'gone') await this.router.navigateByUrl('/');
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/');
  }
}
