import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Layout } from '../core/layout';
import { CraftPage } from './craft-page';
import { CraftVm } from './craft-vm';

function mount(desktop: boolean) {
  TestBed.resetTestingModule();
  TestBed.inject(Layout).isDesktop.set(desktop);
  const vm = TestBed.inject(CraftVm);
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement, layout: TestBed.inject(Layout) };
}

describe('CraftPage', () => {
  beforeEach(() => localStorage.clear());

  for (const desktop of [false, true]) {
    it(`沒選時顯示空白提示並設定標題(${desktop ? '桌機' : '手機'})`, () => {
      const { el, layout } = mount(desktop);
      expect(layout.pageTitle()).toBe('配件製作');
      expect(el.querySelector('.ct-empty')).toBeTruthy();
      expect(el.querySelector('.ct-row')).toBeNull();
    });
  }

  for (const desktop of [false, true]) {
    it(`部位區塊整體收合:只留已選部位一行,未選不顯示(${desktop ? '桌機' : '手機'})`, () => {
      const { f, vm, el } = mount(desktop);
      vm.setGrade('hull', 5);
      vm.setGrade('bow', 2);
      f.detectChanges();
      const cards = desktop ? '.ct-slot-card' : '.ct-tile';
      expect(el.querySelectorAll(cards).length).toBe(4);
      expect(el.querySelector('.ct-sum')).toBeNull();
      el.querySelector<HTMLButtonElement>('.ct-slots-bar')!.click();
      f.detectChanges();
      expect(el.querySelectorAll(cards).length).toBe(0);
      const rows = el.querySelectorAll('.ct-sum-row');
      expect(rows.length).toBe(2);
      expect(rows[0]!.querySelector('.ct-code')!.textContent).toContain('+');
      expect(el.querySelector('.ct-slots-bar')!.getAttribute('aria-expanded')).toBe('false');
      expect(el.querySelector('.ct-row')).toBeTruthy();
      if (!desktop) {
        (rows[0] as HTMLElement).click();
        f.detectChanges();
        expect(el.querySelector('.ct-sheet')).toBeTruthy();
      }
      // 全部展開
      if (!desktop) el.querySelector<HTMLElement>('.ct-done')!.click();
      f.detectChanges();
      el.querySelector<HTMLButtonElement>('.ct-slots-bar')!.click();
      f.detectChanges();
      expect(el.querySelectorAll(cards).length).toBe(4);
    });
  }

  it('清除全部:第一次點變紅底「確定清除？」,第二次才清除', () => {
    const { f, vm, el } = mount(true);
    vm.setGrade('hull', 5);
    f.detectChanges();
    const btn = () => el.querySelector<HTMLButtonElement>('.ct-tool.danger')!;
    expect(btn().textContent).toContain('清除全部');
    btn().click();
    f.detectChanges();
    expect(btn().classList.contains('confirm')).toBe(true);
    expect(btn().textContent).toContain('確定清除？');
    expect(vm.hasSelection()).toBe(true);
    btn().click();
    f.detectChanges();
    expect(vm.hasSelection()).toBe(false);
    expect(vm.confirmClear()).toBe(false);
  });

  it('桌機:選等級後出現三欄清單', () => {
    const { f, el } = mount(true);
    const chips = el.querySelectorAll<HTMLButtonElement>('.ct-slot-card:first-child .ct-chip');
    expect(chips.length).toBe(10);
    chips[5]!.click(); // 1改
    f.detectChanges();
    expect(el.querySelectorAll('.ct-col').length).toBe(3);
    expect(el.querySelector('.ct-slot-card.set')).toBeTruthy();
    expect(el.querySelectorAll('.ct-row').length).toBeGreaterThan(0);
    // 再點同一級取消
    el.querySelectorAll<HTMLButtonElement>('.ct-slot-card:first-child .ct-chip')[5]!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-empty')).toBeTruthy();
  });

  it('手機:點方塊開面板選等級,分頁切換三類', () => {
    const { f, el, vm } = mount(false);
    el.querySelector<HTMLButtonElement>('.ct-tile')!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-sheet')).toBeTruthy();
    el.querySelectorAll<HTMLButtonElement>('.ct-sheet .ct-chip')[2]!.click();
    f.detectChanges();
    expect(vm.sel().hull.gradeIndex).toBe(2);
    el.querySelector<HTMLButtonElement>('.ct-done')!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-sheet')).toBeNull();
    const tabs = el.querySelectorAll<HTMLButtonElement>('.ct-tabs .up-tab');
    expect(tabs.length).toBe(3);
    tabs[2]!.click();
    f.detectChanges();
    expect(vm.view().tab).toBe('bases');
  });

  it('選到的配件顯示名稱與英文代號(桌機卡片、手機方塊與面板)', () => {
    const d = mount(true);
    d.vm.setGrade('hull', 5);
    d.f.detectChanges();
    expect(d.el.querySelector('.ct-slot-card.set .ct-sel-name')!.textContent).toContain('鯊魚改級');
    expect(d.el.querySelector('.ct-slot-card.set .ct-code')!.textContent!.trim()).toBe('S+');
    localStorage.clear();
    const m = mount(false);
    m.vm.setGrade('bow', 4);
    m.f.detectChanges();
    expect(m.el.querySelector('.ct-tile.set .ct-code')!.textContent!.trim()).toBe('SY');
    m.el.querySelectorAll<HTMLButtonElement>('.ct-tile')[2]!.click();
    m.f.detectChanges();
    expect(m.el.querySelector('.ct-sheet .ct-code')!.textContent!.trim()).toBe('SY');
  });

  it('點列追蹤:相關列標記,其餘變暗;再點取消', () => {
    const { f, el, vm } = mount(true);
    vm.setGrade('hull', 5);
    f.detectChanges();
    const row = el.querySelector<HTMLElement>('.ct-col:last-child .ct-row')!;
    row.click();
    f.detectChanges();
    expect(el.querySelector('.ct-trace')).toBeTruthy();
    expect(el.querySelector('.ct-row.pin')).toBeTruthy();
    expect(el.querySelector('.ct-row.dim')).toBeTruthy();
    el.querySelector<HTMLButtonElement>('.ct-trace .ct-x')!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-trace')).toBeNull();
  });

  it('記錄庫存:輸入已有後還缺減少,只看缺少會濾掉已足夠的列', () => {
    const { f, el, vm } = mount(true);
    vm.setGrade('hull', 5);
    vm.patchView({ stockMode: true });
    f.detectChanges();
    const total = el.querySelectorAll('.ct-row').length;
    const first = vm.result().bases[0]!;
    vm.setStock(first.name, first.need);
    vm.patchView({ onlyMissing: true });
    f.detectChanges();
    expect(el.querySelectorAll('.ct-row').length).toBe(total - 1);
    expect(el.querySelector('.ct-stockbar')).toBeTruthy();
  });
});
