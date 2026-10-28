import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataStore } from './data-store';
import { DEFAULT_SORT, OverviewVm, SORT_KEY, STATS_OPEN_KEY, addressLine, upkeepText, wsInfo, wsMeta } from './overview-vm';

const NOW = Date.parse('2026-09-28T02:00:00Z');
const iso = (min: number): string => new Date(NOW + min * 60_000).toISOString();

function sub(wid: string, position: number, eta: number | null, status: 'exploring' | 'complete' = 'exploring'): SubmarineDto {
  return { id: `${wid}-${position}`, workshop_id: wid, position, name: null, status, expected_return_at: eta === null ? null : iso(eta), last_synced_at: iso(0) };
}
function ws(id: string, subs: SubmarineDto[]): WorkshopWithSubmarines {
  return { id, name: id, server: 'Garuda' as never, captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0 as never, created_at: iso(0), submarines: subs };
}

describe('OverviewVm', () => {
  let store: DataStore;
  let vm: OverviewVm;
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    store = TestBed.inject(DataStore);
    vm = TestBed.inject(OverviewVm);
    store.now.set(NOW);
    store.fetched.set([ws('A', [sub('A', 1, 120), sub('A', 2, 30)]), ws('B', [sub('B', 1, -5), sub('B', 2, 30), sub('B', 3, null, 'complete')])]);
  });

  it('排序:可收艇在前(穩定),其餘依 ETA,同時間維持工坊與位置順序', () => {
    expect(vm.sortedAll().map((i) => i.id)).toEqual(['B-1', 'B-3', 'A-2', 'B-2', 'A-1']);
    expect(vm.items().map((i) => i.id)).toEqual(['B-1', 'B-3', 'A-2', 'B-2', 'A-1']);
  });

  it('統計與下一艘返航:依目前範圍(切換工坊後只算那間,D-290)', () => {
    expect(vm.stats()).toEqual({ workshops: 2, submarines: 5, ready: 2, readyPct: 40 });
    expect(vm.nextReturn()?.id).toBe('A-2');
    vm.select('A');
    expect(vm.stats()).toEqual({ workshops: 2, submarines: 2, ready: 0, readyPct: 0 });
    expect(vm.nextReturn()?.id).toBe('A-2');
    vm.select('B');
    expect(vm.stats()).toMatchObject({ submarines: 3, ready: 2 });
    expect(vm.nextReturn()?.id).toBe('B-2');
  });

  it('切換工坊(循環含「全部」)與篩選', () => {
    expect(vm.pagerLabels()).toEqual(['全部', 'A', 'B']);
    vm.next();
    expect(vm.currentWorkshop()?.id).toBe('A');
    expect(vm.items().map((i) => i.id)).toEqual(['A-2', 'A-1']);
    vm.prev();
    vm.prev();
    expect(vm.currentWorkshop()?.id).toBe('B');
    vm.next();
    expect(vm.currentWorkshop()).toBeNull();
  });

  it('目前工坊被刪除時退回「全部」', () => {
    vm.prev();
    expect(vm.currentWorkshop()?.id).toBe('B');
    store.fetched.set([ws('A', [])]);
    expect(vm.index()).toBe(0);
  });

  it('select:依工坊 id 套用過濾,找不到退回「全部」', () => {
    vm.select('B');
    expect(vm.currentWorkshop()?.id).toBe('B');
    vm.select('nope');
    expect(vm.currentWorkshop()).toBeNull();
  });

  it('工坊自訂順序會反映在切換與排序的同分順序', () => {
    store.order.set(['B', 'A']);
    expect(vm.pagerLabels()).toEqual(['全部', 'B', 'A']);
    expect(vm.sortedAll().map((i) => i.id)).toEqual(['B-1', 'B-3', 'B-2', 'A-2', 'A-1']);
  });

  it('排序:工坊 → 編號 → 返航的權重、方向套用到全部、沒有返航時間的永遠在最後', () => {
    store.fetched.set([ws('A', [sub('A', 1, 120), sub('A', 2, 30), sub('A', 3, null)]), ws('B', [sub('B', 1, -5), sub('B', 2, 30)])]);
    expect(vm.items().map((i) => i.id)).toEqual(['B-1', 'A-2', 'B-2', 'A-1', 'A-3']);
    vm.toggleSortDir();
    expect(vm.items().map((i) => i.id)).toEqual(['A-1', 'A-2', 'B-2', 'B-1', 'A-3']);
    vm.toggleSortDir();
    vm.toggleSortField('pos');
    expect(vm.sortKeys()).toEqual(['pos', 'eta']);
    expect(vm.items().map((i) => i.id)).toEqual(['B-1', 'A-1', 'A-2', 'B-2', 'A-3']);
    vm.toggleSortField('ws');
    expect(vm.sortKeys()).toEqual(['ws', 'pos', 'eta']);
    expect(vm.sortRank()).toEqual({ ws: 1, pos: 2, eta: 3 });
    expect(vm.items().map((i) => i.id)).toEqual(['A-1', 'A-2', 'A-3', 'B-1', 'B-2']);
    vm.toggleSortDir();
    expect(vm.items().map((i) => i.id)).toEqual(['B-2', 'B-1', 'A-3', 'A-2', 'A-1']);
    expect(vm.sortSummary().long).toBe('依 工坊 → 編號 → 返航，由大到小');
  });

  it('排序:全部關掉退回預設、方向停用;單一工坊時「工坊」不套用;偏好存 localStorage', () => {
    vm.toggleSortField('eta');
    expect(vm.sortAllOff()).toBe(true);
    expect(vm.sortKeys()).toEqual(['eta']);
    vm.toggleSortDir();
    expect(vm.sortDesc()).toBe(false);
    expect(vm.sortRank()).toEqual({ ws: 0, pos: 0, eta: 0 });
    expect(vm.sortSummary().short).toBe('返航 ↑');
    vm.toggleSortField('ws');
    expect(vm.sortDesc()).toBe(true);
    expect(vm.groups()?.map((g) => g.workshop.id)).toEqual(['B', 'A']);
    expect(vm.groups()?.[0]).toMatchObject({ ready: 2 });
    vm.select('A');
    expect(vm.wsSortDisabled()).toBe(true);
    expect(vm.sortKeys()).toEqual(['eta']);
    expect(vm.groups()).toBeNull();
    expect(JSON.parse(localStorage.getItem(SORT_KEY)!)).toEqual({ ws: true, pos: false, eta: false, desc: true });
  });

  it('工坊下拉選項:全部(工坊數)+ 各工坊的次要文字與計數;goTo 超出範圍退回全部', () => {
    const opts = vm.workshopOptions();
    expect(opts[0]).toMatchObject({ value: 0, label: '全部', display: '全部 (2)', hint: '2 間工坊' });
    expect(opts[0]!.meta).toEqual([{ text: '2 待收', tone: 'amber' }, { text: '5 艘' }]);
    expect(opts[2]).toMatchObject({ value: 2, label: 'B', hint: 'Garuda' });
    vm.goTo(2);
    expect(vm.currentWorkshop()?.id).toBe('B');
    vm.goTo(9);
    expect(vm.currentWorkshop()).toBeNull();
  });

  it('wsInfo / upkeepText', () => {
    expect(wsInfo({ server: 'Garuda' as never, captain: 'X' })).toBe('Garuda・X');
    expect(wsInfo({ server: null as never, captain: null })).toBe('');
    expect(upkeepText(2, 0)).toBe('2 艘需維修');
    expect(upkeepText(0, 1)).toBe('1 艘返航後需維修');
    expect(upkeepText(2, 1)).toBe('2 艘需維修、1 艘返航後');
  });

  it('wsMeta / addressLine', () => {
    expect(wsMeta({ server: 'Garuda' as never, captain: null })).toBe(' · Garuda');
    expect(wsMeta({ server: 'Garuda' as never, captain: 'X Y' })).toBe(' · Garuda · X Y');
    expect(addressLine({ address_district: null, address_ward: null, address_detail: null })).toBe('尚未設定地址');
    expect(addressLine({ address_district: '海霧村' as never, address_ward: 3, address_detail: '12 號' })).toBe('海霧村 · 3 區 · 12 號');
  });
});

describe('OverviewVm 排序偏好讀取', () => {
  it('不合法的值退回預設', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(SORT_KEY, '"oops"');
    expect(TestBed.inject(OverviewVm).sort()).toEqual(DEFAULT_SORT);
    TestBed.resetTestingModule();
    localStorage.setItem(SORT_KEY, JSON.stringify({ ws: true, pos: 'x' }));
    expect(TestBed.inject(OverviewVm).sort()).toEqual({ ...DEFAULT_SORT, ws: true });
    localStorage.clear();
  });
});

describe('OverviewVm 統計區收合(D-166)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('預設收起;切換後存 localStorage,重建 service 後保留', () => {
    const vm = TestBed.inject(OverviewVm);
    expect(vm.statsOpen()).toBe(false);
    vm.toggleStats();
    expect(vm.statsOpen()).toBe(true);
    expect(localStorage.getItem(STATS_OPEN_KEY)).toBe('true');
    TestBed.resetTestingModule();
    expect(TestBed.inject(OverviewVm).statsOpen()).toBe(true);
  });

  it('儲存的值不合法時視為收起', () => {
    localStorage.setItem(STATS_OPEN_KEY, 'oops');
    expect(TestBed.inject(OverviewVm).statsOpen()).toBe(false);
  });
});
