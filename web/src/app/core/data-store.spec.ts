import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { OverviewDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';

const overview: OverviewDto = { workshops: [] };

describe('DataStore', () => {
  let store: DataStore;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    store = TestBed.inject(DataStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
  });
  afterEach(() => store.stop());

  it('start 先用快照顯示,再以 API 結果取代並寫回快照', async () => {
    localStorage.setItem('eranaut.snapshot', JSON.stringify({ workshops: [{ id: 'old', submarines: [] }] }));
    store.start();
    expect(store.loaded()).toBe(true);
    expect(store.workshops()[0].id).toBe('old');
    http.expectOne('/api/overview').flush({ workshops: [{ id: 'new', submarines: [] }] });
    await Promise.resolve();
    await Promise.resolve();
    expect(store.workshops()[0].id).toBe('new');
    expect(JSON.parse(localStorage.getItem('eranaut.snapshot') ?? '{}').workshops[0].id).toBe('new');
  });

  it('抓取失敗保留現有畫面並標記 loadError', async () => {
    store.start();
    http.expectOne('/api/overview').flush(null, { status: 500, statusText: 'x' });
    await new Promise((r) => setTimeout(r));
    expect(store.loadError()).toBe(true);
  });

  it('stop 清空資料與快照', () => {
    localStorage.setItem('eranaut.snapshot', JSON.stringify(overview));
    store.start();
    http.expectOne('/api/overview');
    store.stop();
    expect(store.loaded()).toBe(false);
    expect(localStorage.getItem('eranaut.snapshot')).toBeNull();
  });

  it('檢視模式寫入 localStorage', () => {
    store.setView('card');
    expect(store.view()).toBe('card');
    expect(localStorage.getItem('eranaut.view')).toBe('"card"');
  });
});
