import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { QuickEditDialog } from '../update/quick-edit-dialog';
import { WorkshopDeleteDialog } from '../workshops/workshop-delete-dialog';
import { WorkshopFormDialog } from '../workshops/workshop-form-dialog';

// 回歸:模板事件處理式若回傳 false,Angular 會 preventDefault。
// 曾因 (pointerdown)="downOnOverlay = …" 讓真實滑鼠點不進對話框內的輸入框(焦點被擋)。
const ws: WorkshopWithSubmarines = {
  id: 'w1', name: '貝殼', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null,
  notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z',
  submarines: [{ id: 's1', workshop_id: 'w1', position: 1, name: 'A', status: 'exploring', expected_return_at: '2026-10-02T00:00:00Z', last_synced_at: '2026-10-01T00:00:00Z' }],
};

function fire(target: Element, type: string): Event {
  const e = new Event(type, { bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
}

describe('對話框不阻止內部元素的預設行為', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(DataStore).fetched.set([ws]);
  });

  const cases: [string, () => ReturnType<typeof TestBed.createComponent>, string][] = [
    ['新增/編輯工坊', () => TestBed.createComponent(WorkshopFormDialog), '#wsf-captain'],
    [
      '刪除工坊',
      () => {
        const f = TestBed.createComponent(WorkshopDeleteDialog);
        f.componentRef.setInput('workshopId', 'w1');
        return f;
      },
      'button',
    ],
    [
      '單艘快速修改',
      () => {
        const f = TestBed.createComponent(QuickEditDialog);
        f.componentRef.setInput('workshopId', 'w1');
        f.componentRef.setInput('position', 1);
        return f;
      },
      'input',
    ],
  ];

  for (const [name, make, selector] of cases) {
    it(`${name}:對話框內 pointerdown / click 的 defaultPrevented 為 false`, () => {
      const fixture = make();
      fixture.detectChanges();
      const el = (fixture.nativeElement as HTMLElement).querySelector(selector)!;
      expect(el).toBeTruthy();
      expect(fire(el, 'pointerdown').defaultPrevented).toBe(false);
      expect(fire(el, 'click').defaultPrevented).toBe(false);
    });
  }
});
