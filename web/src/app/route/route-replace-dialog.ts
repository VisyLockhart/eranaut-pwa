import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { seaIndex } from './core/data';
import { RouteVm } from './route-vm';

/**
 * 「帶到航點」前的確認:航點頁已經有不同的選點時,先問要不要換掉(D-212)。
 * 狀態放在 root 的 RouteVm(`pendingLoad`,D-163)。取消、背景點擊、Esc 都不會動到已選航點。
 */
@Component({
  selector: 'app-route-replace-dialog',
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-replace-dialog.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RouteReplaceDialog {
  protected readonly vm = inject(RouteVm);
  protected downOnOverlay = false;

  protected readonly text = computed(() => {
    const p = this.vm.pendingLoad();
    if (!p) return null;
    const label = (sea: number, ids: readonly number[]): string => {
      const si = seaIndex(sea);
      return `${si.sea.name} ${ids.map((id) => si.byId.get(id)?.code ?? '?').join(' › ')}`;
    };
    return { current: label(this.vm.sea(), this.vm.seq()), count: this.vm.seq().length, next: label(p.sea, p.order) };
  });

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }

  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.vm.cancelLoad();
    this.downOnOverlay = false;
  }

  protected onEscape(event: Event): void {
    if (this.vm.pendingLoad() && !event.defaultPrevented) this.vm.cancelLoad();
  }
}
