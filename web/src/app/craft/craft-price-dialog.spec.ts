import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from '../core/layout';
import { PriceError, type PriceListing, type PriceQuote } from './core/price-types';
import { ITEM_IDS } from './core/data';
import { CraftPage } from './craft-page';
import { CraftPrice } from './craft-price';
import { CraftVm } from './craft-vm';

const L = (o: Partial<PriceListing> = {}): PriceListing => ({ pricePerUnit: 118, quantity: 90, total: 10620, retainerName: '芳吉', world: '巴哈姆特', hq: false, ...o });
const quote = (listings: PriceListing[], lastUploadAt: number | null = Date.now() - 5 * 60_000): PriceQuote => ({ itemId: 5116, fetchedAt: Date.now(), lastUploadAt, listings });

type Deferred = { resolve: (q: PriceQuote) => void; reject: (e: unknown) => void; signal?: AbortSignal; id: number };

function mount(desktop: boolean) {
  TestBed.resetTestingModule();
  const calls: Deferred[] = [];
  const stub = {
    get: vi.fn((id: number, signal?: AbortSignal) => new Promise<PriceQuote>((resolve, reject) => { calls.push({ resolve, reject, signal, id }); })),
    refresh: vi.fn((id: number, signal?: AbortSignal) => new Promise<PriceQuote>((resolve, reject) => { calls.push({ resolve, reject, signal, id }); })),
  };
  TestBed.configureTestingModule({ providers: [{ provide: CraftPrice, useValue: stub }] });
  TestBed.inject(Layout).isDesktop.set(desktop);
  const vm = TestBed.inject(CraftVm);
  vm.setGrade('hull', 0);
  const f = TestBed.createComponent(CraftPage);
  f.detectChanges();
  return { f, vm, el: f.nativeElement as HTMLElement, calls, stub };
}
const settle = async (f: { detectChanges(): void }) => { await Promise.resolve(); await Promise.resolve(); f.detectChanges(); };

