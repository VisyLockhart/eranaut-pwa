import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Layout } from '../core/layout';
import { OverviewDesktop } from './overview-desktop';
import { OverviewMobile } from './overview-mobile';

@Component({
  selector: 'app-overview-page',
  imports: [OverviewMobile, OverviewDesktop],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (layout.isDesktop()) { <app-overview-desktop /> } @else { <app-overview-mobile /> }`,
  host: { style: 'display: contents' },
})
export class OverviewPage {
  protected readonly layout = inject(Layout);
  constructor() {
    this.layout.pageTitle.set('潛水艇總覽');
  }
}
