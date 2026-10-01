import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { OverviewVm, wsMeta } from '../core/overview-vm';
import { IconComponent } from '../ui/icon';

@Component({
  selector: 'app-overview-mobile',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile.html',
  host: { style: 'display: contents' },
})
export class OverviewMobile {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;
}
