import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { Toast } from '../core/toast';
import { QuickEditDialog } from './quick-edit-dialog';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const workshop = (over: Partial<WorkshopWithSubmarines> = {}): WorkshopWithSubmarines => ({
  id: 'w1',
  name: '貝殼工坊',
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: [
    { id: 's1', workshop_id: 'w1', position: 1, name: '阿爾法', status: 'exploring', expected_return_at: '2026-10-02T00:00:00Z', last_synced_at: '2026-10-01T00:00:00Z' },
    { id: 's2', workshop_id: 'w1', position: 2, name: null, status: 'complete', expected_return_at: null, last_synced_at: '2026-10-01T00:00:00Z' },
  ],
  ...over,
});

describe('QuickEditDialog', () => {
  let http: HttpTestingController;
  let store: DataStore;
  let toast: Toast;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    toast = TestBed.inject(Toast);
    store.fetched.set([workshop()]);
  });

  function open(position: number) {
    const fixture = TestBed.createComponent(QuickEditDialog);
    fixture.componentRef.setInput('workshopId', 'w1');
    fixture.componentRef.setInput('position', position);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    const type = (field: string, value: string): void => {
      const input = el.querySelector<HTMLInputElement>(`[data-field="${field}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    const save = async (): Promise<void> => {
      el.querySelector<HTMLButtonElement>('.btn-primary-modal')!.click();
      fixture.detectChanges();
    };
    return { fixture, el, closed, type, save };
  }

  it('以目前資料建立:名稱與狀態沿用,時間留空', () => {
    const { el } = open(1);
    expect(el.querySelector<HTMLInputElement>('[data-field="name"]')!.value).toBe('阿爾法');
    expect(el.querySelector<HTMLInputElement>('[data-field="h"]')!.value).toBe('');
    expect(el.textContent).toContain('貝殼工坊');
  });

  it('送出:單艘端點(位置取自網址),成功後提示並關閉;沒有等待時間補正,送的就是填的數字', async () => {
    const { type, save, closed, fixture } = open(1);
    type('d', '0');
    type('h', '2');
    type('m', '5');
    await save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ position: 1, name: '阿爾法', status: 'exploring', remaining_minutes: 125 });
    req.flush({ submarines: [{ ...workshop().submarines[0] }], reminder_skipped_positions: [] });
    await settle();
    expect(closed).toHaveBeenCalled();
    expect(toast.items()[0].text).toContain('已更新「貝殼工坊」阿爾法');
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
    fixture.destroy();
  });

  it('驗證失敗:不送出、顯示錯誤,對話框保持開啟', async () => {
    const { el, save, closed, fixture } = open(1);
    await save();
    fixture.detectChanges();
    expect(el.textContent).toContain('請填寫剩餘時間');
    expect(closed).not.toHaveBeenCalled();
    http.expectNone('/api/workshops/w1/submarines/1');
  });

  it('探索完成的艇:不顯示時間欄,可直接送出', async () => {
    const { el, save, fixture } = open(2);
    expect(el.querySelector('[data-field="h"]')).toBeNull();
    await save();
    const req = http.expectOne('/api/workshops/w1/submarines/2');
    expect(req.request.body).toEqual({ position: 2, name: null, status: 'complete' });
    req.flush({ submarines: [], reminder_skipped_positions: [2] });
    await settle();
    expect(toast.items().some((t) => t.tone === 'warn' && t.text.includes('②'))).toBe(true);
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
    fixture.destroy();
  });

  it('伺服器 400:錯誤顯示在這一列,對話框保持開啟', async () => {
    const { el, type, save, closed, fixture } = open(1);
    type('d', '0');
    type('h', '1');
    type('m', '0');
    await save();
    http.expectOne('/api/workshops/w1/submarines/1').flush({ error: 'validation_failed', fields: { remaining_minutes: 'invalid_value' } }, { status: 400, statusText: 'Bad Request' });
    await settle();
    fixture.detectChanges();
    expect(el.textContent).toContain('不正確');
    expect(closed).not.toHaveBeenCalled();
  });

  it('被編輯的潛艇已不存在(例如工坊被刪)時自動關閉', async () => {
    const { closed, fixture } = open(1);
    store.fetched.set([]);
    fixture.detectChanges();
    await settle();
    expect(closed).toHaveBeenCalled();
  });
});
