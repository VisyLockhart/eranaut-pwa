import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ASSIST_MAX_HOURS, MAX_RECORDED_LEVEL, expSliderStep, levelExp, type AssistMode, type SubmarineDto } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { changeExp, changeLevel, defaultDraft, fmtExp, type QuickProgressDraft } from '../core/leveling-vm';
import { OverviewVm } from '../core/overview-vm';
import { Toast } from '../core/toast';
import { RouteFilterVm } from '../route/route-filter-vm';
import { specSummary } from '../route/route-filter-state';
import { ROUTE_FEATURES } from '../route/route-features';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { IconComponent } from '../ui/icon';

/**
 * 快速修改裡的「航線輔助」一列(D-289、D-297)。關閉時只佔一行;開啟才有設定:目前等級(1~130)、這一級的目前經驗(滑桿 + 精確輸入)、模式(練級:最長航行時間;條件組合:選一組已儲存的條件)。
 * 等級是選填,不開啟就不影響任何其他功能。填寫狀態放在 OverviewVm.quickProgress(換版面重建對話框時保留)。
 * 85 級以內的練級照攻略;更高的等級沒有攻略與每級經驗資料,不顯示經驗滑桿,推薦路線改由系統推算(D-298)。
 */
@Component({
  selector: 'app-leveling-field',
  imports: [IconComponent, SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (supported) {
      <div class="lv-field" [class.on]="on()">
        @if (on()) {
          <button type="button" class="uk-ico" [class.open]="open()" [attr.aria-expanded]="open()" aria-label="調整航線輔助" (click)="open.set(!open())"><app-icon name="levelUp" [size]="18" /></button>
        } @else {
          <app-icon name="levelUp" [size]="20" />
        }
        <span class="uk-main">
          <b>航線輔助</b>
          @if (on() && cur(); as c) {
            <small>Lv {{ c.level }}・{{ modeText() }}</small>
          } @else if (sub().progress; as p) {
            <small>
              目前 Lv {{ p.effective_level }}
              <button type="button" class="lv-link" [disabled]="busy()" (click)="clearLevel()">清除等級</button>
            </small>
          } @else {
            <small>記錄等級、推薦路線與經驗推算（選填）</small>
          }
        </span>
        <label class="switch">
          <input type="checkbox" [checked]="on()" (change)="toggle($any($event.target).checked)" aria-label="航線輔助" />
          <span class="slider"></span>
        </label>
      </div>
      @if (on() && open() && cur(); as c) {
        <div class="uk-setup lv-setup">
          <div class="lv-block">
            <span class="uk-k">目前等級（1~{{ max }}）</span>
            <span class="lv-row">
              <button type="button" class="lv-btn" [disabled]="c.level <= 1" (click)="setLevel(c.level - 1)" aria-label="等級減 1">−</button>
              <label class="lv-num"><span>Lv</span><input type="text" inputmode="numeric" maxlength="3" [value]="c.level" (change)="levelInput($event)" aria-label="目前等級" /></label>
              <button type="button" class="lv-btn" [disabled]="c.level >= max" (click)="setLevel(c.level + 1)" aria-label="等級加 1">＋</button>
            </span>
          </div>

          @if (!expKnown()) {
            <small class="uk-hint">{{ c.level }} 級沒有攻略與每級經驗資料，不用填經驗；推薦路線由系統依這艘的等級與配件推算。</small>
          } @else {
          <div class="lv-block">
            <span class="lv-head"><span class="uk-k">這一級的目前經驗</span><span class="uk-k">升級需要 {{ need() }}</span></span>
            <!-- 與配置的等級滑桿同一套樣式(把手大、touch-action: pan-y、拖動時顯示數值),手機才好拖 -->
            <div class="rt-lv-slider" [class.sliding]="sliding()">
              <div class="rt-lv-track">
                <input
                  type="range"
                  class="rt-lv-range"
                  [min]="0"
                  [max]="maxExp()"
                  [step]="step()"
                  [value]="c.exp"
                  (input)="setExp(+$any($event.target).value)"
                  (pointerdown)="sliding.set(true)"
                  (pointerup)="sliding.set(false)"
                  (pointercancel)="sliding.set(false)"
                  (blur)="sliding.set(false)"
                  aria-label="這一級的目前經驗"
                />
                <output class="rt-lv-bubble" [style.--pct]="pct()">{{ expText() }}</output>
              </div>
            </div>
            <span class="lv-row">
              <button type="button" class="lv-btn" [disabled]="c.exp <= 0" (click)="setExp(c.exp - step())" aria-label="經驗減一格">−</button>
              <label class="lv-num wide"><input type="text" inputmode="numeric" [value]="expText()" (change)="expInput($event)" aria-label="目前經驗（精確值）" /></label>
              <button type="button" class="lv-btn" [disabled]="c.exp >= maxExp()" (click)="setExp(c.exp + step())" aria-label="經驗加一格">＋</button>
            </span>
            <small class="uk-hint">拖曳每格約 1%（這一級是 {{ stepText() }}），換等級時上限跟著變；中間的數字可直接輸入遊戲裡看到的精確值。</small>
          </div>
          }

          <div class="lv-block">
            <span class="uk-k">模式</span>
            <div class="uk-seg" role="group" aria-label="航線輔助模式">
              <button type="button" [class.on]="c.mode === 'level'" [attr.aria-pressed]="c.mode === 'level'" (click)="setMode('level')">練級</button>
              <button type="button" [class.on]="c.mode === 'combo'" [attr.aria-pressed]="c.mode === 'combo'" [disabled]="!filtersOn" (click)="setMode('combo')">條件組合</button>
            </div>
            @if (c.mode === 'level') {
              <span class="uk-k">最長航行時間（「不限」= 每分鐘經驗最高）</span>
              <div class="uk-seg lv-hours" role="group" aria-label="最長航行時間">
                @for (h of hours; track h) {
                  <button type="button" [class.on]="c.maxHours === h" [attr.aria-pressed]="c.maxHours === h" (click)="setHours(h)">{{ h === null ? '不限' : h + 'h' }}</button>
                }
              </div>
            } @else {
              <span class="uk-k">條件組合</span>
              <app-select [options]="filterOptions()" [value]="c.filterId ?? ''" ariaLabel="條件組合" (valueChange)="setFilter($event)" />
              @if (filterSummary(); as t) { <small class="uk-hint">{{ t }}</small> }
              @else { <small class="uk-hint">條件在「航線 → 找路線 → 條件組合」建立與修改；這裡只選用，每艘只推薦第 1 名。</small> }
            }
          </div>

          @if (!sub().build) {
            <small class="uk-warn" role="status">這艘還沒設定配件，航線輔助無法推薦路線；請先設定下方的「配件配置」。</small>
          }
          @if (sub().progress?.pending) {
            <small class="uk-warn" role="status">這艘已記下一條派出的路線；改等級或經驗會清掉它，改用你填的數字。</small>
          }
          <small class="uk-note">更新潛艇時，「這次派出」會預設帶入建議路線並推算經驗；用截圖更新到等級時，等級以辨識結果為準。</small>
          @if (sub().progress) {
            <button type="button" class="lv-link end" [disabled]="busy()" (click)="clearLevel()">清除這艘的等級</button>
          }
        </div>
      }
    }
  `,
})
export class LevelingField {
  readonly sub = input.required<SubmarineDto>();

  private readonly overview = inject(OverviewVm);
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);
  protected readonly supported = inject(ROUTE_FEATURES).saving;
  protected readonly draft = this.overview.quickProgress;
  protected readonly open = signal(false);
  protected readonly busy = signal(false);
  protected readonly sliding = signal(false);
  protected readonly max = MAX_RECORDED_LEVEL;
  protected readonly hours = ASSIST_MAX_HOURS;
  private readonly filters = inject(RouteFilterVm);
  /** 展示模式沒有伺服器,沒有條件組合 */
  protected readonly filtersOn = this.filters.enabled;
  protected readonly modeText = computed(() => {
    const c = this.cur();
    if (!c) return '';
    if (c.mode === 'combo') return `條件組合・${this.filters.saved().find((f) => f.id === c.filterId)?.name ?? '尚未選條件'}`;
    return c.maxHours === null ? '練級・不限' : `練級・最長 ${c.maxHours} 小時`;
  });
  protected readonly filterOptions = computed<SelectOption[]>(() => [{ value: '', label: '尚未選條件' } as SelectOption, ...this.filters.saved().map((f) => ({ value: f.id, label: f.name, hint: specSummary(f.spec) || undefined }))]);
  protected readonly filterSummary = computed(() => {
    const id = this.cur()?.filterId;
    const f = id ? this.filters.saved().find((x) => x.id === id) : undefined;
    return f ? specSummary(f.spec) : '';
  });

  protected readonly on = computed(() => {
    const d = this.draft();
    if (d !== null) return d.enabled;
    const p = this.sub().progress;
    return !!p && p.assist_on;
  });
  /** 目前顯示的設定(沒動過就是伺服器的紀錄) */
  protected readonly cur = computed<QuickProgressDraft | null>(() => (this.on() ? (this.draft() ?? defaultDraft(this.sub())) : null));

  /** 86 級以上沒有每級經驗資料 */
  protected readonly expKnown = computed(() => levelExp(this.cur()?.level ?? 1) !== null);
  protected readonly step = computed(() => expSliderStep(this.cur()?.level ?? 1));
  protected readonly maxExp = computed(() => Math.max(0, (levelExp(this.cur()?.level ?? 1) ?? 1) - 1));
  protected readonly need = computed(() => fmtExp(levelExp(this.cur()?.level ?? 1) ?? 0));
  protected readonly stepText = computed(() => fmtExp(this.step()));
  protected readonly expText = computed(() => fmtExp(this.cur()?.exp ?? 0));
  protected readonly pct = computed(() => {
    const m = this.maxExp();
    return m > 0 ? Math.round(((this.cur()?.exp ?? 0) / m) * 100) : 0;
  });

  protected toggle(on: boolean): void {
    if (!on) {
      // 有紀錄:送「關閉」(等級保留);沒有:回到沒碰過的狀態
      this.draft.set(this.sub().progress ? { ...this.base(), enabled: false } : null);
      this.open.set(false);
      return;
    }
    this.draft.set(defaultDraft(this.sub()));
    // 第一次開啟(還沒有等級)直接展開讓人填;已有等級的艇維持收合
    this.open.set(!this.sub().progress);
  }

  private base(): QuickProgressDraft {
    return this.draft() ?? defaultDraft(this.sub());
  }

  protected setLevel(level: number): void {
    this.draft.set(changeLevel(this.base(), level));
  }

  protected levelInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = parseInt(el.value.replace(/\D/g, ''), 10);
    this.setLevel(Number.isFinite(n) ? n : this.base().level);
    el.value = String(this.cur()?.level ?? this.base().level);
  }

  protected setExp(exp: number): void {
    this.draft.set(changeExp(this.base(), exp));
  }

  protected expInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = parseInt(el.value.replace(/\D/g, ''), 10);
    this.setExp(Number.isFinite(n) ? n : this.base().exp);
    el.value = this.expText();
  }

  protected setMode(mode: AssistMode): void {
    if (mode === 'combo') this.filters.start();
    this.draft.set({ ...this.base(), mode });
  }

  protected setHours(maxHours: number | null): void {
    this.draft.set({ ...this.base(), maxHours });
  }

  protected setFilter(value: SelectValue): void {
    this.draft.set({ ...this.base(), filterId: value === '' || value === null ? null : String(value) });
  }

  /** 立即清除這艘的等級(不需按「送出更新」) */
  protected async clearLevel(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.store.clearProgress(this.sub().id);
      this.draft.set(null);
      this.open.set(false);
      this.toast.show('已清除這艘的等級');
    } catch {
      this.toast.show('清除失敗，請稍後再試', { tone: 'warn' });
    } finally {
      this.busy.set(false);
    }
  }
}
