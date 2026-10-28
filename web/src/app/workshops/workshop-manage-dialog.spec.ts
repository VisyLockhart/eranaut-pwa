import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { WorkshopsVm } from '../core/workshops-vm';
import { WorkshopManageDialog } from './workshop-manage-dialog';

function ws(id: string): WorkshopWithSubmarines {
  return { id, name: `工坊${id}`, server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z', submarines: [] };
}

describe('WorkshopManageDialog(D-294)', () => {
  let vm: WorkshopsVm;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    const store = TestBed.inject(DataStore);
    store.loaded.set(true);
    store.fetched.set([ws('a'), ws('b')]);
    vm = TestBed.inject(WorkshopsVm);
    vm.openManage();
  });

  function render(desktop: boolean) {
    TestBed.inject(Layout).isDesktop.set(desktop);
    const fixture = TestBed.createComponent(WorkshopManageDialog);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('標題「工坊管理」、列出排序清單,桌機是置中視窗、手機是貼底面板', () => {
    const d = render(true).el;
    expect(d.querySelector('#wsm-title')?.textContent).toContain('工坊管理');
    expect(d.querySelectorAll('.ws-row')).toHaveLength(2);
    expect(d.querySelector('.modal-overlay')?.classList.contains('rt-sheet')).toBe(false);
    TestBed.resetTestingModule();
  });

  it('手機版用貼底面板樣式', () => {
    const m = render(false).el;
    const overlay = m.querySelector('.modal-overlay')!;
    expect(overlay.classList.contains('rt-sheet')).toBe(true);
    expect(overlay.classList.contains('rt-compact')).toBe(true);
  });

  it('「完成」與 Esc 關閉', () => {
    const { fixture, el } = render(true);
    (el.querySelector('.btn-primary-modal') as HTMLButtonElement).click();
    expect(vm.manageOpen()).toBe(false);
    vm.openManage();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(vm.manageOpen()).toBe(false);
  });

  it('「新增工坊」:收掉管理視窗、開新增對話框', () => {
    const { el } = render(true);
    (el.querySelector('.ws-add-btn') as HTMLButtonElement).click();
    expect(vm.manageOpen()).toBe(false);
    expect(vm.formDialog()).toEqual({ id: null });
  });
});
