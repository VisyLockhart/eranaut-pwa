import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { ROUTE_CACHE_KEY, ROUTE_FILTERS_CACHE_KEY } from './route-cache';
import { RouteFilterVm } from './route-filter-vm';
import { RoutePage } from './route-page';
import { ROUTE_FEATURES } from './route-features';
import { RouteVm } from './route-vm';

// 展示模式(saving: false):沒有伺服器,不呼叫 /api/route-subs、清單恆為空,配置只是臨時配置
describe('RouteVm(展示模式:不儲存配置)', () => {
  let vm: RouteVm;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ROUTE_FEATURES, useValue: { saving: false } }] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    TestBed.tick();
  });

  it('預設可儲存(正式版);展示模式關閉', () => {
    expect(vm.canSave).toBe(false);
    TestBed.resetTestingModule();
    expect(TestBed.inject(ROUTE_FEATURES).saving).toBe(true);
  });

  it('start() 視為載入完成,不呼叫 API、不寫快照', async () => {
    vm.start();
    await vm.refresh();
    expect(vm.loaded()).toBe(true);
    expect(vm.saved()).toEqual([]);
    http.expectNone('/api/route-subs');
    expect(localStorage.getItem(ROUTE_CACHE_KEY)).toBeNull();
  });

  it('儲存、覆蓋、綁定、刪除都不會送出請求', async () => {
    vm.start();
    await expect(vm.saveCurrent('x')).rejects.toThrow();
    await expect(vm.overwrite('a')).rejects.toThrow();
    await expect(vm.remove('a')).rejects.toThrow();
    http.expectNone('/api/route-subs');
    expect(vm.pending()).toBe(0);
  });

  it('套用草稿成為臨時配置,不需要儲存', () => {
    vm.openConfig('temp');
    vm.setDraftLevel(100);
    vm.setDraftPart(0, 7);
    vm.applyDraft();
    expect(vm.subId()).toBeNull();
    expect(vm.level()).toBe(100);
    expect(vm.parts()[0]).toBe(7);
  });
});

// 展示模式:條件組合同樣不能儲存(沒有伺服器),整個功能不顯示、不呼叫 /api/route-filters(D-229)
describe('條件組合(展示模式:不儲存)', () => {
  let http: HttpTestingController;
  let fv: RouteFilterVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ROUTE_FEATURES, useValue: { saving: false } }] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    fv = TestBed.inject(RouteFilterVm);
  });

  it('start() 不呼叫 API、不寫快照;儲存與覆蓋都被拒絕', async () => {
    expect(fv.enabled).toBe(false);
    fv.start();
    await fv.refresh();
    http.expectNone('/api/route-filters');
    expect(localStorage.getItem(ROUTE_FILTERS_CACHE_KEY)).toBeNull();
    await expect(fv.saveCurrent('x')).rejects.toThrow();
    await expect(fv.overwrite('a')).rejects.toThrow();
    await expect(fv.remove('a')).rejects.toThrow();
    http.expectNone('/api/route-filters');
  });

  it('找路線頁沒有「條件組合」列與「儲存條件」按鈕,但條件區仍可收合', () => {
    TestBed.inject(Layout).isDesktop.set(false);
    const vm = TestBed.inject(RouteVm);
    vm.setTab('route');
    vm.findOpen.set(true);
    const f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('app-route-filter-bar .rt-filterbar')).toBeNull();
    const labels = [...el.querySelectorAll('button')].map((b) => b.textContent?.trim() ?? '');
    expect(labels.some((t) => t.startsWith('儲存條件') || t.startsWith('儲存這組條件'))).toBe(false);
    expect(el.querySelector('#rt-find-cond-body')).not.toBeNull();
    http.expectNone('/api/route-filters');
  });
});
