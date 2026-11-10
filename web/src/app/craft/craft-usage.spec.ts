import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Layout } from '../core/layout';
import { CraftPage } from './craft-page';
import { CraftVm } from './craft-vm';
import { CRAFT_DATA } from './core/data';
import { calculate } from './core/craft-calc';
import { usageOf } from './core/craft-usage';

function mount(desktop: boolean) {
  TestBed.resetTestingModule();
  TestBed.inject(Layout).isDesktop.set(desktop);
  const vm = TestBed.inject(CraftVm);
  vm.setGrade('hull', 5);
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement };
}
const rowOf = (el: HTMLElement, name: string) => [...el.querySelectorAll<HTMLElement>('.ct-row')].find((r) => r.querySelector('.ct-name')!.textContent!.trim().startsWith(name))!;

describe('素材用途(D-347)', () => {
  beforeEach(() => localStorage.clear());

  it('usageOf:列出用到該素材的交納 / 直接素材,用量 = 製作次數 × 配方,不看庫存', () => {
    const full = calculate([{ slot: 'hull', gradeIndex: 4, qty: 1 }], {}, CRAFT_DATA, {});
    const base = full.bases.find((r) => !(r.name in CRAFT_DATA.crafts) && [...full.directs, ...full.finals].some((x) => (x.inputs[r.name] ?? 0) > 0))!;
    const u = usageOf(base.name, full, full);
    expect(u.items.length).toBeGreaterThan(0);
    for (const it of u.items) expect(it.qty).toBeGreaterThan(0);
    expect(u.total).toBe(base.need);
    expect(u.items.every((it) => !it.covered)).toBe(true);
  });

  it('usageOf:上層庫存已夠做出該品項 → 標「已備齊」,但用途與用量仍在', () => {
    const sel = [{ slot: 'hull' as const, gradeIndex: 4, qty: 1 }];
    const full = calculate(sel, {}, CRAFT_DATA, {});
    const direct = full.directs.find((r) => r.crafts > 0)!;
    const raw = Object.keys(direct.inputs)[0]!;
    const actual = calculate(sel, {}, CRAFT_DATA, { ['d:' + direct.name]: direct.need, [direct.name]: direct.need });
    const u = usageOf(raw, full, actual);
    const hit = u.items.find((i) => i.name === direct.name && i.layer === 'direct');
    expect(hit?.qty).toBe(direct.inputs[raw]);
    expect(hit?.covered).toBe(true);
  });

  it('追蹤原料後橫幅有「用途」鈕;再點一次該列開用途面板,面板可關、可取消追蹤', () => {
    const { f, el, vm } = mount(true);
    const full = vm.result();
    const raw = full.bases.find((r) => !vm.hasTree(r.name) && usageOf(r.name, calculate(vm.selections(), {}), full).items.length > 0)!;
    rowOf(el, raw.name).click();
    f.detectChanges();
    expect(vm.pin()).toBe(raw.name);
    expect(el.querySelector('.ct-usage-go')).toBeTruthy();
    expect(vm.usageOpen()).toBe(false);
    rowOf(el, raw.name).click();
    f.detectChanges();
    expect(vm.usageOpen()).toBe(true);
    expect(el.querySelector('.ct-usage-dlg')).toBeTruthy();
    expect(el.querySelectorAll('.ct-usage-item').length).toBe(vm.pinUsage()!.items.length);
    el.querySelector<HTMLElement>('.ct-usage-dlg .modal-close')!.click();
    f.detectChanges();
    expect(el.querySelector('.ct-usage-dlg')).toBeNull();
    expect(vm.pin()).toBe(raw.name);
    vm.openUsage();
    f.detectChanges();
    [...el.querySelectorAll<HTMLElement>('.ct-usage-dlg .rt-save-btn')].find((b) => b.textContent!.includes('取消追蹤'))!.click();
    f.detectChanges();
    expect(vm.pin()).toBeNull();
    expect(vm.usageOpen()).toBe(false);
  });

  it('有配方樹的品項不顯示用途鈕,再點一次仍是配方樹', () => {
    const { f, el, vm } = mount(true);
    const d = vm.result().directs.find((r) => vm.hasTree(r.name))!;
    const row = () => rowOf(el, d.name);
    row().click();
    f.detectChanges();
    expect(el.querySelector('.ct-usage-go')).toBeNull();
    expect(vm.pinUsage()).toBeNull();
  });

  it('只看:快速切換徽章 = 各欄相關列數;跳過去只標色不變暗,上方細條可回原欄', () => {
    const { f, el, vm } = mount(true);
    const raw = vm.result().bases.find((r) => !/之(碎晶|水晶|晶簇)$/.test(r.name) && !vm.hasTree(r.name) && vm.result().directs.some((d) => (d.inputs[r.name] ?? 0) > 0))!;
    vm.enterFocus('bases');
    f.detectChanges();
    expect(el.querySelector('.ct-rbadge')).toBeNull();
    rowOf(el, raw.name).click();
    f.detectChanges();
    const counts = vm.relCounts();
    expect(counts.directs).toBeGreaterThan(0);
    const chips = el.querySelectorAll<HTMLElement>('.ct-focus-chip');
    expect(chips[1]!.querySelector('.ct-rbadge')!.textContent).toBe(String(counts.directs));
    expect(chips[2]!.querySelector('.ct-rbadge')).toBeNull(); // 基礎欄的相關列為 0 → 不顯示(同名直接列算在直接欄)
    expect(el.querySelector('.ct-relstrip')).toBeNull();
    chips[1]!.click();
    f.detectChanges();
    expect(el.querySelectorAll('.ct-focus-body .ct-row.rel').length).toBe(counts.directs);
    expect(el.querySelector('.ct-focus-body .ct-row.dim')).toBeNull();
    expect(el.querySelector('.ct-focus-body .ct-group.trace')).toBeNull();
    expect(el.querySelector('.ct-relstrip')!.textContent).toContain(raw.name);
    el.querySelector<HTMLElement>('.ct-relstrip-back')!.click();
    f.detectChanges();
    expect(vm.view().tab).toBe('bases');
    expect(el.querySelector('.ct-relstrip')).toBeNull();
  });
});
