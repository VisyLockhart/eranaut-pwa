import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
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

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
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

  it('只列排序用的資訊:名稱與統計,沒有編輯 / 刪除按鈕與提醒徽章(搬到總覽,D-294)', () => {
    const { el } = render();
    const rows = el.querySelectorAll('.ws-row');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('1 艘探索中');
    expect(rows[0].textContent).toContain('1 艘待收');
    expect(rows[0].textContent).not.toContain('整批提醒');
    expect(rows[1].textContent).toContain('目前沒有潛水艇記錄');
    expect(el.querySelector('.ws-icon-btn')).toBeNull();
  });

  it('可拖曳的清單帶 ws-cdk(介面大小放大時靠它抵銷 zoom,D-164)', () => {
    const { el } = render();
    const list = el.querySelector('.ws-list');
    expect(list?.classList.contains('ws-cdk')).toBe(true);
    expect(list?.querySelectorAll('.ws-row')).toHaveLength(3);
  });

  it('沒有任何工坊時顯示空狀態', () => {
    store.fetched.set([]);
    expect(render().el.textContent).toContain('尚未建立任何工坊');
  });

  it('每列有把手與 ▲▼;頭尾的 ▲▼ 停用', () => {
    const { el } = render();
    expect(names(el, '.ws-row[data-id]')).toEqual(['a', 'b', 'c']);
    expect(el.querySelectorAll('.ws-drag-handle')).toHaveLength(3);
    const ups = el.querySelectorAll<HTMLButtonElement>('[data-move="up"]');
    const downs = el.querySelectorAll<HTMLButtonElement>('[data-move="down"]');
    expect([ups[0].disabled, ups[1].disabled, ups[2].disabled]).toEqual([true, false, false]);
    expect([downs[0].disabled, downs[1].disabled, downs[2].disabled]).toEqual([false, false, true]);
  });

  it('▼ 換位後順序更新並寫入 localStorage', () => {
    const { fixture, el } = render();
    (el.querySelector('.ws-row[data-id="a"] [data-move="down"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(names(el, '.ws-row[data-id]')).toEqual(['b', 'a', 'c']);
    expect(JSON.parse(localStorage.getItem('eranaut.workshop-order') ?? '[]')).toEqual(['b', 'a', 'c']);
  });

  it('桌機版每列多一個工坊圖示,手機版沒有', () => {
    expect(render('desktop').el.querySelectorAll('.ws-icon')).toHaveLength(3);
    TestBed.resetTestingModule();
  });
});
