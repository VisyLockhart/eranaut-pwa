import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteFilterDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEAS, SEA_INDEXES } from './core/data';
import { ROUTE_FILTERS_CACHE_KEY } from './route-cache';
import { RouteFilterVm } from './route-filter-vm';
import { RouteFindVm } from './route-find-vm';

const grey = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteFilterDto> = {}): RouteFilterDto => ({
  id: 'a', name: '灰海組', spec: { v: 1, sea: SEAS[1]!.sea, max_hours: 6, sort: 'opens', required: [grey().sea.points[0]!.id], excluded: [], item_ids: [], match: 'all' },
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const tick = () => new Promise((r) => setTimeout(r));

describe('RouteFilterVm(條件組合,D-229)', () => {
  let fv: RouteFilterVm;
  let f: RouteFindVm;
  let http: HttpTestingController;

  function setup(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    fv = TestBed.inject(RouteFilterVm);
    f = TestBed.inject(RouteFindVm);
    TestBed.tick();
  }
  const load = async (list: RouteFilterDto[]) => {
    fv.start();
    http.expectOne('/api/route-filters').flush(list);
    await tick();
  };
  beforeEach(() => {
    localStorage.clear();
    setup();
  });
  afterEach(() => fv.stop());

  it('start:載入清單並寫入快照;重複 start 不重複請求', async () => {
    await load([dto()]);
    expect(fv.saved().map((s) => s.name)).toEqual(['灰海組']);
    expect(JSON.parse(localStorage.getItem(ROUTE_FILTERS_CACHE_KEY)!)).toHaveLength(1);
    fv.start();
    http.expectNone('/api/route-filters');
  });

  it('離線時用快照顯示,載入失敗不清空', async () => {
    localStorage.setItem(ROUTE_FILTERS_CACHE_KEY, JSON.stringify([dto()]));
    fv.start();
    expect(fv.saved()).toHaveLength(1);
    http.expectOne('/api/route-filters').error(new ProgressEvent('error'));
    await tick();
    expect(fv.saved()).toHaveLength(1);
    expect(fv.loadError()).toBe(true);
  });

  it('apply:整組套用(含物品與全部 / 任一個),海圖跳到必選點的海域,不自動搜尋', async () => {
    const itemId = f.l.matches()[0]!.id;
    const d = dto({ spec: { ...dto().spec, item_ids: [itemId], match: 'any', excluded: [grey().sea.points[1]!.id] } });
    await load([d]);
    f.x.viewSea.set(SEAS[0]!.sea);
    expect(fv.apply(d)).toBe(0);
    expect(f.sea()).toBe(SEAS[1]!.sea);
    expect(f.maxHours()).toBe(6);
    expect(f.sort()).toBe('opens');
    expect([...f.required()]).toEqual([grey().sea.points[0]!.id]);
    expect([...f.excluded()]).toEqual([grey().sea.points[1]!.id]);
    expect(f.l.itemIds()).toEqual([itemId]);
    expect(f.l.match()).toBe('any');
    expect(f.x.viewSea()).toBe(SEAS[1]!.sea);
    expect(f.result()).toBeNull(); // apply 本身不搜尋
    expect(fv.activeId()).toBe('a');
    expect(fv.modified()).toBe(false);
    f.maxHours.set(12);
    expect(fv.modified()).toBe(true);
  });

  it('load:套用後自動搜尋,收合海圖與條件區', async () => {
    await load([dto()]);
    f.x.mapOpen.set(true);
    f.condOpen.set(true);
    fv.load(fv.saved()[0]!);
    expect(f.busy()).toBe(true);
    await tick();
    expect(f.result()).not.toBeNull();
    expect(f.runCount()).toBe(1);
    expect(f.x.mapOpen()).toBe(false);
    expect(f.condOpen()).toBe(false);
    expect(f.stale()).toBe(false);
  });

  it('apply:資料集已沒有的項目被略過', async () => {
    await load([]);
    expect(fv.apply(dto({ spec: { ...dto().spec, required: [grey().sea.points[0]!.id, 9999], item_ids: [999999] } }))).toBe(2);
    expect(f.required().size).toBe(1);
    expect(f.l.itemIds()).toEqual([]);
  });

  it('needsConfirm:目前沒有條件或與目標相同時不用確認', async () => {
    await load([]);
    const d = dto();
    expect(fv.needsConfirm(d)).toBe(false);
    fv.apply(d);
    expect(fv.needsConfirm(d)).toBe(false);
    f.maxHours.set(24);
    expect(fv.needsConfirm(d)).toBe(true);
  });

  it('saveCurrent / overwrite / rename / remove 成功才更新畫面', async () => {
    await load([]);
    f.maxHours.set(12);
    f.sort.set('variety');
    const p = fv.saveCurrent('  新組  ');
    const req = http.expectOne('/api/route-filters');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ name: '新組', spec: { max_hours: 12, sort: 'variety', sea: 'all' } });
    req.flush(dto({ id: 'n', name: '新組' }), { status: 201, statusText: 'Created' });
    await p;
    expect(fv.saved().map((s) => s.id)).toEqual(['n']);
    expect(fv.activeId()).toBe('n');

    const o = fv.overwrite('n');
    const put = http.expectOne('/api/route-filters/n');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.name).toBe('新組');
    put.flush(dto({ id: 'n', name: '新組', updated_at: 'x' }));
    await o;

    const r = fv.rename('n', '改名');
    const rr = http.expectOne('/api/route-filters/n');
    expect(rr.request.body.spec.max_hours).toBeDefined();
    rr.flush(dto({ id: 'n', name: '改名' }));
    await r;
    expect(fv.saved()[0]!.name).toBe('改名');

    const d = fv.remove('n');
    http.expectOne('/api/route-filters/n').flush(null, { status: 204, statusText: 'No Content' });
    await d;
    expect(fv.saved()).toEqual([]);
    expect(fv.activeId()).toBeNull();
  });

  it('寫入失敗時丟出原始錯誤、清單不變(409 已滿)', async () => {
    await load([dto()]);
    const p = fv.saveCurrent('x');
    http.expectOne('/api/route-filters').flush({ error: 'limit_reached' }, { status: 409, statusText: 'Conflict' });
    await expect(p).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(fv.saved()).toHaveLength(1);
  });

  it('stop(登出):清空清單與目前組合', async () => {
    await load([dto()]);
    fv.apply(dto());
    fv.stop();
    expect(fv.saved()).toEqual([]);
    expect(fv.activeId()).toBeNull();
  });

  it('isEmpty:預設條件為空', async () => {
    await load([]);
    expect(fv.isEmpty()).toBe(true);
    f.cycleFilter(grey().sea.points[0]!.id);
    expect(fv.isEmpty()).toBe(false);
  });
});
