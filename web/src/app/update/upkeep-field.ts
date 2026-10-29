import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import type { UpkeepPatch } from '@eranaut/shared';
import { Toast } from '../core/toast';
import { UPKEEP_LIMITS, upkeepOptionsFor, upkeepPartsLabel, upkeepPartsSig, type SubmarineDto, type SubmarineStatus } from '@eranaut/shared';
import { OverviewVm } from '../core/overview-vm';
import { clampLimit, upkeepItem, upkeepNote, upkeepRouteLabel, type QuickUpkeepDraft } from '../core/upkeep-vm';
import { DataStore } from '../core/data-store';
import { RouteVm } from '../route/route-vm';
import { IconComponent } from '../ui/icon';

/**
 * 快速修改裡的「配件維修提醒」一列(D-288)。關閉時只佔一行;開啟才展開路線、趟數、起算方式。
 * 需要潛艇已綁定一組配置(配件 → 清單),且資料集有那組零件在該路線的耐久資料;否則停用並說明還差什麼。
 * 填寫狀態放在 OverviewVm.quickUpkeep(換版面重建對話框時保留)。
 */
@Component({
  selector: 'app-upkeep-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routeVm.canSave) {
      @switch (mode()) {
        @case ('nobuild') {
          <button type="button" class="uk-field dim dashed" (click)="setBuild()">
            <app-icon name="wrench" [size]="20" />
            <span class="uk-main"><b>配件維修提醒</b><small>先設定這艘的配件配置</small></span>
            <app-icon name="chevronRight" [size]="14" />
          </button>
        }
        @case ('unsupported') {
          <div class="uk-field dim">
            <app-icon name="wrench" [size]="20" />
            <span class="uk-main"><b>配件維修提醒</b><small>配件「{{ configLabel() }}」還沒有耐久資料，暫不支援</small></span>
            <span class="uk-chip">即將支援</span>
          </div>
        }
        @default {
          <div class="uk-field" [class.on]="mode() !== 'off'">
            @if (mode() === 'tracked') {
              <button type="button" class="uk-ico" [class.open]="adjusting()" [attr.aria-expanded]="adjusting()" aria-label="調整維修提醒" (click)="adjusting.set(!adjusting())"><app-icon name="wrench" [size]="18" /></button>
            } @else {
              <app-icon name="wrench" [size]="20" />
            }
            <span class="uk-main">
              <b>配件維修提醒</b>
              @switch (mode()) {
                @case ('tracked') { <small>{{ tracked()!.label }}・{{ routeLabel() }}</small> }
                @case ('setup') { <small>配件「{{ configLabel() }}」・{{ routeLabel() }}</small> }
                @default { <small>配件「{{ configLabel() }}」・{{ options()[0]!.route.label }} 可追蹤</small> }
              }
            </span>
            <label class="switch">
              <input type="checkbox" [checked]="mode() !== 'off'" (change)="toggle($any($event.target).checked)" aria-label="配件維修提醒" />
              <span class="slider"></span>
            </label>
          </div>
          @if (mode() === 'tracked' && tracked()!.configChanged) {
            <div class="uk-warn" role="status">這艘的配件和開啟提醒時不同。若已換新零件，請到「總覽」的維修面板標示已維修，或在配件配置裡勾選「同時標示已維修」。</div>
          }
          @if (mode() === 'tracked' && adjusting() && tracked(); as t) {
            <div class="uk-setup">
              <div class="uk-line">
                <span class="uk-k">路線</span>
                <span class="uk-v">{{ upkeepRouteLabel(t.upkeep.route_key) }}</span>
              </div>
              <div class="uk-line">
                <span class="uk-k">已跑趟數</span>
                <span class="uk-step">
                  <button type="button" [disabled]="busy() || t.upkeep.voyages_done <= 0" (click)="adjust({ voyages_done: t.upkeep.voyages_done - 1 })" aria-label="少算一趟">−</button>
                  <b class="mono">{{ t.upkeep.voyages_done }}</b>
                  <button type="button" [disabled]="busy() || t.upkeep.voyages_done >= t.upkeep.limit_voyages" (click)="adjust({ voyages_done: t.upkeep.voyages_done + 1 })" aria-label="多算一趟">＋</button>
                </span>
              </div>
              <div class="uk-line">
                <span class="uk-k">可跑趟數</span>
                <span class="uk-step">
                  <button type="button" [disabled]="busy() || t.upkeep.limit_voyages <= minV" (click)="adjust({ limit_voyages: t.upkeep.limit_voyages - 1 })" aria-label="減少可跑趟數">−</button>
                  <b class="mono">{{ t.upkeep.limit_voyages }}</b>
                  <button type="button" [disabled]="busy() || t.upkeep.limit_voyages >= maxV" (click)="adjust({ limit_voyages: t.upkeep.limit_voyages + 1 })" aria-label="增加可跑趟數">＋</button>
                </span>
              </div>
              <small class="uk-note">調整會立即儲存，不需按「送出更新」。已跑趟數用來修正漏更新或剛維修完的情況。</small>
            </div>
          }
          @if (mode() === 'setup' && draft(); as d) {
            <div class="uk-setup">
              <div class="uk-line">
                <span class="uk-k">路線</span>
                @if (options().length > 1) {
                  <select class="field-select" [value]="d.routeKey" (change)="setRoute($any($event.target).value)" aria-label="路線">
                    @for (o of options(); track o.route.key) { <option [value]="o.route.key">{{ o.route.label }}</option> }
                  </select>
                } @else {
                  <span class="uk-v">{{ upkeepRouteLabel(d.routeKey) }}</span>
                }
              </div>
              <div class="uk-line">
                <span class="uk-k">可跑趟數</span>
                <span class="uk-step">
                  <button type="button" (click)="step('limit', -1)" [disabled]="d.limit <= minV" aria-label="減少可跑趟數">−</button>
                  <b class="mono">{{ d.limit }}</b>
                  <button type="button" (click)="step('limit', 1)" [disabled]="d.limit >= maxV" aria-label="增加可跑趟數">＋</button>
                </span>
              </div>
              <small class="uk-hint">依配置：取四個配件中最先壞的，預設 {{ defaultLimit() }} 趟（玩家實測值）。可手動修改。</small>
              <div class="uk-seg" role="group" aria-label="起算方式">
                <button type="button" [class.on]="d.mode === 'fresh'" [attr.aria-pressed]="d.mode === 'fresh'" (click)="setMode('fresh')">剛維修完（滿耐久）</button>
                <button type="button" [class.on]="d.mode === 'ran'" [attr.aria-pressed]="d.mode === 'ran'" (click)="setMode('ran')">已跑過幾趟…</button>
              </div>
              @if (d.mode === 'ran') {
                <div class="uk-line">
                  <span class="uk-k">已跑過</span>
                  <span class="uk-step">
                    <button type="button" (click)="step('ran', -1)" [disabled]="d.ran <= 1" aria-label="減少已跑趟數">−</button>
                    <b class="mono">{{ d.ran }}</b>
                    <button type="button" (click)="step('ran', 1)" [disabled]="d.ran >= d.limit - 1" aria-label="增加已跑趟數">＋</button>
                  </span>
                </div>
              }
              <small class="uk-note">{{ note() }}</small>
            </div>
          }
        }
      }
    }
  `,
})
export class UpkeepField {
  readonly sub = input.required<SubmarineDto>();
  readonly status = input.required<SubmarineStatus>();

  protected readonly routeVm = inject(RouteVm);
  private readonly overview = inject(OverviewVm);
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);
  /** 已開啟的艇:展開調整區(點左邊的扳手) */
  protected readonly adjusting = signal(false);
  protected readonly busy = signal(false);
  protected readonly draft = this.overview.quickUpkeep;
  protected readonly minV = UPKEEP_LIMITS.minVoyages;
  protected readonly maxV = UPKEEP_LIMITS.maxVoyages;
  protected readonly upkeepRouteLabel = upkeepRouteLabel;

  /** 這艘自己的配件(D-296);還沒設定回 undefined */
  private readonly build = computed(() => this.sub().build);
  protected readonly options = computed(() => {
    const b = this.build();
    return b ? upkeepOptionsFor({ hull: b.hull, stern: b.stern, bow: b.bow, bridge: b.bridge }) : [];
  });
  protected readonly configLabel = computed(() => {
    const b = this.build();
    return b ? upkeepPartsLabel(upkeepPartsSig({ hull: b.hull, stern: b.stern, bow: b.bow, bridge: b.bridge })) : '';
  });
  protected readonly tracked = computed(() => upkeepItem(this.sub(), this.store.now()));
  protected readonly defaultLimit = computed(() => this.options().find((o) => o.route.key === this.draft()?.routeKey)?.limit ?? 0);
  protected readonly routeLabel = computed(() => {
    const d = this.draft();
    const key = d?.enabled ? d.routeKey : this.sub().upkeep?.route_key;
    return key ? upkeepRouteLabel(key) : '';
  });
  protected readonly note = computed(() => {
    const d = this.draft();
    return d?.enabled ? upkeepNote(d, this.status() === 'exploring') : '';
  });

  /** nobuild(還沒設定配件)/ unsupported / tracked(已開啟,沒動過)/ setup(正在設定)/ off(可開啟) */
  protected readonly mode = computed(() => {
    const d = this.draft();
    if (d?.enabled) return 'setup';
    if (d === null && this.sub().upkeep) return 'tracked';
    if (!this.build()) return 'nobuild';
    if (this.options().length === 0) return 'unsupported';
    return 'off';
  });

  /** 立即儲存已跑 / 可跑趟數(和總覽維修面板的「調整」相同的端點) */
  protected async adjust(patch: UpkeepPatch): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.store.adjustUpkeep(this.sub().id, patch);
    } catch {
      this.toast.show('調整失敗，請稍後再試', { tone: 'warn' });
    } finally {
      this.busy.set(false);
    }
  }

  protected toggle(on: boolean): void {
    if (!on) {
      // 已開啟的要送「關閉」;原本沒開的回到沒碰過的狀態
      this.draft.set(this.sub().upkeep ? { enabled: false, routeKey: '', limit: 0, mode: 'fresh', ran: 0 } : null);
      return;
    }
    const first = this.options()[0];
    if (!first) return;
    this.draft.set({ enabled: true, routeKey: first.route.key, limit: first.limit, mode: 'fresh', ran: 1 });
  }

  protected setRoute(key: string): void {
    const o = this.options().find((x) => x.route.key === key);
    if (o) this.patch({ routeKey: o.route.key, limit: o.limit });
  }

  protected setMode(mode: QuickUpkeepDraft['mode']): void {
    this.patch({ mode });
  }

  protected step(field: 'limit' | 'ran', delta: number): void {
    const d = this.draft();
    if (!d) return;
    const limit = field === 'limit' ? clampLimit(d.limit + delta) : d.limit;
    // 已跑趟數必須小於可跑趟數(否則這艘早該維修了)
    const ran = field === 'ran' ? d.ran + delta : d.ran;
    this.patch({ limit, ran: Math.max(1, Math.min(ran, limit - 1)) });
  }

  private patch(change: Partial<QuickUpkeepDraft>): void {
    this.draft.update((d) => (d ? { ...d, ...change } : d));
  }

  /** 打開這艘的配件配置對話框(蓋在快速修改上面;存好後回到這裡) */
  protected setBuild(): void {
    this.routeVm.openSubBuild(this.sub().id);
  }
}
