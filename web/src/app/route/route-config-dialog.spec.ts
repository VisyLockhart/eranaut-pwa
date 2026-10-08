import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Toast } from '../core/toast';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteConfigDialog } from './route-config-dialog';
import { RouteVm } from './route-vm';

const g = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RouteConfigDialog', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteConfigDialog>>;

  async function mount(saved: RouteSubDto[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RouteConfigDialog);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }
  const open = (mode: 'new' | 'edit' | 'temp' = 'new', id: string | null = null) => {
    vm.openConfig(mode, id);
    fixture.detectChanges();
  };
  const btn = (text: string) => [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;
  const part = (label: string) => el.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const rowTotal = (label: string) => [...el.querySelectorAll('.rt-stats tbody tr')].find((r) => r.querySelector('th')?.textContent?.trim() === label)!.querySelector('.rt-total')!.textContent!.trim();
  const type = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('沒開啟時什麼都不畫', async () => {
    await mount();
    expect(el.querySelector('.rt-dlg')).toBeNull();
  });

  it('五列 × 四個零件,每格 1 | 1改 兩顆按鈕;標題依模式', async () => {
    await mount([dto()]);
    open('new');
    expect(el.querySelectorAll('.rt-parts-row')).toHaveLength(5);
    expect(el.querySelectorAll('.rt-part')).toHaveLength(40);
    expect(el.querySelector('.modal-title')?.textContent).toContain('新增配置');
    vm.closeConfig();
    open('edit', 'a');
    expect(el.querySelector('.modal-title')?.textContent).toContain('編輯配置');
    vm.closeConfig();
    open('temp');
    expect(el.querySelector('.modal-title')?.textContent).toContain('臨時');
  });

  it('點零件與改等級只動草稿,不動畫面上的配置與航點;統計表即時變(案例 C:距離 98、巡航 155)', async () => {
    await mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
    const before = vm.seq();
    open('temp');
    expect(rowTotal('距離')).toBe('98');
    expect(rowTotal('巡航')).toBe('155');
    part('船體 3改').click();
    fixture.detectChanges();
    expect(vm.draft()!.parts[0]).toBe(8);
    expect(part('船體 3改').getAttribute('aria-pressed')).toBe('true');
    // 取消:航點與配置不變
    const lv = el.querySelector<HTMLInputElement>('#rt-cfg-level')!;
    lv.value = '1';
    lv.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(vm.draft()!.level).toBe(1);
    btn('取消').click();
    fixture.detectChanges();
    expect(vm.draft()).toBeNull();
    expect(vm.level()).toBe(76);
    expect(vm.parts()).toEqual([3, 1, 2, 3]);
    expect(vm.seq()).toEqual(before);
  });

  it('有路線時統計表顯示需求與顏色;超重會警告', async () => {
    await mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
    open('temp');
    const rg = [...el.querySelectorAll('.rt-stats tbody tr')].find((r) => r.querySelector('th')?.textContent?.trim() === '距離')!;
    expect(rg.querySelector('.rt-need')?.textContent?.trim()).toBe('87');
    expect(rg.querySelector('.rt-total')?.classList.contains('g-full')).toBe(true);
    expect(el.querySelector('.rt-dirty.bad')).toBeNull();
    vm.setDraftLevel(1); // 1 級重量上限 20
    for (let i = 0; i < 4; i++) vm.setDraftPart(i as 0 | 1 | 2 | 3, 10);
    fixture.detectChanges();
    expect(el.querySelector('.rt-dirty.bad')?.textContent).toContain('重量');
  });

  it('沒選航點時,需求欄為破折號並提示', async () => {
    await mount();
    open('new');
    const rg = [...el.querySelectorAll('.rt-stats tbody tr')].find((r) => r.querySelector('th')?.textContent?.trim() === '距離')!;
    expect(rg.querySelector('.rt-need')?.textContent?.trim()).toBe('—');
    expect(el.textContent).toContain('還沒選航點');
  });

  it('「只套用」:不打伺服器,成為臨時配置(不再使用儲存配置)並關閉', async () => {
    await mount([dto()]);
    vm.useSub('a');
    open('edit', 'a');
    part('船體 4').click();
    fixture.detectChanges();
    btn('只套用').click();
    fixture.detectChanges();
    http.expectNone('/api/route-subs');
    expect(vm.subId()).toBeNull();
    expect(vm.parts()[0]).toBe(4);
    expect(vm.draft()).toBeNull();
  });

  it('新增並儲存:預設名稱、字數驗證、送出等級與零件', async () => {
    await mount();
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    open('new');
    const input = el.querySelector<HTMLInputElement>('#rt-cfg-name')!;
    expect(input.value).toBe('Lv76 3/1/2/3');
    type(input, '一二三四五六七八九十一二三四五六七八九十一');
    expect(btn('儲存為新配置').disabled).toBe(true);
    type(input, '我的艇');
    btn('儲存為新配置').click();
    const req = http.expectOne('/api/route-subs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: '我的艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [] });
    req.flush(dto({ id: 'n', name: '我的艇' }));
    await settle();
    fixture.detectChanges();
    expect(vm.saved().map((s) => s.name)).toEqual(['我的艇']);
    expect(vm.subId()).toBe('n');
    expect(TestBed.inject(Toast).items().some((t) => t.text.includes('已加入'))).toBe(true);
    expect(el.querySelector('.rt-dlg')).toBeNull();
  });

  it('預設名稱會跟著零件變,手動改過名稱就不再自動換', async () => {
    await mount();
    open('new');
    const input = el.querySelector<HTMLInputElement>('#rt-cfg-name')!;
    part('船體 2').click();
    fixture.detectChanges();
    expect(vm.draft()!.name).toBe(`Lv${vm.draft()!.level} 2/1/1/1`);
    type(input, '自訂');
    part('船體 3').click();
    fixture.detectChanges();
    expect(vm.draft()!.name).toBe('自訂');
  });

  it('編輯儲存的配置:PUT 覆蓋同一組,保留綁定', async () => {
    await mount([dto({ bound_submarine_ids: ['sub1'] })]);
    open('edit', 'a');
    part('船體 4').click();
    fixture.detectChanges();
    btn('儲存').click();
    const req = http.expectOne('/api/route-subs/a');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ name: '主力艇', hull: 4, bound_submarine_ids: ['sub1'] });
    req.flush(dto({ hull: 4, bound_submarine_ids: ['sub1'] }));
    await settle();
    expect(vm.saved()[0]!.hull).toBe(4);
    expect(vm.subId()).toBe('a');
    expect(vm.draft()).toBeNull();
  });

  it('已滿 10 組:改成選一組覆蓋,再按一次確認才送出 PUT(保留那一組的名稱)', async () => {
    const full = Array.from({ length: 10 }, (_, i) => dto({ id: `s${i}`, name: `艇${i}` }));
    await mount(full);
    vm.setLevel(100);
    open('new');
    btn('儲存為新配置').click();
    fixture.detectChanges();
    expect(el.textContent).toContain('已滿 10 組');
    el.querySelectorAll<HTMLButtonElement>('.rt-pick')[3]!.click();
    fixture.detectChanges();
    http.expectNone('/api/route-subs/s3');
    btn('確定覆蓋這一組').click();
    const req = http.expectOne('/api/route-subs/s3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.level).toBe(100);
    expect(req.request.body.name).toBe('艇3');
    req.flush(dto({ id: 's3', name: '艇3', level: 100 }));
    await settle();
    expect(vm.saved().find((s) => s.id === 's3')!.level).toBe(100);
    expect(vm.draft()).toBeNull();
  });

  it('伺服器回 409(別的裝置剛存滿):重抓清單並改成選一組覆蓋', async () => {
    await mount();
    open('new');
    btn('儲存為新配置').click();
    http.expectOne('/api/route-subs').flush({ error: 'limit_reached' }, { status: 409, statusText: 'Conflict' });
    await settle();
    http.expectOne('/api/route-subs').flush(Array.from({ length: 10 }, (_, i) => dto({ id: `s${i}`, name: `艇${i}` })));
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('.rt-save-error')?.textContent).toContain('10 組');
    expect(el.querySelectorAll('.rt-pick')).toHaveLength(10);
  });

  it('寫入失敗(沒網路)只顯示錯誤,不改清單,草稿保留', async () => {
    await mount();
    open('new');
    btn('儲存為新配置').click();
    http.expectOne('/api/route-subs').error(new ProgressEvent('error'));
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('.rt-save-error')?.textContent).toContain('沒有網路');
    expect(vm.saved()).toEqual([]);
    expect(vm.draft()).not.toBeNull();
  });

  it('背景點擊:沒改過才關閉;改過就留著;Esc 一律關閉', async () => {
    await mount();
    open('new');
    const click = () => {
      const overlay = el.querySelector<HTMLElement>('.modal-overlay')!;
      overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      overlay.click();
      fixture.detectChanges();
    };
    part('船體 3').click();
    fixture.detectChanges();
    click();
    expect(vm.draft()).not.toBeNull();
    // 點在對話框內部不算背景
    el.querySelector<HTMLElement>('.rt-dlg')!.click();
    expect(vm.draft()).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(vm.draft()).toBeNull();
    open('new');
    click();
    expect(vm.draft()).toBeNull();
  });

  it('手機是整頁表單,底部固定列有性能摘要;桌機沒有', async () => {
    await mount();
    open('new');
    expect(el.querySelector('.modal-overlay')?.classList.contains('rt-sheet')).toBe(true);
    expect(el.querySelector('.rt-dlg-sum')?.textContent).toContain('距離');
  });
});
