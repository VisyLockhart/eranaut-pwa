import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { OverviewVm } from './overview-vm';
import { WorkshopsVm } from './workshops-vm';

function ws(id: string): WorkshopWithSubmarines {
  return { id, name: id, server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z', submarines: [] };
}
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

describe('WorkshopsVm(D-294)', () => {
  let vm: WorkshopsVm;
  let overview: OverviewVm;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(DataStore).fetched.set([ws('A'), ws('B'), ws('C')]);
    vm = TestBed.inject(WorkshopsVm);
    overview = TestBed.inject(OverviewVm);
  });

  it('開關工坊管理視窗;新增會先收掉它再開表單,編輯直接開表單', () => {
    vm.openManage();
    expect(vm.manageOpen()).toBe(true);
    vm.add();
    expect(vm.manageOpen()).toBe(false);
    expect(vm.formDialog()).toEqual({ id: null });
    vm.edit('B');
    expect(vm.formDialog()).toEqual({ id: 'B' });
    vm.closeDialog();
    expect(vm.formDialog()).toBeNull();
  });

  it('刪除目前檢視的工坊:刪完回到「全部」,不會跳到下一間', async () => {
    overview.select('B');
    const p = vm.deleteWorkshop('B');
    http.expectOne('/api/workshops/B').flush(null, { status: 204, statusText: 'No Content' });
    await p;
    await settle();
    expect(overview.currentWorkshop()).toBeNull();
    expect(overview.index()).toBe(0);
  });

  it('刪除的不是目前檢視的工坊:不改變目前檢視', async () => {
    overview.select('A');
    const p = vm.deleteWorkshop('C');
    http.expectOne('/api/workshops/C').flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(overview.currentWorkshop()?.id).toBe('A');
  });

  it('reset 關掉所有視窗並丟棄草稿', () => {
    vm.openManage();
    vm.edit('A');
    vm.reset();
    expect(vm.manageOpen()).toBe(false);
    expect(vm.formDialog()).toBeNull();
  });
});
