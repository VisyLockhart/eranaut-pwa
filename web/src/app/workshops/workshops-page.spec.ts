import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { Layout } from '../core/layout';
import { WorkshopsVm } from '../core/workshops-vm';
import { WorkshopsPage } from './workshops-page';

const ws = (id: string): WorkshopWithSubmarines => ({
  id,
  name: `工坊${id}`,
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: [],
});

describe('WorkshopsPage 版面切換(D-163)', () => {
  let vm: WorkshopsVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(Auth).status.set('authenticated');
    const store = TestBed.inject(DataStore);
    store.loaded.set(true);
    store.fetched.set([ws('a'), ws('b')]);
    vm = TestBed.inject(WorkshopsVm);
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function open(desktop: boolean) {
    TestBed.inject(Layout).isDesktop.set(desktop);
    const fixture = TestBed.createComponent(WorkshopsPage);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    return { fixture, el };
  }

  it('頁面被銷毀、在另一種版面重建:管理模式與已打開的對話框(含填到一半的內容)保留', () => {
    const first = open(true);
    vm.toggleManage();
    vm.add();
    first.fixture.detectChanges();
    const name = first.el.querySelector<HTMLInputElement>('#wsf-name')!;
    name.value = '寫到一半';
    name.dispatchEvent(new Event('input'));
    first.fixture.destroy();
    document.body.innerHTML = '';

    const second = open(false);
    expect(vm.manageMode()).toBe(true);
    expect(second.el.querySelector<HTMLInputElement>('#wsf-name')!.value).toBe('寫到一半');
  });

  it('導到別的頁面:回到瀏覽模式、對話框關閉、草稿丟棄', async () => {
    const first = open(true);
    vm.toggleManage();
    vm.add();
    first.fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    expect(vm.manageMode()).toBe(false);
    expect(vm.dialog()).toBeNull();
    expect(vm.formDraft()).toBeNull();
    first.fixture.destroy();
    document.body.innerHTML = '';
    open(true);
    expect(vm.manageMode()).toBe(false);
  });

  it('登出:丟棄管理模式與對話框', () => {
    open(true);
    vm.toggleManage();
    vm.remove('a');
    TestBed.inject(Auth).status.set('anonymous');
    TestBed.tick();
    expect(vm.manageMode()).toBe(false);
    expect(vm.dialog()).toBeNull();
  });
});
