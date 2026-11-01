import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, SubmarinesChangeResult, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataStore } from './data-store';
import { destPips, ManageVm } from './manage-vm';
import { OverviewVm } from './overview-vm';
import { Toast } from './toast';

const NOW = Date.parse('2026-09-28T02:00:00Z');
const sub = (wid: string, position: number, over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: `${wid}-${position}`,
  workshop_id: wid,
  position,
  name: null,
  status: 'complete',
  expected_return_at: null,
  last_synced_at: new Date(NOW).toISOString(),
  ...over,
});
const ws = (id: string, n: number): WorkshopWithSubmarines => ({
  id,
  name: id,
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: new Date(NOW).toISOString(),
  submarines: Array.from({ length: n }, (_, i) => sub(id, i + 1)),
});

describe('destPips', () => {
  it('已有 / 放入 / 空 / 超過', () => {
    expect(destPips(2, 1)).toEqual(['have', 'have', 'add', 'empty']);
    expect(destPips(4, 1)).toEqual(['have', 'have', 'have', 'have', 'over']);
    expect(destPips(3, 3)).toEqual(['have', 'have', 'have', 'add', 'over', 'over']);
  });
});

describe('ManageVm', () => {
  let store: DataStore;
  let vm: OverviewVm;
  let mg: ManageVm;
  let toast: Toast;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(DataStore);
    vm = TestBed.inject(OverviewVm);
    mg = TestBed.inject(ManageVm);
    toast = TestBed.inject(Toast);
    http = TestBed.inject(HttpTestingController);
    store.now.set(NOW);
    store.fetched.set([ws('A', 3), ws('B', 4)]);
  });
  afterEach(() => http.match(() => true));

  const flush = async (): Promise<void> => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  it('只有單一工坊檢視能進管理模式;回到「全部」自動離開並清掉選取', () => {
    mg.enter();
    expect(mg.active()).toBe(false);
    vm.select('A');
    TestBed.tick();
    mg.enter();
    mg.toggle('A-1');
    expect(mg.active()).toBe(true);
    expect(mg.count()).toBe(1);
    vm.goTo(0);
    TestBed.tick();
    expect(mg.active()).toBe(false);
    expect(mg.count()).toBe(0);
  });

  it('全選:沒選 / 部分 → 全選;全選 → 全不選;長按進入並選取該列', () => {
    vm.select('A');
    TestBed.tick();
    expect(mg.selectState()).toBe('none');
    mg.longPress('A-2');
    expect(mg.active()).toBe(true);
    expect(mg.selectState()).toBe('some');
    mg.toggleAll();
    expect(mg.selectState()).toBe('all');
    mg.toggleAll();
    expect(mg.selectState()).toBe('none');
  });

  it('目的地列:搬移單選、複製到...多選;超過 4 艘標示超過但不阻擋', () => {
    vm.select('A');
    TestBed.tick();
    mg.enter();
    mg.toggleAll();
    mg.openTransfer('move');
    mg.toggleTarget('B');
    expect(mg.destRows()).toMatchObject([{ id: 'B', have: 4, add: 3, after: 7, over: true, text: '7 / 4 艘・超過' }]);
    expect(mg.overDests().length).toBe(1);
    expect(mg.canConfirmTransfer()).toBe(true);
  });

  it('刪光時註明工坊保留;刪除後呼叫 API 並以回應取代該工坊', async () => {
    vm.select('A');
    TestBed.tick();
    mg.enter();
    mg.toggleAll();
    expect(mg.emptiesWorkshop()).toBe(true);
    mg.openDelete();
    const p = mg.confirmDelete();
    const req = http.expectOne('/api/workshops/A/submarines/delete');
    expect(req.request.body).toEqual({ submarine_ids: ['A-1', 'A-2', 'A-3'] });
    req.flush({ workshops: [{ workshop_id: 'A', submarines: [] }], created_ids: [] } satisfies SubmarinesChangeResult);
    await p;
    expect(store.workshops().find((w) => w.id === 'A')?.submarines).toEqual([]);
    expect(toast.items().at(-1)?.text).toContain('工坊保留');
    expect(mg.dialog()).toBeNull();
    http.match('/api/overview');
  });

  it('原地複製:提示超過 4 艘並附「編排位置」;復原 = 刪除這次的複本', async () => {
    vm.select('B');
    TestBed.tick();
    mg.enter();
    mg.toggle('B-1');
    const p = mg.copyHere();
    const req = http.expectOne('/api/submarines/transfer');
    expect(req.request.body).toEqual({ source_workshop_id: 'B', submarine_ids: ['B-1'], mode: 'copy', target_workshop_ids: ['B'] });
    const made = sub('B', 5, { id: 'new1', status: 'registered' });
    const all = [...ws('B', 4).submarines, made];
    req.flush({ workshops: [{ workshop_id: 'B', submarines: all }], created_ids: ['new1'] } satisfies SubmarinesChangeResult);
    await p;
    const texts = toast.items();
    expect(texts[0]!.text).toContain('已複製 1 艘');
    expect(texts[0]!.actions[0]!.label).toBe('復原');
    expect(texts[1]!.tone).toBe('warn');
    expect(texts[1]!.text).toContain('超過建議的 4 艘');
    expect(texts[1]!.actions[0]!.label).toBe('編排位置');
    http.match('/api/overview');
    texts[0]!.actions[0]!.run();
    await flush();
    const del = http.expectOne('/api/workshops/B/submarines/delete');
    expect(del.request.body).toEqual({ submarine_ids: ['new1'] });
    del.flush({ workshops: [{ workshop_id: 'B', submarines: ws('B', 4).submarines }], created_ids: [] });
    http.match('/api/overview');
  });

  it('409 滿 20 艘:對話框顯示錯誤、不關閉', async () => {
    vm.select('A');
    TestBed.tick();
    mg.enter();
    mg.toggle('A-1');
    mg.openTransfer('copymove');
    expect(mg.targets()).toEqual(['B']); // 只有一間其他工坊時預先勾選
    const p = mg.confirmTransfer();
    http.expectOne('/api/submarines/transfer').flush({ error: 'too_many_submarines' }, { status: 409, statusText: 'Conflict' });
    await p;
    expect(mg.error()).toContain('20');
    expect(mg.dialog()).toBe('copymove');
    expect(mg.busy()).toBe(false);
  });

  it('位置編輯:拿起、放下、套用送出 slots 與 unplaced', async () => {
    store.fetched.set([ws('A', 6), ws('B', 1)]);
    vm.select('A');
    TestBed.tick();
    mg.enter();
    expect(mg.needsLayout()).toBe(true);
    expect(mg.unplacedCount()).toBe(2);
    mg.openLayout();
    mg.layoutTapPool('A-5');
    mg.layoutTapSlot(0);
    expect(mg.layoutChanged()).toBe(2);
    const p = mg.applyLayout();
    const req = http.expectOne('/api/workshops/A/submarines/layout');
    expect(req.request.body).toEqual({ slots: ['A-5', 'A-2', 'A-3', 'A-4'], unplaced: ['A-6', 'A-1'] });
    req.flush({ workshops: [{ workshop_id: 'A', submarines: [] }], created_ids: [] });
    await p;
    expect(mg.dialog()).toBeNull();
    http.match('/api/overview');
  });

  it('切回視窗重新抓資料(工坊物件換新、id 不變)不會退出管理模式;換工坊或刪光才退出', () => {
    store.fetched.set([ws('A', 3), ws('B', 1)]);
    vm.select('A');
    TestBed.tick();
    mg.enter();
    mg.toggle('A-1');
    expect(mg.active()).toBe(true);
    store.fetched.set([ws('A', 3), ws('B', 1)]);
    TestBed.tick();
    expect(mg.active()).toBe(true);
    expect(mg.count()).toBe(1);
    store.fetched.set([ws('A', 0), ws('B', 1)]);
    TestBed.tick();
    expect(mg.active()).toBe(false);
    vm.select('A');
    mg.enter();
    vm.select('B');
    TestBed.tick();
    expect(mg.active()).toBe(false);
  });
});
