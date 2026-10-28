import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ChartUpdateVm } from '../core/chart-update-vm';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';

/**
 * 加入海圖視窗(D-294 補):截圖辨識不到時,手動把還沒解鎖的海圖加進來。
 * 加入後先標起點 A(1/n),再到海圖上標其餘已發現的點。桌機置中視窗、手機貼底面板。
 */
@Component({
  selector: 'app-add-sea',
  imports: [CdkTrapFocus, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="modal-overlay" [class.rt-sheet]="!layout.isDesktop()" [class.rt-compact]="!layout.isDesktop()" (pointerdown)="down = $event.target === $event.currentTarget" (click)="overlayClick($event)">
      <div class="modal-box rt-dlg ch-add-dlg" role="dialog" aria-modal="true" aria-labelledby="chadd-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        <div class="rt-dlg-head">
          <div class="modal-title" id="chadd-title">加入海圖</div>
          <button type="button" class="modal-close" (click)="closed.emit()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
        </div>
        <div class="rt-dlg-body">
          <div class="rt-note">選一張還沒解鎖的海圖，加入後先標起點 A，再到海圖上標其餘已發現的點</div>
          @if (vm.addable().length === 0) {
            <div class="ch-add-none">所有海圖都已加入了</div>
          } @else {
            <div class="ch-add-list" role="radiogroup" aria-label="未解鎖的海圖">
              @for (t of vm.addable(); track t.sea) {
                <button type="button" role="radio" class="ch-add-opt" [class.on]="pick() === t.sea" [attr.aria-checked]="pick() === t.sea" (click)="pick.set(t.sea)">
                  <span class="ch-add-radio" aria-hidden="true"></span>
                  <b>{{ t.name }}</b>
                  <span class="ch-add-n">0 / {{ t.total }}</span>
                </button>
              }
            </div>
          }
        </div>
        <div class="rt-dlg-foot">
          <div class="ws-manage-actions">
            <button type="button" class="ghost-btn" (click)="closed.emit()">取消</button>
            <button type="button" class="btn-primary-modal" [disabled]="pick() === null" (click)="confirm()">加入</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AddSeaDialog {
  protected readonly vm = inject(ChartUpdateVm);
  protected readonly layout = inject(Layout);
  readonly closed = output<void>();
  protected readonly pick = signal<number | null>(null);
  protected down = false;

  protected overlayClick(event: Event): void {
    if (this.down && event.target === event.currentTarget) this.closed.emit();
    this.down = false;
  }
  protected confirm(): void {
    const sea = this.pick();
    if (sea === null) return;
    this.vm.addSea(sea);
    this.closed.emit();
  }
}
