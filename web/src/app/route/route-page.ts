import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { lootTiers } from './core/need';
import { MAX_STOPS } from './core/route';
import { RouteAbout } from './route-about';
import { RouteConfigDialog } from './route-config-dialog';
import { RouteEditor } from './route-editor';
import { RouteLoot } from './route-loot';
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
  imports: [NgTemplateOutlet, IconComponent, RouteCfgBar, RouteMap, RouteEditor, RouteRecommend, RouteLoot, RouteAbout, RouteConfigDialog, RoutePerfDialog, RouteReplaceDialog, RouteSeaPager, RouteStats],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-page.html',
  host: {
    style: 'display: contents',
    '(document:pointerdown)': 'onDocPointer($event)',
    '(document:keydown.escape)': 'onEscape($event)',
  },
})
export class RoutePage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(RouteVm);
  protected readonly maxStops = MAX_STOPS;
  /** 分頁順序:先有配置才選航點 */
  protected readonly tabs = [
    { id: 'config', label: '配置' },
    { id: 'recommend', label: '推薦' },
    { id: 'map', label: '航點' },
  ] as const;
  /** 試著點了不能選的航點時顯示原因 */
  protected readonly hint = signal('');

  /** 已選航點;`tiers` 是收合時列上顯示的三階摘要(高階 / 中階探索不足時加鎖頭) */
  protected readonly picked = computed(() => {
    const surveillance = this.vm.stats().surveillance;
    return this.vm.seq().map((id, i) => {
      const point = this.vm.seaIdx().byId.get(id)!;
      const t = lootTiers(point, surveillance);
      return {
        n: i + 1,
        point,
        tiers: [
          { label: '低', locked: t.low.locked },
          { label: '中', locked: t.mid.locked },
          { label: '高', locked: t.high.locked },
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

  /** 手機:五個分頁按鈕捲出畫面後,右下角浮出的功能選單(D-209) */
  private readonly tabbar = viewChild<ElementRef<HTMLElement>>('tabbar');
  private readonly fab = viewChild<ElementRef<HTMLElement>>('fab');
  private readonly tabsOut = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly fabVisible = computed(() => !this.layout.isDesktop() && this.tabsOut());
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    this.layout.pageTitle.set('航線模擬');
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

    // 分頁列離開捲動區可視範圍時顯示浮動鈕
    effect((onCleanup) => {
      const bar = this.tabbar()?.nativeElement;
      const root = this.scroller();
      if (!bar || !root || this.layout.isDesktop() || typeof IntersectionObserver === 'undefined') {
        this.tabsOut.set(false);
        return;
      }
      const io = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1];
        if (!last) return;
        this.tabsOut.set(!last.isIntersecting);
        if (last.isIntersecting) this.menuOpen.set(false);
      }, { root, threshold: 0 });
      io.observe(bar);
      onCleanup(() => io.disconnect());
    });
  }

  private scroller(): HTMLElement | null {
    return this.tabbar()?.nativeElement.closest<HTMLElement>('.rt-m-body') ?? null;
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected fabPick(id: RouteTab): void {
    this.menuOpen.set(false);
    this.vm.setTab(id);
    this.toTop();
  }

  protected fabTop(): void {
    this.menuOpen.set(false);
    this.toTop();
  }

  private toTop(): void {
    const el = this.scroller();
    if (el) el.scrollTop = 0;
  }

  protected onDocPointer(event: Event): void {
    if (this.menuOpen() && !(event.target instanceof Node && this.host.nativeElement.querySelector('.rt-fab-wrap')?.contains(event.target))) this.menuOpen.set(false);
  }

  protected onEscape(event: Event): void {
    if (!this.menuOpen() || event.defaultPrevented) return;
    this.menuOpen.set(false);
    this.fab()?.nativeElement.focus();
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
