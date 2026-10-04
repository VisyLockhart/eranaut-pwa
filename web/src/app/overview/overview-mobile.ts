import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { OverviewVm, wsMeta } from '../core/overview-vm';
import { IconComponent } from '../ui/icon';
import { PULL_THRESHOLD, PullRefresh } from '../ui/pull-refresh';

/** 重新整理中,指示區停留的高度 */
const REFRESHING_HEIGHT = 36;
/** 重新整理中的最短顯示時間(毫秒),避免一閃而過看不出有沒有更新 */
const MIN_REFRESH_MS = 600;

@Component({
  selector: 'app-overview-mobile',
  imports: [IconComponent, PullRefresh],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview-mobile.html',
  host: { style: 'display: contents' },
})
export class OverviewMobile {
  protected readonly vm = inject(OverviewVm);
  protected readonly store = inject(DataStore);
  protected readonly circled = circled;
  protected readonly wsMeta = wsMeta;

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
