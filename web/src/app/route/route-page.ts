import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CraftLink, pageScroller } from '../core/craft-link';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { lootTiers } from './core/need';
import { MAX_STOPS } from './core/route';
import { RouteAbout } from './route-about';
import { RouteConfigDialog } from './route-config-dialog';
import { RouteEditor } from './route-editor';
import { RouteLoot } from './route-loot';
import { RouteChartBar } from './route-chart-bar';
import { RouteExploreVm } from './route-explore-vm';
import { RouteMap } from './route-map';
import { RoutePerfDialog } from './route-perf-dialog';
import { RouteCfgBar } from './route-cfg-bar';
import { RouteRecommend } from './route-recommend';
import { RouteReplaceDialog } from './route-replace-dialog';
import { RouteSeaPager } from './route-sea-pager';
import { offReason } from './route-format';
import type { RouteTab } from './route-state';
import { RouteStats } from './route-stats';
import { RouteVm } from './route-vm';

/**
 * 航線頁(P4):海域翻頁、地圖選點、已選清單、摘要列(航行時間、返航時刻、燃料)與距離上限進度。
 * 選取規則與反灰由 RouteVm 負責(RS-05~09、RS-23);本頁只負責顯示。
 * 手機的「航線」分頁、桌機側欄的「航線模擬」。
 */
@Component({
  selector: 'app-route-page',
  imports: [NgTemplateOutlet, IconComponent, RouteChartBar, RouteCfgBar, RouteMap, RouteEditor, RouteRecommend, RouteLoot, RouteAbout, RouteConfigDialog, RoutePerfDialog, RouteReplaceDialog, RouteSeaPager, RouteStats],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-page.html',
  host: { style: 'display: contents' },
})
export class RoutePage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(RouteVm);
  protected readonly x = inject(RouteExploreVm);
  protected readonly maxStops = MAX_STOPS;

  protected openFind(): void {
    this.vm.findOpen.set(true);
  }
  /** 試著點了不能選的航點時顯示原因 */
  protected readonly hint = signal('');

  /** 已選航點;`tiers` 是收合時列上顯示的三階摘要(高 → 中 → 低,高階 / 中階探索不足時加鎖頭;展開後由打撈物列的標籤取代,D-263) */
  protected readonly picked = computed(() => {
    const surveillance = this.vm.stats().surveillance;
    return this.vm.seq().map((id, i) => {
      const point = this.vm.seaIdx().byId.get(id)!;
      const t = lootTiers(point, surveillance);
      return {
        n: i + 1,
        point,
        tiers: [
          { label: '高', locked: t.high.locked },
          { label: '中', locked: t.mid.locked },
          { label: '低', locked: t.low.locked },
        ],
      };
    });
  });
  /** 展開了打撈物的航點 id */
  protected readonly openStops = signal<ReadonlySet<number>>(new Set());
  protected readonly usedPct = computed(() => {
    const cap = this.vm.stats().range;
    return cap > 0 ? Math.min(100, Math.round((this.vm.cost().range / cap) * 100)) : 0;
  });

  /** 燈號下方展開的路線需求(沒選航點時為 null) */
  protected readonly needRows = computed(() => {
    if (this.vm.seq().length === 0) return null;
    const n = this.vm.need();
    const s = this.vm.stats();
    return [
      { label: '探索', text: `${s.surveillance}(中 ${n.surveillanceMid} / 高 ${n.surveillanceHigh})` },
      { label: '收集', text: `${s.retrieval}(一般 ${n.retrievalNorm} / 最佳 ${n.retrievalOptim})` },
      { label: '恩惠', text: `${s.favor}(需 ${n.favor})` },
      { label: '距離', text: `${s.range}(耗用 ${n.range})` },
    ];
  });
  protected readonly lightsLabel = computed(() => `達標燈號:${this.lights().map((l) => l.text).join('、')}。點一下顯示路線需求`);
  /** 四個燈號(探索、收集、距離、恩惠):沒選航點時中性 */
  protected readonly lights = computed(() => {
    const j = this.vm.judgement();
    const has = this.vm.seq().length > 0;
    const l = (label: string, g: { grade: 'full' | 'partial' | 'none'; have: number; gapToTop: number }) => ({
      label,
      grade: has ? g.grade : 'plain',
      text: has ? `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` : `${label} ${g.have}`,
    });
    return [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)];
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** 目前是哪一頁:配件清單或航線(由路由決定,D-295) */
  protected readonly isConfig = computed(() => this.vm.tab() === 'config');

  constructor() {
    const routeTab = inject(ActivatedRoute, { optional: true })?.snapshot.data['routeTab'] as RouteTab | undefined;
    if (routeTab) this.vm.showTab(routeTab);
    effect(() => this.layout.pageTitle.set(this.vm.tab() === 'config' ? '配件清單' : '航線模擬'));
    this.vm.start();

    // 換了配置,地圖上「不能選」的提示就過時了
    effect(() => {
      this.vm.build();
      untracked(() => this.hint.set(''));
    });

    // 換分頁一律回到頂部(手機的捲動區是 .rt-m-body,桌機整頁捲動不處理)
    effect(() => {
      this.vm.tab();
      this.toTop();
    });

    // 從配件製作的提示按「回配置」回來:捲回離開時的位置(D-262)
    const restoreTop = inject(CraftLink).takeRestore();
    if (restoreTop) {
      afterNextRender(
        () => {
          const go = (): void => pageScroller().scrollTo?.({ top: restoreTop, behavior: 'auto' });
          go();
          requestAnimationFrame(go);
        },
        { injector: inject(Injector) },
      );
    }
  }

  private scroller(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('.rt-m-body');
  }

  private toTop(): void {
    const el = this.scroller();
    if (el) el.scrollTop = 0;
  }

  protected pick(id: number): void {
    const state = this.vm.selectable().get(id);
    if (state === 'ok' || state === 'selected') {
      this.hint.set('');
      this.vm.toggle(id);
      return;
    }
    const p = this.vm.seaIdx().byId.get(id);
    this.hint.set(state && p ? `${p.code} ${p.name}:${offReason(state, p.rankReq)}` : '');
  }

  protected toggleStop(id: number): void {
    this.openStops.update((cur) => {
      const next = new Set(cur);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected setSea(sea: number): void {
    this.hint.set('');
    this.vm.selectSea(sea);
  }

  protected shortest(): void {
    this.vm.sortShortest();
  }

  protected clear(): void {
    this.hint.set('');
    this.vm.clearSeq();
  }
}
