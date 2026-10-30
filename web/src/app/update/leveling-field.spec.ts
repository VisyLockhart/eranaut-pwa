import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ProgressDto, SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { middleExp } from '../core/leveling-vm';
import { ROUTE_FEATURES } from '../route/route-features';
import { RouteVm } from '../route/route-vm';
import { QuickEditDialog } from './quick-edit-dialog';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const NOW = Date.parse('2026-10-26T02:00:00Z');

const progress = (over: Partial<ProgressDto> = {}): ProgressDto => ({
  level: 20, exp_in_level: 52_000, source: 'manual', assist_on: true, assist_mode: 'level', max_hours: null, filter_id: null, pending: null, last_route: null, effective_level: 20, effective_exp: 52_000, updated_at: '2026-10-01T00:00:00Z', ...over,
});
const sub = (over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: 's1', workshop_id: 'w1', position: 1, name: '阿爾法', status: 'complete', expected_return_at: null, last_synced_at: '2026-10-01T00:00:00Z', ...over,
});
const workshop = (s: SubmarineDto): WorkshopWithSubmarines => ({
  id: 'w1', name: '貝殼工坊', server: '迦樓羅', captain: null, address_district: null, address_ward: null, address_detail: null, notify_batched: false, notify_lead_minutes: 0, created_at: '2026-10-01T00:00:00Z', submarines: [s],
});