describe('素材查價(D-343)', () => {
  beforeEach(() => localStorage.clear());

  for (const desktop of [false, true]) {
    const tag = desktop ? '桌機' : '手機';

    it(`追蹤素材時橫幅有「查價」鈕;骨架與沒追蹤時沒有(${tag})`, () => {
      const { f, vm, el } = mount(desktop);
      expect(el.querySelector('.ct-price-go')).toBeNull();
      vm.togglePin('鈷鐵礦', 'base');
      f.detectChanges();
      const btn = el.querySelector<HTMLButtonElement>('.ct-price-go')!;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('查價');
      expect(btn.getAttribute('aria-label')).toBe('查價 鈷鐵礦');
      expect(el.querySelector('.ct-trace')!.classList.contains('has-price')).toBe(true);
      // 查價鈕在名稱之後、取消 ✕ 之前
      const kids = [...el.querySelector('.ct-trace')!.children];
      expect(kids.indexOf(btn)).toBeGreaterThan(kids.findIndex((c) => c.tagName === 'B'));
      expect(kids.indexOf(btn)).toBeLessThan(kids.findIndex((c) => c.classList.contains('ct-x')));
      // 骨架列(不是物品)沒有
      vm.togglePin('鈷鐵礦', 'base');
      vm.togglePin(vm.result().finals.find((r) => r.frame)?.name ?? '希爾德拉級船體骨架', 'final');
      f.detectChanges();
      expect(el.querySelector('.ct-price-go')).toBeNull();
    });

    it(`按下查價:視窗先開成骨架,以物品 ID 查詢,回來後顯示表格與頁尾(${tag})`, async () => {
      const { f, vm, el, calls, stub } = mount(desktop);
      vm.togglePin('鈷鐵礦', 'base');
      f.detectChanges();
      el.querySelector<HTMLButtonElement>('.ct-price-go')!.click();
      f.detectChanges();
      const dlg = el.querySelector('.ct-price-dlg')!;
      expect(dlg).toBeTruthy();
      expect(dlg.querySelector('.modal-title')!.textContent).toBe('鈷鐵礦');
      expect(dlg.textContent).toContain('查價 · 陸行鳥');
      expect(dlg.querySelectorAll('.ct-price-sk-row').length).toBe(10);
      expect(dlg.querySelector('table')).toBeNull();
      expect(stub.get).toHaveBeenCalledTimes(1);
      expect(calls[0]!.id).toBe(ITEM_IDS['鈷鐵礦']);
      expect(el.querySelector('.modal-overlay')!.classList.contains('rt-sheet')).toBe(!desktop);

      calls[0]!.resolve(quote([L({ hq: true, pricePerUnit: 118 }), L({ pricePerUnit: 10620, quantity: 1234, total: 12_345_678, retainerName: '澄星', world: '鳳凰' })]));
      await settle(f);
      expect(dlg.querySelector('.ct-price-sk')).toBeNull();
      const heads = [...dlg.querySelectorAll('th')].map((h) => h.textContent);
      expect(heads).toEqual(['單價', '數量', '總計', '雇員', '服務器']);
      const rows = dlg.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
      expect(rows[0]!.classList.contains('low')).toBe(true);
      expect(rows[1]!.classList.contains('low')).toBe(false);
      const cells = [...rows[0]!.querySelectorAll('td')].map((c) => c.textContent!.trim());
      expect(cells).toEqual(['118HQ', '90', '10,620', '芳吉', '巴哈姆特']);
      expect(rows[0]!.querySelector('.ct-hq')).toBeTruthy();
      expect(rows[1]!.querySelector('.ct-hq')).toBeNull();
      expect(rows[1]!.querySelectorAll('td')[2]!.textContent).toBe('12,345,678');
      const info = dlg.querySelector('.ct-price-info')!.textContent!;
      expect(info).toMatch(/查詢於 \d\d:\d\d/);
      expect(info).toContain('更新於 5 分鐘前');
      expect(dlg.querySelector('.ct-price-ago')!.classList.contains('stale')).toBe(false);
    });
  }

  it('資料超過 24 小時沒更新:「更新於」標成過期;沒有上傳時間就不顯示', async () => {
    const { f, vm, el, calls } = mount(true);
    vm.openPrice('鈷鐵礦');
    f.detectChanges();
    calls[0]!.resolve(quote([L()], Date.now() - 30 * 3_600_000));
    await settle(f);
    const ago = el.querySelector('.ct-price-ago')!;
    expect(ago.textContent).toContain('更新於 1 天前');
    expect(ago.classList.contains('stale')).toBe(true);

    vm.closePrice();
    f.detectChanges();
    vm.openPrice('鈷鐵礦');
    f.detectChanges();
    calls[1]!.resolve(quote([L()], null));
    await settle(f);
    expect(el.querySelector('.ct-price-ago')).toBeNull();
    expect(el.querySelector('.ct-price-info')!.textContent).toMatch(/查詢於/);
  });

  it('沒有掛單:顯示一句話,不顯示表格', async () => {
    const { f, vm, el, calls } = mount(true);
    vm.openPrice('鈷鐵礦');
    f.detectChanges();
    calls[0]!.resolve(quote([]));
    await settle(f);
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.ct-price-msg')!.textContent).toContain('目前沒有人在賣');
  });

  it('失敗:顯示原因,「重新查詢」變主要鈕;按下略過快取重查,成功後顯示表格', async () => {
    const { f, vm, el, calls, stub } = mount(true);
    vm.openPrice('鈷鐵礦');
    f.detectChanges();
    calls[0]!.reject(new PriceError('rate-limit'));
    await settle(f);
    const msg = el.querySelector('.ct-price-msg.err')!;
    expect(msg.getAttribute('role')).toBe('alert');
    expect(msg.textContent).toContain('查詢太頻繁');
    const [retry, close] = [...el.querySelectorAll<HTMLButtonElement>('.ct-price-foot .rt-save-btn')];
    expect(retry!.textContent).toBe('重新查詢');
    expect(retry!.classList.contains('primary')).toBe(true);
    expect(close!.classList.contains('primary')).toBe(false);
    expect(el.querySelector('.ct-price-info')!.textContent!.trim()).toBe('');

    retry!.click();
    f.detectChanges();
    expect(stub.refresh).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.ct-price-sk')).toBeTruthy();
    expect(retry!.disabled).toBe(true); // 查詢中不能再按
    calls[1]!.resolve(quote([L()]));
    await settle(f);
    expect(el.querySelector('table')).toBeTruthy();
    expect(el.querySelector('.ct-price-msg')).toBeNull();
  });

  it('各種失敗原因都有對應文字;不認識的錯誤當作連不上', async () => {
    const texts: [unknown, string][] = [
      [new PriceError('timeout'), '查詢逾時'],
      [new PriceError('network'), '連不上查價服務'],
      [new PriceError('server'), '查價服務暫時無法使用'],
      [new PriceError('format'), '無法辨識'],
      [new PriceError('not-found'), '沒有這個物品'],
      [new Error('boom'), '連不上查價服務'],
    ];
    for (const [err, text] of texts) {
      const { f, vm, el, calls } = mount(true);
      vm.openPrice('鈷鐵礦');
      f.detectChanges();
      calls[0]!.reject(err);
      await settle(f);
      expect(el.querySelector('.ct-price-msg.err')!.textContent, text).toContain(text);
    }
  });

  it('關閉(✕、關閉鈕、點背景、Esc)都會中止進行中的請求;Esc 先關查價視窗', () => {
    const { f, vm, el, calls } = mount(false);
    vm.togglePin('鈷鐵礦', 'base');
    f.detectChanges();
    const open = () => { vm.openPrice('鈷鐵礦'); f.detectChanges(); };
    open();
    expect(calls[0]!.signal!.aborted).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(vm.priceFor()).toBeNull();
    expect(el.querySelector('.ct-price-dlg')).toBeNull();
    expect(calls[0]!.signal!.aborted).toBe(true);
    expect(vm.pin()).toBe('鈷鐵礦'); // 追蹤還在

    open();
    el.querySelector<HTMLButtonElement>('.ct-price-dlg .modal-close')!.click();
    f.detectChanges();
    expect(vm.priceFor()).toBeNull();
    expect(calls[1]!.signal!.aborted).toBe(true);

    open();
    const overlay = el.querySelector<HTMLElement>('.modal-overlay')!;
    overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    overlay.click();
    f.detectChanges();
    expect(vm.priceFor()).toBeNull();

    open();
    const close = [...el.querySelectorAll<HTMLButtonElement>('.ct-price-foot .rt-save-btn')][1]!;
    close.click();
    f.detectChanges();
    expect(vm.priceFor()).toBeNull();
  });

  it('資料集每個素材都能開查價;不在對照表的名稱不會開', () => {
    const { vm } = mount(true);
    for (const n of Object.keys(ITEM_IDS)) expect(vm.hasPrice(n), n).toBe(true);
    vm.openPrice('不存在的東西');
    expect(vm.priceFor()).toBeNull();
    vm.openPrice('constructor');
    expect(vm.priceFor()).toBeNull();
    vm.openPrice('氣泡水');
    expect(vm.priceFor()).toBe('氣泡水');
  });
});
