import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CraftStockDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { CraftPage } from './craft-page';
import { CRAFT_FEATURES } from './craft-features';
import { CraftStockVm } from './craft-stock-vm';
import { CraftVm } from './craft-vm';

const U = '/api/craft-stocks';
const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const row = (over: Partial<CraftStockDto> = {}): CraftStockDto => ({
  id: 'a', name: '主力', spec: { v: 1, sel: { bow: { grade: 2, qty: 1 } }, stock: {} },
  favorite: false, created_at: '', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});

describe('庫存組的畫面(D-329)', () => {
  let el: HTMLElement;
  let f: ReturnType<typeof TestBed.createComponent<CraftPage>>;
  let http: HttpTestingController;
  let craft: CraftVm;
  let sv: CraftStockVm;

  async function mount(list: CraftStockDto[], desktop = false, features?: { stockSets: boolean }) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), ...(features ? [{ provide: CRAFT_FEATURES, useValue: features }] : [])] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(desktop);
    craft = TestBed.inject(CraftVm);
    sv = TestBed.inject(CraftStockVm);
    http = TestBed.inject(HttpTestingController);
    f = TestBed.createComponent(CraftPage);
    f.detectChanges();
    if (features?.stockSets === false) http.expectNone(U);
    else http.expectOne(U).flush(list);
    await tick();
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(text))!;
  const bar = () => el.querySelector('app-craft-stock-bar')!;
  const dlg = () => document.querySelector('app-craft-stock-dialogs [role=dialog]') as HTMLElement | null;
  const dlgBtn = (text: string) => btn(text, dlg()!.querySelector('.rt-dlg-foot')!);
  const pickOption = (label: string) => {
    bar().querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
    f.detectChanges();
    [...bar().querySelectorAll<HTMLElement>('.sel-opt')].find((o) => o.textContent!.trim().startsWith(label))!.click();
    f.detectChanges();
  };
  const fill = () => {
    if (craft.sel().hull.gradeIndex !== 5) craft.setGrade('hull', 5);
    craft.setStock(craft.result().finals[0]!.key, 3);
    f.detectChanges();
  };

  beforeEach(() => localStorage.clear());

  for (const desktop of [false, true]) {
    it(`展示模式:整列不顯示、不呼叫伺服器(${desktop ? '桌機' : '手機'})`, async () => {
      await mount([], desktop, { stockSets: false });
      expect(el.querySelector('.ct-setbar')).toBeNull();
    });
  }

  it('沒選配件或沒庫存時「儲存」不能按;都有才能按,預設名稱「庫存 月/日」,存成功關閉', async () => {
    await mount([]);
    expect(btn('儲存', bar()).disabled).toBe(true);
    craft.setGrade('hull', 5);
    f.detectChanges();
    expect(btn('儲存', bar()).disabled).toBe(true);
    fill();
    expect(btn('儲存', bar()).disabled).toBe(false);
    btn('儲存', bar()).click();
    f.detectChanges();
    expect(dlg()).not.toBeNull();
    expect(dlg()!.textContent).toContain('庫存 1 項');
    await tick();
    f.detectChanges();
    expect(dlg()!.querySelector<HTMLInputElement>('input[type=text]')!.value).toMatch(/^庫存 \d+\/\d+$/);
    dlgBtn('儲存').click();
    const req = http.expectOne(U);
    req.flush(row({ id: 'n', name: req.request.body.name, spec: req.request.body.spec }), { status: 201, statusText: 'Created' });
    await tick();
    f.detectChanges();
    expect(dlg()).toBeNull();
    expect(sv.saved()).toHaveLength(1);
  });

  it('畫面空白時選一組直接載入並打開記錄庫存;有內容時先確認,取消不變、「換掉並載入」才換', async () => {
    await mount([row()]);
    pickOption('主力');
    expect(dlg()).toBeNull();
    expect(craft.sel().bow.gradeIndex).toBe(2);
    expect(craft.view().stockMode).toBe(true);

    await mount([row(), row({ id: 'b', name: '另一組', spec: { v: 1, sel: { stern: { grade: 1, qty: 1 } }, stock: {} } })]);
    craft.setGrade('hull', 5);
    f.detectChanges();
    pickOption('另一組');
    expect(dlg()!.textContent).toContain('要換掉目前的配件與庫存嗎?');
    expect(craft.sel().stern.gradeIndex).toBeNull();
    dlgBtn('取消').click();
    f.detectChanges();
    expect(dlg()).toBeNull();
    expect(craft.sel().hull.gradeIndex).toBe(5);
    pickOption('另一組');
    dlgBtn('換掉並載入').click();
    f.detectChanges();
    expect(craft.sel().hull.gradeIndex).toBeNull();
    expect(craft.sel().stern.gradeIndex).toBe(1);
  });

  it('確認視窗的「先儲存目前的」:存成新組後接著載入;沒庫存可存時不顯示這個按鈕', async () => {
    await mount([row()]);
    craft.setGrade('hull', 5);
    f.detectChanges();
    pickOption('主力');
    expect(btn('先儲存目前的', dlg()!)).toBeUndefined();
    dlgBtn('取消').click();
    fill();
    pickOption('主力');
    dlgBtn('先儲存目前的').click();
    f.detectChanges();
    expect(dlg()!.textContent).toContain('儲存庫存組');
    await tick();
    f.detectChanges();
    dlgBtn('儲存').click();
    const req = http.expectOne(U);
    req.flush(row({ id: 'n2', name: req.request.body.name, spec: req.request.body.spec }), { status: 201, statusText: 'Created' });
    await tick();
    f.detectChanges();
    expect(dlg()).toBeNull();
    expect(craft.sel().bow.gradeIndex).toBe(2);
    expect(sv.activeId()).toBe('a');
  });

  for (const desktop of [false, true]) {
    it(`「複製」鈕(D-337):庫存組列開啟時在列內,展示版放回工具列;沒選配件停用(${desktop ? '桌機' : '手機'})`, async () => {
      await mount([], desktop);
      expect(el.querySelectorAll('.ct-copy')).toHaveLength(1);
      expect(el.querySelector('.ct-setbar .ct-copy')).toBeTruthy();
      expect(el.querySelector<HTMLButtonElement>('.ct-copy')!.disabled).toBe(true);
      craft.setGrade('hull', 5);
      f.detectChanges();
      expect(el.querySelector<HTMLButtonElement>('.ct-copy')!.disabled).toBe(false);
      expect(el.querySelector('.ct-copy')!.textContent!.trim()).toBe('複製');
      await mount([], desktop, { stockSets: false });
      expect(el.querySelectorAll('.ct-copy')).toHaveLength(1);
      expect(el.querySelector('.ct-setbar')).toBeNull();
      expect(el.querySelector('.ct-toolbar .ct-copy')).toBeTruthy();
    });
  }

  it('「複製」複製畫面上目前的清單;載入庫存組又改過內容時,提示標「已修改」(D-337)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    await mount([row()]);
    pickOption('主力');
    const copy = () => bar().querySelector<HTMLButtonElement>('.ct-copy')!;
    expect(copy().getAttribute('aria-label')).toBe('複製目前清單');
    craft.setGrade('hull', 3);
    f.detectChanges();
    expect(copy().getAttribute('aria-label')).toBe('複製目前(已修改)');
    copy().click();
    await tick();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]![0]).toBe(craft.copyText([craft.view().tab]));
    f.detectChanges();
    expect(copy().textContent!.trim()).toBe('複製');
    vi.unstubAllGlobals();
  });

  it('庫存組列在工具列內;說明文字改成下拉預設文字與「儲存」鈕提示,不另佔一行(D-337)', async () => {
    await mount([]);
    expect(el.querySelector('.ct-toolbar .ct-setbar')).toBeTruthy();
    expect(el.querySelector('.ct-setbar .rt-cap')).toBeNull();
    expect(bar().querySelector('button[aria-haspopup]')!.textContent).toContain('尚無庫存組');
    expect(bar().querySelector('.ct-set-tip')).toBeTruthy();
  });

  it('下拉面板底部固定列(D-331):沒有庫存組不顯示;有就顯示「已用 N / 10 組」,9 組轉琥珀、滿 10 組轉紅', async () => {
    const open = () => {
      bar().querySelector<HTMLButtonElement>('button[aria-haspopup]')!.click();
      f.detectChanges();
    };
    const foot = () => bar().querySelector<HTMLElement>('.sel-foot');
    await mount([]);
    open();
    expect(foot()).toBeNull();
    const n = (k: number) => Array.from({ length: k }, (_, i) => row({ id: `s${i}`, name: `組${i}` }));
    await mount(n(3));
    open();
    expect(foot()!.textContent).toContain('已用 3 / 10 組');
    expect(foot()!.getAttribute('data-tone')).toBeNull();
    expect(foot()!.querySelectorAll('.sel-pips > i.on')).toHaveLength(3);
    await mount(n(9));
    open();
    expect(foot()!.textContent).toContain('剩 1 組');
    expect(foot()!.getAttribute('data-tone')).toBe('amber');
    await mount(n(10));
    open();
    expect(foot()!.textContent).toContain('已滿 10 / 10 組');
    expect(foot()!.getAttribute('data-tone')).toBe('danger');
  });

  it('管理:刪除要按兩下,按「再按一次刪除」才送出', async () => {
    await mount([row()]);
    btn('管理', bar()).click();
    f.detectChanges();
    btn('刪除', dlg()!).click();
    f.detectChanges();
    http.expectNone(`${U}/a`);
    expect(btn('再按一次刪除', dlg()!)).toBeTruthy();
    btn('再按一次刪除', dlg()!).click();
    http.expectOne(`${U}/a`).flush(null, { status: 204, statusText: 'No Content' });
    await tick();
    f.detectChanges();
    expect(sv.saved()).toHaveLength(0);
    expect(dlg()).toBeNull();
  });

  it('滿 10 組:另存新組要選一組覆蓋', async () => {
    const list = Array.from({ length: 10 }, (_, i) => row({ id: `i${i}`, name: `組${i}` }));
    await mount(list);
    fill();
    btn('儲存', bar()).click();
    f.detectChanges();
    expect(dlg()!.textContent).toContain('已滿 10 組');
    expect(dlgBtn('覆蓋').disabled).toBe(true);
  });

  for (const desktop of [false, true]) {
    it(`工具列:全部收合 / 展開是只有圖示的按鈕,提示文字隨狀態切換(${desktop ? '桌機' : '手機'})`, async () => {
      await mount([], desktop);
      craft.setGrade('hull', 5);
      f.detectChanges();
      const ib = () => el.querySelector<HTMLButtonElement>('.ct-iconbtn')!;
      expect(ib().textContent!.trim()).toBe('');
      expect(ib().getAttribute('aria-label')).toBe('全部收合');
      ib().click();
      f.detectChanges();
      expect(ib().getAttribute('aria-label')).toBe('全部展開');
    });
  }
});
