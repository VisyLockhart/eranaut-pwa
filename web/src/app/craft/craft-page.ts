import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Injector, OnDestroy, afterNextRender, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CraftLink, pageScroller } from '../core/craft-link';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import type { CalcRow } from './core/craft-calc';
import type { SlotKey } from './core/types';
import { CrystalIcon } from './crystal-icon';
import { CraftVm } from './craft-vm';
import { GRADE_INDEXES, MAX_QTY, TAB_LABEL, TABS, gradeInfo, gradeLabel, missing, type CraftTab, type GradeInfo, type RowGroup, type SlotSel } from './craft-state';
import { CRAFT_DATA } from './core/data';

/** 配件製作:選潛艇配件等級,算出所需交納素材 / 直接素材 / 基礎素材(D-239、D-240、D-258) */
@Component({
  selector: 'app-craft-page',
  imports: [NgTemplateOutlet, CdkTrapFocus, IconComponent, CrystalIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './craft-page.html',
  host: { style: 'display: contents', '(document:keydown.escape)': 'onEscape($event)' },
})
export class CraftPage implements OnDestroy {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(CraftVm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private downOnOverlay = false;
  /** 開始追蹤前的捲動位置;取消追蹤時還原,避免使用者找不到原本看的位置 */
  private savedTop: number | null = null;
  protected readonly gradeIndexes = GRADE_INDEXES;
  protected readonly tabs = TABS;
  protected readonly tabLabel = TAB_LABEL;
  protected readonly maxQty = MAX_QTY;
  protected readonly gradeLabel = gradeLabel;
  protected readonly missing = missing;
  /** 手機:正在選等級的部位(底部面板) */
  protected readonly sheet = signal<SlotKey | null>(null);

  constructor() {
    this.layout.pageTitle.set('配件製作');
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
  /** Esc:先關配方樹,再關底部面板 */
  protected onEscape(ev: Event): void {
    if (ev.defaultPrevented) return;
    if (this.vm.treeFor()) {
      this.vm.closeTree();
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
    this.vm.closeTree();
    if (p === null) return;
    this.vm.togglePin(p);
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
  protected setTab(t: CraftTab): void {
    this.vm.patchView({ tab: t });
  }
  /**
   * 點一列:切換追蹤。追蹤分類在清單最上方,所以開始追蹤時捲到那裡;取消時還原原本的位置。
   * 已追蹤的品項有配方時,再點一次改為開配方樹(D-264);沒有配方的基礎素材再點仍是取消追蹤,
   * 取消追蹤也可以用上方的追蹤列 ✕ 或配方樹視窗的「取消追蹤」。
   */
  protected pinRow(name: string, ev: Event): void {
    if (this.vm.pin() === name && this.vm.hasTree(name)) {
      this.vm.openTree(name);
      return;
    }
    const was = this.vm.pin() !== null;
    const sp = scrollParent(ev.currentTarget as HTMLElement);
    if (!was) this.savedTop = sp.scrollTop;
    this.vm.togglePin(name);
    this.afterPinChange(sp);
  }
  protected unpin(ev: Event): void {
    const p = this.vm.pin();
    if (p === null) return;
    const sp = scrollParent(ev.currentTarget as HTMLElement);
    this.vm.togglePin(p);
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
    if (this.vm.pin() === r.name) parts.push('pin');
    else if (this.vm.related().has(r.name)) parts.push('rel');
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
