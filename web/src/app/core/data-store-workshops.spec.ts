import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopDto, WorkshopInput, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';

const input: WorkshopInput = { name: '新工坊', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0 };
function dto(id: string, name = id): WorkshopDto {
  return { id, name, server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z' };
}
function ws(id: string, subs = 0): WorkshopWithSubmarines {
  return {
    ...dto(id),
    submarines: Array.from({ length: subs }, (_, i) => ({ id: `${id}-${i}`, workshop_id: id, position: i + 1, name: null, status: 'exploring' as const, expected_return_at: '2026-10-02T00:00:00Z', last_synced_at: '2026-10-01T00:00:00Z' })),
  };
}
const ids = (store: DataStore) => store.workshops().map((w) => w.id);
const snapshot = () => JSON.parse(localStorage.getItem('eranaut.snapshot') ?? '{}');

describe('DataStore 工坊管理', () => {
  let store: DataStore;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(DataStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store.fetched.set([ws('a', 2), ws('b'), ws('c')]);
  });
  afterEach(() => http.verify());

  it('新增:成功後附加到最後(沒有潛艇),並更新快照', async () => {
    const p = store.createWorkshop(input);
    const req = http.expectOne('/api/workshops');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush(dto('d', '新工坊'), { status: 201, statusText: 'Created' });
    await p;
    expect(ids(store)).toEqual(['a', 'b', 'c', 'd']);
    expect(store.workshops()[3].submarines).toEqual([]);
    expect(snapshot().workshops).toHaveLength(4);
  });

  it('新增:驗證失敗時丟出錯誤、畫面不變', async () => {
    const p = store.createWorkshop(input);
    http.expectOne('/api/workshops').flush({ error: 'validation_failed', fields: { name: 'required' } }, { status: 400, statusText: 'Bad Request' });
    await expect(p).rejects.toMatchObject({ status: 400 });
    expect(ids(store)).toEqual(['a', 'b', 'c']);
  });

  it('編輯:以回應取代工坊欄位,保留既有潛艇', async () => {
    const p = store.updateWorkshop('a', { ...input, name: '改名' });
    const req = http.expectOne('/api/workshops/a');
    expect(req.request.method).toBe('PUT');
    req.flush(dto('a', '改名'));
    await p;
    const a = store.workshops().find((w) => w.id === 'a')!;
    expect(a.name).toBe('改名');
    expect(a.submarines).toHaveLength(2);
  });

  it('刪除:移除工坊並清掉順序裡的 id', async () => {
    store.reorderWorkshops(0, 2); // b, c, a
    expect(JSON.parse(localStorage.getItem('eranaut.workshop-order') ?? '[]')).toEqual(['b', 'c', 'a']);
    const p = store.deleteWorkshop('c');
    const req = http.expectOne('/api/workshops/c');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(ids(store)).toEqual(['b', 'a']);
    expect(JSON.parse(localStorage.getItem('eranaut.workshop-order') ?? '[]')).toEqual(['b', 'a']);
    expect(snapshot().workshops.map((w: { id: string }) => w.id)).toEqual(['a', 'b']);
  });

  it('刪除:404(已被刪掉)當作成功,其他錯誤丟出', async () => {
    const p = store.deleteWorkshop('b');
    http.expectOne('/api/workshops/b').flush({ error: 'not_found' }, { status: 404, statusText: 'Not Found' });
    await p;
    expect(ids(store)).toEqual(['a', 'c']);

    const q = store.deleteWorkshop('a');
    http.expectOne('/api/workshops/a').flush(null, { status: 500, statusText: 'Server Error' });
    await expect(q).rejects.toMatchObject({ status: 500 });
    expect(ids(store)).toEqual(['a', 'c']);
  });

  it('排序:reorder / ▲▼ 都寫入 localStorage,邊界不動作', () => {
    store.reorderWorkshops(2, 0);
    expect(ids(store)).toEqual(['c', 'a', 'b']);
    store.moveWorkshop('a', 1);
    expect(ids(store)).toEqual(['c', 'b', 'a']);
    store.moveWorkshop('c', -1);
    store.moveWorkshop('a', 1);
    expect(ids(store)).toEqual(['c', 'b', 'a']);
    expect(JSON.parse(localStorage.getItem('eranaut.workshop-order') ?? '[]')).toEqual(['c', 'b', 'a']);
  });

  it('重新載入後套用存的順序,新工坊排在最後', () => {
    localStorage.setItem('eranaut.workshop-order', JSON.stringify(['c', 'a', 'gone']));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fresh = TestBed.inject(DataStore);
    fresh.fetched.set([ws('a'), ws('b'), ws('c'), ws('d')]);
    expect(fresh.workshops().map((w) => w.id)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('登出(stop)清掉快照但保留順序偏好', () => {
    store.reorderWorkshops(0, 1);
    store.stop();
    expect(localStorage.getItem('eranaut.snapshot')).toBeNull();
    expect(localStorage.getItem('eranaut.workshop-order')).not.toBeNull();
  });
});
