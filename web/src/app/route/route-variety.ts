import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { ITEMS, SEAS, SEA_INDEXES } from './core/data';
import { judgeBuild, routeNeed } from './core/need';
import type { VarietyRoute } from './core/variety';
import { formatTravel } from './route-format';
import { MAX_HOURS_OPTIONS } from './route-exp-vm';
import { RouteVarietyVm } from './route-variety-vm';
import { RouteVm } from './route-vm';

const PAGE = 20;
const ITEM_PREVIEW = 8;

interface Card {
  key: string;
  sea: number;
  order: number[];
  seaName: string;
  stops: string;
  count: number;
  itemNames: string[];
  exp: string;
  time: string;
  fuel: number;
  range: number;
  lights: { label: string; grade: string; text: string }[];
}

/**
 * 距離型推薦(D-215):一趟走多個地點,用目前配置撈到最多「種」不同物品的路線。
 * 每張卡列出可撈到的物品(預設前幾個,可展開),「帶到航點」把路線放進航點頁。
 */
@Component({
  selector: 'app-route-variety',
  imports: [SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-variety.html',
})
export class RouteVariety {
  protected readonly vm = inject(RouteVm);
  protected readonly x = inject(RouteVarietyVm);

  protected readonly shown = signal(PAGE);
  protected readonly expanded = signal<ReadonlySet<string>>(new Set());
  protected readonly previewCount = ITEM_PREVIEW;

  protected readonly seaOptions: SelectOption[] = [{ value: 'all', label: '全部海域' }, ...SEAS.map((s) => ({ value: s.sea, label: s.name }))];
  protected readonly hourOptions: SelectOption[] = MAX_HOURS_OPTIONS.map((h) => ({ value: h ?? 'any', label: h === null ? '不限' : `${h} 小時內` }));

  protected readonly cards = computed<Card[]>(() => {
    const rs = this.x.result();
    const stats = this.x.searchedStats();
    if (!rs || !stats) return [];
    return rs.map((r) => this.card(r, stats));
  });
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));

  private card(r: VarietyRoute, stats: NonNullable<ReturnType<RouteVarietyVm['searchedStats']>>): Card {
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const j = judgeBuild(stats, routeNeed(si, r.order));
    const l = (label: string, g: { grade: string; have: number; gapToTop: number }) => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    return {
      key: `${r.sea}:${r.order.join(',')}`,
      sea: r.sea,
      order: r.order,
      seaName: si.sea.name,
      stops: r.order.map((id) => `${si.byId.get(id)!.code} ${si.byId.get(id)!.name}`).join(' › '),
      count: r.items.length,
      itemNames: r.items.map((id) => ITEMS[String(id)]?.name ?? `#${id}`),
      exp: r.exp.toLocaleString('en-US'),
      time: formatTravel(r.minutes),
      fuel: r.cost.fuel,
      range: r.cost.range,
      lights: [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)],
    };
  }

  protected isOpen(c: Card): boolean {
    return this.expanded().has(c.key);
  }
  protected names(c: Card): string[] {
    return this.isOpen(c) ? c.itemNames : c.itemNames.slice(0, ITEM_PREVIEW);
  }
  protected toggleItems(c: Card): void {
    this.expanded.update((s) => {
      const n = new Set(s);
      if (n.has(c.key)) n.delete(c.key);
      else n.add(c.key);
      return n;
    });
  }
  protected onSea(v: SelectValue): void {
    this.x.sea.set(v === 'all' ? 'all' : Number(v));
  }
  protected onHours(v: SelectValue): void {
    this.x.maxHours.set(v === 'any' ? null : Number(v));
  }
  protected search(): void {
    this.shown.set(PAGE);
    this.expanded.set(new Set());
    this.x.run();
  }
  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }
  protected load(c: Card): void {
    this.vm.requestLoad(c.sea, c.order);
  }
}
