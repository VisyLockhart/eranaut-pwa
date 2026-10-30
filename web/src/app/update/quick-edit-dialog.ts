import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import type { SubmarineDto, SubmarineValidationErrorBody } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { OverviewVm } from '../core/overview-vm';
import { etaText, rowError, rowMinutes, rowWithRemaining, serverRowMessage, toSubmarineInput, type SubRow, type TimeField } from '../core/submarine-form';
import { Toast } from '../core/toast';
import { announceSkippedReminders } from '../core/update-vm';
import { IconComponent } from '../ui/icon';
import { LevelingField } from './leveling-field';
import { BuildField } from './build-field';
import { UpkeepField } from './upkeep-field';
import { progressRequest } from '../core/leveling-vm';
import { DispatchVm, isDispatch, resolveRoute, type RouteSel } from '../core/dispatch-vm';
import { DispatchLine } from './dispatch-line';
import { upkeepRequest } from '../core/upkeep-vm';
import { SubRowEditor } from './sub-row-editor';
import { changeCount, quickChanges } from '../core/quick-dirty';
import { upkeepItem } from '../core/upkeep-vm';
import type { IconName } from '../ui/icons';

/**
 * 單艘快速修改(D-117):從總覽點一艘潛艇開啟。
 * 與整坊更新不同,沒有等待時間補正(只改一艘、很快送出;demo 也是如此):送出的就是填的數字。
 */
