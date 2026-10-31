import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { applyExp, LEVELING_POINTS, levelingPoints, type ProgressRoute } from '@eranaut/shared';
import { fmtExp, lvUp, minutesText, planRoute, statsFor, type RoutePlan } from '../core/leveling-vm';
import { MAX_STOPS, selectability, type Selectability } from '../route/core/route';
import { SEAS as ALL_SEAS, seaIndex } from '../route/core/data';
import { pointCode, seaName } from '../core/charts';
import { addPending, removePending } from '../core/pending-unlock';
import { IconComponent } from '../ui/icon';

/** 全部有點位資料的海域(D-304:取消 85 級上限後不再只列溺沒海與灰海) */
const SEAS = LEVELING_POINTS.map((s) => ({
  sea: s.sea,
  label: seaIndex(s.sea).sea.name,
  minRank: Math.min(...s.points.map((p) => p.rank)),
  ids: new Set(seaIndex(s.sea).sea.points.map((p) => p.id)),
}));

/** 確認時交給外面的內容:路線(沒排就是 null,只解鎖)與要解鎖的航點 id(依解鎖順序) */
export interface PickerResult {
  route: ProgressRoute | null;
  unlock: number[];
}

/**
 * 航線輔助的簡化選點器(D-289、D-304、D-311):只留點位按鈕(代碼 + 需要的等級 + 解鎖標示),沒有地圖和連結。
 * 計算沿用航線模擬器的核心函式:一次最多 5 點、距離(耗用)不能超過配置的上限、等級不夠的點不能選;
 * 選取的順序就是航行順序。沒有綁定配置時沒有距離上限可比,只算經驗。
 * 快速解鎖(D-311):工坊有海圖紀錄時,還沒發現的點虛線加鎖頭、可以點,點了變「待解鎖」(開鎖頭、可排進路線);
 * 按下確認才由外面存到工坊(`confirmed`),這裡只管畫面。沒有海圖紀錄(`found` 為 null)時不上鎖,維持原本行為。
 */
