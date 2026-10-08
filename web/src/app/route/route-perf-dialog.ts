import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { formatTravel } from './route-format';
import { RouteSubs } from './route-subs';
import { RouteVm } from './route-vm';

/**
 * 「查看性能」對話框:全部儲存配置(與臨時配置)對目前路線的達標比較表,每一組可「改用這組」。
 * 從航點頁的配置列開啟,狀態放在 root 的 RouteVm(`perfOpen`,D-163)。
 * 只是檢視,背景點擊、✕、Esc 都能直接關閉;編輯配置會疊上配置對話框。
 */
@Component({
  selector: 'app-route-perf-dialog',
  imports: [CdkTrapFocus, IconComponent, RouteSubs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-perf-dialog.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RoutePerfDialog {
  protected readonly vm = inject(RouteVm);
  protected readonly layout = inject(Layout);
  protected downOnOverlay = false;

  protected readonly summary = computed(() => {
    const n = this.vm.seq().length;
    if (n === 0) return '';
    const c = this.vm.cost();
    return `${this.vm.seaIdx().sea.name} · ${n} 個航點 · 距離需求 ${c.range} · 約 ${formatTravel(this.vm.minutes())}`;
  });

  /** 這條路線的需求(探索中 / 高階、收集一般 / 最佳、恩惠、距離耗用) */
  protected readonly need = computed(() => {
    if (this.vm.seq().length === 0) return '';
    const n = this.vm.need();
    return `需求:探索 中 ${n.surveillanceMid} / 高 ${n.surveillanceHigh} · 收集 一般 ${n.retrievalNorm} / 最佳 ${n.retrievalOptim} · 恩惠 ${n.favor} · 距離 ${n.range}`;
  });

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }

  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
    this.downOnOverlay = false;
  }

  protected onEscape(event: Event): void {
    // 配置對話框疊在上面時,Esc 先交給它(它處理過會 preventDefault)
    if (this.vm.perfOpen() && !this.vm.draft() && !event.defaultPrevented) this.close();
  }

  protected close(): void {
    this.vm.perfOpen.set(false);
  }
}
