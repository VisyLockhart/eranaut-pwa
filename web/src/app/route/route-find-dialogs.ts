import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { SEA_INDEXES } from './core/data';
import { aggregateLoot, type LootSection } from './core/loot-list';
import { RouteFindVm } from './route-find-vm';
import { RouteLootVm } from './route-loot-vm';

const ITEM_PAGE = 40;

/** 「看全部」的一段;id 以 `o-`(已解鎖)/ `l-`(未解鎖)開頭,給展開收合記錄用 */
interface ItemGroup extends LootSection {
  id: string;
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

  /**
   * 「看全部」(D-263):高 → 中 → 低 分段,最後是「未解鎖」(預設收合,標出差多少);
   * 段內依配件製作的名稱排序,指定的物品排最前。判定用搜尋當時的探索值。
   */
  protected readonly groups = computed<ItemGroup[]>(() => {
    const r = this.f.itemsFor();
    const stats = this.f.searchedStats();
    if (!r || !stats) return [];
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const points = r.order.map((id) => si.byId.get(id)!);
    return aggregateLoot(points, stats.surveillance, new Set(r.got)).map((g) => ({ ...g, id: `${g.locked ? 'l' : 'o'}-${g.key}` }));
  });
  /** 判定依據:搜尋當時配置的探索值 */
  protected readonly basisSurveillance = computed(() => this.f.searchedStats()?.surveillance ?? null);
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
