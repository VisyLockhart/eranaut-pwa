import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { slotsFromRanges, type NotifyWindowDto, type NotifyWindowsDto } from '@eranaut/shared';
import { Auth } from './auth';
import { NotifyWindowVm } from './notify-window-vm';
import { Toast } from './toast';
import { announceDeferredReminders } from './update-vm';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const SLOTS = slotsFromRanges([[720, 810], [1140, 1410]]);
const group = (over: Partial<NotifyWindowDto> = {}): NotifyWindowDto => ({ id: 'g1', name: '晚上', days: 127, slots: SLOTS, enabled: true, position: 0, ...over });
const data = (over: Partial<NotifyWindowsDto> = {}): NotifyWindowsDto => ({ on: true, scope: { dm: true, channel: true, push: true }, limit: 10, groups: [group()], ...over });
/** 台北 2026-10-01 03:00(週四) */
const NOW = Date.UTC(2026, 9, 1, 3 - 8, 0);

describe('NotifyWindowVm(D-348)', () => {
  let http: HttpTestingController;
  let vm: NotifyWindowVm;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    vm = TestBed.inject(NotifyWindowVm);
    vm.now.set(NOW);
  });

  async function loaded(d: NotifyWindowsDto = data()): Promise<void> {
    const p = vm.load();
    http.expectOne('/api/notify-windows').flush(d);
    await p;
  }

  it('載入;失敗標示錯誤', async () => {
    await loaded();
    expect(vm.data()?.groups).toHaveLength(1);
    const p = vm.load();
    http.expectOne('/api/notify-windows').flush({}, { status: 500, statusText: 'x' });
    await p;
    expect(vm.loadError()).toBe(true);
  });

  it('狀態列:勿擾中顯示今天區間與下一次通知;允許時段內顯示「現在可通知」', async () => {
    await loaded();
    expect(vm.summary()).toEqual({ today: '今天 12:00–13:30、19:00–23:30 會通知', state: '現在勿擾中', next: '今天 12:00 起可通知(約 9 小時後)' });
    vm.now.set(Date.UTC(2026, 9, 1, 12 - 8, 10));
    expect(vm.summary()?.state).toBe('現在可通知');
    await loaded(data({ on: false }));
    expect(vm.summary()).toBeNull();
  });

  it('開著但沒有啟用中的組:noneEnabled 為 true(提示提醒不會送出)', async () => {
    await loaded(data({ groups: [group({ enabled: false })] }));
    expect(vm.noneEnabled()).toBe(true);
    expect(vm.summary()?.state).toBe('沒有啟用中的時段');
  });

  it('總開關:先更新畫面,伺服器回應(含自動建立的「白天」)取代;失敗還原並提示', async () => {
    await loaded(data({ on: false, groups: [] }));
    const p = vm.setOn(true);
    expect(vm.data()?.on).toBe(true);
    const req = http.expectOne('/api/notify-window-prefs');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ on: true, scope: { dm: true, channel: true, push: true } });
    req.flush(data({ groups: [group({ name: '白天' })] }));
    await p;
    expect(vm.data()?.groups.map((g) => g.name)).toEqual(['白天']);

    const q = vm.setOn(false);
    http.expectOne('/api/notify-window-prefs').flush({}, { status: 500, statusText: 'x' });
    await q;
    expect(vm.data()?.on).toBe(true);
    expect(vm.error()).toContain('已還原');
  });

  it('套用範圍切換送出完整的三個欄位', async () => {
    await loaded();
    const p = vm.toggleScope('channel');
    const req = http.expectOne('/api/notify-window-prefs');
    expect(req.request.body.scope).toEqual({ dm: true, channel: false, push: true });
    req.flush(data({ scope: { dm: true, channel: false, push: true } }));
    await p;
    expect(vm.data()?.scope.channel).toBe(false);
  });

  it('啟用/停用一組:PATCH enabled', async () => {
    await loaded();
    const p = vm.toggleGroup(group());
    expect(vm.data()?.groups[0]?.enabled).toBe(false);
    const req = http.expectOne('/api/notify-windows/g1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ enabled: false });
    req.flush(group({ enabled: false }));
    await p;
    expect(vm.enabledGroups()).toEqual([]);
  });

  it('新增:空白草稿不能存;補上名稱與時段後 POST,清單加入新組並關閉編輯器', async () => {
    await loaded();
    vm.openNew();
    expect(vm.draft()?.days).toBe(127);
    expect(vm.canSave()).toBe(false);
    vm.patchDraft({ name: ' 假日 ', days: 96 });
    vm.fill(36, 47, true);
    expect(vm.draftSummary()).toBe('09:00–12:00(共 3 小時)');
    expect(vm.canSave()).toBe(true);
    const p = vm.save();
    const req = http.expectOne('/api/notify-windows');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({ name: '假日', days: 96, enabled: true });
    req.flush(group({ id: 'g2', name: '假日', days: 96, position: 1 }), { status: 201, statusText: 'Created' });
    await p;
    expect(vm.draft()).toBeNull();
    expect(vm.data()?.groups.map((g) => g.id)).toEqual(['g1', 'g2']);
  });

  it('編輯:PUT 整筆取代;上限 409 顯示訊息並保留編輯器', async () => {
    await loaded();
    vm.openEdit(group());
    vm.patchDraft({ name: '晚間' });
    const p = vm.save();
    const req = http.expectOne('/api/notify-windows/g1');
    expect(req.request.method).toBe('PUT');
    req.flush(group({ name: '晚間' }));
    await p;
    expect(vm.data()?.groups[0]?.name).toBe('晚間');

    vm.openNew();
    vm.patchDraft({ name: 'x' });
    vm.fill(0, 3, true);
    const q = vm.save();
    http.expectOne('/api/notify-windows').flush({ error: 'limit_reached' }, { status: 409, statusText: 'Conflict' });
    await q;
    expect(vm.draftError()).toContain('最多 10 組');
    expect(vm.draft()).not.toBeNull();
  });

  it('刪除:DELETE 後從清單移除', async () => {
    await loaded();
    vm.openEdit(group());
    const p = vm.remove();
    const req = http.expectOne('/api/notify-windows/g1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(vm.data()?.groups).toEqual([]);
    expect(vm.draft()).toBeNull();
  });

  it('草稿操作:格子切換、反轉、範圍、星期至少留一天', async () => {
    await loaded();
    vm.openNew();
    vm.toggleCell(5);
    expect(vm.draft()?.slots[5]).toBe('1');
    vm.invert();
    expect(vm.draft()?.slots[5]).toBe('0');
    expect(vm.draft()?.slots[6]).toBe('1');
    vm.applyRanges([[0, 60]]);
    expect(vm.draftRanges()).toEqual([[0, 60]]);
    vm.patchDraft({ days: 1 });
    vm.toggleDay(0);
    expect(vm.draft()?.days).toBe(1);
    vm.toggleDay(2);
    expect(vm.draft()?.days).toBe(5);
  });

  it('清單列:新增一列獨立保存、不被相連的段合併;改遮罩的其他操作會讓列重新由遮罩推出', async () => {
    await loaded();
    vm.openNew();
    vm.applyRanges([[480, 1320]]);
    vm.addRow();
    expect(vm.rows()).toEqual([[480, 1320], [0, 60]]);
    vm.setRowStart(1, 1320);
    expect(vm.rows()).toEqual([[480, 1320], [1320, 1380]]);
    expect(vm.draft()?.slots).toBe(slotsFromRanges([[480, 1380]]));
    vm.setRowEnd(1, 1440);
    expect(vm.draftSummary()).toBe('08:00–24:00(共 16 小時)');
    vm.removeRow(0);
    expect(vm.rows()).toEqual([[1320, 1440]]);
    vm.toggleCell(0); // 格子操作 → 重新由遮罩推出
    expect(vm.rows()).toEqual([[0, 15], [1320, 1440]]);
    vm.applyRanges([[0, 1440]]);
    expect(vm.canAddRow()).toBe(false);
  });

  it('滿 10 組時不能再開新增', async () => {
    await loaded(data({ groups: Array.from({ length: 10 }, (_, i) => group({ id: `g${i}` })) }));
    expect(vm.full()).toBe(true);
    vm.openNew();
    expect(vm.draft()).toBeNull();
  });
});

describe('announceDeferredReminders', () => {
  const now = Date.UTC(2026, 9, 1, 3 - 8, 0);
  const at = new Date(Date.UTC(2026, 9, 1, 12 - 8, 0)).toISOString();

  it('同一個送出時間的潛艇合併成一句;整批說這間工坊;沒有延後就不提示', () => {
    const toast = new Toast();
    announceDeferredReminders(toast, [], now);
    announceDeferredReminders(toast, undefined, now);
    expect(toast.items()).toHaveLength(0);
    announceDeferredReminders(toast, [{ position: 1, at }, { position: 3, at }], now);
    expect(toast.items()[0]?.text).toBe('🌙 ①③的提醒延後到 今天 12:00 通知(勿擾時段)。');
    announceDeferredReminders(toast, [{ position: null, at }], now);
    expect(toast.items()[1]?.text).toBe('🌙 這間工坊的提醒延後到 今天 12:00 通知(勿擾時段)。');
  });
});
void settle;
