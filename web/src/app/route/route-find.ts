import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Layout } from '../core/layout';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { SEAS, SEA_INDEXES } from './core/data';
import type { FindRoute, FindSort } from './core/find';
import { judgeBuild, routeNeed } from './core/need';
import { MAX_HOURS_OPTIONS } from './route-explore-vm';
import { RouteFindDialogs } from './route-find-dialogs';
import { specSummary } from './route-filter-state';
import { RouteFilterVm } from './route-filter-vm';
import { RouteFindVm } from './route-find-vm';
import { formatTravel } from './route-format';
import { itemName } from './route-loot-vm';
import { RouteMap } from './route-map';
import { RouteSeaPager } from './route-sea-pager';
import { RouteVm } from './route-vm';

const PAGE = 20;
/** 結果卡上最多直接列出幾個指定物品,其餘折成「+N」 */
const GOT_PREVIEW = 3;

export const SORT_OPTIONS: readonly { id: FindSort; label: string; title: string }[] = [
  { id: 'perMin', label: '每分鐘經驗', title: '練級:每分鐘經驗最高的路線' },
  { id: 'opens', label: '可能解鎖', title: '探索:回來後可能開出最多新航點的路線' },
  { id: 'variety', label: '最多物品', title: '一趟撈到最多種不同物品的路線' },
];

interface Card {
  key: string;
  route: FindRoute;
  sea: number;
  order: number[];
  seaName: string;
  stops: { code: string; name: string }[];
  /** 右側主指標,隨排序變化 */
  headline: string;
  /** 只在排序為可能解鎖時有;「返航時有機會解鎖新航點:X、X、X」 */
  opens: string | null;
  itemsCount: number;
  got: string[];
  gotMore: number;
  exp: string;
  perMin: string;
  /** 排序不是每分鐘經驗時,底部資訊列才另外列出每分鐘經驗(主指標已經是它就不重複) */
  showPerMin: boolean;
  time: string;
  fuel: number;
  range: number;
  lights: { label: string; grade: string; text: string }[];
}

/**
 * 找路線(D-222):取代原本推薦頁的練級、探索、距離、掉落四個目標。
 * 上面是海圖(「篩選航點」與「標記去過」兩種模式,說明用「?」彈出),中間是條件(海域、航行時間、指定物品、排序),
 * 按「找路線」才計算。結果卡的右側主指標隨排序變化,物品區預設「可撈到 N 種物品」,有指定物品時另列指定的。
 */
