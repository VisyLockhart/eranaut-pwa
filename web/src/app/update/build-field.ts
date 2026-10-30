import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MAX_RECORDED_LEVEL, expSliderStep, levelExp, type SubmarineDto } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { changeExp, changeLevel, defaultDraft, fmtExp, type QuickProgressDraft } from '../core/leveling-vm';
import { OverviewVm } from '../core/overview-vm';
import { Toast } from '../core/toast';
import { partLabel } from '../route/core/build';
import { RouteVm } from '../route/route-vm';
import { IconComponent } from '../ui/icon';

/**
 * 快速修改的「② 潛艇配置」區塊(D-296、D-305):這艘自己的配件摘要(四格)+「編輯配件」,
 * 以及就地調整的等級(1~130)與這一級的目前經驗(滑桿約 1% 一格 + 精確輸入)。
 * 等級是潛艇的資料,和「航線輔助」開不開無關;改了等級 / 經驗放在 OverviewVm.quickProgress,按「送出更新」才存。
 * 86 級以上沒有每級經驗資料,不顯示經驗,改顯示說明。展示版沒有儲存,不顯示。
 */
@Component({
  selector: 'app-build-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routeVm.canSave) {
      <section class="qs" data-qs="config" aria-labelledby="qs-config-t">
        <div class="qs-h">
          <span class="qs-i"><app-icon name="settings" [size]="18" /></span>
          <span class="qs-m">
            <span class="qs-t" id="qs-config-t">潛艇配置@if (dirty()) { <em class="qs-tag">已改</em> }</span>
            <span class="qs-s">配件、等級與經驗</span>
          </span>
          <button type="button" class="rt-save-btn" [attr.aria-label]="(parts() ? '編輯' : '設定') + '這艘的配件'" (click)="open()">{{ parts() ? '編輯配件' : '設定配件' }}</button>
        </div>
        <div class="qs-b">
          <div class="bf-parts" [class.dashed]="!parts()" role="group" aria-label="目前配件">
            @for (c of cells(); track c.label) {
              <span class="bf-part"><small>{{ c.label }}</small><b>{{ c.value }}</b></span>
            }
            @if (!parts()) { <span class="bf-none">尚未設定配件</span> }
          </div>

          <div class="qs-cols">
            <div class="lv-block">
              <span class="lv-head">
                <span class="uk-k">目前等級（1~{{ max }}）</span>
                <span class="uk-k">{{ levelNote() }}</span>
              </span>
              <span class="lv-row">
                <button type="button" class="lv-btn" [disabled]="c().level <= 1" (click)="setLevel(c().level - 1)" aria-label="等級減 1">−</button>
                <label class="lv-num"><span>Lv</span><input type="text" inputmode="numeric" maxlength="3" [value]="c().level" (change)="levelInput($event)" aria-label="目前等級" /></label>
                <button type="button" class="lv-btn" [disabled]="c().level >= max" (click)="setLevel(c().level + 1)" aria-label="等級加 1">＋</button>
              </span>
              <div class="rt-lv-slider" [class.sliding]="slidingLv()">
                <div class="rt-lv-track">
                  <input type="range" class="rt-lv-range" min="1" [max]="max" step="1" [value]="c().level" (input)="setLevel(+$any($event.target).value)"
                    (pointerdown)="slidingLv.set(true)" (pointerup)="slidingLv.set(false)" (pointercancel)="slidingLv.set(false)" (blur)="slidingLv.set(false)" aria-label="目前等級（滑桿）" />
                  <output class="rt-lv-bubble" [style.--pct]="lvPct()">{{ c().level }}</output>
                </div>
              </div>
              <div class="rt-lv-ends"><span>1</span><span>{{ max }}</span></div>
            </div>

            <div class="lv-block">
              @if (expKnown()) {
                <span class="lv-head"><span class="uk-k">這一級的目前經驗</span><span class="uk-k">升級需要 {{ need() }}</span></span>
                <span class="lv-row">
                  <button type="button" class="lv-btn" [disabled]="c().exp <= 0" (click)="setExp(c().exp - step())" aria-label="經驗減一格">−</button>
                  <label class="lv-num wide"><input type="text" inputmode="numeric" [value]="expText()" (change)="expInput($event)" aria-label="目前經驗（精確值）" /></label>
                  <button type="button" class="lv-btn" [disabled]="c().exp >= maxExp()" (click)="setExp(c().exp + step())" aria-label="經驗加一格">＋</button>
                </span>
                <div class="rt-lv-slider" [class.sliding]="slidingExp()">
                  <div class="rt-lv-track">
                    <input type="range" class="rt-lv-range" min="0" [max]="maxExp()" [step]="step()" [value]="c().exp" (input)="setExp(+$any($event.target).value)"
                      (pointerdown)="slidingExp.set(true)" (pointerup)="slidingExp.set(false)" (pointercancel)="slidingExp.set(false)" (blur)="slidingExp.set(false)" aria-label="這一級的目前經驗（滑桿）" />
                    <output class="rt-lv-bubble" [style.--pct]="expPct()">{{ expText() }}</output>
                  </div>
                </div>
                <div class="rt-lv-ends"><span>0</span><span>{{ fmtMax() }}</span></div>
              } @else {
                <span class="uk-k">這一級的目前經驗</span>
                <small class="uk-hint">{{ c().level }} 級沒有攻略與每級經驗資料，不用填經驗；推薦路線由系統依這艘的等級與配件推算。</small>
              }
            </div>
          </div>

          <small class="uk-hint">等級與經驗按「送出更新」才會儲存；經驗滑桿每格約 1%（這一級是 {{ stepText() }}），中間的數字可直接輸入遊戲裡看到的精確值。</small>
          @if (sub().progress) {
            <button type="button" class="lv-link end" [disabled]="busy()" (click)="clearLevel()">清除這艘的等級（立即生效）</button>
          }
        </div>
      </section>
    }
  `,
})
export class BuildField {
  readonly sub = input.required<SubmarineDto>();
  /** 這一區有未送出的修改:標題旁顯示「已改」 */
  readonly dirty = input(false);

  protected readonly routeVm = inject(RouteVm);
  private readonly overview = inject(OverviewVm);
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);
  protected readonly draft = this.overview.quickProgress;
  protected readonly busy = signal(false);
  protected readonly slidingLv = signal(false);
  protected readonly slidingExp = signal(false);
  protected readonly max = MAX_RECORDED_LEVEL;

  protected readonly parts = computed(() => {
    const b = this.sub().build;
    return b ? [b.hull, b.stern, b.bow, b.bridge].map(partLabel).join(' ') : null;
  });
  protected readonly cells = computed(() => {
    const b = this.sub().build;
    return b
      ? [
          { label: '船體', value: partLabel(b.hull) },
          { label: '船尾', value: partLabel(b.stern) },
          { label: '船首', value: partLabel(b.bow) },
          { label: '艦橋', value: partLabel(b.bridge) },
        ]
      : [];
  });

  /** 目前顯示的等級 / 經驗(沒動過就是伺服器的紀錄;沒有紀錄從 1 級開始) */
  protected readonly c = computed<QuickProgressDraft>(() => this.draft() ?? defaultDraft(this.sub()));
  protected readonly levelNote = computed(() => {
    const p = this.sub().progress;
    if (!p) return '尚未記錄';
    const was = Math.min(p.effective_level, MAX_RECORDED_LEVEL);
    return this.c().level === was ? '' : `原本 Lv ${was}`;
  });
  protected readonly expKnown = computed(() => levelExp(this.c().level) !== null);
  protected readonly step = computed(() => expSliderStep(this.c().level));
  protected readonly maxExp = computed(() => Math.max(0, (levelExp(this.c().level) ?? 1) - 1));
  protected readonly need = computed(() => fmtExp(levelExp(this.c().level) ?? 0));
  protected readonly stepText = computed(() => fmtExp(this.step()));
  protected readonly expText = computed(() => fmtExp(this.c().exp));
  protected readonly fmtMax = computed(() => fmtExp(this.maxExp()));
  protected readonly lvPct = computed(() => Math.round(((this.c().level - 1) / (this.max - 1)) * 100));
  protected readonly expPct = computed(() => {
    const m = this.maxExp();
    return m > 0 ? Math.round((this.c().exp / m) * 100) : 0;
  });

  protected open(): void {
    this.routeVm.openSubBuild(this.sub().id);
  }

  protected setLevel(level: number): void {
    this.draft.set(changeLevel(this.c(), level));
  }

  protected levelInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = parseInt(el.value.replace(/\D/g, ''), 10);
    this.setLevel(Number.isFinite(n) ? n : this.c().level);
    el.value = String(this.c().level);
  }

  protected setExp(exp: number): void {
    this.draft.set(changeExp(this.c(), exp));
  }

  protected expInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const n = parseInt(el.value.replace(/\D/g, ''), 10);
    this.setExp(Number.isFinite(n) ? n : this.c().exp);
    el.value = this.expText();
  }

  /** 立即清除這艘的等級(不需按「送出更新」);草稿一併丟掉 */
  protected async clearLevel(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.store.clearProgress(this.sub().id);
      this.draft.set(null);
      this.toast.show('已清除這艘的等級');
    } catch {
      this.toast.show('清除失敗，請稍後再試', { tone: 'warn' });
    } finally {
      this.busy.set(false);
    }
  }
}
