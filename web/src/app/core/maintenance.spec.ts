import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { MaintenanceDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { MAINTENANCE_POLL_MS, Maintenance, formatMaintenanceRange, isSiteMaintenance, maintenanceView } from './maintenance';

// 台北時間 2026-09-29 13:00 ~ 18:00(UTC 05:00 ~ 10:00)
const START = Date.UTC(2026, 8, 29, 5, 0);
const END = Date.UTC(2026, 8, 29, 10, 0);
const H = 3_600_000;
const info: MaintenanceDto = {
  id: 'MAINT00001',
  title: '09/29 維護更新作業',
  url: 'https://www.ffxiv.com.tw/web/news/news_content.aspx?id=MAINT00001',
  start_at: new Date(START).toISOString(),
  end_at: new Date(END).toISOString(),
};

describe('formatMaintenanceRange', () => {
  it('同一天只寫一次日期,不顯示年份', () => {
    expect(formatMaintenanceRange(START, END)).toBe('09/29 13:00 ~ 18:00');
  });
  it('跨日兩邊都寫日期(以台北時間判斷日期)', () => {
    const s = Date.UTC(2026, 8, 29, 15, 0); // 台北 23:00
    const e = Date.UTC(2026, 8, 29, 19, 0); // 台北隔天 03:00
    expect(formatMaintenanceRange(s, e)).toBe('09/29 23:00 ~ 09/30 03:00');
  });
});

describe('maintenanceView', () => {
  it('沒有維護 → null', () => {
    expect(maintenanceView(null, START)).toBeNull();
  });
  it('開始前 24 小時才出現,之前是 null', () => {
    expect(maintenanceView(info, START - 24 * H - 1000)).toBeNull();
    const v = maintenanceView(info, START - 24 * H)!;
    expect(v.phase).toBe('upcoming');
    expect(v.label).toBe('伺服器維護 09/29 13:00 ~ 18:00');
    expect(v.status).toBe('距開始 1 日 0 時 00 分');
  });
  it('倒數文字:4 小時 12 分', () => {
    expect(maintenanceView(info, START - (4 * H + 12 * 60_000))!.status).toBe('距開始 4 時 12 分');
  });
  it('開始後 = 維護中;超過預計結束但沒完成 = 超過預計時間', () => {
    expect(maintenanceView(info, START)!.phase).toBe('ongoing');
    expect(maintenanceView(info, START)!.status).toBe('維護中');
    const over = maintenanceView(info, END + 1000)!;
    expect(over.phase).toBe('overrun');
    expect(over.status).toBe('已超過預計時間,等待官方開機公告');
  });
  it('預計結束後 6 小時自動消失', () => {
    expect(maintenanceView(info, END + 6 * H - 1000)).not.toBeNull();
    expect(maintenanceView(info, END + 6 * H)).toBeNull();
  });
  it('官網維護(標題含「官網」)不顯示', () => {
    expect(maintenanceView({ ...info, title: '10/20 官網維護' }, START)).toBeNull();
    expect(isSiteMaintenance('10/20 官網維護')).toBe(true);
    expect(isSiteMaintenance('10/20 維護更新作業')).toBe(false);
  });
  it('時間格式壞掉 → null,不丟例外', () => {
    expect(maintenanceView({ ...info, start_at: 'x' }, START)).toBeNull();
  });
});

describe('Maintenance 服務', () => {
  let store: DataStore;
  let http: HttpTestingController;
  let svc: Maintenance;
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    http = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(Maintenance);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setVisibility = (state: 'visible' | 'hidden') => Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });

  it('沒有橫幅時完全不輪詢', () => {
    TestBed.tick();
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS * 3);
    http.expectNone('/api/maintenance');
  });

  it('橫幅顯示中且分頁在前景:每 5 分鐘確認一次;背景分頁不抓', async () => {
    store.now.set(START - 2 * H);
    store.maintenance.set(info);
    TestBed.tick();
    expect(svc.view()).not.toBeNull();

    setVisibility('hidden');
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS);
    http.expectNone('/api/maintenance');

    setVisibility('visible');
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS);
    http.expectOne('/api/maintenance').flush({ maintenance: info });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.maintenance()?.id).toBe('MAINT00001');
  });

  it('收到已開機(maintenance 為 null)→ 橫幅消失並停止輪詢', async () => {
    setVisibility('visible');
    store.now.set(START + H);
    store.maintenance.set(info);
    TestBed.tick();
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS);
    http.expectOne('/api/maintenance').flush({ maintenance: null });
    await vi.advanceTimersByTimeAsync(0);
    expect(svc.view()).toBeNull();
    TestBed.tick();
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS * 2);
    http.expectNone('/api/maintenance');
  });

  it('輪詢失敗保留現狀,不丟例外', async () => {
    setVisibility('visible');
    store.now.set(START + H);
    store.maintenance.set(info);
    TestBed.tick();
    vi.advanceTimersByTime(MAINTENANCE_POLL_MS);
    http.expectOne('/api/maintenance').flush(null, { status: 500, statusText: 'x' });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.maintenance()?.id).toBe('MAINT00001');
  });
});

describe('DataStore 與維護資料', () => {
  it('隨總覽一起取得、寫入快照;stop 清掉', async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    const store = TestBed.inject(DataStore);
    const http = TestBed.inject(HttpTestingController);
    store.start();
    http.expectOne('/api/overview').flush({ workshops: [], maintenance: info });
    await new Promise((r) => setTimeout(r));
    expect(store.maintenance()?.id).toBe('MAINT00001');
    expect(JSON.parse(localStorage.getItem('eranaut.snapshot') ?? '{}').maintenance.id).toBe('MAINT00001');
    store.stop();
    expect(store.maintenance()).toBeNull();
  });

  it('舊版 API 沒有 maintenance 欄位 → null', async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    const store = TestBed.inject(DataStore);
    const http = TestBed.inject(HttpTestingController);
    store.start();
    http.expectOne('/api/overview').flush({ workshops: [] });
    await new Promise((r) => setTimeout(r));
    expect(store.maintenance()).toBeNull();
    store.stop();
  });
});
