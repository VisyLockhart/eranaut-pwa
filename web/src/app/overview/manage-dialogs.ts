import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { circled } from '../core/format';
import { Layout } from '../core/layout';
import { ManageVm } from '../core/manage-vm';
import { IconComponent } from '../ui/icon';
import { PositionEditor } from './position-editor';

/**
 * 管理模式的對話框(D-313、D-314):刪除確認、搬移 / 複製到...的目的工坊、位置編輯。
 * 桌機是置中視窗,手機是貼底的面板(沿用工坊管理的 rt-sheet 樣式)。
 */
@Component({
  selector: 'app-manage-dialogs',
  imports: [CdkTrapFocus, IconComponent, PositionEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @if (mg.dialog(); as kind) {
      <div class="modal-overlay" [class.rt-sheet]="!layout.isDesktop()" [class.rt-compact]="!layout.isDesktop()" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
        @switch (kind) {
          @case ('delete') {
            <div class="modal-box rt-dlg danger mg-dlg" role="alertdialog" aria-modal="true" aria-labelledby="mg-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
              <div class="rt-dlg-head">
                <div class="modal-title" id="mg-title">確定刪除以下 {{ mg.count() }} 艘潛水艇？</div>
                <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
              </div>
              <div class="rt-dlg-body">
                <ul class="mg-list">
                  @for (s of mg.selectedItems(); track s.id) {
                    <li><span class="sub-no">{{ circled(s.position) }}</span><b>{{ s.name }}</b>@if (s.level) { <span class="mg-lv">Lv {{ s.level.level }}</span> }@if (s.registered) { <span class="mg-new"><i aria-hidden="true"></i>新登記</span> }</li>
                  }
                </ul>
                <div class="mg-warn danger" role="note"><app-icon name="warning" [size]="16" /><span>刪除後<b>無法復原</b>。這些潛水艇的等級與經驗、配件、維修提醒、航線輔助與返航提醒都會一併刪除。</span></div>
                @if (mg.emptiesWorkshop()) { <div class="mg-note">刪除後「{{ mg.workshop()?.name }}」會剩 0 艘，<b>工坊會保留</b>。</div> }
                @if (mg.error(); as e) { <div class="modal-error-text" role="alert">{{ e }}</div> }
              </div>
              <div class="rt-dlg-foot mg-foot">
                <button type="button" class="btn-secondary" (click)="close()">取消</button>
                <button type="button" class="btn-danger" [disabled]="mg.busy()" (click)="mg.confirmDelete()">{{ mg.busy() ? '刪除中…' : '刪除 ' + mg.count() + ' 艘' }}</button>
              </div>
            </div>
          }
          @case ('layout') {
            <div class="modal-box rt-dlg mg-dlg wide-ish" role="dialog" aria-modal="true" aria-labelledby="mg-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
              <div class="rt-dlg-head">
                <div class="modal-title" id="mg-title">編排「{{ mg.workshop()?.name }}」的潛水艇位置</div>
                <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
              </div>
              <div class="rt-dlg-body"><app-position-editor [mobile]="!layout.isDesktop()" /></div>
              <div class="rt-dlg-foot mg-foot">
                <button type="button" class="btn-secondary mg-reset" [disabled]="mg.layoutChanged() === 0" (click)="mg.layoutReset()">還原</button>
                <button type="button" class="btn-secondary" (click)="close()">取消</button>
                <button type="button" class="btn-primary-modal" [disabled]="mg.layoutChanged() === 0 || mg.busy()" (click)="mg.applyLayout()">{{ mg.busy() ? '套用中…' : '套用排列' }}</button>
              </div>
            </div>
          }
          @default {
            <div class="modal-box rt-dlg mg-dlg" role="dialog" aria-modal="true" aria-labelledby="mg-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
              <div class="rt-dlg-head">
                <div class="modal-title" id="mg-title">{{ kind === 'move' ? '搬移 ' + mg.count() + ' 艘到…' : '複製 ' + mg.count() + ' 艘到…' }}</div>
                <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
              </div>
              <div class="rt-dlg-body">
                <div class="rt-note">
                  @if (kind === 'move') { 原艇換到選的工坊，等級、配件、維修提醒與航線輔助都會一起帶走。只能選一間。 }
                  @else { 原艇留在「{{ mg.workshop()?.name }}」，複本放進勾選的工坊（可多選）。複本只帶名稱、配件、等級與經驗，狀態為「新登記」。 }
                </div>
                <div class="mg-chips">
                  @for (s of mg.selectedItems(); track s.id) { <span class="mg-chip"><span class="sub-no">{{ circled(s.position) }}</span>{{ s.name }}</span> }
                </div>
                <div class="mg-dests" role="group" [attr.aria-label]="kind === 'move' ? '選擇目的工坊（單選）' : '選擇目的工坊（可多選）'">
                  @for (d of mg.destRows(); track d.id) {
                    <button type="button" class="mg-dest" [class.on]="d.checked" [class.over]="d.checked && d.over" [attr.role]="kind === 'move' ? 'radio' : 'checkbox'" [attr.aria-checked]="d.checked" (click)="mg.toggleTarget(d.id)">
                      <span class="mg-dest-mark" [class.radio]="kind === 'move'" aria-hidden="true">@if (d.checked) { <i></i> }</span>
                      <span class="mg-dest-main"><b>{{ d.name }}</b><small>{{ d.info }}</small></span>
                      <span class="mg-pips" aria-hidden="true">@for (p of d.pips; track $index) { <i [class]="p"></i> }</span>
                      <span class="mg-dest-text mono">{{ d.text }}</span>
                    </button>
                  }
                </div>
                @if (mg.overDests().length > 0) {
                  <div class="mg-warn" role="status"><app-icon name="warning" [size]="16" /><span>{{ overText() }}仍可繼續；第 5 艘起「未排入」，不提醒返航，之後可用「編排位置」排入。</span></div>
                }
                @if (mg.error(); as e) { <div class="modal-error-text" role="alert">{{ e }}</div> }
              </div>
              <div class="rt-dlg-foot mg-foot">
                <button type="button" class="btn-secondary" (click)="close()">取消</button>
                <button type="button" class="btn-primary-modal" [disabled]="!mg.canConfirmTransfer()" (click)="mg.confirmTransfer()">{{ confirmLabel() }}</button>
              </div>
            </div>
          }
        }
      </div>
    }
  `,
})
export class ManageDialogs {
  protected readonly mg = inject(ManageVm);
  protected readonly layout = inject(Layout);
  protected readonly circled = circled;
  private downOnOverlay = false;

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
    this.downOnOverlay = false;
  }
  protected close(): void {
    if (!this.mg.busy()) this.mg.closeDialog();
  }
  protected overText(): string {
    return this.mg.overDests().map((d) => `「${d.name}」放入後共 ${d.after} 艘`).join('、') + '，超過建議的 4 艘。';
  }
  protected confirmLabel(): string {
    const over = this.mg.overDests().length > 0;
    if (this.mg.busy()) return '處理中…';
    if (this.mg.dialog() === 'move') return over ? '仍要搬移' : this.mg.targets().length > 0 ? `搬移 ${this.mg.count()} 艘` : '搬移';
    const n = this.mg.targets().length;
    return over ? '仍要複製' : n > 0 ? `複製到 ${n} 間工坊` : '複製';
  }
}
