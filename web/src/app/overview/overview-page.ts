import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { DispatchVm } from '../core/dispatch-vm';
import { Layout } from '../core/layout';
import { OverviewVm } from '../core/overview-vm';
import { UpkeepVm } from '../core/upkeep-vm';
import { QuickEditDialog } from '../update/quick-edit-dialog';
import { UpkeepPanel } from './upkeep-panel';
import { OverviewDesktop } from './overview-desktop';
import { OverviewMobile } from './overview-mobile';

@Component({
  selector: 'app-overview-page',
  imports: [OverviewMobile, OverviewDesktop, QuickEditDialog, UpkeepPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout.isDesktop()) { <app-overview-desktop /> } @else { <app-overview-mobile /> }
    @if (upkeep.openId()) { <app-upkeep-panel /> }
    @if (vm.quickEdit(); as q) {
      <app-quick-edit [workshopId]="q.workshopId" [position]="q.position" (closed)="vm.closeQuickEdit()" />
    }
  `,
  host: { style: 'display: contents' },
})
export class OverviewPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(OverviewVm);
  protected readonly upkeep = inject(UpkeepVm);
  private readonly dispatch = inject(DispatchVm);
  constructor() {
    this.layout.pageTitle.set('潛水艇總覽');
    // 可收艇的「下一趟」要依綁定的配置推算(D-291):有這種艇時才載入儲存的配置
    effect(() => {
      if (this.vm.sortedAll().some((i) => i.ready && i.level?.sim)) untracked(() => this.dispatch.start());
    });
  }
}
