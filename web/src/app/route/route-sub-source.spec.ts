import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { subSimBuild } from './route-state';
import { RouteExploreVm } from './route-explore-vm';
import { RouteVm } from './route-vm';

const T = '2026-10-29T00:00:00Z';
const prog = (level: number): SubmarineDto['progress'] => ({ level, exp_in_level: 0, source: 'manual', assist_on: false, assist_mode: 'level', max_hours: null, filter_id: null, pending: null, last_route: null, effective_level: level, effective_exp: 0, updated_at: T });
const build = (hull = 3): SubmarineDto['build'] => ({ hull, stern: 1, bow: 2, bridge: 4, updated_at: T });
const sub = (id: string, position: number, over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id, workshop_id: 'w1', position, name: `艇${position}`, status: 'complete', expected_return_at: null, last_synced_at: T, ...over,
});
const ws = (subs: SubmarineDto[]): WorkshopWithSubmarines => ({
  id: 'w1', name: '貝殼', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: T, submarines: subs,
});

describe('工坊潛艇作為配置來源(D-296)', () => {
  let vm: RouteVm;
  let store: DataStore;
  let x: RouteExploreVm;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(DataStore);
    x = TestBed.inject(RouteExploreVm);
    vm = TestBed.inject(RouteVm);
    store.loaded.set(true);
    store.fetched.set([ws([sub('s1', 1, { progress: prog(80), build: build() }), sub('s2', 2, { progress: prog(60) }), sub('s3', 3, { build: build() }), sub('s4', 4)])]);
    x.selectChartWs('w1');
    TestBed.tick();
  });

  it('subSimBuild:要有等級也要有配件才算;等級取返航後的有效等級', () => {
    expect(subSimBuild(sub('a', 1, { progress: prog(80), build: build() }))).toEqual({ level: 80, parts: [3, 1, 2, 4] });
    expect(subSimBuild(sub('a', 1, { progress: prog(80) }))).toBeNull();
    expect(subSimBuild(sub('a', 1, { build: build() }))).toBeNull();
  });

  it('候選清單只列有等級也有配件的艇;沒選工坊就沒有', () => {
    expect(vm.wsCandidates().map((s) => s.id)).toEqual(['s1']);
    x.selectChartWs(null);
    expect(vm.wsCandidates()).toEqual([]);
  });

  it('選工坊潛艇:等級與配件取自該艇,配置範本的選擇解除;沒有等級或配件的艇不能選', () => {
    vm.subId.set('cfg');
    vm.useWsSub('s2');
    expect(vm.wsSubId()).toBeNull();
    expect(vm.subId()).toBe('cfg');
    vm.useWsSub('s1');
    expect(vm.source()).toBe('ws');
    expect(vm.subId()).toBeNull();
    expect(vm.level()).toBe(80);
    expect(vm.parts()).toEqual([3, 1, 2, 4]);
  });

  it('選了配置範本會解除工坊潛艇(互斥);✕ 清除保留畫面上的等級與配件', () => {
    vm.useWsSub('s1');
    vm.saved.set([{ id: 'a', name: 'A', level: 50, hull: 1, stern: 1, bow: 1, bridge: 1, favorite: false, created_at: T, updated_at: T }]);
    vm.useSub('a');
    expect(vm.source()).toBe('config');
    expect(vm.wsSubId()).toBeNull();
    vm.useWsSub('s1');
    vm.detachWsSub();
    expect(vm.source()).toBe('none');
    expect(vm.level()).toBe(80);
  });

  it('潛艇的配件被改、等級變了,畫面跟著走;配件被清掉或換工坊就解除', () => {
    vm.useWsSub('s1');
    store.fetched.set([ws([sub('s1', 1, { progress: prog(90), build: build(5) })])]);
    TestBed.tick();
    expect(vm.level()).toBe(90);
    expect(vm.parts()[0]).toBe(5);
    store.fetched.set([ws([sub('s1', 1, { progress: prog(90) })])]);
    TestBed.tick();
    expect(vm.wsSubId()).toBeNull();
    store.fetched.set([ws([sub('s1', 1, { progress: prog(90), build: build() })])]);
    vm.useWsSub('s1');
    x.selectChartWs(null);
    TestBed.tick();
    expect(vm.wsSubId()).toBeNull();
  });

  it('手動改等級或配件 = 不再是工坊潛艇的配置', () => {
    vm.useWsSub('s1');
    vm.setPart(0, 7);
    expect(vm.wsSubId()).toBeNull();
  });

  describe('潛艇配置對話框', () => {
    it('已有等級:唯讀;儲存只送配件;開著維修提醒且勾選時帶 mark_repaired', async () => {
      store.fetched.set([ws([sub('s1', 1, { progress: prog(80), build: build(), upkeep: { route_key: '1:OJ', route_sea: 1, route_points: [], voyages_done: 2, limit_voyages: 6, parts_sig: '3,1,2,4', current_sig: '3,1,2,4', repaired_at: null, updated_at: T } })])]);
      vm.openSubBuild('s1');
      const d = vm.draft()!;
      expect(d.mode).toBe('sub');
      expect(d.sub!.levelFixed).toBe(true);
      vm.setDraftLevel(10);
      expect(vm.draft()!.level).toBe(80);
      vm.setDraftPart(0, 5);
      vm.setDraftMarkRepaired(true);
      const p = vm.saveSubDraft();
      const req = http.expectOne('/api/submarines/s1/build');
      expect(req.request.body).toEqual({ hull: 5, stern: 1, bow: 2, bridge: 4, mark_repaired: true });
      req.flush(sub('s1', 1, { progress: prog(80), build: build(5) }));
      await p;
      expect(vm.draft()).toBeNull();
      http.match('/api/overview');
    });

    it('沒填等級:可輸入模擬等級,儲存時先存成這艘的等級,再存配件', async () => {
      vm.openSubBuild('s3');
      expect(vm.draft()!.sub!.levelFixed).toBe(false);
      vm.setDraftLevel(70);
      const p = vm.saveSubDraft();
      const r1 = http.expectOne('/api/submarines/s3/progress');
      expect(r1.request.body).toEqual({ level: 70 });
      r1.flush(sub('s3', 3, { progress: prog(70), build: build() }));
      await new Promise((r) => setTimeout(r));
      const r2 = http.expectOne('/api/submarines/s3/build');
      expect(r2.request.body).toEqual({ hull: 3, stern: 1, bow: 2, bridge: 4 });
      r2.flush(sub('s3', 3, { progress: prog(70), build: build() }));
      await p;
    });

    it('套用已儲存的配置只複製配件,等級不動', () => {
      vm.saved.set([{ id: 'a', name: 'A', level: 50, hull: 9, stern: 9, bow: 9, bridge: 9, favorite: false, created_at: T, updated_at: T }]);
      vm.openSubBuild('s1');
      vm.applySavedToDraft('a');
      expect(vm.draft()!.parts).toEqual([9, 9, 9, 9]);
      expect(vm.draft()!.level).toBe(80);
    });
  });
});
