import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { UpkeepDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { UpkeepVm } from '../core/upkeep-vm';
import { UpkeepTag } from './upkeep-bits';
import { OverviewVm } from '../core/overview-vm';
import { UpkeepPanel } from './upkeep-panel';
import { Component } from '@angular/core';
import { upkeepItem } from '../core/upkeep-vm';

const NOW = Date.parse('2026-10-26T02:00:00Z');
const iso = (min: number): string => new Date(NOW + min * 60_000).toISOString();
const upkeep = (done: number): UpkeepDto => ({ route_key: '1:OJ', route_sea: 1, route_points: ['O', 'J'], voyages_done: done, limit_voyages: 6, parts_sig: '3,1,2,4', current_sig: '3,1,2,4', repaired_at: null, updated_at: iso(0) });
const base = { workshop_id: 'w1', last_synced_at: iso(0) };
const workshop = (): WorkshopWithSubmarines => ({
  id: 'w1', name: '貝殼工坊', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: iso(0),
  submarines: [
    { ...base, id: 's1', position: 1, name: '潛水艇-1', status: 'exploring', expected_return_at: iso(180), upkeep: upkeep(2) },
    { ...base, id: 's2', position: 2, name: '潛水艇-2', status: 'complete', expected_return_at: null, upkeep: upkeep(6) },
    { ...base, id: 's3', position: 3, name: '潛水艇-3', status: 'exploring', expected_return_at: iso(60) },
    { ...base, id: 's4', position: 4, name: '潛水艇-4', status: 'exploring', expected_return_at: iso(120), upkeep: upkeep(6) },
  ],
});

@Component({ imports: [UpkeepTag], template: `<app-upkeep-tag [item]="item" />` })
class Host {
  item = upkeepItem(workshop().submarines[1]!, NOW);
}

describe('維修面板與總覽標示', () => {
  let http: HttpTestingController;
  let vm: UpkeepVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    const store = TestBed.inject(DataStore);
    store.now.set(NOW);
    store.fetched.set([workshop()]);
    vm = TestBed.inject(UpkeepVm);
  });

  function mountPanel() {
    vm.open('w1');
    const fixture = TestBed.createComponent(UpkeepPanel);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    return { fixture, el };
  }

  it('同工坊 4 艘:標出需要維修的、返航後需維修的、還能跑的、沒開啟的', () => {
    const { el } = mountPanel();
    const items = [...el.querySelectorAll<HTMLElement>('.uk-item')];
    expect(items.map((i) => i.dataset['phase'])).toEqual(['ok', 'repair_now', 'repair_after_return']);
    expect(items[0]!.textContent).toContain('還能跑 4 趟');
    expect(items[1]!.textContent).toContain('已返航・6/6 趟');
    expect(items[2]!.textContent).toContain('探索中');
    expect(el.querySelector('.uk-off')?.textContent).toContain('③ 潛水艇-3・未開啟維修提醒');
    expect(el.querySelector('.uk-sum')?.textContent).toContain('1 艘需要維修才能出航，1 艘返航後需維修');
  });

  it('預設只勾現在就要維修的;合計修理材與按鈕數量跟著勾選', () => {
    const { el, fixture } = mountPanel();
    const boxes = [...el.querySelectorAll<HTMLInputElement>('.uk-pick input')];
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false]);
    expect(el.querySelector('.uk-total')?.textContent).toContain('已勾選 1 艘');
    expect(el.querySelector('.uk-total b')?.textContent).toBe('10');
    boxes[2]!.click();
    fixture.detectChanges();
    expect(el.querySelector('.uk-total b')?.textContent).toBe('20');
    expect(el.querySelector('.uk-go')?.textContent).toContain('標示已維修（2 艘）');
  });

  it('全部取消勾選時,送出按鈕停用', () => {
    const { el, fixture } = mountPanel();
    el.querySelectorAll<HTMLInputElement>('.uk-pick input')[1]!.click();
    fixture.detectChanges();
    expect(el.querySelector<HTMLButtonElement>('.uk-go')!.disabled).toBe(true);
  });

  it('送出標示已維修', async () => {
    const { el, fixture } = mountPanel();
    el.querySelector<HTMLButtonElement>('.uk-go')!.click();
    const req = http.expectOne('/api/workshops/w1/upkeep/repaired');
    expect(req.request.body).toEqual({ submarine_ids: ['s2'] });
    req.flush({ submarines: workshop().submarines.map((s) => (s.id === 's2' ? { ...s, upkeep: upkeep(0) } : s)) });
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
    expect(vm.openId()).toBeNull();
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
  });

  it('「調整」展開步進器;ESC / 稍後再說可關閉', () => {
    const { el, fixture } = mountPanel();
    el.querySelector<HTMLButtonElement>('.uk-link')!.click();
    fixture.detectChanges();
    expect(el.querySelector('.uk-adjust')?.textContent).toContain('已跑');
    el.querySelector<HTMLButtonElement>('.btn-secondary')!.click();
    expect(vm.openId()).toBeNull();
  });

  it('總覽的維修摘要(D-290):有要修的列出工坊;小字標籤依階段上色', () => {
    const ov = TestBed.inject(OverviewVm);
    const u = ov.upkeepSummary();
    expect(u.state).toBe('alert');
    expect(u.repairNow).toBe(1);
    expect(u.afterReturn).toBe(1);
    expect(u.alerts.map((a) => a.workshop.id)).toEqual(['w1']);
    const fixture = TestBed.createComponent(Host);
    const el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(el.querySelector('.uk-tag')?.getAttribute('data-phase')).toBe('repair_now');
  });

  it('多間工坊要維修時,面板可左右切換(循環),只有一間時不顯示切換', () => {
    const store = TestBed.inject(DataStore);
    const w2 = { ...workshop(), id: 'w2', name: '鋼鐵之心', submarines: workshop().submarines.map((x) => ({ ...x, id: 'b' + x.id, workshop_id: 'w2' })) };
    store.fetched.set([workshop(), w2]);
    vm.open('w2', ['w1', 'w2']);
    const fixture = TestBed.createComponent(UpkeepPanel);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    expect(el.querySelector('.uk-nav-label')?.textContent).toContain('2 / 2');
    el.querySelectorAll<HTMLButtonElement>('.uk-nav button')[1]!.click();
    fixture.detectChanges();
    expect(vm.openId()).toBe('w1');
    expect(el.querySelector('.modal-title')?.textContent).toContain('貝殼工坊');
    vm.open('w1');
    fixture.detectChanges();
    expect(el.querySelector('.uk-nav')).toBeNull();
  });
});