describe('快速修改的練級輔助', () => {
  let http: HttpTestingController;
  let store: DataStore;

  function setup(s: SubmarineDto = sub(), saving = true) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: ROUTE_FEATURES, useValue: { saving } }],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    store.now.set(NOW);
    store.fetched.set([workshop(s)]);
    const routeVm = TestBed.inject(RouteVm);
    routeVm.saved.set([]);
    routeVm.loaded.set(true);
    const fixture = TestBed.createComponent(QuickEditDialog);
    fixture.componentRef.setInput('workshopId', 'w1');
    fixture.componentRef.setInput('position', 1);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    const toggle = (checked: boolean): void => {
      const box = el.querySelector<HTMLInputElement>('[data-qs="assist"] input[type="checkbox"]')!;
      box.checked = checked;
      box.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    const click = (selector: string, index = 0): void => {
      el.querySelectorAll<HTMLElement>(selector)[index]!.click();
      fixture.detectChanges();
    };
    const save = (): void => {
      el.querySelector<HTMLButtonElement>('.btn-primary-modal')!.click();
      fixture.detectChanges();
    };
    return { fixture, el, toggle, click, save };
  }

  async function finish(body: object, result: SubmarineDto[] = []): Promise<void> {
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.body).toEqual(body);
    req.flush({ submarines: result, reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
  }

  beforeEach(() => localStorage.clear());

  it('展示模式(不能儲存)整列不出現', () => {
    const { el } = setup(sub(), false);
    expect(el.querySelector('[data-qs="assist"]')).toBeNull();
    expect(el.querySelector('[data-qs="config"]')).toBeNull();
  });

  it('沒填等級:只有一行,不碰就不帶 progress(請求和原本一樣)', async () => {
    const { el, save } = setup();
    expect(el.querySelector('[data-qs="assist"]')?.textContent).toContain('關閉中');
    expect(el.querySelector('[data-qs="assist"] .qs-w.open')).toBeNull();
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect('progress' in req.request.body).toBe(false);
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
  });

  it('開啟:設定在區塊內展開(1 級、經驗取中間),送出帶等級、經驗與 assist_on', async () => {
    const { el, toggle, save } = setup();
    toggle(true);
    expect(el.querySelector('[data-qs="assist"] .qs-w.open')).not.toBeNull();
    expect((el.querySelector('input[aria-label="目前等級"]') as HTMLInputElement).value).toBe('1');
    save();
    await finish({ position: 1, name: '阿爾法', status: 'complete', progress: { assist_on: true, assist_mode: 'level', max_hours: null, filter_id: null, level: 1, exp_in_level: middleExp(1) } });
  });

  it('等級 ± 與最長航行時間:換等級時上限跟著變,送出選的上限', async () => {
    const { el, toggle, click, save } = setup();
    toggle(true);
    click('button[aria-label="等級加 1"]');
    click('button[aria-label="等級加 1"]');
    expect((el.querySelector('input[aria-label="目前等級"]') as HTMLInputElement).value).toBe('3');
    expect(el.querySelectorAll('[data-qs="config"] .lv-head')[1]?.textContent).toContain('18,972');
    click('.lv-hours button', 2);
    save();
    await finish({ position: 1, name: '阿爾法', status: 'complete', progress: { assist_on: true, assist_mode: 'level', max_hours: 12, filter_id: null, level: 3, exp_in_level: middleExp(3) } });
  });

  it('已有等級且開著:區塊展開並唯讀顯示 Lv(在潛艇配置調整);沒動數字就不送等級(保留待結算路線)', async () => {
    const { el, save } = setup(sub({ progress: progress() }));
    expect(el.querySelector('[data-qs="assist"] .qs-w.open')).not.toBeNull();
    expect(el.querySelector('[data-qs="assist"] .lv-cur')?.textContent).toContain('Lv 20');
    expect(el.querySelector('[data-qs="assist"] input[aria-label="目前等級"]')).toBeNull();
    expect((el.querySelector('[data-qs="config"] input[aria-label="目前等級"]') as HTMLInputElement).value).toBe('20');
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect('progress' in req.request.body).toBe(false);
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
  });

  it('關閉:只送 assist_on: false(等級保留)', async () => {
    const { toggle, save } = setup(sub({ progress: progress() }));
    toggle(false);
    save();
    await finish({ position: 1, name: '阿爾法', status: 'complete', progress: { assist_on: false } });
  });

  it('超過 85 級(D-298):一樣有開關;潛艇配置沒有經驗滑桿,等級可到 130', () => {
    const { el, fixture } = setup(sub({ progress: progress({ level: 90, effective_level: 90, effective_exp: 0, source: 'ocr', assist_on: false }) }));
    const sw = el.querySelector<HTMLInputElement>('[data-qs="assist"] input[type="checkbox"]')!;
    expect(sw).not.toBeNull();
    sw.click();
    fixture.detectChanges();
    expect(el.querySelector('input[aria-label="這一級的目前經驗（滑桿）"]')).toBeNull();
    expect(el.querySelector<HTMLInputElement>('input[aria-label="目前等級"]')!.value).toBe('90');
    expect(el.querySelector('[data-qs="config"]')!.textContent).toContain('沒有攻略與每級經驗資料');
    expect(el.querySelector<HTMLInputElement>('input[aria-label="目前等級（滑桿）"]')!.max).toBe('130');
  });

  it('等級與航線輔助脫鉤(D-305):沒開輔助也能記等級 / 經驗,送出只帶 assist_on: false 與數字', async () => {
    const { el, click, save } = setup();
    click('button[aria-label="等級加 1"]');
    click('button[aria-label="等級加 1"]');
    expect(el.querySelector('[data-qs="assist"] .qs-w.open')).toBeNull();
    save();
    await finish({ position: 1, name: '阿爾法', status: 'complete', progress: { assist_on: false, level: 3, exp_in_level: middleExp(3) } });
  });

  it('輔助關閉的艇改等級:只送等級與經驗,不會被打開', async () => {
    const { click, save } = setup(sub({ progress: progress({ assist_on: false }) }));
    click('button[aria-label="等級加 1"]');
    save();
    await finish({ position: 1, name: '阿爾法', status: 'complete', progress: { assist_on: false, level: 21, exp_in_level: middleExp(21) } });
  });

  it('已返航又派出(開著航線輔助):「這次派出」預設帶入建議(欄位未解鎖時優先含解鎖點),隨更新一起送(D-291)', async () => {
    const { el, fixture, save } = setup(sub({ status: 'complete', progress: progress({ level: 42, exp_in_level: 0, effective_level: 42, effective_exp: 0 }), build: { hull: 3, stern: 1, bow: 1, bridge: 3, updated_at: '2026-10-01T00:00:00Z' } }));
    // 剩餘時間沒填:只顯示下一趟建議
    expect(el.querySelector('.dp-line')).toBeNull();
    expect(el.textContent).toContain('下一趟建議');
    el.querySelectorAll<HTMLButtonElement>('.uf-seg button')[0]!.click();
    fixture.detectChanges();
    const h = el.querySelector<HTMLInputElement>('input[data-field="h"]')!;
    h.value = '18';
    h.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelector('.dp-line')).not.toBeNull();
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    // 工坊只有 1 艘 = 第 2 艘的欄位還沒解鎖:路線優先包含解鎖點 J
    expect(req.request.body.progress.route.sea).toBe(1);
    expect(req.request.body.progress.route.points).toContain('J');
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
  });

  it('還在航行中只是修正時間:不記新的路線', async () => {
    // 剩餘時間依真實時鐘帶入;「還在航行」依畫面時鐘(NOW)判斷
    const { save } = setup(sub({ status: 'exploring', expected_return_at: new Date(Math.max(Date.now(), NOW) + 3 * 3_600_000).toISOString(), progress: progress() }));
    save();
    const req = http.expectOne('/api/workshops/w1/submarines/1');
    expect(req.request.body.progress).toBeUndefined();
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
  });

  it('清除等級:立即呼叫 DELETE,不需送出更新', async () => {
    const { el, click, fixture } = setup(sub({ progress: progress() }));
    click('[data-qs="config"] .lv-link.end');
    const req = http.expectOne('/api/submarines/s1/progress');
    expect(req.request.method).toBe('DELETE');
    req.flush(sub());
    await settle();
    http.expectOne('/api/overview').flush({ workshops: [workshop(sub())] });
    await settle();
    fixture.detectChanges();
    expect(el.querySelector('[data-qs="config"] .lv-link.end')).toBeNull();
    expect(store.workshops()[0]!.submarines[0]!.progress).toBeUndefined();
  });
});
