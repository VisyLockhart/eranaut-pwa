import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, untracked } from '@angular/core';
import { DataStore } from '../core/data-store';
import { WorkshopsVm } from '../core/workshops-vm';
import { IconComponent } from '../ui/icon';

/** 刪除確認(D-104):依工坊底下有無潛艇記錄分兩種文案,有記錄時用危險色強調會一併刪除 */
@Component({
  selector: 'app-workshop-delete',
  imports: [CdkTrapFocus, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @if (workshop(); as ws) {
      <div class="modal-overlay" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
        <div class="modal-box danger" role="alertdialog" aria-modal="true" aria-labelledby="wsd-title" aria-describedby="wsd-desc" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          @if (count() > 0) {
            <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(248, 113, 113, 0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 16px">
              <app-icon name="warning" [size]="24" />
            </div>
          }
          <div class="modal-title" id="wsd-title" style="margin-bottom: 10px">刪除工坊</div>
          <div id="wsd-desc" style="font-size: 14px; line-height: 1.6; color: var(--text-muted); margin-bottom: 24px">
            @if (count() > 0) {
              工坊「<span style="color: var(--text); font-weight: 600">{{ ws.name }}</span>」底下還有 <span style="color: var(--danger); font-weight: 700">{{ count() }} 艘</span> 潛艇記錄，刪除工坊會<span style="color: var(--text); font-weight: 600">一併刪除這些記錄</span>，此動作無法復原。
            } @else {
              確定要刪除「<span style="color: var(--text); font-weight: 600">{{ ws.name }}</span>」嗎？這個工坊底下目前沒有潛水艇記錄。
            }
          </div>
          @if (error()) { <div class="modal-error-text" role="alert">{{ error() }}</div> }
          <div class="modal-actions">
            <button type="button" class="btn-secondary" cdkFocusInitial (click)="close()">取消</button>
            <button type="button" class="btn-danger" [disabled]="saving()" (click)="confirm()">{{ saving() ? '刪除中…' : '確認刪除' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WorkshopDeleteDialog {
  readonly workshopId = input.required<string>();
  readonly closed = output<void>();

  private readonly store = inject(DataStore);
  protected readonly workshop = computed(() => this.store.workshops().find((w) => w.id === this.workshopId()) ?? null);
  protected readonly count = computed(() => this.workshop()?.submarines.length ?? 0);
  private readonly vm = inject(WorkshopsVm);
  private destroyed = false;
  // 送出狀態放在 WorkshopsVm(版面切換重建對話框時要保留,D-163)
  protected readonly saving = this.vm.busy;
  protected readonly error = this.vm.submitError;
  protected downOnOverlay = false;

  // 注意:模板事件處理式若回傳 false,Angular 會對該事件呼叫 preventDefault(),
  // 把指派或 && 運算式直接寫在模板會讓對話框內的點擊(輸入框取得焦點、勾選、按鈕)全部失效,所以用回傳 void 的方法。
  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }

  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
  }

  /** 結束對話框;若送出期間元件已因版面切換被銷毀(output 不能再 emit),改直接通知 service 關閉 */
  private finish(): void {
    if (this.destroyed) this.vm.closeDialog();
    else this.closed.emit();
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    // 要刪除的工坊已經不在了(例如在別的裝置刪掉後重新整理)→ 直接關閉
    effect(() => {
      if (this.workshop() === null) untracked(() => this.closed.emit());
    });
  }

  protected close(): void {
    if (!this.saving()) this.closed.emit();
  }

  protected async confirm(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.store.deleteWorkshop(this.workshopId());
      this.finish();
    } catch {
      // 401 由 interceptor 轉成 session 過期畫面;其他錯誤留在對話框讓使用者重試
      this.error.set('刪除失敗，請稍後再試。');
    } finally {
      this.saving.set(false);
    }
  }
}
