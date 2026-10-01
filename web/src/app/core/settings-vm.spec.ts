import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from './auth';
import { SettingsVm } from './settings-vm';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));

describe('SettingsVm', () => {
  let http: HttpTestingController;
  let vm: SettingsVm;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    vm = TestBed.inject(SettingsVm);
  });

  async function loaded(prefs = { dm: true, channel: false }): Promise<void> {
    const p = vm.load();
    http.expectOne('/api/notify-prefs').flush(prefs);
    await p;
  }

  it('載入提醒方式', async () => {
    await loaded();
    expect(vm.prefs()).toEqual({ dm: true, channel: false });
    expect(vm.loadError()).toBe(false);
  });

  it('載入失敗時標示錯誤,重試可恢復', async () => {
    const p = vm.load();
    http.expectOne('/api/notify-prefs').flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(vm.loadError()).toBe(true);
    expect(vm.prefs()).toBeNull();
    await loaded();
    expect(vm.loadError()).toBe(false);
    expect(vm.prefs()).not.toBeNull();
  });

  it('切換立即更新畫面並送出完整的兩個欄位', async () => {
    await loaded();
    const p = vm.toggle('channel');
    expect(vm.prefs()).toEqual({ dm: true, channel: true });
    expect(vm.saving()).toBe(true);
    const req = http.expectOne('/api/notify-prefs');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ dm: true, channel: true });
    req.flush({ dm: true, channel: true });
    await p;
    expect(vm.saving()).toBe(false);
  });

  it('允許全部關閉(D-133)', async () => {
    await loaded();
    const p = vm.toggle('dm');
    const req = http.expectOne('/api/notify-prefs');
    expect(req.request.body).toEqual({ dm: false, channel: false });
    req.flush({ dm: false, channel: false });
    await p;
    expect(vm.prefs()).toEqual({ dm: false, channel: false });
  });

  it('儲存失敗時還原並提示', async () => {
    await loaded();
    const p = vm.toggle('dm');
    http.expectOne('/api/notify-prefs').flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(vm.prefs()).toEqual({ dm: true, channel: false });
    expect(vm.saveError()).toContain('已還原');
  });

  it('儲存中忽略下一次切換;尚未載入時也不動作', async () => {
    await vm.toggle('dm');
    http.expectNone('/api/notify-prefs');
    await loaded();
    const p = vm.toggle('dm');
    void vm.toggle('channel');
    const req = http.expectOne('/api/notify-prefs');
    req.flush({ dm: false, channel: false });
    await p;
    http.expectNone('/api/notify-prefs');
  });
});
