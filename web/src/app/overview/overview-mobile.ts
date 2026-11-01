import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { chartLabel } from '../core/charts';
import { RouterLink } from '@angular/router';
import { ManageVm } from '../core/manage-vm';
import { OverviewVm, upkeepText, wsInfo, wsMeta, type OverviewItem } from '../core/overview-vm';
import { UpkeepVm } from '../core/upkeep-vm';
import { WorkshopsVm } from '../core/workshops-vm';
import { SelectField } from '../ui/select';
import { OverviewSort } from './overview-sort';
import { IconComponent } from '../ui/icon';
import { SubNo } from '../ui/sub-no';
import { PULL_THRESHOLD, PullRefresh } from '../ui/pull-refresh';
import { LevelBadge, LevelTag, NextRouteTag } from './level-tag';
import { ManageBar } from './manage-bar';
import { MgBox, SubFlags } from './manage-bits';
import { LongPress } from '../ui/long-press';
import { UpkeepTag } from './upkeep-bits';

/** 重新整理中,指示區停留的高度 */
const REFRESHING_HEIGHT = 36;
/** 重新整理中的最短顯示時間(毫秒),避免一閃而過看不出有沒有更新 */
const MIN_REFRESH_MS = 600;

@Component({
  selector: 'app-overview-mobile',
  imports: [SubNo, IconComponent, RouterLink, PullRefresh, UpkeepTag, LevelBadge, LevelTag, NextRouteTag, SelectField, OverviewSort, ManageBar, MgBox, SubFlags, LongPress],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile.html',
  host: { style: 'display: contents' },
})
export class OverviewMobile {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  protected readonly wsVm = inject(WorkshopsVm);
  protected readonly mg = inject(ManageVm);
  /** 管理模式開著:點一列 = 勾選 / 取消;平常 = 快速修改 */
  protected tap(item: OverviewItem): void {
    if (this.mg.active()) this.mg.toggle(item.id);
    else this.vm.openQuickEdit(item);
  }
  protected tapSpace(event: Event, item: OverviewItem): void {
    if (!this.mg.active()) return;
    event.preventDefault();
    this.mg.toggle(item.id);
  }
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;
  protected readonly wsInfo = wsInfo;
  protected readonly upkeepText = upkeepText;
  protected readonly chartLabel = chartLabel;
  private readonly upkeep = inject(UpkeepVm);

  /** 只有「全部」且沒有依工坊分組時,每艘才需要標出所屬工坊(D-290 續) */
  protected readonly showWs = computed(() => this.vm.currentWorkshop() === null && this.vm.groups() === null);

  /** 摘要格的維修:先開第一間需要維修的工坊,面板上可左右切到其他間(D-290) */
  protected openUpkeep(): void {
    const ids = this.vm.upkeepSummary().alerts.map((a) => a.workshop.id);
    if (ids.length > 0) this.upkeep.open(ids[0], ids);
  }

  /** 手指拉出的距離 */
  protected readonly pull = signal(0);
  protected readonly refreshing = signal(false);
  protected readonly ptrHeight = computed(() => (this.refreshing() ? REFRESHING_HEIGHT : this.pull()));
  protected readonly ptrLabel = computed(() =>
    this.refreshing() ? '重新整理中…' : this.pull() >= PULL_THRESHOLD ? '放開重新整理' : '下拉重新整理',
  );

  protected onPull(distance: number): void {
    if (!this.refreshing()) this.pull.set(distance);
  }

  protected async onRefresh(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    const started = Date.now();
    try {
      await this.store.refresh();
      const rest = MIN_REFRESH_MS - (Date.now() - started);
      if (rest > 0) await new Promise((resolve) => setTimeout(resolve, rest));
    } finally {
      this.refreshing.set(false);
    }
  }
}
