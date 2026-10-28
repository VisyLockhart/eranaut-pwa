import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { LEVELING_SCHOOLS, LEVELING_SCHOOL_LABEL, type WorkshopWithSubmarines } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { unlockText, type ViewSchool } from '../core/dispatch';
import { DispatchVm, type DispatchInfo, type DispatchOption } from '../core/dispatch-vm';
import { circled, displayFor } from '../core/format';
import { fmtExp, lvUp, minutesText, routeText } from '../core/leveling-vm';
import { IconComponent } from '../ui/icon';

const SHORT: Record<ViewSchool, string> = { pref: '偏好', snap: '掐點', half: '半日', day: '整日' };

/**
 * 更新頁的「下一趟派出建議」(D-291):上傳截圖 / 手動輸入之前就看得到每艘下一趟該派哪條。
 * 目前等級 + 上一趟待結算的經驗 → 返航後(出發時)的等級 → 該流派的推薦路線。
 * 上方可暫時切換流派檢視(不改各艇的偏好);點一艘展開三個流派的比較。只列練級輔助開著的艇。
 */
@Component({
  selector: 'app-dispatch-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cards().length > 0) {
      <section class="dp-panel" [class.m]="!desktop()" aria-labelledby="dp-title">
        <div class="dp-head">
          <div class="dp-title-wrap">
            <h2 class="dp-title" id="dp-title"><app-icon name="levelUp" [size]="18" />下一趟派出建議</h2>
            @if (desktop()) { <small class="dp-sub">目前等級＋上一趟路線的經驗 → 返航後等級 → 該等級的推薦路線</small> }
            @else { <small class="dp-sub">依返航後等級推算</small> }
          </div>
          <div class="ct-seg dp-seg" role="group" aria-label="流派檢視">
            @for (v of views; track v) {
              <button type="button" [class.on]="vm.view() === v" [attr.aria-pressed]="vm.view() === v" (click)="vm.view.set(v)">{{ desktop() ? label(v) : short[v] }}</button>
            }
          </div>
        </div>
        <ul class="dp-list">
          @for (c of cards(); track c.i.sub.id) {
            <li class="dp-card" [class.ready]="c.i.start.returned" [class.open]="openId() === c.i.sub.id">
              <button type="button" class="dp-card-btn" [attr.aria-expanded]="openId() === c.i.sub.id" (click)="toggle(c.i.sub.id)">
                <span class="dp-who">
                  <span class="sub-no">{{ circled(c.i.sub.position) }}</span>
                  <b class="dp-name">{{ c.i.sub.name || '潛水艇 ' + c.i.sub.position }}</b>
                  <span class="dp-lv">
                    @if (c.i.start.fromLevel !== c.i.start.level) { Lv {{ c.i.start.fromLevel }} → <b>{{ c.i.start.level }}</b> <i class="dp-up">▲{{ c.i.start.level - c.i.start.fromLevel }}</i> }
                    @else { Lv <b>{{ c.i.start.level }}</b> }
                  </span>
                  <span class="dp-when" [class.ok]="c.i.start.returned">{{ c.when }}</span>
                </span>
                @if (c.o; as o) {
                  <span class="dp-route">
                    <span class="dp-tag">{{ desktop() ? o.label : shortOf(o) }}@if (o.pref && desktop()) {・偏好}</span>
                    @if (o.unlock) { <span class="dp-tag unlock">{{ unlockText(o.unlock) }}</span> }
                    @if (o.plan.sea === 2) { <span class="dp-tag sea">灰海</span> }
                    @if (o.avoided?.length && o.calc) { <span class="dp-tag chart">已避開未發現的點</span> }
                    <b class="dp-pts mono">{{ routeText(o.plan.points) }}</b>
                    <span class="dp-meta">
                      @if (desktop()) { <span><b>+{{ fmt(o.plan.exp) }}</b> {{ up(c.i.start.level, o.after) }}</span> } @else if (o.after > c.i.start.level) { <span>→ {{ o.after }}</span> }
                      @if (desktop() && o.plan.minutes !== null) { <span>航行 {{ time(o.plan.minutes) }}</span> }
                      @if (desktop() && c.back) { <span>{{ c.i.start.returned ? '現在出發' : '返航後出發' }}約 {{ c.back }} 回</span> }
                    </span>
                  </span>
                  @if (c.allSame && desktop()) { <small class="dp-note">三種流派都是這條</small> }
                  @if (c.i.toGray) { <small class="dp-note warn">抵達 Lv 50 後，下一趟起改走灰海</small> }
                  @if (o.prereq) { <small class="dp-note">解鎖點還沒發現：這趟先去 {{ o.prereq }}，回來後解鎖點才會出現在海圖上</small> }
                  @else if (o.unlock) { <small class="dp-note">工坊還有潛艇欄位沒解鎖，優先跑含解鎖點的路線@if (o.calc) {（依配置推算）}</small> }
                  @else if (o.avoided?.length) { <small class="dp-note">@if (o.calc) {攻略路線含還沒發現的 {{ o.avoided.join('、') }}，改推已發現的點裡最好的路線} @else {攻略路線含還沒發現的 {{ o.avoided.join('、') }}，請先更新海圖或確認}</small> }
                  @else if (o.calc) { <small class="dp-note">這艘的配置走不了攻略路線，改依配置推算</small> }
                  @if (o.plan.problem === 'range') { <small class="dp-note warn">以這艘的配置，距離不夠（{{ o.plan.range }} / {{ o.plan.rangeCap }}）</small> }
                  @if (c.i.parts === null && c.i.guideConfig) { <small class="dp-note warn">還沒綁定配置，時間依攻略配置 {{ c.i.guideConfig.join('') }} 推算</small> }
                } @else {
                  <small class="dp-note">這個等級沒有推薦路線</small>
                }
              </button>
              @if (openId() === c.i.sub.id) {
                <ul class="dp-more" aria-label="各流派比較">
                  @for (o of c.i.options; track o.key) {
                    <li>
                      <span class="dp-more-k">{{ o.label }}@if (o.pref) { <i class="lv-badge">偏好</i> }</span>
                      <b class="mono">{{ routeText(o.plan.points) }}</b>
                      <small>
                        @if (o.plan.minutes !== null) { 航行 {{ time(o.plan.minutes) }}・ }
                        +{{ fmt(o.plan.exp) }} {{ up(c.i.start.level, o.after) }}
                        @if (o.sameAs) {・與{{ o.sameAs }}相同}
                        @if (o.unlock) {・{{ unlockText(o.unlock) }}}
                      </small>
                    </li>
                  }
                </ul>
              }
            </li>
          }
        </ul>
        <small class="dp-foot">上傳截圖或手動輸入後，每艘的「這次派出」預設帶這裡的建議，送出前可以逐艘改。</small>
      </section>
    }
  `,
})
export class DispatchPanel {
  readonly workshop = input.required<WorkshopWithSubmarines>();
  readonly desktop = input(false);

  protected readonly vm = inject(DispatchVm);
  private readonly store = inject(DataStore);
  protected readonly views: ViewSchool[] = ['pref', ...LEVELING_SCHOOLS];
  protected readonly short = SHORT;
  protected readonly circled = circled;
  protected readonly routeText = routeText;
  protected readonly fmt = fmtExp;
  protected readonly up = lvUp;
  protected readonly unlockText = unlockText;
  protected readonly time = minutesText;
  protected readonly openId = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.workshop().submarines.some((s) => s.progress?.sim_on)) untracked(() => this.vm.start());
    });
  }

  protected shortOf(o: DispatchOption): string {
    return o.key in SHORT ? SHORT[o.key as ViewSchool] : o.label;
  }

  protected label(v: ViewSchool): string {
    return v === 'pref' ? '各艇偏好' : LEVELING_SCHOOL_LABEL[v];
  }

  protected readonly cards = computed(() => {
    const now = this.store.now();
    const out: { i: DispatchInfo; o: DispatchOption | null; when: string; back: string | null; allSame: boolean }[] = [];
    for (const s of [...this.workshop().submarines].sort((a, b) => a.position - b.position)) {
      const i = this.vm.info(s, now);
      if (!i || i.start.over) continue;
      const o = i.current;
      const when = i.start.returned ? '可收・現在就能派' : `${displayFor(false, i.start.returnAt, now).shortTime}後返航`;
      const departAt = i.start.returnAt ?? now;
      const back = o && o.plan.minutes !== null ? displayFor(false, departAt + o.plan.minutes * 60_000, now).hint.replace(/^約 /, '今天 ').replace(/^明 /, '明天 ') : null;
      const schools = i.options.filter((x) => x.key !== 'last');
      const allSame = schools.length > 1 && schools.every((x) => x === schools[0] || x.sameAs !== null);
      out.push({ i, o, when, back, allSame });
    }
    return out;
  });

  protected toggle(id: string): void {
    this.openId.update((cur) => (cur === id ? null : id));
  }
}
