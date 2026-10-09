import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { SEA_INDEXES } from './core/data';
import type { SeaPoint } from './core/types';
import { RouteFindVm } from './route-find-vm';
import { itemName, RouteLootVm } from './route-loot-vm';

const ITEM_PAGE = 40;

interface ItemGroup {
  label: string;
  items: { id: number; name: string; stops: string; wanted: boolean }[];
}

/**
 * 找路線的三個彈出視窗(D-222):海圖模式的「?」說明、結果卡的「看全部」物品、指定物品的挑選。
 * 狀態都在 root 的 `RouteFindVm`(`help`、`itemsFor`)與 `RouteLootVm`(`pickerOpen`),換版面重建頁面元件時不會丟。
 * 手機是底部面板;背景點擊、✕、Esc 都能關閉。
 */
@Component({
  selector: 'app-route-find-dialogs',
  imports: [CdkTrapFocus, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-find-dialogs.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RouteFindDialogs {
  protected readonly f = inject(RouteFindVm);
  protected readonly l = inject(RouteLootVm);
  protected readonly layout = inject(Layout);
  protected downOnOverlay = false;

  protected readonly itemsShown = signal(ITEM_PAGE);
  protected readonly pickItems = computed(() => this.l.matches().slice(0, this.itemsShown()));

  /** 「看全部」:這條路線拿得到的物品,依低 / 中 / 高階分組,並標出由哪幾站撈到 */
  protected readonly groups = computed<ItemGroup[]>(() => {
    const r = this.f.itemsFor();
    const stats = this.f.searchedStats();
    if (!r || !stats) return [];
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const wanted = new Set(r.got);
    const tiers: { label: string; get: (p: SeaPoint) => number[] }[] = [
      { label: '低階', get: (p) => p.drop.low },
      { label: '中階', get: (p) => (stats.surveillance >= p.statReq.surveillanceMid ? p.drop.mid : []) },
      { label: '高階', get: (p) => (stats.surveillance >= p.statReq.surveillanceHigh ? p.drop.high : []) },
    ];
    const out: ItemGroup[] = [];
    for (const t of tiers) {
      const stops = new Map<number, string[]>();
      for (const pid of r.order) {
        const p = si.byId.get(pid)!;
        for (const id of t.get(p)) stops.set(id, [...(stops.get(id) ?? []), p.code]);
      }
      if (stops.size === 0) continue;
      out.push({
        label: t.label,
        items: [...stops]
          .map(([id, codes]) => ({ id, name: itemName(id), stops: codes.join('、'), wanted: wanted.has(id) }))
          .sort((a, b) => Number(b.wanted) - Number(a.wanted) || a.name.localeCompare(b.name, 'zh-Hant')),
      });
    }
    return out;
  });
  protected readonly routeTitle = computed(() => {
    const r = this.f.itemsFor();
    if (!r) return '';
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    return `${si.sea.name} ${r.order.map((id) => si.byId.get(id)!.code).join(' › ')}`;
  });

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event, close: () => void): void {
    if (this.downOnOverlay && event.target === event.currentTarget) close();
    this.downOnOverlay = false;
  }
  protected onEscape(event: Event): void {
    if (event.defaultPrevented) return;
    if (this.l.pickerOpen()) this.closePicker();
    else if (this.f.itemsFor()) this.closeItems();
    else if (this.f.help()) this.closeHelp();
    else return;
    event.preventDefault();
  }

  protected closeHelp = (): void => this.f.help.set(null);
  protected closeItems = (): void => this.f.itemsFor.set(null);
  protected closePicker = (): void => {
    this.l.setPickerOpen(false);
    this.itemsShown.set(ITEM_PAGE);
  };

  protected onQuery(q: string): void {
    this.itemsShown.set(ITEM_PAGE);
    this.l.setQuery(q);
  }
  protected onCategory(c: string | null): void {
    this.itemsShown.set(ITEM_PAGE);
    this.l.setCategory(c);
  }
  protected moreItems(): void {
    this.itemsShown.update((n) => n + ITEM_PAGE);
  }
}
