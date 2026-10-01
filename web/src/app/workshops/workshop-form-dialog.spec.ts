import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataStore } from '../core/data-store';
import { WorkshopFormDialog } from './workshop-form-dialog';

const NOW = Date.parse('2026-10-01T00:00:00Z');
const at = (min: number): string => new Date(NOW + min * 60_000).toISOString();

function workshop(over: Partial<WorkshopWithSubmarines> = {}, etas: number[] = []): WorkshopWithSubmarines {
  return {
    id: 'w1',
    name: '貝殼工坊',
    server: '伊弗利特',
    captain: '芙寧娜',
    address_district: null,
    address_ward: null,
    address_detail: null,
    notify_batched: false,
    notify_lead_minutes: 0,
    created_at: at(0),
    submarines: etas.map((eta, i) => ({ id: `s${i}`, workshop_id: 'w1', position: i + 1, name: null, status: 'exploring' as const, expected_return_at: at(eta), last_synced_at: at(0) })),
    ...over,
  };
}

/** HTTP 回應 → promise → 狀態更新都是微任務,等一個 macrotask 讓它們全部跑完 */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

describe('WorkshopFormDialog', () => {
  let http: HttpTestingController;
  let store: DataStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(DataStore);
    store.now.set(NOW);
  });

  function open(id: string | null) {
    const fixture = TestBed.createComponent(WorkshopFormDialog);
    fixture.componentRef.setInput('workshopId', id);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el); // 焦點相關行為(cdkFocusInitial)需要元素在文件裡
    fixture.detectChanges();
    const type = (selector: string, value: string): void => {
      const input = el.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
    };
    const submit = async (): Promise<void> => {
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    };
    return { fixture, el, closed, type, submit };
  }

  it('空白送出:顯示必填錯誤、不呼叫 API', async () => {
    const { el, submit, fixture } = open(null);
    await submit();
    fixture.detectChanges();
    expect(el.textContent).toContain('請輸入工坊名稱');
    expect(el.textContent).toContain('請選擇遊戲伺服器');
    http.expectNone('/api/workshops');
  });

  it('新增:送出整理過的內容(去空白、空白選填欄位送 null),成功後關閉', async () => {
    const { el, type, submit, closed, fixture } = open(null);
    type('#wsf-name', '  新工坊  ');
    type('#wsf-server', '迦樓羅');
    type('#wsf-ward', '8');
    await submit();
    const req = http.expectOne('/api/workshops');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: '新工坊',
      server: '迦樓羅',
      captain: null,
      address_district: null,
      address_ward: 8,
      address_detail: null,
      notify_batched: false,
      notify_lead_minutes: 0,
    });
    req.flush({ ...workshop({ id: 'new', name: '新工坊' }), submarines: undefined }, { status: 201, statusText: 'Created' });
    await settle();
    fixture.detectChanges();
    expect(closed).toHaveBeenCalledTimes(1);
    expect(store.workshops().map((w) => w.id)).toEqual(['new']);
    expect(el.querySelector('.modal-error-text')).toBeNull();
  });

  it('伺服器驗證失敗:錯誤顯示在欄位旁,不關閉', async () => {
    const { el, type, submit, closed, fixture } = open(null);
    type('#wsf-name', '工坊');
    type('#wsf-server', '泰坦');
    await submit();
    http.expectOne('/api/workshops').flush({ error: 'validation_failed', fields: { name: 'too_long' } }, { status: 400, statusText: 'Bad Request' });
    await settle();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(el.textContent).toContain('字數超過上限');
    expect(closed).not.toHaveBeenCalled();
  });

  it('其他錯誤:顯示通用訊息並可重試', async () => {
    const { el, type, submit, fixture } = open(null);
    type('#wsf-name', '工坊');
    type('#wsf-server', '泰坦');
    await submit();
    http.expectOne('/api/workshops').flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(el.textContent).toContain('儲存失敗');
    expect((el.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('編輯:帶入既有值,以 PUT 整筆取代', async () => {
    store.fetched.set([workshop({ address_district: '海霧村', address_ward: 15, address_detail: '51巷2號' })]);
    const { el, type, submit, fixture } = open('w1');
    expect(el.querySelector<HTMLInputElement>('#wsf-name')!.value).toBe('貝殼工坊');
    expect(el.querySelector<HTMLInputElement>('#wsf-ward')!.value).toBe('15');
    type('#wsf-captain', '');
    await submit();
    const req = http.expectOne('/api/workshops/w1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({ name: '貝殼工坊', captain: null, address_district: '海霧村', address_ward: 15, address_detail: '51巷2號' });
    req.flush({ ...workshop(), captain: null });
    await settle();
    fixture.detectChanges();
  });

  it('預先提醒:開啟預設 5 分;整批模式只列出小於剩餘時間的選項,原值不可選時改成最接近的', async () => {
    store.fetched.set([workshop({ notify_batched: true, notify_lead_minutes: 60 }, [45, 30])]);
    const { el, fixture } = open('w1');
    fixture.detectChanges();
    const options = [...el.querySelectorAll('.modal-toggle-row select option')].map((o) => o.textContent?.trim());
    expect(options).toEqual(['5 分', '10 分', '15 分', '30 分']);
    expect(el.querySelector<HTMLSelectElement>('.modal-toggle-row select')!.selectedOptions[0].textContent?.trim()).toBe('30 分');
  });

  it('預先提醒:剩餘不足 5 分鐘時開關停用', () => {
    store.fetched.set([workshop({ notify_batched: true }, [3])]);
    const { el, fixture } = open('w1');
    fixture.detectChanges();
    const toggle = el.querySelectorAll<HTMLInputElement>('.modal-toggle-row input[type=checkbox]')[1];
    expect(toggle.disabled).toBe(true);
    expect(el.textContent).toContain('剩餘時間不足 5 分鐘');
  });

  it('逐艘模式不過濾預先提醒選項', () => {
    store.fetched.set([workshop({ notify_batched: false, notify_lead_minutes: 120 }, [3])]);
    const { el, fixture } = open('w1');
    fixture.detectChanges();
    expect(el.querySelectorAll('.modal-toggle-row select option')).toHaveLength(6);
  });

  it('正在編輯的工坊被刪掉時自動關閉', async () => {
    store.fetched.set([workshop()]);
    const { fixture, closed } = open('w1');
    store.fetched.set([]);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    expect(closed).toHaveBeenCalled();
  });
});
