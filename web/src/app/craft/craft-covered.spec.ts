import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Layout } from '../core/layout';
import { CraftPage } from './craft-page';
import { CraftVm } from './craft-vm';

function mount() {
  TestBed.resetTestingModule();
  TestBed.inject(Layout).isDesktop.set(true);
  const vm = TestBed.inject(CraftVm);
  vm.setGrade('hull', 1); // 船體 2 級:黑膠 ×9(明膠怪的肉 27、布丁的肉 18、水之水晶 27 往下推)
  vm.patchView({ stockMode: true });
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement };
}

describe('上層備齊 → 下游需求扣成 0 的標示(D-346)', () => {
  beforeEach(() => localStorage.clear());

  it('交納素材備齊後,下游列標「上層已備齊」並保留原需求(刪除線);庫存數字不動', () => {
    const { f, vm, el } = mount();
    const jelly = () => vm.result().directs.find((r) => r.name === '明膠怪的肉')!;
    expect(vm.covered(jelly())).toBe(false);
    vm.setStock('黑膠', 9);
    f.detectChanges();
    expect(jelly().need).toBe(0);
    expect(vm.covered(jelly())).toBe(true);
    expect(vm.fullNeedOf(jelly())).toBe(27);
    expect(vm.stock()).toEqual({ 黑膠: 9 }); // 沒有偷偷補庫存
    const row = [...el.querySelectorAll<HTMLElement>('.ct-row.covered')].find((r) => r.textContent!.includes('明膠怪的肉'))!;
    expect(row.querySelector('.ct-covered-tag')!.textContent).toBe('上層已備齊');
    expect(row.querySelector('.ct-need-was')!.textContent).toBe('27');
  });

  it('沒備齊(部分庫存)只是需求變少,不標;關掉記錄庫存也不標;取消勾選後恢復', () => {
    const { f, vm, el } = mount();
    vm.setStock('黑膠', 3);
    f.detectChanges();
    const r = vm.result().directs.find((x) => x.name === '明膠怪的肉')!;
    expect(r.need).toBe(18);
    expect(vm.covered(r)).toBe(false);
    vm.setStock('黑膠', 9);
    vm.patchView({ stockMode: false });
    f.detectChanges();
    expect(el.querySelector('.ct-row.covered')).toBeNull();
    vm.patchView({ stockMode: true });
    vm.toggleDone(vm.result().finals.find((x) => x.name === '黑膠')!); // 再點一次清零
    f.detectChanges();
    expect(el.querySelector('.ct-row.covered')).toBeNull();
  });

  it('直接素材的可製作品備齊,基礎素材同樣標示', () => {
    const { vm } = mount();
    for (const g of [5, 6, 7, 8, 9]) {
      vm.setGrade('hull', g);
      if (vm.result().directs.some((r) => r.key.startsWith('d:'))) break;
    }
    const dir = vm.result().directs.find((r) => r.key.startsWith('d:'));
    expect(dir).toBeTruthy();
    vm.setStock(dir!.key, dir!.need);
    expect(vm.covered(vm.result().directs.find((r) => r.key === dir!.key)!)).toBe(false); // 自己是備齊,不是被扣成 0
    expect(vm.result().bases.some((b) => vm.covered(b))).toBe(true);
  });
});
