import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { OverviewVm } from './overview-vm';
import { Toast } from './toast';
import { UpdateVm } from './update-vm';

const T0 = Date.parse('2026-10-01T04:00:00Z');
const MIN = 60_000;
const settle = (): Promise<void> => new Promise((r) => setTimeout(r));

const sub = (wid: string, position: number, over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: `${wid}-${position}`,
  workshop_id: wid,
  position,
  name: `潛水艇-${position}`,
  status: 'exploring',
  expected_return_at: '2026-10-02T00:00:00Z',
  last_synced_at: '2026-10-01T00:00:00Z',
  ...over,
});
const workshop = (id: string, positions: number[], over: Partial<WorkshopWithSubmarines> = {}): WorkshopWithSubmarines => ({
  id,
  name: id === 'w1' ? '貝殼工坊' : '鋼鐵之心',
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: positions.map((p) => sub(id, p)),
  ...over,
});

describe('UpdateVm', () => {
  let vm: UpdateVm;
  let store: DataStore;
  let toast: Toast;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    toast = TestBed.inject(Toast);
    vm = TestBed.inject(UpdateVm);
    store.fetched.set([workshop('w1', [1, 2]), workshop('w2', [])]);
    vm.mode.set('manual'); // 這支測手動輸入;截圖辨識見 update-vm-ocr.spec.ts
  });
  afterEach(() => {
    vm.close();
    vi.useRealTimers();
  });

  const keyOf = (position: number): number => vm.rows().find((r) => r.position === position)!.key;
  const row = (position: number) => vm.rows().find((r) => r.position === position)!;
  /** 填完一列並離開欄位(= D-124 起算) */
  const fill = (position: number, d: string, h: string, m: string): void => {
    const key = keyOf(position);
    vm.setTime(key, 'd', d);
    vm.setTime(key, 'h', h);
    vm.setTime(key, 'm', m);
    vm.resume(key);
  };
  const flushRefresh = async (): Promise<void> => {
    await settle();
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();
  };

  describe('建立表單', () => {
    it('預設選第一間工坊,以既有潛艇建立列(名稱與狀態沿用、時間留空、既有位置不可移除)', () => {
      vm.open();
      expect(vm.workshopId()).toBe('w1');
      expect(vm.rows().map((r) => [r.position, r.name, r.status, r.d, r.added])).toEqual([
        [1, '潛水艇-1', 'exploring', '', false],
        [2, '潛水艇-2', 'exploring', '', false],
      ]);
    });

    it('總覽正過濾某間工坊時,預設選那間', () => {
      TestBed.inject(OverviewVm).select('w2');
      vm.open();
      expect(vm.workshopId()).toBe('w2');
    });

    it('資料晚到(直接開頁面、還沒有快照):到了之後補選第一間;已選的工坊不被重抓蓋掉', () => {
      store.fetched.set([]);
      vm.open();
      expect(vm.workshopId()).toBeNull();
      store.fetched.set([workshop('w1', [1, 2])]);
      vm.ensureSelection();
      expect(vm.workshopId()).toBe('w1');
      expect(vm.rows()).toHaveLength(2);

      fill(1, '0', '3', '41');
      store.fetched.set([workshop('w1', [1, 2]), workshop('w2', [])]); // 背景重抓
      vm.ensureSelection();
      expect(row(1).m).toBe('41');
    });

    it('選的工坊被刪掉:改選剩下的第一間;全刪光則清空', () => {
      vm.open();
      store.fetched.set([workshop('w2', [])]);
      vm.ensureSelection();
      expect(vm.workshopId()).toBe('w2');
      store.fetched.set([]);
      vm.ensureSelection();
      expect(vm.workshopId()).toBeNull();
      expect(vm.rows()).toEqual([]);
    });

    it('沒有潛艇的工坊:先給第 1 艘空列(新位置,可移除)', () => {
      vm.open();
      vm.selectWorkshop('w2');
      expect(vm.rows()).toHaveLength(1);
      expect(vm.rows()[0]).toMatchObject({ position: 1, name: '潛水艇-1', added: true });
    });

    it('加入第 N 艘(最多 4 艘),只有新加入的位置可移除', () => {
      vm.open();
      expect(vm.nextPosition()).toBe(3);
      vm.addRow();
      vm.addRow();
      expect(vm.rows().map((r) => r.position)).toEqual([1, 2, 3, 4]);
      expect(vm.canAdd()).toBe(false);
      vm.removeRow(keyOf(1)); // 既有位置不能移除
      expect(vm.rows()).toHaveLength(4);
      vm.removeRow(keyOf(3));
      expect(vm.rows().map((r) => r.position)).toEqual([1, 2, 4]);
      expect(vm.nextPosition()).toBe(3);
    });
  });

  describe('D-124 補正', () => {
    beforeEach(() => vm.open());

    it('填完離開欄位才起算;每滿 1 分鐘減 1,其他沒填的列不動', () => {
      fill(1, '0', '3', '41');
      expect(row(1)).toMatchObject({ base: 221, startedAt: T0 });
      expect(row(2).base).toBeNull();

      vi.setSystemTime(T0 + 3 * MIN + 10_000);
      expect(vm.tick(Date.now())).toBe(false);
      expect([row(1).d, row(1).h, row(1).m]).toEqual(['0', '3', '38']);
      expect(vm.compMin()).toBe(3);
      expect(row(2).m).toBe('');
    });

    it('D-156:只填一部分,離開欄位組時空白自動補 0 並起算;之後照常補正', () => {
      const key = keyOf(1);
      vm.setTime(key, 'm', '5');
      vm.resume(key);
      expect([row(1).d, row(1).h, row(1).m]).toEqual(['0', '0', '5']);
      expect(row(1)).toMatchObject({ base: 5, startedAt: T0 });
      vi.setSystemTime(T0 + 2 * MIN + 1000);
      vm.tick(Date.now());
      expect([row(1).d, row(1).h, row(1).m]).toEqual(['0', '0', '3']);
      expect(vm.compMin()).toBe(2);
    });

    it('D-156:整列都沒填,離開欄位不補 0、也不起算', () => {
      const key = keyOf(1);
      vm.pause(key);
      vm.resume(key);
      expect([row(1).d, row(1).h, row(1).m]).toEqual(['', '', '']);
      expect(row(1).base).toBeNull();
    });

    it('D-156:沒離開欄位就直接送出,空白欄位也當 0 送出', async () => {
      vm.setTime(keyOf(1), 'h', '2'); // 只填「時」,沒有離開(沒有 resume)
      vm.setStatus(keyOf(2), 'complete');
      const p = vm.submit();
      const req = http.expectOne('/api/workshops/w1/submarines');
      expect(req.request.body.submarines[0]).toMatchObject({ position: 1, status: 'exploring', remaining_minutes: 120 });
      req.flush({ submarines: [], reminder_skipped_positions: [] });
      await settle();
      http.expectOne('/api/overview').flush({ workshops: store.fetched() });
      await p;
    });

    it('跨日/時的進位正確', () => {
      fill(1, '1', '0', '5');
      vi.setSystemTime(T0 + 10 * MIN);
      vm.tick(Date.now());
      expect([row(1).d, row(1).h, row(1).m]).toEqual(['0', '23', '55']);
    });

    it('正在編輯的列暫停補正;離開後以當時的值重新起算', () => {
      fill(1, '0', '3', '41');
      vm.pause(keyOf(1));
      vi.setSystemTime(T0 + 5 * MIN);
      vm.tick(Date.now());
      expect(row(1).m).toBe('41');
      expect(vm.compMin()).toBe(0);

      vm.resume(keyOf(1)); // 在 T0+5 分重新起算
      vi.setSystemTime(T0 + 7 * MIN);
      vm.tick(Date.now());
      expect(row(1).m).toBe('39');
    });

    it('輸入時暫停(使用者的修改優先),不會在輸入途中被補正改掉', () => {
      fill(1, '0', '3', '41');
      vm.setTime(keyOf(1), 'm', '5');
      expect(row(1).paused).toBe(true);
      vi.setSystemTime(T0 + 2 * MIN);
      vm.tick(Date.now());
      expect(row(1).m).toBe('5');
    });

    it('改狀態會重新起算:切到探索完成不再補正', () => {
      fill(1, '0', '3', '41');
      vm.setStatus(keyOf(1), 'complete');
      expect(row(1).base).toBeNull();
      vi.setSystemTime(T0 + 3 * MIN);
      vm.tick(Date.now());
      expect(row(1).m).toBe('41');
    });

    it('各列各自起算:後填的列從自己填完的時間開始', () => {
      fill(1, '0', '1', '0');
      vi.setSystemTime(T0 + 2 * MIN);
      fill(2, '0', '1', '0');
      vi.setSystemTime(T0 + 5 * MIN);
      vm.tick(Date.now());
      expect(row(1).m).toBe('55');
      expect(row(2).m).toBe('57');
      expect(vm.compMin()).toBe(5);
    });

    it('任一列扣到 0 → 資料作廢:表單回到全新狀態並提示', () => {
      fill(1, '0', '0', '2');
      fill(2, '0', '5', '0');
      vi.setSystemTime(T0 + 2 * MIN);
      expect(vm.tick(Date.now())).toBe(true);
      expect(vm.rows().every((r) => r.d === '' && r.h === '' && r.m === '')).toBe(true);
      expect(vm.compMin()).toBe(0);
      expect(toast.items().some((t) => t.tone === 'warn' && t.text.includes('作廢'))).toBe(true);
    });

    it('預計返航時間(絕對時間)不會因補正而改變', () => {
      fill(1, '0', '3', '0');
      const before = vm.etaOf(row(1));
      vi.setSystemTime(T0 + 4 * MIN);
      vm.tick(Date.now());
      expect(vm.etaOf(row(1))).toBe(before);
    });
  });

  describe('送出', () => {
    beforeEach(() => vm.open());

    it('驗證失敗:不呼叫 API,錯誤標在對應列', async () => {
      fill(1, '0', '3', '41'); // 第 2 列整列沒填
      expect(await vm.submit()).toBe('invalid');
      expect(vm.errors()[keyOf(2)]).toContain('請填寫剩餘時間');
      expect(vm.errors()[keyOf(1)]).toBeUndefined();
      http.expectNone('/api/workshops/w1/submarines');
    });

    it('送出的是補正後的分鐘(零頭進位多扣 1 分鐘);探索完成不送時間;完成後選取該工坊並提示', async () => {
      fill(1, '0', '3', '41');
      vm.setStatus(keyOf(2), 'complete');
      vm.setName(keyOf(2), '   ');
      vi.setSystemTime(T0 + 90_000); // 等了 1.5 分鐘:畫面 220,送出 221 - ceil(1.5) = 219

      const p = vm.submit();
      const req = http.expectOne('/api/workshops/w1/submarines');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        submarines: [
          { position: 1, name: '潛水艇-1', status: 'exploring', remaining_minutes: 219 },
          { position: 2, name: null, status: 'complete' },
        ],
      });
      req.flush({ submarines: [sub('w1', 1), sub('w1', 2, { name: null, status: 'complete', expected_return_at: null })], reminder_skipped_positions: [] });
      expect(await p).toBe('ok');
      expect(toast.items()[0]).toMatchObject({ tone: 'info', text: '已更新「貝殼工坊」2 艘潛水艇' });
      expect(toast.items()).toHaveLength(1);
      await flushRefresh();
    });

    it('沒有補正基準(正在編輯或沒起算)時,送出填的數字', async () => {
      const k1 = keyOf(1);
      vm.setTime(k1, 'd', '0');
      vm.setTime(k1, 'h', '2');
      vm.setTime(k1, 'm', '0'); // 仍在編輯(paused)
      vm.setStatus(keyOf(2), 'complete');
      vi.setSystemTime(T0 + 10 * MIN);
      // 狀態切換會重新起算第 2 列,第 1 列沒離開欄位 → 不補正
      const p = vm.submit();
      const req = http.expectOne('/api/workshops/w1/submarines');
      expect(req.request.body.submarines[0].remaining_minutes).toBe(120);
      req.flush({ submarines: [], reminder_skipped_positions: [] });
      await p;
      await flushRefresh();
    });

    it('送出時某列補正後歸零 → 作廢,不呼叫 API', async () => {
      fill(1, '0', '0', '1');
      vm.setStatus(keyOf(2), 'complete');
      vi.setSystemTime(T0 + 30_000);
      expect(await vm.submit()).toBe('voided');
      http.expectNone('/api/workshops/w1/submarines');
    });

    it('預先提醒時間已過(D-135 ②b):逐艘列出圈號、整批只提示工坊', async () => {
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      let p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush({ submarines: [], reminder_skipped_positions: [1, 2] });
      await p;
      const warn = toast.items().find((t) => t.tone === 'warn')!;
      expect(warn.text).toContain('①②');
      expect(warn.text).toContain('不會收到提醒');
      await flushRefresh();

      toast.items().forEach((t) => toast.dismiss(t.id));
      store.fetched.update((list) => list.map((w) => (w.id === 'w1' ? { ...w, notify_batched: true } : w)));
      vm.selectWorkshop('w1');
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush({ submarines: [], reminder_skipped_positions: [1, 2] });
      await p;
      expect(toast.items().find((t) => t.tone === 'warn')!.text).toBe('預先提醒的時間已過，這間工坊這次不會收到提醒。');
      await flushRefresh();
    });

    it('伺服器 400:依 items 的 index 把錯誤放回對應列,資料保留', async () => {
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      const p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush(
        { error: 'validation_failed', fields: {}, items: [{ index: 1, fields: { remaining_minutes: 'invalid_value' } }] },
        { status: 400, statusText: 'Bad Request' },
      );
      expect(await p).toBe('invalid');
      expect(vm.errors()[keyOf(2)]).toContain('不正確');
      expect(vm.errors()[keyOf(1)]).toBeUndefined();
      expect(row(1).h).toBe('3');
    });

    it('陣列本身的錯誤顯示在表單層級', async () => {
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      const p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush({ error: 'validation_failed', fields: { submarines: 'invalid_value' } }, { status: 400, statusText: 'Bad Request' });
      await p;
      expect(vm.formError()).toContain('最多 4 艘');
    });

    it('工坊已被刪除(404):提示並回報 gone', async () => {
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      const p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush({ error: 'not_found' }, { status: 404, statusText: 'Not Found' });
      expect(await p).toBe('gone');
      expect(toast.items().some((t) => t.text.includes('不存在'))).toBe(true);
      await flushRefresh();
    });

    it('網路等其他錯誤:留在表單、資料保留、可重試', async () => {
      fill(1, '0', '3', '0');
      fill(2, '0', '3', '0');
      const p = vm.submit();
      http.expectOne('/api/workshops/w1/submarines').flush({}, { status: 500, statusText: 'Server Error' });
      expect(await p).toBe('failed');
      expect(vm.formError()).toContain('送出失敗');
      expect(vm.submitting()).toBe(false);
      expect(row(1).h).toBe('3');
    });
  });

  it('離開頁面:丟棄表單、停止計時(不保存草稿,D-145 ⑤)', () => {
    vm.open();
    fill(1, '0', '3', '0');
    vm.close();
    expect(vm.rows()).toEqual([]);
    expect(vm.workshopId()).toBeNull();
    vm.open();
    expect(row(1).m).toBe('');
  });
});
