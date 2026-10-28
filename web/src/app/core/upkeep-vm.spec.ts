import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, UpkeepDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { OverviewVm } from './overview-vm';
import { UpkeepVm, clampLimit, upkeepItem, upkeepNote, upkeepRequest, workshopUpkeep, type QuickUpkeepDraft } from './upkeep-vm';

const NOW = Date.parse('2026-10-26T02:00:00Z');
const iso = (min: number): string => new Date(NOW + min * 60_000).toISOString();
const settle = (): Promise<void> => new Promise((r) => setTimeout(r));

function upkeep(done: number, over: Partial<UpkeepDto> = {}): UpkeepDto {
  return { route_key: '1:OJ', route_sea: 1, route_points: ['O', 'J'], voyages_done: done, limit_voyages: 6, parts_sig: '3,1,2,4', current_sig: '3,1,2,4', repaired_at: null, updated_at: iso(0), ...over };
}
function sub(position: number, over: Partial<SubmarineDto> = {}): SubmarineDto {
  return { id: `s${position}`, workshop_id: 'w1', position, name: `艇${position}`, status: 'exploring', expected_return_at: iso(60), last_synced_at: iso(0), ...over };
}
function ws(subs: SubmarineDto[], id = 'w1'): WorkshopWithSubmarines {
  return { id, name: '貝殼工坊', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: iso(0), submarines: subs };
}

describe('upkeepItem / workshopUpkeep', () => {
  it('沒開啟 → null', () => {
    expect(upkeepItem(sub(1), NOW)).toBeNull();
  });

  it('還有餘裕:顯示 N/M 趟,剩餘趟數', () => {
    const i = upkeepItem(sub(1, { upkeep: upkeep(2) }), NOW)!;
    expect(i.phase).toBe('ok');
    expect(i.label).toBe('維修 2/6 趟');
    expect(i.remaining).toBe(4);
    expect(i.materials).toBe(10);
    expect(i.configChanged).toBe(false);
    expect(i.status).toBe('探索中・1 時 00 分後返航');
  });

  it('最後一趟、還沒返航 → 返航後需維修;已返航 → 需維修才能出航', () => {
    expect(upkeepItem(sub(1, { upkeep: upkeep(6) }), NOW)!.label).toBe('最後一趟,返航後需維修');
    const now = upkeepItem(sub(1, { upkeep: upkeep(6), status: 'complete', expected_return_at: null }), NOW)!;
    expect([now.phase, now.label, now.status]).toEqual(['repair_now', '需維修才能出航(6/6 趟)', '已返航']);
    expect(upkeepItem(sub(1, { upkeep: upkeep(6), expected_return_at: iso(-1) }), NOW)!.phase).toBe('repair_now');
  });

  it('配置被改過或解除綁定 → configChanged', () => {
    expect(upkeepItem(sub(1, { upkeep: upkeep(1, { current_sig: '5,5,5,5' }) }), NOW)!.configChanged).toBe(true);
    expect(upkeepItem(sub(1, { upkeep: upkeep(1, { current_sig: null }) }), NOW)!.configChanged).toBe(true);
  });

  it('同工坊彙總:需維修 / 返航後需維修 / 未追蹤', () => {
    const v = workshopUpkeep(
      ws([sub(1, { upkeep: upkeep(2) }), sub(2, { upkeep: upkeep(6), status: 'complete', expected_return_at: null }), sub(3), sub(4, { upkeep: upkeep(6) })]),
      NOW,
    );
    expect([v.items.length, v.repairNow, v.afterReturn, v.untracked.map((s) => s.position)]).toEqual([3, 1, 1, [3]]);
  });
});

describe('快速修改草稿', () => {
  const on: QuickUpkeepDraft = { enabled: true, routeKey: '1:OJ', limit: 6, mode: 'fresh', ran: 1 };

  it('upkeepRequest:沒碰 = 不帶;關閉 = null(只有原本已開啟);開啟 = 物件', () => {
    expect(upkeepRequest(null, false)).toBeUndefined();
    expect(upkeepRequest({ ...on, enabled: false }, true)).toBeNull();
    expect(upkeepRequest({ ...on, enabled: false }, false)).toBeUndefined();
    expect(upkeepRequest(on, false)).toEqual({ route_key: '1:OJ', limit_voyages: 6, already_done: 0 });
    expect(upkeepRequest({ ...on, mode: 'ran', ran: 3 }, false)).toEqual({ route_key: '1:OJ', limit_voyages: 6, already_done: 3 });
    expect(upkeepRequest({ ...on, mode: 'ran', ran: 9 }, false)!.already_done).toBe(5);
  });

  it('upkeepNote:探索中這趟算第 N 趟;探索完成只記錄已跑', () => {
    expect(upkeepNote(on, true)).toBe('送出後這趟算第 1 趟;第 6 趟返航時提醒維修。');
    expect(upkeepNote({ ...on, mode: 'ran', ran: 2 }, true)).toContain('第 3 趟');
    expect(upkeepNote({ ...on, mode: 'ran', ran: 2 }, false)).toBe('送出後記錄已跑 2 趟;下次出航算第 3 趟,第 6 趟返航時提醒維修。');
  });

  it('clampLimit', () => {
    expect([clampLimit(0), clampLimit(7), clampLimit(99)]).toEqual([1, 7, 20]);
  });
});

