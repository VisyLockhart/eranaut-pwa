import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataStore } from './data-store';
import { OverviewVm, addressLine, wsMeta } from './overview-vm';

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
    store = TestBed.inject(DataStore);
    vm = TestBed.inject(OverviewVm);
    store.now.set(NOW);
    store.workshops.set([ws('A', [sub('A', 1, 120), sub('A', 2, 30)]), ws('B', [sub('B', 1, -5), sub('B', 2, 30), sub('B', 3, null, 'complete')])]);
  });

  it('排序:可收艇在前(穩定),其餘依 ETA,同時間維持工坊與位置順序', () => {
    expect(vm.sortedAll().map((i) => i.id)).toEqual(['B-1', 'B-3', 'A-2', 'B-2', 'A-1']);
    expect(vm.fastest()?.id).toBe('B-1');
  });

  it('統計', () => {
    expect(vm.stats()).toEqual({ workshops: 2, submarines: 5, ready: 2 });
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
    store.workshops.set([ws('A', [])]);
    expect(vm.index()).toBe(0);
  });

  it('wsMeta / addressLine', () => {
    expect(wsMeta({ server: 'Garuda' as never, captain: null })).toBe(' · Garuda');
    expect(wsMeta({ server: 'Garuda' as never, captain: 'X Y' })).toBe(' · Garuda · X Y');
    expect(addressLine({ address_district: null, address_ward: null, address_detail: null })).toBe('尚未設定地址');
    expect(addressLine({ address_district: '海霧村' as never, address_ward: 3, address_detail: '12 號' })).toBe('海霧村 · 3 區 · 12 號');
  });
});
