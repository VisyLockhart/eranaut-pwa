import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { OcrResultDto, OcrSubmarineDto, SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './auth';
import { DataStore } from './data-store';
import { flagText } from './submarine-form';
import { Toast } from './toast';
import { UpdateVm, fileProblem } from './update-vm';

// 截圖辨識接進更新表單(D-117、D-119、D-124、D-154)。手動輸入的案例在 update-vm.spec.ts

const T0 = Date.parse('2026-10-01T04:00:00Z');
const MIN = 60_000;
const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const png = (): File => new File(['x'], 'shot.png', { type: 'image/png' });

const sub = (wid: string, position: number): SubmarineDto => ({
  id: `${wid}-${position}`,
  workshop_id: wid,
  position,
  name: `既有-${position}`,
  status: 'exploring',
  expected_return_at: '2026-10-02T00:00:00Z',
  last_synced_at: '2026-10-01T00:00:00Z',
});
const workshop = (id: string, positions: number[]): WorkshopWithSubmarines => ({
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
});
const dto = (position: number, minutes: number | null, over: Partial<OcrSubmarineDto> = {}): OcrSubmarineDto => ({
  position,
  name: `潛水艇-${position}`,
  status: 'exploring',
  days: minutes === null ? null : Math.floor(minutes / 1440),
  hours: minutes === null ? null : Math.floor((minutes % 1440) / 60),
  minutes: minutes === null ? null : minutes % 60,
  remaining_minutes: minutes,
  suspect: { name: false, time: false },
  reasons: [],
  ...over,
});
const result = (submarines: OcrSubmarineDto[], warnings: OcrResultDto['warnings'] = []): OcrResultDto => ({ format: 'menu', submarines, warnings });

describe('UpdateVm 截圖辨識', () => {
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
    vm.open();
  });
  afterEach(() => {
    vm.close();
    vi.useRealTimers();
  });

  const upload = async (r: OcrResultDto): Promise<void> => {
    const pending = vm.recognize(png());
    http.expectOne('/api/ocr').flush(r);
    await pending;
  };
  const row = (position: number) => vm.rows().find((x) => x.position === position)!;

  it('預設是截圖辨識分頁、等上傳;表單還沒顯示', () => {
    expect(vm.mode()).toBe('ocr');
    expect(vm.ocrPhase()).toBe('idle');
    expect(vm.formVisible()).toBe(false);
  });

  it('上傳:以 multipart 的 image 欄位送出,辨識中顯示忙碌,結果帶入表單', async () => {
    const pending = vm.recognize(png());
    expect(vm.ocrPhase()).toBe('busy');
    const req = http.expectOne('/api/ocr');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('image')).toBeInstanceOf(File);
    req.flush(result([dto(1, 528), dto(2, 61)]));
    await pending;
    expect(vm.ocrPhase()).toBe('review');
    expect(vm.formVisible()).toBe(true);
    expect(vm.rows().map((r) => [r.position, r.status, r.d, r.h, r.m, r.added])).toEqual([
      [1, 'exploring', '0', '8', '48', false],
      [2, 'exploring', '0', '1', '1', false],
    ]);
  });

  it('名稱讀不到:沿用既有名稱;既有沒有的位置用預設名稱並算新加入', async () => {
    await upload(result([dto(1, 10, { name: null }), dto(3, 20, { name: null })]));
    expect(row(1).name).toBe('既有-1');
    expect(row(3).name).toBe('潛水艇-3');
    expect(row(3).added).toBe(true);
    expect(row(1).added).toBe(false);
  });

  it('只更新辨識到的位置;沒辨識到的既有位置不在表單裡(D-122)', async () => {
    await upload(result([dto(2, 30)]));
    expect(vm.rows().map((r) => r.position)).toEqual([2]);
  });

  it('可疑欄位標「請核對」;修改那一欄後標示消失,兩欄都改完整個標示移除', async () => {
    await upload(result([dto(1, 90, { name: '潘水艇-1', suspect: { name: true, time: true }, reasons: ['low_confidence'] })]));
    expect(row(1).flag).toEqual({ name: true, time: true, reasons: ['low_confidence'] });
    expect(flagText(row(1))).toContain('請核對：辨識信心偏低');
    vm.setTime(row(1).key, 'm', '31');
    expect(row(1).flag).toMatchObject({ name: true, time: false });
    expect(flagText(row(1))).not.toBeNull();
    vm.setName(row(1).key, '潛水艇-1');
    expect(row(1).flag).toBeUndefined();
    expect(flagText(row(1))).toBeNull();
  });

  it('探索完成:沒有時間欄,也沒有時間的核對標示', async () => {
    await upload(result([dto(1, null, { status: 'complete', suspect: { name: false, time: true }, reasons: ['low_confidence'] })]));
    expect(row(1)).toMatchObject({ status: 'complete', d: '', h: '', m: '' });
    expect(row(1).flag).toBeUndefined();
  });

  it('時間讀不到(null):欄位留空等使用者填,標時間可疑', async () => {
    await upload(result([dto(1, null, { suspect: { name: false, time: true }, reasons: ['time_unreadable'] })]));
    expect(row(1)).toMatchObject({ d: '', h: '', m: '', base: null });
    expect(flagText(row(1))).toContain('沒讀到時間');
  });

  it('D-124:結果回來的時間就是補正的起點;之後每滿一分鐘扣一分鐘', async () => {
    await upload(result([dto(1, 120), dto(2, 45)]));
    expect(row(1)).toMatchObject({ base: 120, startedAt: T0 });
    vm.tick(T0 + 3 * MIN);
    expect([row(1).h, row(1).m]).toEqual(['1', '57']);
    expect([row(2).h, row(2).m]).toEqual(['0', '42']);
    expect(vm.compMin()).toBe(3);
  });

  it('D-124:任一艘扣到 0 → 資料作廢,回到等上傳並提示重新上傳', async () => {
    await upload(result([dto(1, 120), dto(2, 2)]));
    expect(vm.tick(T0 + 2 * MIN)).toBe(true);
    expect(vm.ocrPhase()).toBe('idle');
    expect(vm.rows().length).toBe(2); // 回到以工坊目前潛艇建立的空表單(不顯示)
    expect(toast.items().at(-1)?.text).toContain('請重新上傳截圖');
  });

  it('送出:帶入的值就是送出的值(扣掉補正);探索完成不送時間', async () => {
    await upload(result([dto(1, 100), dto(2, null, { status: 'complete' })]));
    vi.setSystemTime(T0 + 30_000); // 過了半分鐘:不滿一分鐘的零頭在送出時多扣 1 分鐘
    const submit = vm.submit();
    const req = http.expectOne('/api/workshops/w1/submarines');
    expect(req.request.body).toEqual({
      submarines: [
        { position: 1, name: '潛水艇-1', status: 'exploring', remaining_minutes: 99 }, // D-124 ④
        { position: 2, name: '潛水艇-2', status: 'complete' },
      ],
    });
    req.flush({ submarines: [], reminder_skipped_positions: [] });
    await settle();
    http.match('/api/overview').forEach((r) => r.flush({ workshops: store.fetched() }));
    expect(await submit).toBe('ok');
  });

  it('警告:列數對不上、超過 4 列各有說明', async () => {
    await upload(result([dto(1, 10)], ['row_count_mismatch', 'too_many_rows']));
    expect(vm.ocrWarnings().length).toBe(2);
    expect(vm.ocrWarnings()[0]).toContain('少讀了某一艘');
    expect(vm.ocrWarnings()[1]).toContain('前 4 艘');
  });

  it('截圖辨識的列可以移除(含既有位置),但至少留一列;手動輸入仍只有新加入的可移除', async () => {
    await upload(result([dto(1, 10), dto(2, 20)]));
    expect(vm.isRemovable(row(1))).toBe(true);
    vm.removeRow(row(1).key);
    expect(vm.rows().map((r) => r.position)).toEqual([2]);
    expect(vm.isRemovable(row(2))).toBe(false);
    vm.setMode('manual');
    expect(vm.rows().map((r) => r.position)).toEqual([1, 2]);
    expect(vm.isRemovable(row(1))).toBe(false);
  });

  it('重新上傳:丟掉辨識結果回到等上傳', async () => {
    await upload(result([dto(1, 10)]));
    vm.restartOcr();
    expect(vm.ocrPhase()).toBe('idle');
    expect(vm.formVisible()).toBe(false);
    expect(vm.ocrWarnings()).toEqual([]);
  });

  it('換工坊 / 換分頁會丟棄辨識結果;辨識中換工坊,晚到的結果不採用', async () => {
    const pending = vm.recognize(png());
    const req = http.expectOne('/api/ocr');
    vm.selectWorkshop('w2');
    req.flush(result([dto(1, 10)]));
    await pending;
    expect(vm.ocrPhase()).toBe('idle');
    expect(vm.workshopId()).toBe('w2');
    expect(vm.rows()).toEqual([expect.objectContaining({ position: 1, name: '潛水艇-1', d: '' })]);
  });

  describe('錯誤', () => {
    const fail = async (status: number, error: string): Promise<void> => {
      const pending = vm.recognize(png());
      http.expectOne('/api/ocr').flush({ error }, { status, statusText: 'x' });
      await pending;
    };

    it.each([
      [422, 'unrecognized', '看不出這是潛水艇的畫面'],
      [429, 'busy', '稍後再試'],
      [503, 'ocr_unavailable', '改用手動輸入'],
      [413, 'file_too_large', '10 MB'],
      [415, 'unsupported_image', 'PNG'],
      [400, 'no_file', '沒有收到圖片'],
    ])('%s %s → 回到等上傳並顯示說明', async (status, code, text) => {
      await fail(status, code);
      expect(vm.ocrPhase()).toBe('idle');
      expect(vm.ocrError()).toContain(text);
    });

    it('網路失敗:通用說明,可再試一次', async () => {
      const pending = vm.recognize(png());
      http.expectOne('/api/ocr').error(new ProgressEvent('error'));
      await pending;
      expect(vm.ocrError()).toContain('辨識失敗');
      const again = vm.recognize(png());
      http.expectOne('/api/ocr').flush(result([dto(1, 10)]));
      await again;
      expect(vm.ocrPhase()).toBe('review');
      expect(vm.ocrError()).toBeNull();
    });

    it('檔案不合(不是支援的圖片、太大、空檔):不送出請求', async () => {
      await vm.recognize(new File(['x'], 'a.gif', { type: 'image/gif' }));
      expect(vm.ocrError()).toContain('PNG');
      await vm.recognize(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
      expect(vm.ocrError()).toContain('10 MB');
      expect(vm.ocrPhase()).toBe('idle');
      http.expectNone('/api/ocr');
    });
  });

  it('fileProblem:三種格式、剛好 10 MB 可過', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(fileProblem({ type, size: 10 * 1024 * 1024 })).toBeNull();
    expect(fileProblem({ type: 'image/png', size: 0 })).not.toBeNull();
    expect(fileProblem({ type: '', size: 5 })).not.toBeNull();
  });
});
