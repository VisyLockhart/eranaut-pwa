import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { WorkshopDto } from '@eranaut/shared';
import { RouterLink } from '@angular/router';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { chartDate } from '../core/charts';
import { OverviewVm, addressLine, upkeepText, wsInfo, wsMeta } from '../core/overview-vm';
import { UpkeepVm } from '../core/upkeep-vm';
import { IconComponent } from '../ui/icon';
import { SelectField } from '../ui/select';
import { LevelBadge, LevelTag, NextRouteTag } from './level-tag';
import { OverviewSort } from './overview-sort';
import { UpkeepTag } from './upkeep-bits';

@Component({
  selector: 'app-overview-desktop',
  imports: [IconComponent, RouterLink, UpkeepTag, LevelBadge, LevelTag, NextRouteTag, SelectField, OverviewSort],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-desktop.html',
  host: { style: 'display: contents' },
})
export class OverviewDesktop {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  private readonly upkeep = inject(UpkeepVm);
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;
  protected readonly wsInfo = wsInfo;
  protected readonly addressLine = addressLine;
  protected readonly upkeepText = upkeepText;
  protected readonly chartDate = (ms: number | null) => chartDate(ms);
  protected readonly sections = this.vm.sections;
  /** 只有「全部」且沒有依工坊分組時,每艘才需要標出所屬工坊(D-290 續) */
  protected readonly showWsCol = computed(() => this.vm.currentWorkshop() === null && this.vm.groups() === null);
  /** 範圍內有任何一艘開啟維修提醒或練級輔助,才顯示「練級・維修」欄(D-290 續) */
  protected readonly showProgCol = computed(() => this.vm.items().some((i) => i.upkeep !== null || i.level?.sim === true));
  protected hasAddress(w: Pick<WorkshopDto, 'address_district' | 'address_ward' | 'address_detail'>): boolean {
    return !!(w.address_district || w.address_ward !== null || w.address_detail);
  }
  protected readonly readyPct = (): number => this.vm.stats().readyPct;

  /** 開某間工坊的維修面板;面板上可切到其他需要維修的工坊 */
  protected openUpkeep(workshopId: string): void {
    this.upkeep.open(workshopId, this.vm.upkeepSummary().alerts.map((a) => a.workshop.id));
  }
}
