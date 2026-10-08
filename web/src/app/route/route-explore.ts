import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { SEAS, SEA_INDEXES } from './core/data';
import { judgeBuild, routeNeed } from './core/need';
import type { ExploreRoute } from './core/explore';
import { MAX_HOURS_OPTIONS, RouteExploreVm } from './route-explore-vm';
import { formatTravel } from './route-format';
import { RouteMap } from './route-map';
import { RouteSeaPager } from './route-sea-pager';
import { RouteVm } from './route-vm';

const PAGE = 20;

interface Card {
  key: string;
  sea: number;
  order: number[];
  seaName: string;
  stops: string;
  opens: string;
  opensCount: number;
  exp: string;
  time: string;
  fuel: number;
  range: number;
  lights: { label: string; grade: string; text: string }[];
}

/**
 * 探索推薦(D-213):先在地圖上標記「去過哪些航點」(點遠處的點會一併標記前面的點),
 * 再用上面選的配置找「這趟回來之後能開出最多新航點」的路線;只會推薦前一個點已去過的點(收艇後解鎖是機率,故為「可能解鎖」)。
 */
@Component({
  selector: 'app-route-explore',
  imports: [SelectField, RouteMap, RouteSeaPager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-explore.html',
})
export class RouteExplore {
  protected readonly vm = inject(RouteVm);
  protected readonly x = inject(RouteExploreVm);

  protected readonly shown = signal(PAGE);
  protected readonly confirmClear = signal(false);
  protected readonly seaOptions: SelectOption[] = [{ value: 'all', label: '全部海域' }, ...SEAS.map((s) => ({ value: s.sea, label: s.name }))];
  protected readonly hourOptions: SelectOption[] = MAX_HOURS_OPTIONS.map((h) => ({ value: h ?? 'any', label: h === null ? '不限' : `${h} 小時內` }));
  protected readonly seaIdx = computed(() => SEA_INDEXES.find((s) => s.sea.sea === this.x.viewSea()) ?? SEA_INDEXES[0]!);
  protected readonly seaProgress = computed(() => {
    const ex = this.x.explored();
    const pts = this.seaIdx().sea.points;
    return `${pts.filter((p) => ex.has(p.id)).length} / ${pts.length}`;
  });

  protected readonly cards = computed<Card[]>(() => {
    const rs = this.x.result();
    const stats = this.x.searchedStats();
    if (!rs || !stats) return [];
    return rs.map((r) => this.card(r, stats));
  });
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));

  private pointName(id: number, withSea: boolean): string {
    const si = this.x.graph.seaOf.get(id)!;
    const p = si.byId.get(id)!;
    return `${withSea ? si.sea.name + ' ' : ''}${p.code} ${p.name}`;
  }

  private card(r: ExploreRoute, stats: NonNullable<ReturnType<RouteExploreVm['searchedStats']>>): Card {
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const j = judgeBuild(stats, routeNeed(si, r.order));
    const l = (label: string, g: { grade: string; have: number; gapToTop: number }) => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    return {
      key: `${r.sea}:${r.order.join(',')}`,
      sea: r.sea,
      order: r.order,
      seaName: si.sea.name,
      stops: r.order.map((id) => this.pointName(id, false)).join(' › '),
      opens: r.opens.map((id) => (this.x.graph.seaOf.get(id) === si ? this.pointName(id, false).split(' ')[0]! : this.pointName(id, true).split(' ').slice(0, 2).join(' '))).join('、'),
      opensCount: r.opens.length,
      exp: r.exp.toLocaleString('en-US'),
      time: formatTravel(r.minutes),
      fuel: r.cost.fuel,
      range: r.cost.range,
      lights: [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)],
    };
  }

  protected onSea(v: SelectValue): void {
    this.x.sea.set(v === 'all' ? 'all' : Number(v));
  }
  protected onHours(v: SelectValue): void {
    this.x.maxHours.set(v === 'any' ? null : Number(v));
  }
  protected pickPoint(id: number): void {
    this.confirmClear.set(false);
    this.x.toggle(id);
  }
  protected clear(): void {
    if (!this.confirmClear()) {
      this.confirmClear.set(true);
      return;
    }
    this.confirmClear.set(false);
    this.x.clearAll();
  }
  protected search(): void {
    this.shown.set(PAGE);
    this.x.run();
  }
  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }
  protected load(c: Card): void {
    this.vm.requestLoad(c.sea, c.order);
  }
}
