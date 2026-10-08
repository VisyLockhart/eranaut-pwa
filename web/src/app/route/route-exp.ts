import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { SEAS, SEA_INDEXES } from './core/data';
import { judgeBuild, routeNeed } from './core/need';
import type { ExpRoute, ExpSort, RouteTier } from './core/recommend';
import { formatTravel } from './route-format';
import { MAX_HOURS_OPTIONS, RouteExpVm } from './route-exp-vm';
import { RouteVm } from './route-vm';

const PAGE = 20;

const TIERS: readonly { id: RouteTier; label: string }[] = [
  { id: 'any', label: '不限' },
  { id: 'mid', label: '中階以上' },
  { id: 'high', label: '高階' },
];
const SORTS: readonly { id: ExpSort; label: string }[] = [
  { id: 'perMin', label: '每分鐘經驗' },
  { id: 'total', label: '一趟總經驗' },
];

interface Card {
  key: string;
  sea: number;
  order: number[];
  seaName: string;
  stops: string;
  exp: string;
  time: string;
  fuel: number;
  range: number;
  perMin: string;
  lights: { label: string; grade: string; text: string }[];
}

/**
 * 練級推薦(D-212):用上面選的配置,找每分鐘經驗(或一趟總經驗)最高的路線;
 * 每條結果用和航點頁相同的四個燈號,「帶到航點」把路線放進航點頁(已有不同選點時先確認)。
 */
@Component({
  selector: 'app-route-exp',
  imports: [SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-exp.html',
})
export class RouteExp {
  protected readonly vm = inject(RouteVm);
  protected readonly x = inject(RouteExpVm);

  protected readonly tiers = TIERS;
  protected readonly sorts = SORTS;
  protected readonly shown = signal(PAGE);

  protected readonly seaOptions: SelectOption[] = [{ value: 'all', label: '全部海域' }, ...SEAS.map((s) => ({ value: s.sea, label: s.name }))];
  protected readonly hourOptions: SelectOption[] = MAX_HOURS_OPTIONS.map((h) => ({ value: h ?? 'any', label: h === null ? '不限' : `${h} 小時內` }));

  protected readonly cards = computed<Card[]>(() => {
    const rs = this.x.result();
    const stats = this.x.searchedStats();
    if (!rs || !stats) return [];
    return rs.map((r) => this.card(r, stats));
  });
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));

  private card(r: ExpRoute, stats: NonNullable<ReturnType<RouteExpVm['searchedStats']>>): Card {
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const j = judgeBuild(stats, routeNeed(si, r.order));
    const l = (label: string, g: { grade: string; have: number; gapToTop: number }) => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    return {
      key: `${r.sea}:${r.order.join(',')}`,
      sea: r.sea,
      order: r.order,
      seaName: si.sea.name,
      stops: r.order.map((id) => `${si.byId.get(id)!.code} ${si.byId.get(id)!.name}`).join(' › '),
      exp: r.exp.toLocaleString('en-US'),
      time: formatTravel(r.minutes),
      fuel: r.cost.fuel,
      range: r.cost.range,
      perMin: r.perMin.toFixed(1),
      lights: [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)],
    };
  }

  protected onSea(v: SelectValue): void {
    this.x.sea.set(v === 'all' ? 'all' : Number(v));
  }
  protected onHours(v: SelectValue): void {
    this.x.maxHours.set(v === 'any' ? null : Number(v));
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