describe('UpkeepVm / OverviewVm.upkeepAlerts', () => {
  let http: HttpTestingController;
  let store: DataStore;
  let vm: UpkeepVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    vm = TestBed.inject(UpkeepVm);
    store.now.set(NOW);
    store.fetched.set([
      ws([
        sub(1, { upkeep: upkeep(2) }),
        sub(2, { upkeep: upkeep(6, { limit_voyages: 6 }), status: 'complete', expected_return_at: null }),
        sub(4, { upkeep: upkeep(6) }),
      ]),
      ws([sub(1, { id: 'x1', workshop_id: 'w2' })], 'w2'),
    ]);
  });

  it('摘要:只列有潛艇要維修的工坊;選了單一工坊就只看那間', () => {
    const o = TestBed.inject(OverviewVm);
    expect(o.upkeepAlerts().map((a) => [a.workshop.id, a.repairNow, a.afterReturn])).toEqual([['w1', 1, 1]]);
    o.select('w2');
    expect(o.upkeepAlerts()).toEqual([]);
  });

  it('開啟面板:預設只勾「現在就要維修」的艇;最後一趟還沒回來的可手動勾選', () => {
    vm.open('w1');
    expect(vm.selection().map((i) => i.position)).toEqual([2]);
    vm.toggle('s4');
    expect(vm.selection().map((i) => i.position)).toEqual([2, 4]);
    expect(vm.selectedMaterials()).toBe(20);
    vm.toggle('s2');
    expect(vm.selection().map((i) => i.position)).toEqual([4]);
  });

  it('標示已維修:送出勾選的艇,成功後以回應更新畫面並關閉面板', async () => {
    vm.open('w1');
    const done = vm.markRepaired();
    const req = http.expectOne('/api/workshops/w1/upkeep/repaired');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ submarine_ids: ['s2'] });
    req.flush({ submarines: [sub(1, { upkeep: upkeep(2) }), sub(2, { upkeep: upkeep(0), status: 'complete', expected_return_at: null }), sub(4, { upkeep: upkeep(6) })] });
    await done;
    expect(vm.openId()).toBeNull();
    expect(store.fetched()[0]!.submarines.find((s) => s.position === 2)!.upkeep!.voyages_done).toBe(0);
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();
  });

  it('標示已維修失敗:留在面板並顯示錯誤', async () => {
    vm.open('w1');
    const done = vm.markRepaired();
    http.expectOne('/api/workshops/w1/upkeep/repaired').flush({}, { status: 500, statusText: 'x' });
    await done;
    expect(vm.openId()).toBe('w1');
    expect(vm.error()).toContain('失敗');
    expect(vm.saving()).toBe(false);
  });

  it('沒勾任何一艘時不送出', async () => {
    vm.open('w1');
    vm.toggle('s2');
    await vm.markRepaired();
    http.expectNone('/api/workshops/w1/upkeep/repaired');
  });

  it('調整趟數與關閉提醒走各自的端點,並合併回畫面', async () => {
    vm.open('w1');
    const a = vm.adjust('s1', { voyages_done: 3 });
    const req = http.expectOne('/api/submarines/s1/upkeep');
    expect([req.request.method, req.request.body]).toEqual(['PUT', { voyages_done: 3 }]);
    req.flush(sub(1, { upkeep: upkeep(3) }));
    await a;
    expect(store.fetched()[0]!.submarines[0]!.upkeep!.voyages_done).toBe(3);
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();

    const d = vm.disable('s1');
    const del = http.expectOne('/api/submarines/s1/upkeep');
    expect(del.request.method).toBe('DELETE');
    del.flush(sub(1));
    await d;
    expect(store.fetched()[0]!.submarines[0]!.upkeep).toBeUndefined();
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();
  });
});
