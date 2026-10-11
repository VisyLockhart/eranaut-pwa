import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import type { CalcRow } from './core/craft-calc';
import type { SlotKey } from './core/types';
import { CraftVm } from './craft-vm';
import { GRADE_INDEXES, MAX_QTY, TAB_LABEL, TABS, gradeInfo, gradeLabel, missing, type CraftTab, type GradeInfo, type RowGroup, type SlotSel } from './craft-state';
import { CRAFT_DATA } from './core/data';

/** 配件製作:選潛艇配件等級,算出所需交納素材 / 直接素材 / 基礎素材(D-239、D-240、D-258) */
@Component({
  selector: 'app-craft-page',
  imports: [NgTemplateOutlet, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './craft-page.html',
  host: { style: 'display: contents', '(document:keydown.escape)': 'closeSheet()' },
})
export class CraftPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(CraftVm);
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
  protected rowState(r: CalcRow): string {
    const parts: string[] = [];
    if (this.vm.pin() === r.name) parts.push('pin');
    else if (this.vm.related().has(r.name)) parts.push('rel');
    else if (this.vm.pin()) parts.push('dim');
    if (this.vm.view().stockMode && missing(r, this.vm.stock()) === 0) parts.push('done');
    return parts.join(' ');
  }
}
