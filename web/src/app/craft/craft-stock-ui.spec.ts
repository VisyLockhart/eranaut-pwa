import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CraftStockDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
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
