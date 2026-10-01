import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';

const sub = (wid: string, position: number, over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: `${wid}-${position}`,
  workshop_id: wid,
  position,
  name: null,
  status: 'exploring',
  expected_return_at: '2026-10-02T00:00:00Z',
  last_synced_at: '2026-10-01T00:00:00Z',
  ...over,
});
const ws = (id: string, positions: number[]): WorkshopWithSubmarines => ({
  id,
  name: id,
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: positions.map((p) => sub(id, p)),
});
const snapshot = () => JSON.parse(localStorage.getItem('eranaut.snapshot') ?? '{}');

describe('DataStore 更新潛艇', () => {
  let store: DataStore;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(DataStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store.fetched.set([ws('a', [1, 2]), ws('b', [1])]);
  });
  afterEach(() => http.verify());

  /** 送出後會在背景重抓確認(D-84),測試要把那個請求處理掉 */
  const flushRefresh = async (list: WorkshopWithSubmarines[]): Promise<void> => {
    await new Promise((r) => setTimeout(r));
    http.expectOne('/api/overview').flush({ workshops: list });
    await new Promise((r) => setTimeout(r));
  };

  it('整坊更新:PUT /submarines、以回應合併、存快照、背景重抓', async () => {
    const input = [
      { position: 1, name: '甲', status: 'exploring' as const, remaining_minutes: 90 },
      { position: 3, name: null, status: 'complete' as const },
    ];
    const p = store.updateSubmarines('a', input);
    const req = http.expectOne('/api/workshops/a/submarines');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ submarines: input });
    req.flush({ submarines: [sub('a', 1, { name: '甲' }), sub('a', 2), sub('a', 3, { status: 'complete', expected_return_at: null })], reminder_skipped_positions: [2] });
    const result = await p;
    expect(result.reminder_skipped_positions).toEqual([2]);
    expect(store.workshops()[0].submarines.map((s) => s.position)).toEqual([1, 2, 3]);
    expect(store.workshops()[0].submarines[0].name).toBe('甲');
    expect(snapshot().workshops[0].submarines).toHaveLength(3);
    await flushRefresh([ws('a', [1, 2, 3]), ws('b', [1])]);
  });

  it('單艘快速修改:PUT /submarines/:position,只合併那一艘,其他不動', async () => {
    const p = store.updateSubmarine('a', { position: 2, name: '乙', status: 'exploring', remaining_minutes: 10 });
    const req = http.expectOne('/api/workshops/a/submarines/2');
    expect(req.request.method).toBe('PUT');
    req.flush({ submarines: [sub('a', 2, { name: '乙' })], reminder_skipped_positions: [] });
    await p;
    const subs = store.workshops()[0].submarines;
    expect(subs.map((s) => [s.position, s.name])).toEqual([[1, null], [2, '乙']]);
    expect(store.workshops()[1].submarines).toHaveLength(1);
    await flushRefresh([ws('a', [1, 2]), ws('b', [1])]);
  });

  it('寫入失敗:丟出原始錯誤、畫面不變、不重抓', async () => {
    const p = store.updateSubmarines('a', [{ position: 1, status: 'exploring', remaining_minutes: 0 }]);
    http.expectOne('/api/workshops/a/submarines').flush({ error: 'validation_failed', fields: {}, items: [] }, { status: 400, statusText: 'Bad Request' });
    await expect(p).rejects.toMatchObject({ status: 400 });
    expect(store.workshops()[0].submarines).toHaveLength(2);
  });
});