@Component({
  selector: 'app-route-find',
  imports: [SelectField, RouteMap, RouteSeaPager, RouteFindDialogs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-find.html',
})
export class RouteFind {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(RouteVm);
  protected readonly f = inject(RouteFindVm);
  protected readonly fv = inject(RouteFilterVm);
  protected readonly x = this.f.x;
  protected readonly l = this.f.l;

  protected readonly shown = signal(PAGE);
  /** 條件區收合時顯示的一行摘要 */
  protected readonly condSummary = computed(() => specSummary(this.fv.current()) || '沒有額外條件');
  /** 海圖與條件區都收合:桌機兩欄等高 */
  protected readonly bothClosed = computed(() => !this.x.mapOpen() && !this.f.condOpen());
  protected readonly confirmClear = signal(false);
  protected readonly sorts = SORT_OPTIONS;
  protected readonly seaOptions: SelectOption[] = [{ value: 'all', label: '全部海域' }, ...SEAS.map((s) => ({ value: s.sea, label: s.name }))];
  protected readonly hourOptions: SelectOption[] = MAX_HOURS_OPTIONS.map((h) => ({ value: h ?? 'any', label: h === null ? '不限' : `${h} 小時內` }));
  protected readonly seaIdx = computed(() => SEA_INDEXES.find((s) => s.sea.sea === this.x.viewSea()) ?? SEA_INDEXES[0]!);
  protected readonly seaProgress = computed(() => {
    const ex = this.x.explored();
    const pts = this.seaIdx().sea.points;
    return `${pts.filter((p) => ex.has(p.id)).length} / ${pts.length}`;
  });
  /** 這個海域的篩選:選中 / 排除幾個 */
  protected readonly seaFilter = computed(() => {
    const pts = this.seaIdx().sea.points;
    const req = this.f.required();
    const exc = this.f.excluded();
    return `${pts.filter((p) => req.has(p.id)).length} 選中 · ${pts.filter((p) => exc.has(p.id)).length} 排除`;
  });
  constructor() {
    // 每算完一次:結果頁數歸零;若是載入條件組合觸發的,捲到結果
    effect(() => {
      if (this.f.runCount() === 0) return;
      untracked(() => {
        this.shown.set(PAGE);
        if (this.f.scrollPending) {
          this.f.scrollPending = false;
          setTimeout(() => document.getElementById('rt-find-results')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 80);
        }
      });
    });
  }

  protected readonly sortLabel = computed(() => {
    switch (this.f.searchedSort()) {
      case 'opens': return '可能開出的新航點數';
      case 'variety': return '物品種類數';
      default: return '每分鐘經驗';
    }
  });

  protected readonly cards = computed<Card[]>(() => {
    const rs = this.f.result();
    const stats = this.f.searchedStats();
    const sort = this.f.searchedSort();
    if (!rs || !stats || !sort) return [];
    return rs.map((r) => this.card(r, stats, sort));
  });
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));
  /** 沒有結果時,依條件說明可以怎麼放寬 */
  protected readonly emptyText = computed(() => {
    const sort = this.f.searchedSort();
    if (sort === 'opens') return '沒有可以去的航點。可能是配置的距離不夠、等級不足,或這個海域的航點都已經去過了;試著放寬條件,或到上面「標記去過」補標還沒標的航點。';
    return '用這個配置找不到符合的路線。可能是條件太嚴(選中太多點、指定物品拿不到),也可能是距離或等級不夠;試著放寬條件,或到「配置」提高探索與距離。';
  });

  private card(r: FindRoute, stats: NonNullable<ReturnType<RouteFindVm['searchedStats']>>, sort: FindSort): Card {
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const j = judgeBuild(stats, routeNeed(si, r.order));
    const lt = (label: string, g: { grade: string; have: number; gapToTop: number }) => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    const graph = this.x.graph;
    const gotNames = r.got.map(itemName);
    return {
      key: `${r.sea}:${r.order.join(',')}`,
      route: r,
      sea: r.sea,
      order: r.order,
      seaName: si.sea.name,
      stops: r.order.map((id) => { const p = si.byId.get(id)!; return { code: p.code, name: p.name }; }),
      headline: sort === 'perMin' ? `每分鐘 ${r.perMin.toFixed(1)} 經驗` : sort === 'opens' ? `最多開 ${r.opens.length} 點` : `共 ${r.items.length} 種物品`,
      opens:
        sort === 'opens' && r.opens.length > 0
          ? r.opens.map((id) => { const o = graph.seaOf.get(id)!; const code = o.byId.get(id)!.code; return o === si ? code : `${o.sea.name} ${code}`; }).join('、')
          : null,
      itemsCount: r.items.length,
      got: gotNames.slice(0, GOT_PREVIEW),
      gotMore: Math.max(0, gotNames.length - GOT_PREVIEW),
      exp: r.exp.toLocaleString('en-US'),
      perMin: r.perMin.toFixed(1),
      showPerMin: sort !== 'perMin',
      time: formatTravel(r.minutes),
      fuel: r.cost.fuel,
      range: r.cost.range,
      lights: [lt('探索', j.surveillance), lt('收集', j.retrieval), lt('距離', j.range), lt('恩惠', j.favor)],
    };
  }

  protected onSea(v: SelectValue): void {
    this.f.sea.set(v === 'all' ? 'all' : Number(v));
  }
  protected onHours(v: SelectValue): void {
    this.f.maxHours.set(v === 'any' ? null : Number(v));
  }
  protected pickPoint(id: number): void {
    this.confirmClear.set(false);
    if (this.f.mode() === 'visit') this.x.toggle(id);
    else this.f.cycleFilter(id);
  }
  protected useRoute(): void {
    this.confirmClear.set(false);
    this.f.useRouteAsRequired();
  }
  protected clearVisit(): void {
    if (!this.confirmClear()) {
      this.confirmClear.set(true);
      return;
    }
    this.confirmClear.set(false);
    this.x.clearAll();
  }
  protected setMode(m: 'visit' | 'filter'): void {
    this.confirmClear.set(false);
    this.f.setMode(m);
  }
  protected search(): void {
    this.shown.set(PAGE);
    this.f.run();
    // 等計算與畫面更新完再捲到結果,否則會捲到更新前的位置
    setTimeout(() => document.getElementById('rt-find-results')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 80);
  }
  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }
  protected load(c: Card): void {
    this.vm.requestLoad(c.sea, c.order);
  }
  protected showAllItems(c: Card): void {
    this.f.itemsFor.set(c.route);
  }
}
