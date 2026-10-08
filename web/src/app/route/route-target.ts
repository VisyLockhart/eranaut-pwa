import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Toast } from '../core/toast';
import { partLabel } from './core/build';
import { SEA_INDEXES } from './core/data';
import { judgeBuild, routeNeed } from './core/need';
import { shortestOrder } from './core/route';
import type { BuildGoal, TargetHit } from './core/target';
import { formatTravel } from './route-format';
import { offReason } from './route-format';
import { RouteMap } from './route-map';
import { RouteSeaPager } from './route-sea-pager';
import { RouteTargetVm, TARGET_MAX_STOPS } from './route-target-vm';
import { RouteVm } from './route-vm';

const PAGE = 20;

const COPY: Record<BuildGoal, { title: string; note: string; pick: string; goal: string }> = {
  collect: { title: '收集:同一個地點撈到最大量', note: '選一個想去的航點,找出收集達到該點最高階門檻、距離走得完的零件組合。', pick: '點一個航點(再點別的點就是換掉)', goal: '收集達到最高階' },
  favor: { title: '恩惠:同一個地點有機會再撈一次', note: '選一個想去的航點,找出恩惠達到該點門檻、距離走得完的零件組合。', pick: '點一個航點(再點別的點就是換掉)', goal: '恩惠達標' },
  speed: { title: '速度:最短時間收艇', note: '選這趟要去的航點(最多 5 個),找出能出航、拿得到東西,而且航行時間最短的零件組合。', pick: '依序點航點,最多 5 個', goal: '航行時間最短' },
};

interface HitCard {
  key: string;
  parts: string;
  weight: number;
  stats: { label: string; value: number }[];
  lights: { label: string; grade: string; text: string }[];
  time: string;
  shortfall: number;
  raw: TargetHit;
}

/**
 * 找配置(D-214):收集 / 恩惠 / 速度共用一個畫面——地圖選航點,用目前配置的等級找零件組合。
 * 找不到時列出「最接近」的幾組(各項還差多少);結果可帶入配置或加入儲存。
 */
@Component({
  selector: 'app-route-target',
  imports: [RouteMap, RouteSeaPager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-target.html',
})
export class RouteTarget {
  readonly goal = input.required<BuildGoal>();
  protected readonly vm = inject(RouteVm);
  protected readonly x = inject(RouteTargetVm);
  private readonly toast = inject(Toast);

  protected readonly copy = computed(() => COPY[this.goal()]);
  protected readonly shown = signal(PAGE);
  protected readonly hint = signal('');
  protected readonly busyKey = signal<string | null>(null);

  protected readonly ids = computed(() => this.x.ids(this.goal()));
  protected readonly states = computed(() => this.x.states(this.goal()));
  protected readonly maxStops = computed(() => TARGET_MAX_STOPS[this.goal()]);
  protected readonly picked = computed(() => {
    const si = this.x.seaIdx();
    return this.ids().map((id) => `${si.byId.get(id)!.code} ${si.byId.get(id)!.name}`);
  });
  protected readonly stale = computed(() => this.x.stale(this.goal()));
  /** 目前配置離這個目標差多少(沒選航點時不顯示) */
  protected readonly baseline = computed(() => {
    const ids = this.ids();
    if (ids.length === 0) return null;
    const si = this.x.seaIdx();
    const need = routeNeed(si, shortestOrder(si, ids).order);
    return { lights: this.lights(judgeBuild(this.vm.stats(), need)), need };
  });

  protected readonly result = computed(() => (this.x.searched()?.goal === this.goal() ? this.x.result() : null));
  protected readonly cards = computed(() => (this.result()?.hits ?? []).map((h) => this.card(h)));
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));
  protected readonly nearest = computed(() => (this.result()?.nearest ?? []).map((h) => this.card(h)));
  protected readonly searchedName = computed(() => {
    const q = this.x.searched();
    if (!q) return '';
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    return `${si.sea.name} ${q.ids.map((id) => si.byId.get(id)!.code).join('›')}`;
  });

  private lights(j: ReturnType<typeof judgeBuild>) {
    const l = (label: string, g: { grade: string; have: number; gapToTop: number }) => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    return [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)];
  }

  private card(h: TargetHit): HitCard {
    const q = this.x.searched()!;
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    const need = routeNeed(si, h.order);
    return {
      key: h.build.parts.join('-'),
      parts: h.build.parts.map(partLabel).join(' '),
      weight: h.stats.weight,
      stats: [
        { label: '探索', value: h.stats.surveillance },
        { label: '收集', value: h.stats.retrieval },
        { label: '巡航', value: h.stats.speed },
        { label: '距離', value: h.stats.range },
        { label: '恩惠', value: h.stats.favor },
      ],
      lights: this.lights(judgeBuild(h.stats, need)),
      time: formatTravel(h.minutes),
      shortfall: h.shortfall,
      raw: h,
    };
  }

  protected pick(id: number): void {
    const si = this.x.seaIdx();
    const p = si.byId.get(id)!;
    const was = this.states().get(id);
    if (!this.x.toggle(this.goal(), id)) {
      this.hint.set(`${p.code} ${p.name}:${offReason(was ?? 'ok', p.rankReq)}`);
      return;
    }
    this.hint.set('');
  }
  protected setSea(sea: number): void {
    this.hint.set('');
    this.x.setSea(sea);
  }
  protected clear(): void {
    this.hint.set('');
    this.x.clear();
  }
  protected search(): void {
    this.shown.set(PAGE);
    this.x.run(this.goal());
  }
  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }

  protected apply(h: HitCard): void {
    this.vm.applyParts(h.raw.build.parts as [number, number, number, number]);
    this.vm.setTab('config');
  }

  protected async save(h: HitCard): Promise<void> {
    this.vm.applyParts(h.raw.build.parts as [number, number, number, number]);
    if (this.vm.isFull()) {
      this.toast.show('已滿 10 組,請在配置頁選一組覆蓋', { tone: 'warn' });
      this.vm.setTab('config');
      return;
    }
    this.busyKey.set(h.key);
    try {
      const sub = await this.vm.saveCurrent(`Lv${this.vm.level()} ${h.parts.split(' ').join('/')}`);
      this.toast.show(`已儲存「${sub.name}」`);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 409) {
        await this.vm.refresh();
        this.toast.show('已滿 10 組,請在配置頁選一組覆蓋', { tone: 'warn' });
        this.vm.setTab('config');
      } else this.toast.show('儲存失敗,可能沒有網路,稍後再試', { tone: 'warn' });
    } finally {
      this.busyKey.set(null);
    }
  }
}
