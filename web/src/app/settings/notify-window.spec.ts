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

  it('範本與清單模式:新增一段立刻多一列(緊貼前一段也不合併)、下拉選單排除已被選走的時間', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    const chip = (t: string) => Array.from(el(f).querySelectorAll<HTMLButtonElement>('.nw-chip')).find((b) => b.textContent?.trim() === t)!;
    chip('白天 08–22').click();
    expect(vm.rows()).toEqual([[480, 1320]]);
    vm.view.set('list');
    f.detectChanges();
    expect(el(f).querySelectorAll('.nw-range')).toHaveLength(1);

    (el(f).querySelector('.nw-ranges .nw-add') as HTMLButtonElement).click();
    f.detectChanges();
    // 第一個空格是 00:00,一小時;和 08:00–22:00 不相連,但即使相連也會是獨立一列
    expect(el(f).querySelectorAll('.nw-range')).toHaveLength(2);
    expect(vm.rows()).toEqual([[480, 1320], [0, 60]]);
    const second = el(f).querySelectorAll('.nw-range')[1]!;
    const opts = (sel: Element) => Array.from(sel.querySelectorAll('option')).map((o) => o.textContent);
    const [start, end] = Array.from(second.querySelectorAll('select'));
    expect(opts(start!)).not.toContain('08:00');
    expect(opts(start!)).not.toContain('21:45');
    expect(opts(start!)).toContain('22:00');
    expect(opts(end!).at(-1)).toBe('08:00');

    // 改第二列的結束時間;遮罩是兩列的聯集
    end!.value = String(120);
    end!.dispatchEvent(new Event('change'));
    expect(vm.rows()).toEqual([[480, 1320], [0, 120]]);
    expect(vm.draftSummary()).toContain('00:00–02:00、08:00–22:00');

    chip('清空').click();
    f.detectChanges();
    expect(vm.rows()).toEqual([]);
    expect(el(f).querySelectorAll('.nw-range')).toHaveLength(0);
  });

  it('Esc 關閉編輯器', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    f.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(vm.draft()).toBeNull();
  });

  it('名稱留白也能按儲存:標示名稱欄(紅框 + 提示)並對焦,不送出;輸入名稱後提示消失', async () => {
    const f = await render();
    const vm = TestBed.inject(NotifyWindowVm);
    vm.openNew();
    vm.patchDraft({ name: '' });
    vm.fill(36, 47, true);
    f.detectChanges();
    const save = [...el(f).querySelectorAll<HTMLButtonElement>('.rt-save-btn.primary')].find((b) => b.textContent?.includes('儲存'))!;
    expect(save.disabled).toBe(false);
    save.click();
    await settle();
    f.detectChanges();
    http.expectNone('/api/notify-windows');
    const input = el(f).querySelector<HTMLInputElement>('.nw-name')!;
    expect(input.classList.contains('error')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(el(f).querySelector('.nw-name-err')?.textContent).toContain('請輸入名稱');
    expect(document.activeElement).toBe(input);

    input.value = '假日';
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
    expect(input.classList.contains('error')).toBe(false);
    expect(el(f).querySelector('.nw-name-err')).toBeNull();
  });

  it('只有一組:清單照舊顯示在設定頁;兩組以上:改成一列「管理時段組」,清單在對話框裡', async () => {
    const f = await render();
    expect(el(f).querySelector('.nw-manage')).toBeNull();
    expect(el(f).querySelectorAll('.nw-list .nw-card')).toHaveLength(1);
    expect(el(f).textContent).toContain('新增時段組 1/10');

    const two: NotifyWindowsDto = { ...DATA, groups: [DATA.groups[0]!, { id: 'g2', name: '假日', days: 96, slots: SLOTS, enabled: false, position: 1 }] };
    TestBed.inject(NotifyWindowVm).data.set(two);
    f.detectChanges();
    expect(el(f).querySelectorAll('.nw-list .nw-card')).toHaveLength(0);
    const manage = el(f).querySelector<HTMLButtonElement>('.nw-manage')!;
    expect(manage.textContent).toContain('2/10 組,啟用 1 組');
    expect(manage.textContent).toContain('晚上、假日');
    expect(el(f).querySelector('.nw-dlg')).toBeNull();

    manage.click();
    f.detectChanges();
    expect(el(f).querySelectorAll('.nw-dlg .nw-card')).toHaveLength(2);

    // 從對話框點進編輯,Esc 先關編輯器、再關管理對話框
    el(f).querySelector<HTMLButtonElement>('.nw-dlg .nw-card-main')!.click();
    f.detectChanges();
    expect(TestBed.inject(NotifyWindowVm).draft()?.id).toBe('g1');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(TestBed.inject(NotifyWindowVm).draft()).toBeNull();
    expect(el(f).querySelector('.nw-dlg')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(el(f).querySelector('.nw-dlg')).toBeNull();
  });
});
