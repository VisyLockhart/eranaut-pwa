import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, untracked } from '@angular/core';
import type { SubmarineDto, SubmarineValidationErrorBody } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { OverviewVm } from '../core/overview-vm';
import { etaText, rowError, rowMinutes, rowWithRemaining, serverRowMessage, toSubmarineInput, type SubRow, type TimeField } from '../core/submarine-form';
import { Toast } from '../core/toast';
import { announceSkippedReminders } from '../core/update-vm';
import { IconComponent } from '../ui/icon';
import { LevelingField } from './leveling-field';
import { UpkeepField } from './upkeep-field';
import { progressRequest } from '../core/leveling-vm';
import { DispatchVm, isDispatch, resolveRoute, type RouteSel } from '../core/dispatch-vm';
import { DispatchLine } from './dispatch-line';
import { upkeepRequest } from '../core/upkeep-vm';
import { SubRowEditor } from './sub-row-editor';

/**
 * 單艘快速修改(D-117):從總覽點一艘潛艇開啟。
 * 與整坊更新不同,沒有等待時間補正(只改一艘、很快送出;demo 也是如此):送出的就是填的數字。
 */
@Component({
  selector: 'app-quick-edit',
  imports: [CdkTrapFocus, IconComponent, SubRowEditor, UpkeepField, LevelingField, DispatchLine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @if (workshop(); as ws) {
      @if (row(); as r) {
        <div class="modal-overlay" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
          <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="qe-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px">
              <div class="modal-title" id="qe-title">快速修改</div>
              <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
            </div>
            <div class="uf-ws"><app-icon name="server" [size]="14" /><b>{{ ws.name }}</b></div>
            <app-sub-row-editor
              [row]="r"
              [error]="error()"
              [eta]="eta()"
              (nameChange)="update({ name: $event })"
              (statusChange)="update({ status: $event })"
              (timeChange)="setTime($event.field, $event.value)"
            >
              <app-dispatch-line
                [sub]="dispatchSub() ?? undefined"
                [status]="r.status"
                [sel]="r.route"
                [filled]="filled()"
                [wsName]="ws.name"
                [desktop]="layout.isDesktop()"
                (routeChange)="setRoute($event)"
              />
            </app-sub-row-editor>
            @if (sub(); as s) { <app-upkeep-field [sub]="s" [status]="r.status" /> }
            @if (sub(); as s) { <app-leveling-field [sub]="s" /> }
            @if (formError()) { <div class="modal-error-text" role="alert">{{ formError() }}</div> }
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="close()">取消</button>
              <button type="button" class="btn-primary-modal" [disabled]="saving()" (click)="save()">{{ saving() ? '送出中…' : '送出更新' }}</button>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class QuickEditDialog {
  readonly workshopId = input.required<string>();
  readonly position = input.required<number>();
  readonly closed = output<void>();

  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);
  private readonly overview = inject(OverviewVm);
  private readonly dispatch = inject(DispatchVm);
  protected readonly layout = inject(Layout);
  private destroyed = false;

  protected readonly workshop = computed(() => this.store.workshops().find((w) => w.id === this.workshopId()) ?? null);
  // 填寫狀態放在 OverviewVm(版面切換重建對話框時要保留,D-163)
  protected readonly sub = computed(() => this.workshop()?.submarines.find((s) => s.position === this.position()) ?? null);
  protected readonly row = this.overview.quickRow;
  protected readonly error = this.overview.quickError;
  protected readonly formError = this.overview.quickFormError;
  protected readonly saving = this.overview.quickSaving;
  protected readonly eta = computed(() => {
    const r = this.row();
    return r === null ? '' : etaText(r, this.store.now());
  });
  protected downOnOverlay = false;
  protected readonly filled = computed(() => {
    const r = this.row();
    return r !== null && (r.status !== 'exploring' || (rowMinutes(r) ?? 0) > 0);
  });

  /**
   * 「這次派出」依的潛艇狀態(D-291):快速修改裡改了等級 / 經驗、或開關練級輔助時,以填的為準
   * (改了等級,伺服器會清掉待結算的路線,所以這裡也不加它)。
   */
  protected readonly dispatchSub = computed<SubmarineDto | null>(() => {
    const s = this.sub();
    if (!s) return null;
    const d = this.overview.quickProgress();
    if (d === null) return s;
    const p = s.progress;
    const level = d.edited || !p ? d.level : p.level;
    const exp = d.edited || !p ? d.exp : p.exp_in_level;
    return {
      ...s,
      progress: {
        level,
        exp_in_level: exp,
        source: p?.source ?? 'manual',
        sim_on: d.enabled,
        school: d.school ?? p?.school ?? null,
        pending: d.edited || !p ? null : p.pending,
        last_route: p?.last_route ?? null,
        effective_level: level,
        effective_exp: exp,
        updated_at: p?.updated_at ?? '',
      },
    };
  });

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
    if (this.destroyed) this.overview.closeQuickEdit();
    else this.closed.emit();
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    // 開啟時以目前資料建立一列(只建一次,之後的重抓不會蓋掉使用者正在填的內容);潛艇或工坊不存在就關閉
    effect(() => {
      const ws = this.workshop();
      const sub = ws?.submarines.find((s) => s.position === this.position());
      untracked(() => {
        if (!sub) this.closed.emit();
        else if (this.row() === null) this.row.set(rowWithRemaining(1, sub, Date.now()));
      });
    });
  }

  protected update(change: Partial<Pick<SubRow, 'name' | 'status'>>): void {
    this.row.update((r) => (r === null ? r : { ...r, ...change }));
    this.error.set(null);
  }

  protected setRoute(route: RouteSel): void {
    this.row.update((r) => (r === null ? r : { ...r, route }));
  }

  protected setTime(field: TimeField, value: string): void {
    this.row.update((r) => (r === null ? r : { ...r, [field]: value }));
    this.error.set(null);
  }

  protected close(): void {
    if (!this.saving()) this.closed.emit();
  }

  protected async save(): Promise<void> {
    const r = this.row();
    const ws = this.workshop();
    if (r === null || ws === null || this.saving()) return;
    const message = rowError(r);
    this.error.set(message);
    this.formError.set(null);
    if (message) return;

    this.saving.set(true);
    try {
      const upkeep = upkeepRequest(this.overview.quickUpkeep(), this.sub()?.upkeep !== undefined);
      const req = progressRequest(this.overview.quickProgress(), this.sub()?.progress !== undefined);
      // 這次派出的路線(D-291):上一趟已返航、這次填探索中,且練級輔助開著
      const now = this.store.now();
      const ds = this.dispatchSub();
      const info = ds ? this.dispatch.info(ds, now) : null;
      const picked = ds && isDispatch(r.status, ds, info, now) && info ? resolveRoute(info, r.route) : null;
      const progress = picked ? { ...(req ?? {}), route: picked.route } : req;
      const result = await this.store.updateSubmarine(ws.id, {
        ...toSubmarineInput(r, rowMinutes(r)),
        ...(upkeep !== undefined ? { upkeep } : {}),
        ...(progress !== undefined ? { progress } : {}),
      });
      this.toast.show(`已更新「${ws.name}」${r.name.trim() || `潛水艇 ${r.position}`}`);
      announceSkippedReminders(this.toast, ws.notify_batched, result.reminder_skipped_positions);
      this.finish();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        this.toast.show('這艘潛水艇所在的工坊已經不存在了', { tone: 'warn' });
        void this.store.refresh();
        this.finish();
      } else if (error instanceof HttpErrorResponse && error.status === 400) {
        const body = error.error as SubmarineValidationErrorBody | null;
        this.error.set(serverRowMessage(body?.fields ?? {}));
      } else {
        // 401 由 interceptor 轉成 session 過期畫面;其他錯誤留在對話框讓使用者重試
        this.formError.set('送出失敗，請稍後再試。');
      }
    } finally {
      this.saving.set(false);
    }
  }
}
