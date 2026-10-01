import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { OverviewVm, addressLine, wsMeta } from '../core/overview-vm';
import { IconComponent } from '../ui/icon';

@Component({
  selector: 'app-overview-desktop',
  imports: [IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-desktop.html',
  host: { style: 'display: contents' },
})
export class OverviewDesktop {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;
  protected readonly addressLine = addressLine;
}
