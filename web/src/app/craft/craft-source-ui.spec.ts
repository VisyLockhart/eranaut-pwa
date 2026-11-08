import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Layout } from '../core/layout';
import { ThemeService } from '../core/theme';
import { IconComponent } from '../ui/icon';
import { CraftPage } from './craft-page';
import { CraftVm } from './craft-vm';

function mount(desktop: boolean) {
  TestBed.resetTestingModule();
  TestBed.inject(Layout).isDesktop.set(desktop);
  const vm = TestBed.inject(CraftVm);
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement };
}

/** 選滿四個部位的高等級配件,讓三層清單都有素材 */
function fill(vm: CraftVm) {
  for (const s of vm.slots) vm.setGrade(s, 9);
  vm.patchView({ tab: 'bases' });
}

describe('素材來源標示(D-333)', () => {
  beforeEach(() => localStorage.clear());

  for (const desktop of [true, false]) {
    const tag = desktop ? '桌機' : '手機';

    it(`${tag}:有其他來源的素材,名稱旁有膠囊;點列追蹤後橫幅出現來源標籤`, () => {
      const { f, vm, el } = mount(desktop);
      fill(vm);
      f.detectChanges();
      const row = [...el.querySelectorAll<HTMLElement>('.ct-row')].find((r) => r.querySelector('.ct-src-cue'));
      expect(row, '至少有一列有來源膠囊').toBeTruthy();
      expect(row!.querySelector('.ct-name .ct-src-cue')).toBeTruthy();
      expect(row!.querySelector('.ct-src-cue')!.getAttribute('aria-label')).toContain('其他來源');
      expect(el.querySelector('.ct-src-chip')).toBeNull();
      row!.click();
      f.detectChanges();
      const chips = el.querySelectorAll('.ct-src-chip:not(.det)');
      expect(chips.length).toBeGreaterThan(0);
      expect(el.querySelector('.ct-trace')!.classList.contains('has-src')).toBe(true);
      expect(!!el.querySelector('.ct-src-chip.det')).toBe(!desktop);
    });

    it(`${tag}:點來源標籤開詳情(${desktop ? '橫幅下方' : '底部面板'}),再點或取消追蹤就關`, () => {
      const { f, vm, el } = mount(desktop);
      fill(vm);
      f.detectChanges();
      [...el.querySelectorAll<HTMLElement>('.ct-row')].find((r) => r.querySelector('.ct-src-cue'))!.click();
      f.detectChanges();
      const open = desktop ? '.ct-src-pop' : '.ct-src-sheet';
      expect(el.querySelector(open)).toBeNull();
      el.querySelector<HTMLButtonElement>('.ct-src-chip')!.click();
      f.detectChanges();
      expect(el.querySelector(open)).toBeTruthy();
      expect(el.querySelector(`${open} .ct-src-grp`)).toBeTruthy();
      if (desktop) {
        el.querySelector<HTMLButtonElement>('.ct-src-chip')!.click();
        f.detectChanges();
        expect(el.querySelector(open)).toBeNull();
      } else {
        el.querySelector<HTMLButtonElement>('.ct-src-sheet .ct-done')!.click();
        f.detectChanges();
        expect(el.querySelector(open)).toBeNull();
      }
      el.querySelector<HTMLButtonElement>('.ct-src-chip')!.click();
      f.detectChanges();
      el.querySelector<HTMLButtonElement>('.ct-trace .ct-x')!.click();
      f.detectChanges();
      expect(vm.srcOpen()).toBe(false);
      expect(el.querySelector('.ct-src-chip')).toBeNull();
    });
  }

  it('沒有其他來源的素材:沒有膠囊,追蹤橫幅也沒有標籤', () => {
    const { f, vm, el } = mount(true);
    fill(vm);
    f.detectChanges();
    const row = [...el.querySelectorAll<HTMLElement>('.ct-row')].find((r) => !r.querySelector('.ct-src-cue'));
    if (!row) return; // 這個配置的素材全都有來源,沒東西可驗
    row.click();
    f.detectChanges();
    expect(el.querySelector('.ct-src-chip')).toBeNull();
    expect(el.querySelector('.ct-trace')!.classList.contains('has-src')).toBe(false);
  });

  it('頁面上不出現資料來源字樣(來源只放在資料授權頁)', () => {
    const { f, vm, el } = mount(true);
    fill(vm);
    f.detectChanges();
    [...el.querySelectorAll<HTMLElement>('.ct-row')].find((r) => r.querySelector('.ct-src-cue'))!.click();
    f.detectChanges();
    el.querySelector<HTMLButtonElement>('.ct-src-chip')!.click();
    f.detectChanges();
    expect(el.textContent).not.toContain('灰機');
    expect(el.textContent).not.toContain('資料來源');
  });
});

@Component({ imports: [IconComponent], template: `<app-icon name="srcCoin" /><app-icon name="srcSwap" /><app-icon name="srcBag" /><app-icon name="srcLock" />` })
class SrcIconsHost {}

describe('素材來源圖示(D-333)', () => {
  const draw = async (theme: 'classic' | 'light' | 'dark' | 'notebook') => {
    TestBed.inject(ThemeService).set(theme);
    const f = TestBed.createComponent(SrcIconsHost);
    await f.whenStable();
    return [...f.nativeElement.querySelectorAll('app-icon')].map((e) => (e as HTMLElement).innerHTML);
  };

  it('經典 / 深色共用線條;淺色是像素;手札是手繪', async () => {
    const classic = await draw('classic');
    expect(await draw('dark')).toEqual(classic);
    classic.forEach((h) => expect(h).toContain('stroke="currentColor"'));
    const light = await draw('light');
    const nb = await draw('notebook');
    classic.forEach((c, i) => {
      expect(light[i]).toContain('shape-rendering="crispEdges"');
      expect(light[i]).not.toBe(c);
      expect(nb[i]).toContain('stroke-width="1.9"');
      expect(nb[i]).not.toBe(c);
    });
  });
});
