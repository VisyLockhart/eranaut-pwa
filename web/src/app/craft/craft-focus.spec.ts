import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Layout } from '../core/layout';
import { CraftPage } from './craft-page';
import { CraftVm } from './craft-vm';
import { DEFAULT_VIEW, sanitizeView } from './craft-state';

function mount(desktop: boolean) {
  TestBed.resetTestingModule();
  TestBed.inject(Layout).isDesktop.set(desktop);
  const vm = TestBed.inject(CraftVm);
  vm.setGrade('hull', 5);
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement };
}
const q = (el: HTMLElement, sel: string) => el.querySelector<HTMLElement>(sel);

describe('只看模式(D-345)', () => {
  beforeEach(() => localStorage.clear());

  it('檢視設定:focus 預設 false,讀檔時型別不對就丟掉', () => {
    expect(DEFAULT_VIEW.focus).toBe(false);
    expect(sanitizeView({ focus: true }).focus).toBe(true);
    expect(sanitizeView({ focus: 'yes' }).focus).toBe(false);
    expect(sanitizeView(null).focus).toBe(false);
  });

  it('桌機:三個欄標頭是「只看」按鈕;點了只剩一欄,按返回回到三欄', () => {
    const { f, el, vm } = mount(true);
    const btns = el.querySelectorAll<HTMLButtonElement>('.ct-col-btn');
    expect(btns.length).toBe(3);
    expect(btns[2]!.getAttribute('aria-label')).toBe('只看基礎素材');
    btns[2]!.click();
    f.detectChanges();
    expect(vm.view()).toMatchObject({ focus: true, tab: 'bases' });
    expect(el.querySelectorAll('.ct-col').length).toBe(1);
    expect(el.querySelector('.ct-arrow')).toBeNull();
    expect(q(el, '.ct-focus-title b')!.textContent).toBe('基礎素材');
    expect(el.querySelectorAll('.ct-focus-body .ct-row').length).toBe(vm.groups().bases.reduce((n, g) => n + g.rows.length, 0)); // 晶類在晶類盤裡,不算列
    q(el, '.ct-focus-back')!.click();
    f.detectChanges();
    expect(vm.view().focus).toBe(false);
    expect(el.querySelectorAll('.ct-col').length).toBe(3);
  });

  it('關閉「分類」時整份清單是一個沒有名稱的組,標為 flat 才能被切成多欄', () => {
    const { f, el, vm } = mount(true);
    vm.setGrouped(false);
    vm.enterFocus('bases');
    f.detectChanges();
    const groups = el.querySelectorAll('.ct-focus-body > .ct-group');
    expect(groups.length).toBe(1);
    expect(groups[0]!.classList.contains('flat')).toBe(true);
    vm.setGrouped(true);
    f.detectChanges();
    expect(el.querySelectorAll('.ct-focus-body > .ct-group.flat').length).toBe(0);
  });

  it('標題列的快速切換:換成另一欄,不必先返回', () => {
    const { f, el, vm } = mount(true);
    vm.enterFocus('bases');
    f.detectChanges();
    const chips = el.querySelectorAll<HTMLButtonElement>('.ct-focus-chip');
    expect(chips.length).toBe(3);
    expect(chips[2]!.getAttribute('aria-pressed')).toBe('true');
    chips[0]!.click();
    f.detectChanges();
    expect(vm.view()).toMatchObject({ focus: true, tab: 'finals' });
    expect(q(el, '.ct-focus-title b')!.textContent).toBe('交納素材');
  });

  it('Esc 返回三欄;在庫存輸入框裡按 Esc 不算', () => {
    const { f, el, vm } = mount(true);
    vm.patchView({ stockMode: true });
    vm.enterFocus('bases');
    f.detectChanges();
    const input = q(el, '.ct-have')!;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(vm.view().focus).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(vm.view().focus).toBe(false);
  });

  it('只看時點列仍可追蹤:橫幅(查價)與配方樹照常,但不標關聯、不變暗、不另開追蹤分類', () => {
    const { f, el, vm } = mount(true);
    vm.enterFocus('directs');
    f.detectChanges();
    const rows = () => el.querySelectorAll<HTMLElement>('.ct-focus-body .ct-row');
    const withTree = [...rows()].find((r) => vm.hasTree(r.querySelector('.ct-name')!.textContent!.trim()))!;
    const name = withTree.querySelector('.ct-name')!.textContent!.trim();
    withTree.click();
    f.detectChanges();
    expect(vm.pin()).toBe(name);
    expect(q(el, '.ct-trace')).toBeTruthy();
    expect(el.querySelectorAll('.ct-focus-body .ct-row.pin').length).toBe(1);
    expect(el.querySelector('.ct-focus-body .ct-row.dim')).toBeNull();
    expect(el.querySelector('.ct-focus-body .ct-row.rel')).toBeNull();
    expect(el.querySelector('.ct-focus-body .ct-group.trace')).toBeNull();
    // 再點一次 = 開配方樹
    [...rows()].find((r) => r.classList.contains('pin'))!.click();
    f.detectChanges();
    expect(vm.treeFor()).toBe(name);
  });

  it('只看時追蹤橫幅的查價鈕可用;工具列(庫存組)仍在', () => {
    const { f, el, vm } = mount(true);
    vm.enterFocus('bases');
    f.detectChanges();
    expect(q(el, '.ct-toolbar')).toBeTruthy();
    const row = [...el.querySelectorAll<HTMLElement>('.ct-focus-body .ct-row')].find((r) => vm.hasPrice(r.querySelector('.ct-name')!.textContent!.trim()))!;
    row.click();
    f.detectChanges();
    q(el, '.ct-price-go')!.click();
    f.detectChanges();
    expect(vm.priceFor()).toBe(row.querySelector('.ct-name')!.textContent!.trim());
  });

  it('手機:記住的 focus 不起作用(本來就是分頁單欄),關聯高亮照舊', () => {
    const { f, el, vm } = mount(false);
    vm.patchView({ focus: true });
    f.detectChanges();
    expect(vm.focusOn()).toBe(false);
    expect(el.querySelector('.ct-focus')).toBeNull();
    el.querySelector<HTMLElement>('.ct-row')!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-row.dim')).toBeTruthy();
  });

  it('窄螢幕時 focus 狀態保留:切回桌機仍是只看', () => {
    const { f, el, vm } = mount(true);
    vm.enterFocus('bases');
    const layout = TestBed.inject(Layout);
    layout.isDesktop.set(false);
    f.detectChanges();
    expect(vm.view().tab).toBe('bases');
    layout.isDesktop.set(true);
    f.detectChanges();
    expect(el.querySelector('.ct-focus')).toBeTruthy();
  });
});
