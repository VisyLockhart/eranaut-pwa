import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { UpdatePage } from './update-page';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const workshop = (id: string, name: string, n: number): WorkshopWithSubmarines => ({
  id,
  name,
  server: '迦樓羅',
  captain: '芙寧娜',
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, workshop_id: id, position: i + 1, name: `潛水艇-${i + 1}`, status: 'exploring' as const, expected_return_at: '2026-10-02T00:00:00Z', last_synced_at: '2026-10-01T00:00:00Z' })),
});

describe('UpdatePage', () => {
  let http: HttpTestingController;
  let store: DataStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    store.loaded.set(true);
    store.fetched.set([workshop('w1', '貝殼工坊', 2), workshop('w2', '鋼鐵之心', 1)]);
  });

  function open() {
    const fixture = TestBed.createComponent(UpdatePage);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    const input = (position: number, field: string): HTMLInputElement => el.querySelector<HTMLInputElement>(`[data-row="${position}"] [data-field="${field}"]`)!;
    const type = (position: number, field: string, value: string): void => {
      const i = input(position, field);
      i.value = value;
      i.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, el, input, type };
  }

  it('列出所選工坊的潛艇;工坊下拉選單依畫面順序', () => {
    const { el } = open();
    expect([...el.querySelectorAll('.uf-row')].length).toBe(2);
    expect([...el.querySelectorAll('#uf-ws option')].map((o) => o.textContent!.trim())).toEqual(['貝殼工坊', '鋼鐵之心']);
  });

  it('切換工坊:以該工坊的潛艇重建表單', () => {
    const { el, fixture } = open();
    const select = el.querySelector<HTMLSelectElement>('#uf-ws')!;
    select.value = 'w2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(1);
  });

  it('時間欄位只留數字;填完顯示預計返航(台北時間)', () => {
    const { el, input, type } = open();
    type(1, 'h', '3a');
    expect(input(1, 'h').value).toBe('3');
    type(1, 'd', '0');
    type(1, 'm', '41');
    expect(el.querySelector('[data-row="1"] .uf-eta')!.textContent).toContain('預計返航');
  });

  it('切到探索完成:隱藏時間欄,預計返航改為可收艇說明', () => {
    const { el, fixture } = open();
    el.querySelectorAll<HTMLButtonElement>('[data-row="1"] .uf-seg button')[1].click();
    fixture.detectChanges();
    expect(el.querySelector('[data-row="1"] [data-field="h"]')).toBeNull();
    expect(el.querySelector('[data-row="1"] .uf-eta')!.textContent).toContain('可收艇');
  });

  it('加入第 3 艘 / 移除', () => {
    const { el, fixture } = open();
    el.querySelector<HTMLButtonElement>('.uf-add')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(3);
    expect(el.querySelectorAll('.uf-rm').length).toBe(1);
    el.querySelector<HTMLButtonElement>('.uf-rm')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(2);
  });

  it('送出成功:跳回總覽', async () => {
    const { el, fixture, type } = open();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/'); // 先在總覽路徑上,才能看出導頁
    for (const p of [1, 2]) {
      type(p, 'd', '0');
      type(p, 'h', '2');
      type(p, 'm', '0');
    }
    // 離開欄位 → 起算
    el.querySelectorAll<HTMLInputElement>('[data-field="m"]').forEach((i) => i.dispatchEvent(new FocusEvent('blur')));
    el.querySelector<HTMLButtonElement>('.uf-actions-m .primary-btn')!.click();
    fixture.detectChanges();
    const req = http.expectOne('/api/workshops/w1/submarines');
    const body = req.request.body as { submarines: { remaining_minutes: number }[] };
    // 剛填完就送出:零頭進位多扣 1 分鐘,最多差 1 分鐘(D-124 ④)
    expect([119, 120]).toContain(body.submarines[0].remaining_minutes);
    req.flush({ submarines: workshop('w1', '貝殼工坊', 2).submarines, reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();
    expect(router.url).toBe('/');
  });

  it('直接開頁面時資料還沒載入:資料到了之後自動建立表單', async () => {
    store.loaded.set(false);
    store.fetched.set([]);
    const { el, fixture } = open();
    expect(el.querySelectorAll('.uf-row').length).toBe(0);
    store.fetched.set([workshop('w1', '貝殼工坊', 2)]);
    store.loaded.set(true);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(2);
  });

  it('沒有任何工坊:顯示引導前往工坊管理', () => {
    store.fetched.set([]);
    const { el } = open();
    expect(el.textContent).toContain('先建立一個工坊');
    expect(el.querySelector('a[href="/workshops"]')).not.toBeNull();
    expect(el.querySelector('.uf-actions-m')).toBeNull();
  });
});
