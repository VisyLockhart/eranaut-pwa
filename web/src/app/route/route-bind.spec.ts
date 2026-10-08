import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import type { RouteSubDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { RouteBind } from './route-bind';
import { RouteVm } from './route-vm';

const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const ws = (id: string, name: string, subs: [string, number, string | null][]): WorkshopWithSubmarines => ({
  id, name, server: 'Titan', captain: null, address_district: null, address_ward: null, address_detail: null,
  notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00.000Z',
  submarines: subs.map(([sid, position, n]) => ({ id: sid, workshop_id: id, position, name: n, status: 'exploring', expected_return_at: null, last_synced_at: '2026-10-08T00:00:00.000Z' })),
} as unknown as WorkshopWithSubmarines);
const settle = () => new Promise((r) => setTimeout(r));

@Component({ selector: 'app-host', imports: [RouteBind], template: '<app-route-bind subId="a" />' })
class Host {}

describe('RouteBind', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;

  async function mount(saved: RouteSubDto[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(DataStore).fetched.set([ws('w1', '一號工坊', [['s1', 1, '快艇'], ['s2', 2, null]]), ws('w2', '二號工坊', [['s3', 1, 'X']])]);
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }
  const btn = (text: string) => [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('未綁定:按「綁定工坊潛艇」列出各工坊的潛艇', async () => {
    await mount([dto()]);
    expect(el.querySelector('.rt-tag')).toBeNull();
    btn('綁定工坊潛艇').click();
    fixture.detectChanges();
    expect(el.textContent).toContain('一號工坊');
    expect(el.textContent).toContain('二號工坊');
    expect(el.querySelectorAll('.rt-bind-group .rt-chip')).toHaveLength(3);
  });

  it('選一艘 → PUT 只改綁定(保留等級與零件)→ 顯示「已綁定 1 艘:工坊 ①名稱」', async () => {
    await mount([dto()]);
    btn('綁定工坊潛艇').click();
    fixture.detectChanges();
    btn('① 快艇').click();
    const req = http.expectOne('/api/route-subs/a');
    expect(req.request.body).toEqual({ name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: ['s1'] });
    req.flush(dto({ bound_submarine_ids: ['s1'] }));
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('.rt-tag')?.textContent).toContain('已綁定 1 艘:一號工坊 ① 快艇');
    expect(btn('完成')).toBeDefined(); // 選完面板不關,可以繼續選
  });

  it('可以再多選一艘(送出全部);點已綁的那艘則取消它', async () => {
    await mount([dto({ bound_submarine_ids: ['s1'] })]);
    btn('調整綁定').click();
    fixture.detectChanges();
    btn('② (未命名)').click();
    const req = http.expectOne('/api/route-subs/a');
    expect(req.request.body.bound_submarine_ids).toEqual(['s1', 's2']);
    req.flush(dto({ bound_submarine_ids: ['s1', 's2'] }));
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('.rt-tag')?.textContent).toContain('已綁定 2 艘');
    expect(el.querySelectorAll('.rt-chip.active')).toHaveLength(2);
    btn('① 快艇').click();
    const req2 = http.expectOne('/api/route-subs/a');
    expect(req2.request.body.bound_submarine_ids).toEqual(['s2']);
    req2.flush(dto({ bound_submarine_ids: ['s2'] }));
    await settle();
    fixture.detectChanges();
    expect(el.querySelectorAll('.rt-chip.active')).toHaveLength(1);
  });

  it('已綁在別組的潛艇會標示那一組的名稱,選了就改綁到這一組', async () => {
    await mount([dto(), dto({ id: 'b', name: '備用艇', bound_submarine_ids: ['s3'] })]);
    btn('綁定工坊潛艇').click();
    fixture.detectChanges();
    expect(el.textContent).toContain('綁在「備用艇」');
    btn('① X(綁在「備用艇」)').click();
    const req = http.expectOne('/api/route-subs/a');
    expect(req.request.body.bound_submarine_ids).toEqual(['s3']);
    req.flush(dto({ bound_submarine_ids: ['s3'] }));
    await settle();
    fixture.detectChanges();
    expect(vm.saved().find((s) => s.id === 'b')!.bound_submarine_ids).toEqual([]);
  });

  it('全部解除:送空陣列', async () => {
    await mount([dto({ bound_submarine_ids: ['s3', 's1'] })]);
    expect(el.querySelector('.rt-tag')?.textContent).toContain('二號工坊 ① X、一號工坊 ① 快艇');
    btn('全部解除').click();
    const req = http.expectOne('/api/route-subs/a');
    expect(req.request.body.bound_submarine_ids).toEqual([]);
    req.flush(dto());
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('.rt-tag')).toBeNull();
  });

  it('綁定的潛艇不在工坊資料裡(尚未載入)時顯示通用文字', async () => {
    await mount([dto({ bound_submarine_ids: ['ghost'] })]);
    expect(el.querySelector('.rt-tag')?.textContent).toContain('工坊潛艇');
  });

  it('寫入失敗:不改綁定', async () => {
    await mount([dto()]);
    btn('綁定工坊潛艇').click();
    fixture.detectChanges();
    btn('① 快艇').click();
    http.expectOne('/api/route-subs/a').error(new ProgressEvent('error'));
    await settle();
    fixture.detectChanges();
    expect(vm.saved()[0]!.bound_submarine_ids).toEqual([]);
  });
});
