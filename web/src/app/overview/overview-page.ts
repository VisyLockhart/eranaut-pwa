import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Layout } from '../core/layout';
import { OverviewVm } from '../core/overview-vm';
import { QuickEditDialog } from '../update/quick-edit-dialog';
import { OverviewDesktop } from './overview-desktop';
import { OverviewMobile } from './overview-mobile';

@Component({
  selector: 'app-overview-page',
  imports: [OverviewMobile, OverviewDesktop, QuickEditDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout.isDesktop()) { <app-overview-desktop /> } @else { <app-overview-mobile /> }
    @if (vm.quickEdit(); as q) {
      <app-quick-edit [workshopId]="q.workshopId" [position]="q.position" (closed)="vm.closeQuickEdit()" />
    }
  `,
  host: { style: 'display: contents' },
})
export class OverviewPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(OverviewVm);
  constructor() {
    this.layout.pageTitle.set('潛水艇總覽');
  }
}
