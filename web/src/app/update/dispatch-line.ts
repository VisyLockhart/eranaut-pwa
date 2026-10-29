import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import type { SubmarineDto } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { matchByTime, unlockText } from '../core/dispatch';
import { DispatchVm, isDispatch, resolveRoute, selKey, type RouteSel } from '../core/dispatch-vm';
import { fmtExp, lvUp, minutesText, routeText } from '../core/leveling-vm';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { DispatchSheet } from './dispatch-sheet';

/**
 * 更新列上的「這次派出」(D-291):截圖辨識、手動輸入、快速修改共用。
 * 上一趟已返航、這次填探索中 → 預設帶入出發前看到的建議,可改選(桌機下拉、手機底部面板);
 * 其他情況只顯示一行說明(沒派出 / 還在航行 / 還沒填時間時的下一趟建議)。練級輔助沒開的艇什麼都不畫。
 */
@Component({
  selector: 'app-dispatch-line',
  imports: [IconComponent, SelectField, DispatchSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (info(); as i) {
      @if (i.lock === 'build') {
        <small class="dp-note warn" role="status">這艘還沒設定配件，航線輔助無法推薦路線；到快速修改的「配件配置」設定後就能用。</small>
      } @else {
        @if (active()) {
          <div class="dp-line" [class.flagged]="mismatch() !== null">
            <span class="dp-k">這次派出</span>
            @if (desktop()) {
              <!-- 選「自己選點…」會開面板;以 nonce 重建下拉,讓按鈕回到目前的選擇 -->
              @for (n of [nonce()]; track n) {
                <app-select class="dp-select" [options]="options()" [value]="key()" [listMax]="420" ariaLabel="這次派出的路線" (valueChange)="onSelect($event)" />
              }
            } @else {
              <button type="button" class="dp-chip" (click)="openSheet(false)" aria-haspopup="dialog">
                @if (chosen(); as c) {
                  <span class="dp-tag">{{ c.label }}</span>
                  @if (chosenUnlock(); as u) { <span class="dp-tag unlock">{{ unlockText(u) }}</span> }
                  <b class="mono">{{ routeText(c.route.points) }}</b>
                  @if (c.after > i.start.level) { <small>→ Lv {{ c.after }}</small> }
                } @else {
                  <span class="dp-dim">這趟不記經驗</span>
                }
                <app-icon name="chevronRight" [size]="14" />
              </button>
            }
            @if (matched() !== null && matched() === key()) { <span class="dp-pill ok">剩餘時間與這條吻合</span> }
          </div>
          @if (mismatch(); as m) {
            <small class="dp-note warn" role="status">截圖是 Lv {{ m.ocr }}，送出前推算是 Lv {{ m.expected }}。等級以截圖為準，請確認實際派的是哪條。</small>
          } @else if (matchedLabel(); as l) {
            <small class="dp-note">剩餘時間與「{{ l }}」吻合，派的是那條的話請改選。</small>
          }
          @if (chosen()?.plan?.problem === 'range') { <small class="dp-note warn">以這艘的配置，距離不夠（{{ chosen()!.plan.range }} / {{ chosen()!.plan.rangeCap }}）</small> }
          @if (i.current?.fallback; as f) { <small class="dp-note warn">條件組合：{{ f }}，這次改用練級推薦。</small> }
          @else if (i.current?.relaxedTo; as h) { <small class="dp-note">最長 {{ i.maxHours }} 小時內沒有路線，放寬到 {{ h }} 小時。</small> }
        } @else if (status() === 'complete') {
          <small class="dp-note">沒有派出，不記路線。@if (i.current; as c) {下一趟建議 <b class="mono">{{ routeText(c.plan.points) }}</b>（{{ c.label }}）}</small>
        } @else if (stillOut()) {
          <small class="dp-note">還在航行中，這次不記新的路線。返航後 Lv {{ i.start.level }}。</small>
        } @else if (i.current; as c) {
          <small class="dp-note">下一趟建議 <b class="mono">{{ routeText(c.plan.points) }}</b>（{{ c.label }}，+{{ fmt(c.plan.exp) }}{{ c.after > i.start.level ? ' → Lv ' + c.after : '' }}）；填好剩餘時間後可改選。</small>
        }
      }
      <!-- 選擇面板與選點器只在打開時才載入(@defer 分出 lazy chunk),不增加首頁 bundle -->
      @if (sheet(); as mode) {
        @defer (on immediate) {
          <app-dispatch-sheet [info]="i" [wsName]="wsName()" [selected]="key()" [matched]="matched()" [startPicking]="mode === 'pick'" (chosen)="choose($event)" (closed)="sheet.set(null)" />
        }
      }
    }
  `,
})
export class DispatchLine {
  /** 這個位置目前記錄的潛艇;新加入的位置為 undefined */
  readonly sub = input<SubmarineDto | undefined>(undefined);
  readonly status = input.required<SubmarineDto['status']>();
  readonly sel = input<RouteSel | undefined>(undefined);
  /** 剩餘時間已填(手動輸入時,填了才出現「這次派出」) */
  readonly filled = input(true);
  /** 截圖辨識到的等級(與推算不同時提醒) */
  readonly ocrLevel = input<number | null | undefined>(undefined);
  /** 截圖辨識的剩餘時間(分鐘),用來比對路線;手動輸入給 null */
  readonly remaining = input<number | null>(null);
  readonly wsName = input('');
  readonly desktop = input(false);
  readonly routeChange = output<RouteSel>();

  private readonly dispatch = inject(DispatchVm);
  private readonly store = inject(DataStore);
  protected readonly routeText = routeText;
  protected readonly fmt = fmtExp;
  /** null = 關閉;choose = 選項;pick = 直接進自己選點 */
  protected readonly sheet = signal<'choose' | 'pick' | null>(null);
  protected readonly nonce = signal(0);

  constructor() {
    // 條件組合要用已儲存的條件清單:載入(已載入則不重複)
    effect(() => {
      if (this.sub()?.progress?.assist_on) untracked(() => this.dispatch.start());
    });
  }

  protected readonly info = computed(() => {
    const s = this.sub();
    return s ? this.dispatch.info(s, this.store.now()) : null;
  });
  protected readonly active = computed(() => this.filled() && isDispatch(this.status(), this.sub(), this.info(), this.store.now()));
  protected readonly stillOut = computed(() => {
    const s = this.sub();
    return !!s && !this.info()?.start.returned;
  });
  protected readonly key = computed(() => {
    const i = this.info();
    return i ? selKey(this.sel(), i) : 'none';
  });
  protected readonly unlockText = unlockText;
  protected readonly chosenUnlock = computed(() => this.info()?.options.find((o) => o.key === this.key())?.unlock ?? null);
  protected readonly chosen = computed(() => {
    const i = this.info();
    return i ? resolveRoute(i, this.sel()) : null;
  });
  /** 與剩餘時間吻合的選項 */
  protected readonly matched = computed(() => {
    const i = this.info();
    if (!i || i.parts === null || this.remaining() === null) return null;
    const idx = matchByTime(i.options.map((o) => o.plan), this.remaining());
    return idx < 0 ? null : i.options[idx]!.key;
  });
  protected readonly matchedLabel = computed(() => {
    const m = this.matched();
    if (m === null || m === this.key()) return null;
    const o = this.info()?.options.find((x) => x.key === m);
    // 「跟上一趟一樣」與某個流派同一條時,不必再提示
    return o && !(o.sameAs && this.info()?.options.find((x) => x.label === o.sameAs)?.key === this.key()) ? o.label : null;
  });
  protected readonly mismatch = computed(() => {
    const lv = this.ocrLevel();
    const i = this.info();
    return typeof lv === 'number' && i && lv !== i.start.level ? { ocr: lv, expected: i.start.level } : null;
  });

  protected readonly options = computed<SelectOption[]>(() => {
    const i = this.info();
    if (!i) return [];
    const up = (to: number): string => lvUp(i.start.level, to);
    const out: SelectOption[] = i.options.map((o) => ({
      value: o.key,
      label: o.label,
      display: [o.label, routeText(o.plan.points), up(o.after)].filter(Boolean).join('・'),
      hint: routeText(o.plan.points) + (o.unlock ? `（${unlockText(o.unlock)}）` : '') + (o.sameAs ? `（與${o.sameAs}相同）` : '') + (o.fallback ? `（${o.fallback},改用練級推薦）` : o.relaxedTo ? `（上限內沒有路線,放寬到 ${o.relaxedTo} 小時）` : o.avoided?.length && o.calc ? '（已避開未發現的點）' : o.calc ? '（依配置推算）' : ''),
      meta: [{ text: `${o.plan.minutes !== null ? minutesText(o.plan.minutes) + '・' : ''}+${fmtExp(o.plan.exp)} ${up(o.after)}`.trim() }],
    }));
    const own = this.sel();
    if (own?.kind === 'own') {
      const c = this.chosen();
      out.push({ value: 'own', label: '自己選點', display: c ? ['自己選點', routeText(c.route.points), up(c.after)].filter(Boolean).join('・') : '自己選點', hint: c ? routeText(c.route.points) : undefined });
      out.push({ value: 'pick', label: '重新選點…', hint: '溺沒海／灰海點位' });
    } else {
      out.push({ value: 'pick', label: '自己選點…', hint: '溺沒海／灰海點位' });
    }
    out.push({ value: 'none', label: '這趟不記經驗', hint: '返航後等級不會變' });
    return out;
  });

  protected onSelect(value: SelectValue): void {
    const v = String(value);
    if (v === 'pick' || v === 'own') {
      this.nonce.update((n) => n + 1);
      if (v === 'pick') this.openSheet(true);
      return;
    }
    this.routeChange.emit(v === 'none' ? { kind: 'none' } : v === 'last' ? { kind: 'last' } : { kind: 'assist' });
  }

  protected openSheet(pick: boolean): void {
    this.sheet.set(pick ? 'pick' : 'choose');
  }

  protected choose(sel: RouteSel): void {
    this.sheet.set(null);
    this.routeChange.emit(sel);
  }
}
