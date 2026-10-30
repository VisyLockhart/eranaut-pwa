import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
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
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
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
  /** 「看全部」的找物品輸入(D-301):綁在開啟的那條路線上,換路線或關閉後自動失效;注音/拼音組字中不查 */
  private readonly find = signal<{ route: unknown; q: string }>({ route: null, q: '' });
  private composing = false;
  /** 第一個符合的物品:名稱開頭相符優先,沒有再找名稱包含;只找展開中的段落 */
  protected readonly hit = computed<string | null>(() => {
    const f = this.find();
    const q = f.q.trim().toLowerCase();
    if (!q || f.route !== this.f.itemsFor()) return null;
    const open = this.groups().filter((g) => !this.f.isFolded(g.id));
    for (const mode of ['start', 'any'] as const) {
      for (const g of open) {
        for (const i of g.items) {
          const n = i.name.toLowerCase();
          if (mode === 'start' ? n.startsWith(q) : n.includes(q)) return `${g.id}:${i.id}`;
        }
      }
    }
    return null;
  });
  protected onFindInput(event: Event): void {
    if (this.composing || (event as InputEvent).isComposing) return;
    this.commitFind((event.target as HTMLInputElement).value);
  }
  protected onCompositionStart(): void {
    this.composing = true;
  }
  protected onCompositionEnd(event: Event): void {
    this.composing = false;
    this.commitFind((event.target as HTMLInputElement).value);
  }
  private commitFind(q: string): void {
    this.find.set({ route: this.f.itemsFor(), q });
    // 等畫面更新出高亮,再把那一列捲到清單最上面(位在黏住的段落標題之下)
    requestAnimationFrame(() => this.scrollToHit());
  }
  private scrollToHit(): void {
    const key = this.hit();
    const body = this.host.nativeElement.querySelector<HTMLElement>('.rt-items-body');
    if (!key || !body) return;
    const li = [...body.querySelectorAll<HTMLElement>('[data-item]')].find((e) => e.dataset['item'] === key);
    if (!li) return;
    const head = li.closest('.rt-items-group')?.querySelector<HTMLElement>('.rt-items-head');
    const offset = li.getBoundingClientRect().top - body.getBoundingClientRect().top - (head ? head.offsetHeight + 4 : 0);
    body.scrollTo({ top: body.scrollTop + offset });
  }

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
