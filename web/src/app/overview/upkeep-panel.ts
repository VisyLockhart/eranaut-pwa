import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { circled } from '../core/format';
import { UpkeepVm, upkeepRouteLabel } from '../core/upkeep-vm';
import { upkeepPartsLabel } from '@eranaut/shared';
import { IconComponent } from '../ui/icon';

/**
 * 同工坊 4 艘的維修面板(D-288)：手機是底部面板，桌機是置中對話框(同一份結構，差別只在樣式)。
 * 預設勾選「現在就不能出航」的艇；最後一趟還沒回來的可以手動勾選提前維修。
 * 「標示已維修」代表使用者已在遊戲內修好配件，之後出航的第一趟從 1 開始計。
 */
@Component({
  selector: 'app-upkeep-panel',
  imports: [CdkTrapFocus, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'vm.close()' },
  template: `
    @if (vm.workshop(); as ws) {
      @if (vm.view(); as v) {
        <div class="modal-overlay uk-overlay" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
          <div class="modal-box uk-panel" role="dialog" aria-modal="true" aria-labelledby="uk-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
            <div class="uk-grab" aria-hidden="true"></div>
            <div class="uk-head">
              <div>
                <div class="modal-title" id="uk-title">維修提醒・{{ ws.name }}</div>
                <div class="uk-sum" [attr.data-phase]="v.repairNow > 0 ? 'repair_now' : 'repair_after_return'">
                  @if (v.repairNow + v.afterReturn === 0) { 目前沒有需要維修的潛艇 }
                  @else { {{ summary(v.repairNow, v.afterReturn) }} }
                </div>
              </div>
              <button type="button" class="modal-close" (click)="vm.close()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
            </div>
            @if (vm.openList().length > 1) {
              <div class="uk-nav">
                <button type="button" class="pager-btn" (click)="vm.step(-1)" [disabled]="vm.saving()" aria-label="上一間需要維修的工坊"><app-icon name="chevronLeft" [size]="16" /></button>
                <span class="uk-nav-label">需要維修的工坊 <b class="mono">{{ vm.navIndex() + 1 }} / {{ vm.openList().length }}</b></span>
                <button type="button" class="pager-btn" (click)="vm.step(1)" [disabled]="vm.saving()" aria-label="下一間需要維修的工坊"><app-icon name="chevronRight" [size]="16" /></button>
              </div>
            }

            <div class="uk-list">
              @for (i of v.items; track i.id) {
                <div class="uk-item" [attr.data-phase]="i.phase" [class.picked]="vm.picked().has(i.id)">
                  <label class="uk-pick">
                    <input type="checkbox" [checked]="vm.picked().has(i.id)" (change)="vm.toggle(i.id)" [attr.aria-label]="'選取 ' + circled(i.position)" />
                    <span class="uk-main">
                      <span class="uk-name"><span class="sub-no">{{ circled(i.position) }}</span><b>{{ nameOf(i.id) }}</b><span class="uk-cfg mono">{{ upkeepPartsLabel(i.upkeep.parts_sig) }}</span></span>
                      <small class="uk-state">{{ i.phase === 'ok' ? '還能跑 ' + i.remaining + ' 趟' : i.status + '・' + i.upkeep.voyages_done + '/' + i.upkeep.limit_voyages + ' 趟' }}</small>
                      <span class="uk-dots" aria-hidden="true">
                        @for (d of dots(i.upkeep.limit_voyages); track d) { <i [class.f]="d <= i.upkeep.voyages_done"></i> }
                      </span>
                    </span>
                    <span class="uk-mat">修理材<b class="mono">{{ i.materials ?? '－' }}</b></span>
                  </label>
                  @if (i.configChanged) {
                    <div class="uk-warn" role="status">綁定的配置已和開啟提醒時不同，請確認趟數是否仍正確。</div>
                  }
                  <div class="uk-more">
                    <span class="uk-route">{{ upkeepRouteLabel(i.upkeep.route_key) }}</span>
                    <button type="button" class="uk-link" [attr.aria-expanded]="vm.adjustId() === i.id" (click)="vm.toggleAdjust(i.id)">調整</button>
                  </div>
                  @if (vm.adjustId() === i.id) {
                    <div class="uk-adjust">
                      <div class="uk-line">
                        <span class="uk-k">已跑</span>
                        <span class="uk-step">
                          <button type="button" [disabled]="vm.saving() || i.upkeep.voyages_done <= 0" (click)="vm.adjust(i.id, { voyages_done: i.upkeep.voyages_done - 1 })" aria-label="少算一趟">−</button>
                          <b class="mono">{{ i.upkeep.voyages_done }}</b>
                          <button type="button" [disabled]="vm.saving() || i.upkeep.voyages_done >= i.upkeep.limit_voyages" (click)="vm.adjust(i.id, { voyages_done: i.upkeep.voyages_done + 1 })" aria-label="多算一趟">＋</button>
                        </span>
                      </div>
                      <div class="uk-line">
                        <span class="uk-k">可跑</span>
                        <span class="uk-step">
                          <button type="button" [disabled]="vm.saving() || i.upkeep.limit_voyages <= 1" (click)="vm.adjust(i.id, { limit_voyages: i.upkeep.limit_voyages - 1 })" aria-label="減少可跑趟數">−</button>
                          <b class="mono">{{ i.upkeep.limit_voyages }}</b>
                          <button type="button" [disabled]="vm.saving() || i.upkeep.limit_voyages >= 20" (click)="vm.adjust(i.id, { limit_voyages: i.upkeep.limit_voyages + 1 })" aria-label="增加可跑趟數">＋</button>
                        </span>
                      </div>
                      <button type="button" class="uk-link danger" [disabled]="vm.saving()" (click)="vm.disable(i.id)">關閉這艘的維修提醒</button>
                    </div>
                  }
                </div>
              }
              @for (s of v.untracked; track s.id) {
                <div class="uk-off"><span class="sub-no">{{ circled(s.position) }}</span> {{ s.name || '潛水艇 ' + s.position }}・未開啟維修提醒</div>
              }
              @if (v.items.length === 0) {
                <div class="uk-empty">這間工坊還沒有開啟維修提醒的潛艇。到總覽點一艘潛艇，在「快速修改」裡開啟「配件維修提醒」。</div>
              }
            </div>

            @if (vm.error(); as e) { <div class="modal-error-text" role="alert">{{ e }}</div> }
            <div class="uk-foot">
              <div class="uk-total">已勾選 {{ vm.selection().length }} 艘・預估魔導機械修理材 <b class="mono">{{ vm.selectedMaterials() }}</b> 個</div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="vm.close()">稍後再說</button>
                <button type="button" class="btn-primary-modal uk-go" [disabled]="vm.saving() || vm.selection().length === 0" (click)="vm.markRepaired()">
                  {{ vm.saving() ? '送出中…' : '標示已維修（' + vm.selection().length + ' 艘）' }}
                </button>
              </div>
              <div class="uk-foot-note">按下代表你已在遊戲內修好配件；之後出航的第一趟從 1 開始計。</div>
            </div>
          </div>
        </div>
      }
    }
  `,
})
export class UpkeepPanel {
  protected readonly vm = inject(UpkeepVm);
  protected readonly circled = circled;
  protected readonly upkeepRouteLabel = upkeepRouteLabel;
  protected readonly upkeepPartsLabel = upkeepPartsLabel;
  private downOnOverlay = false;

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.vm.close();
  }

  protected nameOf(id: string): string {
    const s = this.vm.workshop()?.submarines.find((x) => x.id === id);
    return s?.name || `潛水艇 ${s?.position ?? ''}`;
  }

  /** 一排圓點：實心 = 已跑，空心 = 還剩 */
  protected dots(limit: number): number[] {
    return Array.from({ length: Math.min(limit, 20) }, (_, i) => i + 1);
  }

  protected summary(now: number, after: number): string {
    return [now > 0 ? `${now} 艘需要維修才能出航` : '', after > 0 ? `${after} 艘返航後需維修` : ''].filter(Boolean).join('，');
  }
}
