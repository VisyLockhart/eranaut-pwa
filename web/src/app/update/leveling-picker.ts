import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { applyExp, LEVELING_POINTS, levelingPoints, type ProgressRoute } from '@eranaut/shared';
import { fmtExp, lvUp, minutesText, planRoute, statsFor, type RoutePlan } from '../core/leveling-vm';
import { MAX_STOPS, selectability, type Selectability } from '../route/core/route';
import { seaIndex } from '../route/core/data';

/** 全部有點位資料的海域(D-304:取消 85 級上限後不再只列溺沒海與灰海) */
const SEAS = LEVELING_POINTS.map((s) => ({ sea: s.sea, label: seaIndex(s.sea).sea.name, minRank: Math.min(...s.points.map((p) => p.rank)) }));

/**
 * 航線輔助的簡化選點器(D-289、D-304):只留點位按鈕(代碼 + 需要的等級 + 解鎖標示),沒有地圖和連結。
 * 計算沿用航線模擬器的核心函式:一次最多 5 點、距離(耗用)不能超過配置的上限、等級不夠的點不能選;
 * 選取的順序就是航行順序。沒有綁定配置時沒有距離上限可比,只算經驗。
 */
@Component({
  selector: 'app-leveling-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lv-picker">
      <div class="uk-seg" role="tablist" aria-label="海域">
        @for (s of seas; track s.sea) {
          <button type="button" role="tab" [class.on]="sea() === s.sea" [attr.aria-selected]="sea() === s.sea" (click)="setSea(s.sea)">{{ s.label }}</button>
        }
      </div>
      <div class="lv-grid" role="group" aria-label="航點">
        @for (p of points(); track p.code) {
          <button
            type="button"
            class="lv-pt"
            [class.sel]="state(p.code) === 'selected'"
            [disabled]="state(p.code) !== 'ok' && state(p.code) !== 'selected'"
            [attr.aria-pressed]="state(p.code) === 'selected'"
            [attr.aria-label]="'航點 ' + p.code + '，需要 ' + p.rank + ' 級' + (p.mark ? '，解鎖' + p.mark : '')"
            [attr.data-why]="state(p.code)"
            (click)="toggle(p.code)"
          >
            <b>{{ p.code }}</b>
            <small>{{ p.rank }}</small>
            @if (p.mark) { <i class="lv-mark">{{ p.mark }}</i> }
            @if (order(p.code); as n) { <i class="lv-ord">{{ n }}</i> }
          </button>
        }
      </div>
      <div class="lv-sum" role="status">
        @if (plan(); as pl) {
          <span class="lv-route mono">{{ seq().join(' → ') }}</span>
          <span class="lv-meta">
            @if (pl.range !== null && pl.rangeCap !== null) { <span>距離 {{ pl.range }} / {{ pl.rangeCap }}</span> }
            @if (pl.minutes !== null) { <span>返航 {{ time(pl.minutes) }}</span> }
            <span>經驗 +{{ fmt(pl.exp) }} {{ up(level(), after()) }}</span>
          </span>
        } @else {
          <span class="lv-meta">依序點選航點（最多 {{ maxStops }} 個），順序就是航行順序。</span>
        }
        @if (parts() === null) { <small class="uk-hint">這艘還沒綁定配置，沒有距離上限可比，只算經驗。</small> }
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" (click)="back.emit()">返回</button>
        <button type="button" class="btn-secondary" [disabled]="seq().length === 0" (click)="seq.set([])">清除</button>
        <button type="button" class="btn-primary-modal" [disabled]="plan() === null || busy()" (click)="confirm()">就是這條</button>
      </div>
    </div>
  `,
})
export class LevelingPicker {
  /** 艇目前的等級與這一級的經驗(派出前) */
  readonly level = input.required<number>();
  readonly exp = input(0);
  /** 艇綁定的配置(船體、船尾、船首、艦橋);沒有為 null */
  readonly parts = input<readonly [number, number, number, number] | null>(null);
  readonly busy = input(false);
  readonly picked = output<ProgressRoute>();
  readonly back = output<void>();

  protected readonly seas = SEAS;
  protected readonly maxStops = MAX_STOPS;
  private readonly seaPick = signal<number | null>(null);
  /** 預設:等級已達標的最後一個海域(例:50 級以上看灰海、70 級以上看翠浪海) */
  protected readonly sea = computed(() => this.seaPick() ?? SEAS.filter((s) => s.minRank <= this.level()).at(-1)?.sea ?? SEAS[0]!.sea);
  protected readonly seq = signal<string[]>([]);
  protected readonly fmt = fmtExp;
  protected readonly up = lvUp;
  protected readonly time = minutesText;

  protected readonly points = computed(() => levelingPoints(this.sea()));
  private readonly si = computed(() => seaIndex(this.sea()));
  private readonly cap = computed(() => {
    const p = this.parts();
    return p === null ? Number.POSITIVE_INFINITY : statsFor(p, this.level()).range;
  });
  private readonly states = computed(() => {
    const si = this.si();
    const idOf = new Map(si.sea.points.map((p) => [p.code, p.id]));
    const codeOf = new Map(si.sea.points.map((p) => [p.id, p.code]));
    const seqIds = this.seq().map((c) => idOf.get(c)!).filter((x) => x !== undefined);
    const raw = selectability(si, seqIds, this.level(), this.cap());
    const out = new Map<string, Selectability>();
    for (const [id, st] of raw) out.set(codeOf.get(id) ?? '', st);
    return out;
  });

  protected state(code: string): Selectability {
    return this.states().get(code) ?? 'rank';
  }

  protected order(code: string): number {
    return this.seq().indexOf(code) + 1;
  }

  protected readonly plan = computed<RoutePlan | null>(() => {
    const seq = this.seq();
    if (seq.length === 0) return null;
    return planRoute(this.sea(), seq, this.parts(), this.level());
  });
  protected readonly after = computed(() => {
    const pl = this.plan();
    return pl === null ? this.level() : applyExp({ level: this.level(), exp_in_level: this.exp() }, pl.exp).level;
  });

  protected setSea(sea: number): void {
    if (sea === this.sea()) return;
    this.seaPick.set(sea);
    this.seq.set([]);
  }

  /** 點已選的:移除它和排在它後面的(順序就是航行順序);點未選的:接在最後 */
  protected toggle(code: string): void {
    const seq = this.seq();
    const at = seq.indexOf(code);
    if (at >= 0) this.seq.set(seq.slice(0, at));
    else if (this.state(code) === 'ok') this.seq.set([...seq, code]);
  }

  protected confirm(): void {
    if (this.plan() === null) return;
    this.picked.emit({ sea: this.sea(), points: [...this.seq()] });
  }
}
