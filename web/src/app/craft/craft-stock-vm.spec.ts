import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { CraftStockDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { CRAFT_STOCKS_CACHE_KEY } from './craft-keys';
import { CRAFT_FEATURES } from './craft-features';
import { CraftStockVm } from './craft-stock-vm';
import { CraftVm } from './craft-vm';

const U = '/api/craft-stocks';
const tick = () => new Promise((r) => setTimeout(r));
const dto = (over: Partial<CraftStockDto> = {}): CraftStockDto => ({
  id: 'a', name: '主力', spec: { v: 1, sel: { hull: { grade: 3, qty: 2 } }, stock: {} },
  favorite: false, created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});

describe('CraftStockVm(庫存組,D-329、D-330)', () => {
  let sv: CraftStockVm;
  let craft: CraftVm;
  let http: HttpTestingController;
  /** 一個真的存在的庫存 key */
  let key = '';

  function setup(features?: { stockSets: boolean }): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ...(features ? [{ provide: CRAFT_FEATURES, useValue: features }] : [])] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    craft = TestBed.inject(CraftVm);
    sv = TestBed.inject(CraftStockVm);
    TestBed.tick();
  }
  const load = async (list: CraftStockDto[]) => {
    sv.start();
    http.expectOne(U).flush(list);
    await tick();
  };
  /** 選一個部位並填入庫存 */
  function fill(): void {
    craft.setGrade('hull', 5);
    key = craft.result().finals[0]!.key;
    craft.setStock(key, 3);
    TestBed.tick();
  }
  beforeEach(() => {
    localStorage.clear();
    setup();
  });
  afterEach(() => sv.stop());

  it('start:載入清單並寫入快照;重複 start 不重複請求', async () => {
    await load([dto()]);
    expect(sv.saved()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(CRAFT_STOCKS_CACHE_KEY)!)).toHaveLength(1);
    sv.start();
    http.expectNone(U);
  });

  it('離線用快照顯示,載入失敗不清空', async () => {
    localStorage.setItem(CRAFT_STOCKS_CACHE_KEY, JSON.stringify([dto()]));
    sv.start();
    expect(sv.saved()).toHaveLength(1);
    http.expectOne(U).error(new ProgressEvent('error'));
    await tick();
    expect(sv.saved()).toHaveLength(1);
    expect(sv.loadError()).toBe(true);
  });

  it('展示模式(stockSets 關):不啟動、不呼叫伺服器、寫入丟錯', async () => {
    setup({ stockSets: false });
    expect(sv.enabled).toBe(false);
    sv.start();
    http.expectNone(U);
    fill();
    await expect(sv.saveCurrent('x')).rejects.toThrow();
  });

  it('canSave:要有選配件而且庫存有填(記錄庫存開關關著也算)', () => {
    expect(sv.canSave()).toBe(false);
    craft.setGrade('hull', 5);
    TestBed.tick();
    expect(sv.canSave()).toBe(false);
    key = craft.result().finals[0]!.key;
    craft.setStock(key, 2);
    TestBed.tick();
    expect(craft.view().stockMode).toBe(false);
    expect(sv.canSave()).toBe(true);
    craft.clearAll();
    TestBed.tick();
    expect(sv.canSave()).toBe(false); // 庫存還在但沒有配件
  });

  it('saveCurrent:送出目前的選擇與庫存,成為目前這一組;modified 跟著內容變', async () => {
    await load([]);
    fill();
    const p = sv.saveCurrent('  備料 ');
    const req = http.expectOne(U);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: '備料', spec: { v: 1, sel: { hull: { grade: 5, qty: 1 } }, stock: { [key]: 3 } } });
    req.flush(dto({ id: 'n', name: '備料', spec: req.request.body.spec }));
    await p;
    expect(sv.activeId()).toBe('n');
    expect(sv.modified()).toBe(false);
    craft.setStock(key, 4);
    TestBed.tick();
    expect(sv.modified()).toBe(true);
  });

  it('overwrite 用目前內容覆蓋;rename 只改名不動內容', async () => {
    await load([dto()]);
    fill();
    const p = sv.overwrite('a');
    const put = http.expectOne(`${U}/a`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.name).toBe('主力');
    expect(put.request.body.spec.stock[key]).toBe(3);
    put.flush(dto({ updated_at: '2026-10-09T00:00:00.000Z', spec: put.request.body.spec }));
    await p;
    const r = sv.rename('a', '新名');
    const put2 = http.expectOne(`${U}/a`);
    expect(put2.request.body).toEqual({ name: '新名', spec: sv.saved()[0]!.spec });
    put2.flush(dto({ name: '新名', spec: put2.request.body.spec }));
    await r;
    expect(sv.saved()[0]!.name).toBe('新名');
  });

  it('寫入失敗丟出原始 HttpErrorResponse(409 / 400),清單不變', async () => {
    await load([dto()]);
    fill();
    const p = sv.saveCurrent('x');
    http.expectOne(U).flush({ error: 'limit_reached' }, { status: 409, statusText: 'Conflict' });
    await expect(p).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(sv.saved()).toHaveLength(1);
    expect(sv.pending()).toBe(0);
  });

  it('load:整組換掉選擇與庫存、打開記錄庫存、只動這一個開關', async () => {
    const stockKey = (() => {
      craft.setGrade('hull', 5);
      const k = craft.result().finals[0]!.key;
      craft.clearAll();
      return k;
    })();
    await load([dto({ spec: { v: 1, sel: { bow: { grade: 2, qty: 4 } }, stock: { [stockKey]: 7 } } })]);
    craft.patchView({ crystalTray: false, sort: 'name', expandFrame: true });
    craft.setGrade('hull', 1);
    craft.togglePin('x', 'final' as never);
    sv.load(sv.saved()[0]!);
    expect(craft.sel().hull.gradeIndex).toBeNull();
    expect(craft.sel().bow).toEqual({ gradeIndex: 2, qty: 4 });
    expect(craft.stock()).toEqual({ [stockKey]: 7 });
    expect(craft.pin()).toBeNull();
    expect(craft.view().stockMode).toBe(true);
    expect(craft.view().crystalTray).toBe(false);
    expect(craft.view().sort).toBe('name');
    expect(craft.view().expandFrame).toBe(true);
    expect(sv.activeId()).toBe('a');
    expect(sv.modified()).toBe(false);
  });

  it('load:資料集已沒有的庫存項目被略過', async () => {
    await load([dto({ spec: { v: 1, sel: { hull: { grade: 1, qty: 1 } }, stock: { 不存在的東西: 5 } } })]);
    sv.load(sv.saved()[0]!);
    expect(craft.stock()).toEqual({});
  });

  it('needsConfirm:畫面空白或和那一組相同不用確認,其餘要', async () => {
    await load([dto()]);
    const t = sv.saved()[0]!;
    expect(sv.needsConfirm(t)).toBe(false);
    craft.setGrade('hull', 1);
    TestBed.tick();
    expect(sv.needsConfirm(t)).toBe(true);
    sv.load(t);
    TestBed.tick();
    expect(sv.needsConfirm(t)).toBe(false);
  });

  it('toggleFavorite:樂觀更新;失敗改回', async () => {
    await load([dto()]);
    sv.toggleFavorite('a');
    expect(sv.saved()[0]!.favorite).toBe(true);
    await tick();
    http.expectOne(`${U}/a`).flush('x', { status: 500, statusText: 'err' });
    await tick();
    expect(sv.saved()[0]!.favorite).toBe(false);
  });

  it('remove 成功才從清單拿掉,載入中的那組被刪就清掉 activeId', async () => {
    await load([dto()]);
    sv.activeId.set('a');
    const p = sv.remove('a');
    http.expectOne(`${U}/a`).flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(sv.saved()).toHaveLength(0);
    expect(sv.activeId()).toBeNull();
  });

  it('登出:清掉清單、快照仍由 App 清除;stop 關掉對話框', async () => {
    await load([dto()]);
    sv.dialog.set('manage');
    TestBed.inject(Auth).status.set('anonymous');
    TestBed.tick();
    expect(sv.saved()).toEqual([]);
    expect(sv.dialog()).toBeNull();
  });
});
