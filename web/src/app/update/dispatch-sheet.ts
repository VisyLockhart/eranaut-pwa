import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { ProgressRoute } from '@eranaut/shared';
import { circled } from '../core/format';
import { fmtExp, lvUp, minutesText, routeText } from '../core/leveling-vm';
import { selFromKey, type DispatchInfo, type RouteSel } from '../core/dispatch-vm';
import { unlockText } from '../core/dispatch';
import { IconComponent } from '../ui/icon';
import { LevelingPicker } from './leveling-picker';

/**
 * 「這次派出哪條?」的選擇面板(D-291):手機是底部面板,桌機是置中對話框(沿用維修面板的 `uk-panel`)。
 * 選項:航線輔助推薦(練級或條件組合)、跟上一趟一樣、自己選點(簡化選點器)、這趟不記經驗。只改這一列的選擇,送出更新時才一起存。
 */
@Component({
  selector: 'app-dispatch-sheet',
  imports: [CdkTrapFocus, IconComponent, LevelingPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    @let i = info();
    <div class="modal-overlay uk-overlay" (pointerdown)="overlayDown($event)" (click)="overlayClick($event)">
      <div class="modal-box uk-panel" role="dialog" aria-modal="true" aria-labelledby="dp-sheet-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
        <div class="uk-grab" aria-hidden="true"></div>
        <div class="uk-head">
          <div>
            <div class="modal-title" id="dp-sheet-title">這次派出哪條？</div>
            <div class="uk-sum lv-sub">{{ wsName() }}・{{ circled(i.sub.position) }} {{ i.sub.name || '潛水艇 ' + i.sub.position }}・出發時 Lv {{ i.start.level }}</div>
          </div>
          <button type="button" class="modal-close" (click)="closed.emit()" aria-label="關閉"><app-icon name="close" [size]="16" /></button>
        </div>
        <div class="lv-body">
          @if (picking()) {
            <app-leveling-picker [level]="i.start.level" [exp]="i.start.exp" [parts]="i.parts" (picked)="own($event)" (back)="pickingSet.set(false)" />
          } @else {
            @for (o of i.options; track o.key) {
              <button type="button" class="lv-opt" [class.pref]="o.key === selected()" [attr.aria-pressed]="o.key === selected()" (click)="pick(o.key)">
                <span class="lv-opt-top">
                  <b>{{ o.label }}</b>
                  @if (o.key === matched()) { <i class="lv-badge dp-ok">時間吻合</i> }
                  @if (o.unlock) { <i class="dp-tag unlock">{{ unlockText(o.unlock) }}</i> }
                  @if (o.sameAs) { <small class="dp-dim">與{{ o.sameAs }}相同</small> }
                </span>
                <span class="lv-route mono">{{ routeText(o.plan.points) }}</span>
                <small class="lv-meta">
                  @if (o.plan.minutes !== null) { <span>航行 {{ time(o.plan.minutes) }}</span> }
                  <span>+{{ fmt(o.plan.exp) }} {{ up(i.start.level, o.after) }}</span>
                  @if (o.fallback) { <span class="dp-calc">{{ o.fallback }}，改用練級推薦</span> }
                  @else if (o.relaxedTo) { <span class="dp-calc">上限內沒有路線，放寬到 {{ o.relaxedTo }} 小時</span> }
                  @else if (o.avoided?.length && o.calc) { <span class="dp-calc">已避開未發現的 {{ o.avoided.join('、') }}</span> }
                  @else if (o.calc) { <span class="dp-calc">依配置推算</span> }
                  @if (o.prereq) { <span class="dp-calc">先去 {{ o.prereq }}(解鎖點還沒發現)</span> }
                </small>
              </button>
            }
            <div class="dp-sheet-more">
              <button type="button" class="lv-opt own" [class.pref]="selected() === 'own'" (click)="pickingSet.set(true)">
                <span class="lv-opt-top"><b>自己選點…</b></span>
                <small class="lv-meta">溺沒海／灰海點位，會依這艘的配置檢查距離</small>
              </button>
              <button type="button" class="lv-opt own" [class.pref]="selected() === 'none'" (click)="pick('none')">
                <span class="lv-opt-top"><b>這趟不記經驗</b></span>
                <small class="lv-meta">返航後等級不會變；可隨時在快速修改裡調整</small>
              </button>
            </div>
          }
        </div>
        <div class="uk-foot"><div class="uk-foot-note">只改這一艘的選擇，按「送出更新」時才會存。</div></div>
      </div>
    </div>
  `,
})
export class DispatchSheet {
  readonly info = input.required<DispatchInfo>();
  readonly wsName = input('');
  /** 目前選的選項 key */
  readonly selected = input('');
  /** 與剩餘時間吻合的選項 key(截圖辨識的列) */
  readonly matched = input<string | null>(null);
  /** 一打開就是自己選點 */
  readonly startPicking = input(false);
  readonly chosen = output<RouteSel>();
  readonly closed = output<void>();

  protected readonly circled = circled;
  protected readonly routeText = routeText;
  protected readonly fmt = fmtExp;
  protected readonly up = lvUp;
  protected readonly unlockText = unlockText;
  protected readonly time = minutesText;
  protected readonly pickingSet = signal<boolean | null>(null);
  protected readonly picking = computed(() => this.pickingSet() ?? this.startPicking());
  protected downOn = false;

  // 模板事件處理式回傳 false 會被 preventDefault,所以用回傳 void 的方法(同快速修改)
  protected overlayDown(event: Event): void {
    this.downOn = event.target === event.currentTarget;
  }

  protected overlayClick(event: Event): void {
    if (this.downOn && event.target === event.currentTarget) this.closed.emit();
  }

  protected pick(key: string): void {
    this.chosen.emit(selFromKey(key));
  }

  protected own(route: ProgressRoute): void {
    this.chosen.emit({ kind: 'own', route });
  }
}