@Component({
  selector: 'app-quick-edit',
  imports: [CdkTrapFocus, IconComponent, SubRowEditor, BuildField, UpkeepField, LevelingField, DispatchLine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  template: `
    @if (workshop(); as ws) {
      @if (row(); as r) {
        <div class="modal-overlay qe-ov" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
          <div class="qe-shell">
            @if (layout.isDesktop()) {
              <nav class="qe-rail-v" aria-label="跳到區塊">
                @for (it of rail(); track it.key) {
                  <button type="button" class="qe-rv" [class.on]="active() === it.key" [attr.aria-label]="it.label" [attr.aria-current]="active() === it.key ? 'true' : null" (click)="goTo(it.key)">
                    <app-icon [name]="it.icon" [size]="18" />
                    @if (it.attn) { <i class="qe-dot attn"></i> } @else if (it.on) { <i class="qe-dot"></i> }
                    <span class="qe-tip">{{ it.label }}</span>
                  </button>
                }
              </nav>
            }
            <div class="modal-box rt-dlg qe-box" role="dialog" aria-modal="true" aria-labelledby="qe-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
              <div class="qe-hd">
                <div class="modal-title" id="qe-title">快速修改</div>
                @if (count() > 0) { <span class="qe-pending" role="status">有 {{ count() }} 處未送出</span> }
                <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
              </div>
              <div class="uf-ws qe-ws"><app-icon name="server" [size]="14" /><b>{{ ws.name }}</b></div>
              @if (!layout.isDesktop()) {
                <nav class="qe-rail-h" aria-label="跳到區塊">
                  @for (it of rail(); track it.key) {
                    <button type="button" class="qe-rh" [class.on]="active() === it.key" [attr.aria-current]="active() === it.key ? 'true' : null" (click)="goTo(it.key)">
                      <span class="qe-rh-i"><app-icon [name]="it.icon" [size]="17" />@if (it.attn) { <i class="qe-dot attn"></i> } @else if (it.on) { <i class="qe-dot"></i> }</span>
                      <span class="qe-rh-t">{{ it.short }}</span>
                    </button>
                  }
                </nav>
              }
              <div class="qe-body" #body (scroll)="onScroll()">
                <section class="qs pri" data-qs="quick" aria-labelledby="qs-quick-t">
                  <div class="qs-h">
                    <span class="qs-i"><app-icon name="server" [size]="18" /></span>
                    <span class="qs-m">
                      <span class="qs-t" id="qs-quick-t">快速修改@if (changes().quick.length > 0) { <em class="qs-tag">已改</em> }</span>
                      <span class="qs-s">名稱、狀態、剩餘時間與這次派出</span>
                    </span>
                  </div>
                  <div class="qs-b">
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
                  </div>
                </section>
                @if (sub(); as s) {
                  <app-build-field [sub]="s" [dirty]="changes().config.length > 0" />
                  <app-upkeep-field [sub]="s" [status]="r.status" [dirty]="changes().upkeep.length > 0" />
                  <app-leveling-field [sub]="s" [dirty]="changes().assist.length > 0" (jump)="goTo('config')" />
                }
                @if (formError()) { <div class="modal-error-text" role="alert">{{ formError() }}</div> }
              </div>
              <div class="qe-ft">
                <button type="button" class="btn-secondary" (click)="close()">取消</button>
                <button type="button" class="btn-primary-modal" [disabled]="saving()" (click)="save()">{{ saving() ? '送出中…' : '送出更新' }}</button>
              </div>

              @if (confirming()) {
                <div class="qe-cfm-ov" (click)="$event.stopPropagation()">
                  <div class="qe-cfm" role="alertdialog" aria-modal="true" aria-labelledby="qe-cfm-t">
                    <div class="qe-cfm-t" id="qe-cfm-t">有 {{ count() }} 處修改還沒送出</div>
                    <ul class="qe-cfm-l">
                      @for (g of groups(); track g.title) {
                        @for (line of g.lines; track line) { <li><b>{{ g.title }}</b>{{ line }}</li> }
                      }
                    </ul>
                    <div class="modal-actions">
                      <button type="button" class="btn-secondary" (click)="confirming.set(false)">繼續編輯</button>
                      <button type="button" class="btn-danger" (click)="discard()">放棄並關閉</button>
                    </div>
                  </div>
                </div>
              }
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

  // ---- 區塊、功能選單與未送出修改(D-305) ----
  private readonly bodyEl = viewChild<ElementRef<HTMLElement>>('body');
  protected readonly active = signal<'quick' | 'config' | 'upkeep' | 'assist'>('quick');
  protected readonly confirming = signal(false);
  protected readonly changes = computed(() =>
    quickChanges(this.sub(), this.overview.quickRowInit(), this.row(), this.overview.quickUpkeep(), this.overview.quickProgress()),
  );
  protected readonly count = computed(() => changeCount(this.changes()));
  protected readonly groups = computed(() => {
    const c = this.changes();
    return [
      { title: '快速修改', lines: c.quick },
      { title: '潛艇配置', lines: c.config },
      { title: '維修提醒', lines: c.upkeep },
      { title: '航線輔助', lines: c.assist },
    ].filter((g) => g.lines.length > 0);
  });
  protected readonly rail = computed(() => {
    const s = this.sub();
    const up = this.overview.quickUpkeep();
    const pr = this.overview.quickProgress();
    const upOn = up ? up.enabled : !!s?.upkeep;
    const asOn = pr ? pr.enabled : !!s?.progress?.assist_on;
    const changed = s && upOn && !up ? (upkeepItem(s, this.store.now())?.configChanged ?? false) : false;
    return [
      { key: 'quick' as const, label: '快速修改', short: '快速', icon: 'server' as IconName, on: false, attn: false },
      { key: 'config' as const, label: '潛艇配置', short: '配置', icon: 'settings' as IconName, on: false, attn: false },
      { key: 'upkeep' as const, label: '維修提醒', short: '維修', icon: 'wrench' as IconName, on: upOn, attn: changed },
      { key: 'assist' as const, label: '航線輔助', short: '輔助', icon: 'levelUp' as IconName, on: asOn, attn: asOn && !s?.build },
    ];
  });

  protected goTo(key: 'quick' | 'config' | 'upkeep' | 'assist'): void {
    const body = this.bodyEl()?.nativeElement;
    const el = body?.querySelector<HTMLElement>(`[data-qs="${key}"]`);
    if (!body || !el) return;
    const reduced = document.documentElement.dataset['motion'] === 'reduced';
    this.active.set(key);
    body.scrollTo({ top: Math.max(0, el.offsetTop - 4), behavior: reduced ? 'auto' : 'smooth' });
  }

  /** 捲動時標示目前所在的區塊(最後一個頂端已捲過的區塊;捲到底就是最後一個) */
  protected onScroll(): void {
    const body = this.bodyEl()?.nativeElement;
    if (!body) return;
    const keys = ['quick', 'config', 'upkeep', 'assist'] as const;
    let cur: (typeof keys)[number] = 'quick';
    for (const k of keys) {
      const el = body.querySelector<HTMLElement>(`[data-qs="${k}"]`);
      if (el && el.offsetTop - 24 <= body.scrollTop) cur = k;
    }
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2 && body.scrollTop > 0) cur = 'assist';
    if (cur !== this.active()) this.active.set(cur);
  }

  protected discard(): void {
    this.confirming.set(false);
    this.closed.emit();
  }
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
        assist_on: d.enabled,
        assist_mode: d.mode,
        max_hours: d.maxHours,
        filter_id: d.filterId,
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
        else if (this.row() === null) {
          const init = rowWithRemaining(1, sub, Date.now());
          this.overview.quickRowInit.set(init);
          this.row.set(init);
        }
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

  /** 疊在上面的潛艇配置對話框已先處理這次 Esc(它會 preventDefault),這裡就不關快速修改 */
  protected onEscape(event: Event): void {
    if (event.defaultPrevented) return;
    if (this.confirming()) this.confirming.set(false);
    else this.close();
  }

  /** 「X」、取消、點背景、Esc 都走這裡:有沒送出的修改先跳確認(D-305) */
  protected close(): void {
    if (this.saving()) return;
    if (this.count() > 0) this.confirming.set(true);
    else this.closed.emit();
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
