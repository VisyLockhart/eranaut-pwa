import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { chartFound, chartLabel } from '../core/charts';
import { RouterLink } from '@angular/router';
import { OverviewVm, upkeepText, wsInfo, wsMeta } from '../core/overview-vm';
import { UpkeepVm } from '../core/upkeep-vm';
import { SelectField } from '../ui/select';
import { OverviewSort } from './overview-sort';
import { IconComponent } from '../ui/icon';
import { PULL_THRESHOLD, PullRefresh } from '../ui/pull-refresh';
import { LevelBadge, LevelTag, NextRouteTag } from './level-tag';
import { UpkeepTag } from './upkeep-bits';

/** 重新整理中,指示區停留的高度 */
const REFRESHING_HEIGHT = 36;
/** 重新整理中的最短顯示時間(毫秒),避免一閃而過看不出有沒有更新 */
const MIN_REFRESH_MS = 600;

@Component({
  selector: 'app-overview-mobile',
  imports: [IconComponent, RouterLink, PullRefresh, UpkeepTag, LevelBadge, LevelTag, NextRouteTag, SelectField, OverviewSort],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile.html',
  host: { style: 'display: contents' },
})
export class OverviewMobile {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;
  protected readonly wsInfo = wsInfo;
  protected readonly upkeepText = upkeepText;
  protected readonly chartFound = chartFound;
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
