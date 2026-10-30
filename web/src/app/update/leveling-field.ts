import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ASSIST_MAX_HOURS, type AssistMode, type SubmarineDto } from '@eranaut/shared';
import { defaultDraft, type QuickProgressDraft } from '../core/leveling-vm';
import { OverviewVm } from '../core/overview-vm';
import { RouteFilterVm } from '../route/route-filter-vm';
import { specSummary } from '../route/route-filter-state';
import { ROUTE_FEATURES } from '../route/route-features';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { IconComponent } from '../ui/icon';

/**
 * 快速修改裡的「航線輔助」一列(D-289、D-297)。關閉時只佔一行;開啟才有設定:目前等級(1~130)、這一級的目前經驗(滑桿 + 精確輸入)、模式(練級:最長航行時間;條件組合:選一組已儲存的條件)。
 * 等級是選填,不開啟就不影響任何其他功能。填寫狀態放在 OverviewVm.quickProgress(換版面重建對話框時保留)。
 * 85 級以內的練級照攻略;更高的等級沒有攻略,推薦路線改由系統推算(D-298)。
 */
@Component({
  selector: 'app-leveling-field',
  imports: [IconComponent, SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (supported) {
      <section class="qs" data-qs="assist" [class.off]="!on()" aria-labelledby="qs-assist-t">
        <div class="qs-h">
          <span class="qs-i"><app-icon name="levelUp" [size]="18" /></span>
          <span class="qs-m">
            <span class="qs-t" id="qs-assist-t">航線輔助@if (dirty()) { <em class="qs-tag">已改</em> }</span>
            <span class="qs-s">{{ on() ? modeText() : '關閉中' }}</span>
          </span>
          <label class="switch">
            <input type="checkbox" [checked]="on()" (change)="toggle($any($event.target).checked)" aria-label="航線輔助" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="qs-w" [class.open]="on()" [attr.inert]="on() ? null : ''">
          <div class="qs-wi">
            <div class="qs-b">
              <div class="lv-cur">
                <span class="uk-k">目前等級</span>
                <b>Lv {{ c().level }}</b>
                <button type="button" class="lv-link" (click)="jump.emit()">在潛艇配置調整</button>
              </div>

              <div class="lv-block">
                <span class="uk-k">模式</span>
                <div class="uk-seg" role="group" aria-label="航線輔助模式">
                  <button type="button" [class.on]="c().mode === 'level'" [attr.aria-pressed]="c().mode === 'level'" (click)="setMode('level')">練級</button>
                  <button type="button" [class.on]="c().mode === 'combo'" [attr.aria-pressed]="c().mode === 'combo'" [disabled]="!filtersOn" (click)="setMode('combo')">條件組合</button>
                </div>
                @if (c().mode === 'level') {
                  <span class="uk-k">最長航行時間（「不限」= 每分鐘經驗最高）</span>
                  <div class="uk-seg lv-hours" role="group" aria-label="最長航行時間">
                    @for (h of hours; track h) {
                      <button type="button" [class.on]="c().maxHours === h" [attr.aria-pressed]="c().maxHours === h" (click)="setHours(h)">{{ h === null ? '不限' : h + 'h' }}</button>
                    }
                  </div>
                } @else {
                  <span class="uk-k">條件組合</span>
                  <app-select [options]="filterOptions()" [value]="c().filterId ?? ''" ariaLabel="條件組合" (valueChange)="setFilter($event)" />
                  @if (filterSummary(); as t) { <small class="uk-hint">{{ t }}</small> }
                  @else { <small class="uk-hint">條件在「航線 → 找路線 → 條件組合」建立與修改；這裡只選用，每艘只推薦第 1 名。</small> }
                }
              </div>

              @if (!sub().build) {
                <small class="uk-warn" role="status">這艘還沒設定配件，航線輔助無法推薦路線；請先到<button type="button" class="lv-link" (click)="jump.emit()">潛艇配置</button>設定配件。</small>
              }
              @if (sub().progress?.pending) {
                <small class="uk-warn" role="status">這艘已記下一條派出的路線；改等級或經驗會清掉它，改用你填的數字。</small>
              }
              <small class="uk-note">更新潛艇時，「這次派出」會預設帶入建議路線並推算經驗；用截圖更新到等級時，等級以辨識結果為準。</small>
            </div>
          </div>
        </div>
        @if (!on()) {
          <div class="qs-b"><small class="uk-hint">開啟後可選模式（練級／條件組合）與最長航行時間，更新時自動帶入建議路線。</small></div>
        }
      </section>
    }
  `,
})
export class LevelingField {
  readonly sub = input.required<SubmarineDto>();
  /** 這一區有未送出的修改 */
  readonly dirty = input(false);
  /** 要求跳到「潛艇配置」區塊 */
  readonly jump = output<void>();

  private readonly overview = inject(OverviewVm);
  protected readonly supported = inject(ROUTE_FEATURES).saving;
  protected readonly draft = this.overview.quickProgress;
  protected readonly hours = ASSIST_MAX_HOURS;
  private readonly filters = inject(RouteFilterVm);
  /** 展示模式沒有伺服器,沒有條件組合 */
  protected readonly filtersOn = this.filters.enabled;
  protected readonly modeText = computed(() => {
    const c = this.c();
    if (c.mode === 'combo') return `條件組合・${this.filters.saved().find((f) => f.id === c.filterId)?.name ?? '尚未選條件'}`;
    return c.maxHours === null ? '練級・不限' : `練級・最長 ${c.maxHours} 小時`;
  });
  protected readonly filterOptions = computed<SelectOption[]>(() => [{ value: '', label: '尚未選條件' } as SelectOption, ...this.filters.saved().map((f) => ({ value: f.id, label: f.name, hint: specSummary(f.spec) || undefined }))]);
  protected readonly filterSummary = computed(() => {
    const id = this.c().filterId;
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
  protected readonly c = computed<QuickProgressDraft>(() => this.draft() ?? defaultDraft(this.sub()));

  protected toggle(on: boolean): void {
    const b = this.c();
    if (on) {
      this.draft.set({ ...b, enabled: true });
      return;
    }
    // 有紀錄:送「關閉」(等級保留);沒有紀錄也沒改等級:回到沒碰過的狀態
    this.draft.set(!this.sub().progress && !b.edited ? null : { ...b, enabled: false });
  }

  private base(): QuickProgressDraft {
    return this.c();
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
}
