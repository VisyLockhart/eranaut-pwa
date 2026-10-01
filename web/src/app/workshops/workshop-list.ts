import { CdkDrag, CdkDragHandle, CdkDropList, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import type { WorkshopDto } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { addressLine } from '../core/overview-vm';
import { leadLabel } from '../core/workshop-form';
import { WorkshopsVm } from '../core/workshops-vm';
import { IconComponent } from '../ui/icon';

export type ListVariant = 'mobile' | 'desktop';

/**
 * 工坊清單(D-101、D-102、D-115、D-116)。
 * - 瀏覽模式:點工坊跳到總覽並套用該工坊過濾;桌機 hover 顯示地址泡泡(D-105)
 * - 管理模式:拖曳把手(CDK DragDrop,滑鼠與觸控共用)+ ▲▼ 按鈕(含滑動動畫)+ 編輯 + 刪除
 * 順序只存 localStorage(D-55),由 DataStore 處理。
 */
@Component({
  selector: 'app-workshop-list',
  imports: [CdkDropList, CdkDrag, CdkDragHandle, NgTemplateOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workshop-list.html',
  host: { style: 'display: contents' },
})
export class WorkshopList {
  readonly variant = input<ListVariant>('mobile');

  protected readonly vm = inject(WorkshopsVm);
  protected readonly store = inject(DataStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly addressLine = addressLine;
  protected readonly leadLabel = leadLabel;

  protected open(id: string): void {
    this.vm.focusInOverview(id);
    void this.router.navigateByUrl('/');
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    this.store.reorderWorkshops(event.previousIndex, event.currentIndex);
  }

  /** ▲▼:換位後其他卡片滑動到新位置(D-115 ④,FLIP),並把焦點留在同一顆按鈕上 */
  protected move(ws: WorkshopDto, delta: -1 | 1): void {
    const before = this.rowTops();
    this.store.moveWorkshop(ws.id, delta);
    afterNextRender(
      () => {
        this.playFlip(before);
        this.restoreFocus(ws.id, delta);
      },
      { injector: this.injector },
    );
  }

  private rowTops(): Map<string, number> {
    const tops = new Map<string, number>();
    for (const el of this.host.nativeElement.querySelectorAll<HTMLElement>('.ws-row[data-id]')) {
      tops.set(el.dataset['id'] ?? '', el.getBoundingClientRect().top);
    }
    return tops;
  }

  private playFlip(before: Map<string, number>): void {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const el of this.host.nativeElement.querySelectorAll<HTMLElement>('.ws-row[data-id]')) {
      const was = before.get(el.dataset['id'] ?? '');
      if (was === undefined || typeof el.animate !== 'function') continue;
      const dy = was - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) continue;
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    }
  }

  /** 換位時 Angular 會把節點搬到新位置,瀏覽器可能因此讓按鈕失焦;重新對焦同一顆(到頂/底了就改對另一顆) */
  private restoreFocus(id: string, delta: -1 | 1): void {
    const row = [...this.host.nativeElement.querySelectorAll<HTMLElement>('.ws-row[data-id]')].find((el) => el.dataset['id'] === id);
    if (!row) return;
    const wanted = row.querySelector<HTMLButtonElement>(`[data-move="${delta < 0 ? 'up' : 'down'}"]`);
    const other = row.querySelector<HTMLButtonElement>(`[data-move="${delta < 0 ? 'down' : 'up'}"]`);
    (wanted && !wanted.disabled ? wanted : other)?.focus();
  }
}