@Component({
  selector: 'app-leveling-picker',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lv-picker">
      <div class="uk-seg" role="tablist" aria-label="海域">
        @for (s of seas; track s.sea) {
          <button type="button" role="tab" [class.on]="sea() === s.sea" [class.lv-tab-lock]="seaMark(s.sea) !== ''" [attr.aria-selected]="sea() === s.sea" (click)="setSea(s.sea)">
            {{ s.label }}
            @if (seaMark(s.sea); as m) { <app-icon class="lv-tab-ic" [name]="m === 'pending' ? 'unlock' : 'lock'" [size]="12" /> }
          </button>
        }
      </div>
      <div class="lv-grid" role="group" aria-label="航點">
        @for (p of points(); track p.code) {
          <button
            type="button"
            class="lv-pt"
            [class.sel]="state(p.code) === 'selected'"
            [class.locked]="locked(p.code)"
            [class.pending]="isPending(p.code)"
            [disabled]="!locked(p.code) && state(p.code) !== 'ok' && state(p.code) !== 'selected'"
            [attr.aria-pressed]="locked(p.code) ? null : state(p.code) === 'selected'"
            [attr.aria-label]="label(p)"
            [attr.data-why]="locked(p.code) ? 'locked' : state(p.code)"
            (click)="toggle(p.code)"
          >
            <b>{{ p.code }}</b>
            <small>{{ p.rank }}</small>
            @if (p.mark) { <i class="lv-mark">{{ p.mark }}</i> }
            @if (order(p.code); as n) { <i class="lv-ord">{{ n }}</i> }
            @if (locked(p.code)) { <app-icon class="lv-lock" name="lock" [size]="13" /> }
            @else if (isPending(p.code)) { <app-icon class="lv-lock" name="unlock" [size]="13" /> }
          </button>
        }
      </div>
      @if (found() === null) {
        <small class="uk-hint">這間工坊還沒有海圖紀錄；到「更新海圖」建立紀錄後，才能在這裡解鎖航點。</small>
      }
      @if (pending().length > 0) {
        <div class="lv-pend" role="group" aria-label="待解鎖的航點">
          <div class="lv-pend-head">
            <b><app-icon name="unlock" [size]="14" /> 待解鎖 {{ pending().length }} 點</b>
            <button type="button" class="lv-link" (click)="restoreAll()">全部還原</button>
          </div>
          <div class="lv-chips">
            @for (c of chips(); track c.id) {
              <button type="button" class="lv-chip" [attr.aria-label]="'取消解鎖 ' + c.full" (click)="unpend(c.id)">
                <span>{{ c.text }}</span><app-icon name="close" [size]="10" />
              </button>
            }
          </div>
          <small class="uk-hint">按下確認後才會存到工坊；其他艇的建議路線會立即更新。</small>
        </div>
      }
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
      @if (error(); as e) { <small class="uk-hint lv-err" role="alert">{{ e }}</small> }
      @if (discarding()) {
        <div class="lv-discard" role="alertdialog" aria-label="放棄解鎖">
          <span>放棄 {{ pending().length }} 個尚未確認的解鎖？</span>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="discarding.set(false)">繼續編輯</button>
            <button type="button" class="btn-secondary" (click)="back.emit()">放棄並返回</button>
          </div>
        </div>
      } @else {
        <div class="modal-actions">
          <button type="button" class="btn-secondary" (click)="goBack()">返回</button>
          <button type="button" class="btn-secondary" [disabled]="seq().length === 0" (click)="seq.set([])">清除</button>
          <button type="button" class="btn-primary-modal" [disabled]="!canConfirm() || busy()" (click)="confirm()">{{ primary() }}</button>
        </div>
      }
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
  /** 工坊已發現的航點;null = 這間工坊還沒有海圖紀錄(不知道,不上鎖) */
  readonly found = input<ReadonlySet<number> | null>(null);
  /** 存解鎖失敗等訊息 */
  readonly error = input<string | null>(null);
  readonly confirmed = output<PickerResult>();
  readonly back = output<void>();

  protected readonly seas = SEAS;
  protected readonly maxStops = MAX_STOPS;
  private readonly seaPick = signal<number | null>(null);
  /** 預設:等級已達標的最後一個海域(例:50 級以上看灰海、70 級以上看翠浪海) */
  protected readonly sea = computed(() => this.seaPick() ?? SEAS.filter((s) => s.minRank <= this.level()).at(-1)?.sea ?? SEAS[0]!.sea);
  protected readonly seq = signal<string[]>([]);
  /** 還沒確認的待解鎖航點 id(依解鎖順序,前面必經的點在前) */
  protected readonly pending = signal<number[]>([]);
  protected readonly discarding = signal(false);
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

  private readonly idOf = computed(() => new Map(this.si().sea.points.map((p) => [p.code, p.id])));
  private readonly pendingSet = computed(() => new Set(this.pending()));

  /** 未發現(工坊有海圖紀錄、也還沒待解鎖) */
  protected locked(code: string): boolean {
    const f = this.found();
    const id = this.idOf().get(code);
    return f !== null && id !== undefined && !f.has(id) && !this.pendingSet().has(id);
  }

  protected isPending(code: string): boolean {
    const id = this.idOf().get(code);
    return id !== undefined && this.pendingSet().has(id);
  }

  protected label(p: { code: string; rank: number; mark?: string }): string {
    const base = `航點 ${p.code}，需要 ${p.rank} 級${p.mark ? '，解鎖' + p.mark : ''}`;
    return this.locked(p.code) ? `${base}，未發現，點一下標為待解鎖` : this.isPending(p.code) ? `${base}，待解鎖` : base;
  }

  /** 海域分頁上的小鎖:'locked' = 整個海域都還沒發現;'pending' = 有待解鎖的點 */
  protected seaMark(sea: number): '' | 'locked' | 'pending' {
    const ids = SEAS.find((s) => s.sea === sea)?.ids;
    const f = this.found();
    if (!ids || f === null) return '';
    if (this.pending().some((id) => ids.has(id))) return 'pending';
    return [...ids].some((id) => f.has(id)) ? '' : 'locked';
  }

  protected readonly chips = computed(() =>
    this.pending().map((id) => {
      const sea = ALL_SEAS.find((s) => s.points.some((p) => p.id === id))?.sea;
      const code = pointCode(id);
      const other = sea !== undefined && sea !== this.sea();
      return { id, text: other ? `${seaName(sea)}・${code}` : code, full: `${sea !== undefined ? seaName(sea) : ''} ${code}`.trim() };
    }),
  );

  protected readonly canConfirm = computed(() => this.plan() !== null || this.pending().length > 0);
  protected readonly primary = computed(() => (this.plan() === null && this.pending().length > 0 ? `確認解鎖 ${this.pending().length} 點` : '就是這條'));

  protected unpend(id: number): void {
    const { next, removed } = removePending(this.pending(), id);
    this.pending.set(next);
    this.trimSeq(new Set(removed));
  }

  protected restoreAll(): void {
    this.trimSeq(new Set(this.pending()));
    this.pending.set([]);
  }

  /** 路線裡若有被還原的點,從第一個被還原的點起截掉(順序就是航行順序) */
  private trimSeq(gone: ReadonlySet<number>): void {
    const idOf = this.idOf();
    const at = this.seq().findIndex((c) => gone.has(idOf.get(c)!));
    if (at >= 0) this.seq.set(this.seq().slice(0, at));
  }

  protected goBack(): void {
    if (this.pending().length > 0) this.discarding.set(true);
    else this.back.emit();
  }

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
    if (this.locked(code)) {
      const f = this.found();
      const id = this.idOf().get(code);
      if (f !== null && id !== undefined) this.pending.set(addPending(f, this.pending(), id));
      return;
    }
    const seq = this.seq();
    const at = seq.indexOf(code);
    if (at >= 0) this.seq.set(seq.slice(0, at));
    else if (this.state(code) === 'ok') this.seq.set([...seq, code]);
  }

  protected confirm(): void {
    const route = this.plan() === null ? null : { sea: this.sea(), points: [...this.seq()] };
    if (route === null && this.pending().length === 0) return;
    this.confirmed.emit({ route, unlock: [...this.pending()] });
  }
}
