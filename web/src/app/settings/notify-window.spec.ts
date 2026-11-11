import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { slotsFromRanges, type NotifyWindowsDto } from '@eranaut/shared';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { NotifyWindowVm } from '../core/notify-window-vm';
import { NotifyWindow } from './notify-window';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const SLOTS = slotsFromRanges([[720, 810], [1140, 1410]]);
const DATA: NotifyWindowsDto = { on: true, scope: { dm: true, channel: true, push: true }, limit: 10, groups: [{ id: 'g1', name: '晚上', days: 127, slots: SLOTS, enabled: true, position: 0 }] };

function ptr(type: string, pointerType: string, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType, ...init });
}

describe('NotifyWindow 元件(D-348)', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
  });

  async function render(desktop = true, data: NotifyWindowsDto = DATA) {
    TestBed.inject(Layout);
    const fixture = TestBed.createComponent(NotifyWindow);
    fixture.detectChanges();
    http.expectOne('/api/notify-windows').flush(data);
    await settle();
    fixture.detectChanges();
    void desktop;
    return fixture;
  }
  const el = (f: { nativeElement: unknown }) => f.nativeElement as HTMLElement;

  it('列出時段組:名稱、適用星期、區間與 96 格迷你條;關閉時只顯示總開關', async () => {
    const f = await render();
    expect(el(f).textContent).toContain('晚上');
    expect(el(f).textContent).toContain('每天');
    expect(el(f).textContent).toContain('12:00–13:30、19:00–23:30');
    expect(el(f).querySelectorAll('.nw-bar i')).toHaveLength(96);
    expect(el(f).querySelectorAll('.nw-bar i.on')).toHaveLength(6 + 18);
    expect(el(f).textContent).toContain('新增時段組 1/10');

    TestBed.inject(NotifyWindowVm).data.set({ ...DATA, on: false });
    f.detectChanges();
    expect(el(f).querySelector('.nw-list')).toBeNull();
  });

  it('沒有啟用中的組時顯示警告', async () => {
    const f = await render(true, { ...DATA, groups: [{ ...DATA.groups[0]!, enabled: false }] });
    expect(el(f).querySelector('.nw-warn')?.textContent).toContain('提醒不會送出');
  });

  it('桌機:滑鼠按住拖曳連續塗選,再按已選的格子起拖曳則是清除', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    const grid = el(f).querySelector('.nw-grid') as HTMLElement;
    const cell = (i: number) => grid.querySelector(`[data-i="${i}"]`) as HTMLElement;
    grid.setPointerCapture = () => undefined;
    // elementFromPoint 在 jsdom/headless 沒有版面,改指向我們要的格子
    let under: HTMLElement = cell(10);
    const orig = document.elementFromPoint;
    document.elementFromPoint = () => under;
    try {
      cell(10).dispatchEvent(ptr('pointerdown', 'mouse'));
      under = cell(14);
      grid.dispatchEvent(ptr('pointermove', 'mouse'));
      grid.dispatchEvent(ptr('pointerup', 'mouse'));
      expect(vm.draftRanges()).toEqual([[150, 225]]);
      // 從已選格子開始 → 清除
      under = cell(12);
      cell(12).dispatchEvent(ptr('pointerdown', 'mouse'));
      under = cell(13);
      grid.dispatchEvent(ptr('pointermove', 'mouse'));
      grid.dispatchEvent(ptr('pointerup', 'mouse'));
      expect(vm.draftRanges()).toEqual([[150, 180], [210, 225]]);
    } finally {
      document.elementFromPoint = orig;
    }
  });

  it('手機:點一格選起點、再點另一格填滿中間;點同一格取消起點', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    const grid = el(f).querySelector('.nw-grid') as HTMLElement;
    const cell = (i: number) => grid.querySelector(`[data-i="${i}"]`) as HTMLElement;
    cell(20).dispatchEvent(ptr('pointerdown', 'touch'));
    cell(20).dispatchEvent(ptr('pointerup', 'touch'));
    expect(vm.draftRanges()).toEqual([[300, 315]]);
    cell(27).dispatchEvent(ptr('pointerdown', 'touch'));
    cell(27).dispatchEvent(ptr('pointerup', 'touch'));
    expect(vm.draftRanges()).toEqual([[300, 420]]);
    // 起點後點同一格:只取消起點,不再切換
    cell(40).dispatchEvent(ptr('pointerup', 'touch'));
    cell(40).dispatchEvent(ptr('pointerup', 'touch'));
    expect(vm.draft()?.slots[40]).toBe('1');
  });

  it('鍵盤(click detail = 0)切換格子;滑鼠的 click 不重複切換', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    const c = el(f).querySelector('[data-i="3"]') as HTMLElement;
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(vm.draft()?.slots[3]).toBe('1');
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(vm.draft()?.slots[3]).toBe('1');
  });

  it('範本、清單模式的時間下拉與新增/刪除一段', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    const chip = (t: string) => Array.from(el(f).querySelectorAll<HTMLButtonElement>('.nw-chip')).find((b) => b.textContent?.trim() === t)!;
    chip('白天 08–22').click();
    expect(vm.draftRanges()).toEqual([[480, 1320]]);
    vm.view.set('list');
    f.detectChanges();
    const selects = el(f).querySelectorAll<HTMLSelectElement>('.nw-range select');
    expect(selects).toHaveLength(2);
    selects[1]!.value = '1260';
    selects[1]!.dispatchEvent(new Event('change'));
    expect(vm.draftRanges()).toEqual([[480, 1260]]);
    (el(f).querySelector('.nw-ranges .nw-add') as HTMLButtonElement).click();
    // 最後一段到 21:00,「新增一段」從 21:00 起補一小時,與前一段相連合併
    expect(vm.draftRanges()).toEqual([[480, 1320]]);
    chip('清空').click();
    expect(vm.draftRanges()).toEqual([]);
  });

  it('Esc 關閉編輯器', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(vm.draft()).toBeNull();
  });
});
