import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { BuildDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { ROUTE_FEATURES } from '../route/route-features';
import { RouteVm } from '../route/route-vm';
import { QuickEditDialog } from './quick-edit-dialog';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const NOW = Date.parse('2026-10-26T02:00:00Z');

const build = (over: Partial<BuildDto> = {}): BuildDto => ({ hull: 3, stern: 1, bow: 2, bridge: 4, updated_at: '2026-10-01T00:00:00Z', ...over });
const workshop = (upkeep = false, b: BuildDto | null = build()): WorkshopWithSubmarines => ({
  id: 'w1', name: '貝殼工坊', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z',
  submarines: [
    {
      id: 's1', workshop_id: 'w1', position: 1, name: '阿爾法', status: 'complete', expected_return_at: null, last_synced_at: '2026-10-01T00:00:00Z',
      ...(b ? { build: b } : {}),
      ...(upkeep ? { upkeep: { route_key: '1:OJ', route_sea: 1, route_points: ['O', 'J'], voyages_done: 2, limit_voyages: 6, parts_sig: '3,1,2,4', current_sig: '3,1,2,4', repaired_at: null, updated_at: '2026-10-01T00:00:00Z' } } : {}),
    },
  ],
});

describe('快速修改的維修提醒', () => {
  let http: HttpTestingController;
  let store: DataStore;
  let routeVm: RouteVm;

  function setup(opts: { saving?: boolean; build?: BuildDto | null; upkeep?: boolean } = {}) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: ROUTE_FEATURES, useValue: { saving: opts.saving ?? true } }],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    routeVm = TestBed.inject(RouteVm);
    store.now.set(NOW);
    store.fetched.set([workshop(opts.upkeep, opts.build === undefined ? build() : opts.build)]);
    const fixture = TestBed.createComponent(QuickEditDialog);
    fixture.componentRef.setInput('workshopId', 'w1');
    fixture.componentRef.setInput('position', 1);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    const click = (selector: string, index = 0): void => {
      el.querySelectorAll<HTMLElement>(selector)[index]!.click();
      fixture.detectChanges();
    };
    const toggle = (checked: boolean): void => {
      const box = el.querySelector<HTMLInputElement>('[data-qs="upkeep"] input[type="checkbox"]')!;
      box.checked = checked;
      box.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    const save = (): void => {
      el.querySelector<HTMLButtonElement>('.btn-primary-modal')!.click();
      fixture.detectChanges();
    };
    return { fixture, el, click, toggle, save };
  }

  it('展示模式(不能儲存配置)整列不出現', () => {
    const { el } = setup({ saving: false });
    expect(el.querySelector('[data-qs="upkeep"]')).toBeNull();
  });

  it('還沒設定這艘的配件:停用並說明先設定;按下去開啟潛艇配置對話框', () => {
    const { el } = setup({ build: null });
    expect(el.querySelector('[data-qs="upkeep"]')?.textContent).toContain('先設定這艘的配件配置');
    el.querySelector<HTMLElement>('[data-qs="upkeep"] .lv-link.end')!.click();
    expect(routeVm.draft()?.mode).toBe('sub');
    expect(routeVm.draft()?.sub?.submarineId).toBe('s1');
    expect(el.querySelector('[data-qs="upkeep"] input[type="checkbox"]')).toBeNull();
  });

  it('配置沒有耐久資料:顯示「即將支援」', () => {
    // 10 號零件不在資料集以外的情況不存在;用資料集沒有的零件編號(11)模擬「資料還沒有」
    const { el } = setup({ build: build({ hull: 11 as never }) });
    expect(el.textContent).toContain('即將支援');
  });

  it('預設關閉:只有一行,寫明配置與可追蹤的路線', () => {
    const { el } = setup();
    expect(el.querySelector('[data-qs="upkeep"]')?.textContent).toContain('配件「3124」・溺沒海 O→J 可追蹤');
    expect(el.querySelector('[data-qs="upkeep"] .qs-w.open')).toBeNull();
  });

  it('開啟:預設 6 趟(船尾鯊魚級)、剛維修完;送出時帶 upkeep,這趟算第 1 趟', async () => {
    const { el, click, toggle, save, fixture } = setup();
    toggle(true);
    expect(el.querySelector('[data-qs="upkeep"] .qs-w.open')?.textContent).toContain('溺沒海 O→J');
    expect(el.querySelector('.uk-step b')?.textContent).toBe('6');
    // 探索完成的艇,先改成探索中並填時間
    click('.uf-seg button', 0);
    for (const [f, v] of [['d', '0'], ['h', '2'], ['m', '0']] as const) {
      const input = el.querySelector<HTMLInputElement>(`[data-field="${f}"]`)!;
      input.value = v;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
    expect(el.querySelector('.uk-note')?.textContent).toBe('送出後這趟算第 1 趟;第 6 趟返航時提醒維修。');
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.body).toEqual({ position: 1, name: '阿爾法', status: 'exploring', remaining_minutes: 120, upkeep: { route_key: '1:OJ', limit_voyages: 6, already_done: 0 } });
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
  });

  it('「已跑過幾趟」:步進器與說明跟著變,送出 already_done', async () => {
    const { el, click, toggle, save } = setup();
    toggle(true);
    click('.uk-seg button', 1);
    click('.uk-step button', 3); // 已跑過 ＋ → 2
    expect(el.querySelectorAll('.uk-step b')[1]?.textContent).toBe('2');
    expect(el.querySelector('.uk-note')?.textContent).toContain('記錄已跑 2 趟');
    click('.uk-step button', 0); // 可跑趟數 − → 5
    expect(el.querySelector('.uk-step b')?.textContent).toBe('5');
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.body.upkeep).toEqual({ route_key: '1:OJ', limit_voyages: 5, already_done: 2 });
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
  });

  it('沒打開開關就不帶 upkeep(請求和原本完全一樣)', async () => {
    const { save } = setup();
    // 探索完成,不需要時間
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect('upkeep' in req.request.body).toBe(false);
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
  });

  it('已開啟的艇:顯示目前進度;關閉開關送出 upkeep: null', async () => {
    const { el, toggle, save } = setup({ upkeep: true });
    expect(el.querySelector('[data-qs="upkeep"]:not(.off)')?.textContent).toContain('維修 2/6 趟');
    toggle(false);
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.body.upkeep).toBeNull();
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop()] });
    await settle();
  });

  it('伺服器拒絕(例如配件剛被清除):錯誤顯示在這一列,對話框保持開啟', async () => {
    const { el, toggle, save, fixture } = setup();
    toggle(true);
    save();
    http.expectOne('/api/workshops/w1/submarines/1').flush({ error: 'validation_failed', fields: { upkeep: 'invalid_value' } }, { status: 400, statusText: 'Bad Request' });
    await settle();
    fixture.detectChanges();
    expect(el.textContent).toContain('無法開啟維修提醒');
  });
  it('已開啟的艇:區塊直接展開調整區,步進器立即儲存', async () => {
    const { el, click, fixture } = setup({ upkeep: true });
    expect(el.querySelector('[data-qs="upkeep"] .qs-w.open')?.textContent).toContain('已跑趟數');
    click('[data-qs="upkeep"] .uk-step button', 1); // 已跑 ＋
    const req = http.expectOne('/api/submarines/s1/upkeep');
    expect([req.request.method, req.request.body]).toEqual(['PUT', { voyages_done: 3 }]);
    req.flush({ ...workshop(true).submarines[0]!, upkeep: { ...workshop(true).submarines[0]!.upkeep!, voyages_done: 3 } });
    await settle();
    fixture.detectChanges();
    expect(el.querySelectorAll('[data-qs="upkeep"] .uk-step b')[0]?.textContent).toBe('3');
    http.expectOne('/api/overview').flush({ workshops: [workshop(true)] });
    await settle();
  });
});
