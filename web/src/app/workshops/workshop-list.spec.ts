import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { OverviewVm } from '../core/overview-vm';
import { WorkshopsVm } from '../core/workshops-vm';
import { WorkshopList } from './workshop-list';

const NOW = Date.parse('2026-10-01T00:00:00Z');
const at = (min: number): string => new Date(NOW + min * 60_000).toISOString();
function ws(id: string, extra: Partial<WorkshopWithSubmarines> = {}, etas: number[] = []): WorkshopWithSubmarines {
  return {
    id,
    name: `工坊${id}`,
    server: '迦樓羅',
    captain: null,
    address_district: null,
    address_ward: null,
    address_detail: null,
    notify_batched: false,
    notify_lead_minutes: 0,
    created_at: at(0),
    submarines: etas.map((eta, i) => ({ id: `${id}${i}`, workshop_id: id, position: i + 1, name: null, status: 'exploring' as const, expected_return_at: at(eta), last_synced_at: at(0) })),
    ...extra,
  };
}

describe('WorkshopList', () => {
  let store: DataStore;
  let vm: WorkshopsVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    vm = TestBed.inject(WorkshopsVm);
    store.now.set(NOW);
    store.loaded.set(true);
    store.fetched.set([ws('a', { notify_batched: true, notify_lead_minutes: 5 }, [30, -10]), ws('b'), ws('c', {}, [60])]);
  });

  function render(variant: 'mobile' | 'desktop' = 'mobile') {
    const fixture = TestBed.createComponent(WorkshopList);
    fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }
  const names = (el: HTMLElement, selector: string) => [...el.querySelectorAll(selector)].map((e) => e.getAttribute('data-id') ?? e.textContent);

  it('瀏覽模式:列出工坊、統計與徽章', () => {
    const { el } = render();
    const rows = el.querySelectorAll('.ws-browse-item');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('整批提醒');
    expect(rows[0].textContent).toContain('提前 5 分');
    expect(rows[0].textContent).toContain('1 艘探索中');
    expect(rows[0].textContent).toContain('1 艘待收');
    expect(rows[1].textContent).toContain('目前沒有潛水艇記錄');
  });

  it('桌機瀏覽模式有地址泡泡、手機沒有', () => {
    store.fetched.update((l) => [{ ...l[0], address_district: '海霧村', address_ward: 15, address_detail: '51巷2號' }, ...l.slice(1)]);
    expect(render('desktop').el.querySelector('.ws-tooltip-bubble')?.textContent).toContain('海霧村 · 15 區 · 51巷2號');
    TestBed.resetTestingModule();
  });

  it('只有可拖曳的管理清單帶 ws-cdk(介面大小放大時靠它抵銷 zoom,D-164)', () => {
    expect(render().el.querySelector('.ws-list.ws-cdk')).toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(Auth).status.set('authenticated');
    const store2 = TestBed.inject(DataStore);
    store2.now.set(NOW);
    store2.loaded.set(true);
    store2.fetched.set([ws('a'), ws('b')]);
    TestBed.inject(WorkshopsVm).manageMode.set(true);
    const fixture = TestBed.createComponent(WorkshopList);
    fixture.componentRef.setInput('variant', 'mobile');
    fixture.detectChanges();
    const list = (fixture.nativeElement as HTMLElement).querySelector('.ws-list');
    expect(list?.classList.contains('ws-cdk')).toBe(true);
    expect(list?.querySelectorAll('.ws-row')).toHaveLength(2);
  });

  it('沒有任何工坊時顯示空狀態', () => {
    store.fetched.set([]);
    expect(render().el.textContent).toContain('尚未建立任何工坊');
  });

  it('點工坊:總覽套用該工坊過濾並導向總覽', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { el } = render();
    (el.querySelectorAll('.ws-browse-item')[2] as HTMLElement).click();
    expect(TestBed.inject(OverviewVm).currentWorkshop()?.id).toBe('c');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('管理模式:每列有把手、▲▼、編輯、刪除;頭尾的 ▲▼ 停用', () => {
    vm.manageMode.set(true);
    const { el } = render();
    expect(names(el, '.ws-row[data-id]')).toEqual(['a', 'b', 'c']);
    expect(el.querySelectorAll('.ws-drag-handle')).toHaveLength(3);
    const ups = el.querySelectorAll<HTMLButtonElement>('[data-move="up"]');
    const downs = el.querySelectorAll<HTMLButtonElement>('[data-move="down"]');
    expect([ups[0].disabled, ups[1].disabled, ups[2].disabled]).toEqual([true, false, false]);
    expect([downs[0].disabled, downs[1].disabled, downs[2].disabled]).toEqual([false, false, true]);
  });

  it('▼ 換位後順序更新並寫入 localStorage', async () => {
    vm.manageMode.set(true);
    const { fixture, el } = render();
    (el.querySelector('.ws-row[data-id="a"] [data-move="down"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names(el, '.ws-row[data-id]')).toEqual(['b', 'a', 'c']);
    expect(JSON.parse(localStorage.getItem('eranaut.workshop-order') ?? '[]')).toEqual(['b', 'a', 'c']);
  });

  it('編輯與刪除按鈕開啟對應對話框', () => {
    vm.manageMode.set(true);
    const { el } = render();
    (el.querySelector('.ws-row[data-id="b"] .ws-icon-btn:not(.danger)') as HTMLElement).click();
    expect(vm.dialog()).toEqual({ type: 'form', id: 'b' });
    (el.querySelector('.ws-row[data-id="c"] .ws-icon-btn.danger') as HTMLElement).click();
    expect(vm.dialog()).toEqual({ type: 'delete', id: 'c' });
  });

  it('手機管理模式有「新增工坊」按鈕,桌機沒有(在頂欄)', () => {
    vm.manageMode.set(true);
    expect(render('mobile').el.querySelector('.ws-add-btn')).not.toBeNull();
    TestBed.resetTestingModule();
  });
});
