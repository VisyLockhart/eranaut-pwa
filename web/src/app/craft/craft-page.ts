import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, afterNextRender, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CraftLink, pageScroller } from '../core/craft-link';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import type { CalcRow } from './core/craft-calc';
import type { SlotKey } from './core/types';
import { parseCrystal, type CrystalElement, type CrystalTier } from './core/craft-tree';
import { CrystalIcon } from './crystal-icon';
import { CraftVm } from './craft-vm';
import { CraftCopyButton } from './craft-copy-btn';
import { CRAFT_FEATURES } from './craft-features';
import { CraftStockBar } from './craft-stock-bar';
import { CraftPriceDialog } from './craft-price-dialog';
import { CraftStockDialogs } from './craft-stock-dialogs';
import { CraftStockVm } from './craft-stock-vm';
import { GRADE_INDEXES, MAX_QTY, TAB_LABEL, TABS, gradeInfo, gradeLabel, missing, rowId, type CraftTab, type CrystalTray, type GradeInfo, type RowGroup, type SlotSel } from './craft-state';
import { CRAFT_DATA } from './core/data';
import { sourceTags, sourceTip, type SrcTag } from './core/craft-source';
import { Tip } from '../ui/tip';

/** 配件製作:選潛艇配件等級,算出所需交納素材 / 直接素材 / 基礎素材(D-239、D-240、D-258) */
@Component({
  selector: 'app-craft-page',
  imports: [Tip, NgTemplateOutlet, CdkTrapFocus, IconComponent, CrystalIcon, CraftStockBar, CraftCopyButton, CraftStockDialogs, CraftPriceDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './craft-page.html',
  host: { style: 'display: contents', '(document:keydown.escape)': 'onEscape($event)' },
})
export class CraftPage implements OnDestroy {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(CraftVm);
  /** 庫存組列開啟時,「複製」放在庫存組列內;展示版沒有庫存組列,放回工具列(D-337) */
  protected readonly stockSets = inject(CRAFT_FEATURES).stockSets;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private downOnOverlay = false;
  /** 開始追蹤前的捲動位置;取消追蹤時還原,避免使用者找不到原本看的位置 */
  private savedTop: number | null = null;
  protected readonly gradeIndexes = GRADE_INDEXES;
  protected readonly tabs = TABS;
  protected readonly tabLabel = TAB_LABEL;
  /** 只看時標題列的快速切換用的短名稱 */
  protected readonly tabShort: Record<CraftTab, string> = { finals: '交納', directs: '直接', bases: '基礎' };
  protected readonly maxQty = MAX_QTY;
  protected readonly gradeLabel = gradeLabel;
  protected readonly missing = missing;
  /** 素材的其他取得管道(D-333):列表小膠囊與提示用 */
  protected readonly tagsOf = (r: CalcRow) => sourceTags(r.name, r.need);
  protected readonly srcTip = sourceTip;
  protected readonly srcAria = (tg: SrcTag[]) => `其他來源:${tg.map((t) => t.text).join('、')}`;
  /** 手機:正在選等級的部位(底部面板) */
  protected readonly sheet = signal<SlotKey | null>(null);

  constructor() {
    this.layout.pageTitle.set('配件製作');
    inject(CraftStockVm).start();
    // 從航線帶入配置(D-262):套用後回到頁面最上面,讓發光的部位看得到
    const imp = inject(CraftLink).take();
    if (imp) {
      this.vm.importParts(imp);
      afterNextRender(() => pageScroller().scrollTo?.({ top: 0, behavior: 'auto' }), { injector: this.injector });
    }
  }

  protected selOf(slot: SlotKey): SlotSel {
    return this.vm.sel()[slot];
  }
  protected groupsOf(tab: CraftTab): RowGroup[] {
    return this.vm.groups()[tab];
  }
  protected trayOf(tab: CraftTab): CrystalTray | null {
    return this.vm.trays()[tab];
  }
  /** 晶類盤裡被點的那一格(記錄庫存時在盤下方展開成一列可輸入);不在這一欄 = null */
  protected trayPicked(tab: CraftTab, ty: CrystalTray): CalcRow | null {
    for (const r of ty.rows) for (const c of r.cells) if (c && this.vm.isPinned(c)) return c;
    return null;
  }
  /** 骨架列的「展開 / 收回」膠囊:只切換,不追蹤這一列 */
  protected frameToggle(name: string, e: Event): void {
    e.stopPropagation();
    this.vm.toggleFrame(name);
  }
  /** 格子的提示與無障礙名稱:名稱 · 需要;記錄庫存時改為實際還缺的數字 */
  protected cellTip(r: CalcRow): string {
    if (!this.vm.view().stockMode) return `${r.name} · 需要 ${r.need}`;
    if (this.vm.covered(r)) return `${r.name} · 上層已備齊,不必準備(原需要 ${this.vm.fullNeedOf(r)})`;
    const have = this.vm.stock()[r.key] ?? 0;
    const lack = missing(r, this.vm.stock());
    return lack === 0 ? `${r.name} · 已備齊(${have} / ${r.need})` : `${r.name} · 還缺 ${lack}(已有 ${have} / 需要 ${r.need})`;
  }
  protected parseElement(name: string): CrystalElement {
    return parseCrystal(name)!.element;
  }
  protected parseTier(name: string): CrystalTier {
    return parseCrystal(name)!.tier;
  }
  /** 進度條 0~100 */
  protected cellPct(r: CalcRow): number {
    return r.need > 0 ? Math.min(100, ((this.vm.stock()[r.key] ?? 0) / r.need) * 100) : 100;
  }
  /** 該部位目前選到的配件資訊(名稱 + 英文代號);沒選回傳 null */
  protected infoOf(slot: SlotKey): GradeInfo | null {
    const gi = this.vm.sel()[slot].gradeIndex;
    return gi === null ? null : gradeInfo(slot, gi);
  }
  protected slotLabel(slot: SlotKey): string {
    return CRAFT_DATA.slots[slot].label;
  }
  protected openSheet(slot: SlotKey): void {
    this.sheet.set(slot);
  }
  protected closeSheet(): void {
    if (this.sheet()) this.sheet.set(null);
  }
  /** Esc:先關查價視窗,再關配方樹,再關底部面板 */
  protected onEscape(ev: Event): void {
    if (ev.defaultPrevented) return;
    if (this.vm.priceFor()) {
      this.vm.closePrice();
      ev.preventDefault();
    } else if (this.vm.srcOpen() && !this.layout.isDesktop()) {
      this.vm.srcOpen.set(false);
      ev.preventDefault();
    } else if (this.vm.treeFor()) {
      this.vm.closeTree();
      ev.preventDefault();
    } else if (this.vm.focusOn() && !(ev.target as HTMLElement | null)?.closest?.('input, textarea, select')) {
      // 只看(D-345):Esc 返回三欄;在庫存輸入框裡按 Esc 不算
      this.exitFocus();
      ev.preventDefault();
    } else this.closeSheet();
  }
  ngOnDestroy(): void {
    // 換版面(手機 / 桌機)會重建頁面,配方樹要留著;真的離開配件製作才關
    if (!(this.router.url ?? '/craft').startsWith('/craft')) this.vm.closeTree();
  }
  protected overlayDown(ev: Event): void {
    this.downOnOverlay = ev.target === ev.currentTarget;
  }
  protected overlayClick(ev: Event): void {
    if (this.downOnOverlay && ev.target === ev.currentTarget) this.vm.closeTree();
    this.downOnOverlay = false;
  }
  /** 配方樹視窗的「取消追蹤」:關視窗並取消追蹤,捲動位置還原 */
  protected unpinFromTree(): void {
    const sp = scrollParent(this.host.nativeElement.querySelector<HTMLElement>('.ct-cols, .ct-m-body, .ct-trace') ?? this.host.nativeElement);
    const p = this.vm.pin();
    const k = this.vm.pinKind();
    this.vm.closeTree();
    if (p === null || k === null) return;
    this.vm.togglePin(p, k);
    this.afterPinChange(sp);
  }
  protected qtyInput(slot: SlotKey, ev: Event): void {
    this.vm.setQty(slot, Number((ev.target as HTMLInputElement).value));
  }
  protected stockInput(row: CalcRow, ev: Event): void {
    this.vm.setStock(row.key, Number((ev.target as HTMLInputElement).value));
  }
  protected stop(ev: Event): void {
    ev.stopPropagation();
  }
  /** 進入只看(D-345):焦點移到「返回」,鍵盤與讀屏使用者才知道畫面換了 */
  protected enterFocus(tab: CraftTab): void {
    this.vm.enterFocus(tab);
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('.ct-focus-back')?.focus(), { injector: this.injector });
  }
  /** 返回三欄:焦點回到剛才看的那一欄的標頭按鈕 */
  protected exitFocus(): void {
    const tab = this.vm.view().tab;
    this.vm.exitFocus();
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(`.ct-col-btn[data-tab="${tab}"]`)?.focus(), { injector: this.injector });
  }
  protected setTab(t: CraftTab): void {
    this.vm.patchView({ tab: t });
  }
  /**
   * 點一列:切換追蹤。追蹤分類在清單最上方,所以開始追蹤時捲到那裡;取消時還原原本的位置。
   * 已追蹤的品項有配方時,再點一次改為開配方樹(D-264);沒有配方的基礎素材再點仍是取消追蹤,
   * 取消追蹤也可以用上方的追蹤列 ✕ 或配方樹視窗的「取消追蹤」。
   */
  protected pinRow(r: CalcRow, ev: Event): void {
    if (this.vm.isPinned(r) && this.vm.hasTree(r.name)) {
      this.vm.openTree(r.name);
      return;
    }
    const was = this.vm.pin() !== null;
    const sp = scrollParent(ev.currentTarget as HTMLElement);
    if (!was) this.savedTop = sp.scrollTop;
    this.vm.togglePin(r.name, r.kind);
    this.afterPinChange(sp);
  }
  protected unpin(ev: Event): void {
    const p = this.vm.pin();
    const k = this.vm.pinKind();
    if (p === null || k === null) return;
    const sp = scrollParent(ev.currentTarget as HTMLElement);
    this.vm.togglePin(p, k);
    this.afterPinChange(sp);
  }
  private afterPinChange(sp: HTMLElement): void {
    const pinned = this.vm.pin() !== null;
    afterNextRender(
      () => {
        if (pinned) {
          // 手機:捲到分頁列(追蹤列與追蹤分類在它下面);桌機:捲到追蹤列
          const target = this.host.nativeElement.querySelector<HTMLElement>(this.layout.isDesktop() ? '.ct-trace' : '.ct-tabs');
          if (!target) return;
          const edge = sp === document.scrollingElement ? 0 : sp.getBoundingClientRect().top;
          if (target.getBoundingClientRect().top < edge) target.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
        } else if (this.savedTop !== null) {
          sp.scrollTo?.({ top: this.savedTop, behavior: 'auto' });
          this.savedTop = null;
        }
      },
      { injector: this.injector },
    );
  }
  protected rowState(r: CalcRow): string {
    const parts: string[] = [];
    if (this.vm.covered(r)) parts.push('covered');
    if (this.vm.isPinned(r)) parts.push('pin');
    else if (this.vm.focusOn()) {
      // 只看:不標關聯、不變暗(另外兩欄看不到,整欄變灰沒有意義)
    } else if (this.vm.related().has(rowId(r))) parts.push('rel');
    else if (this.vm.pin()) parts.push('dim');
    if (this.vm.view().stockMode && missing(r, this.vm.stock()) === 0) parts.push('done');
    return parts.join(' ');
  }
}

/** 最近的可捲動祖先(找不到就是整頁) */
function scrollParent(el: HTMLElement): HTMLElement {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}
