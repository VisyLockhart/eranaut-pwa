import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import type { WorkshopWithSubmarines } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { UpdatePage } from './update-page';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));
const workshop = (id: string, name: string, n: number): WorkshopWithSubmarines => ({
  id,
  name,
  server: '迦樓羅',
  captain: '芙寧娜',
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: Array.from({ length: n }, (_, i) => ({ id: `${id}-${i + 1}`, workshop_id: id, position: i + 1, name: `潛水艇-${i + 1}`, status: 'exploring' as const, expected_return_at: '2026-10-02T00:00:00Z', last_synced_at: '2026-10-01T00:00:00Z' })),
});

describe('UpdatePage', () => {
  let http: HttpTestingController;
  let store: DataStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    store.loaded.set(true);
    store.fetched.set([workshop('w1', '貝殼工坊', 2), workshop('w2', '鋼鐵之心', 1)]);
  });

  function open() {
    const fixture = TestBed.createComponent(UpdatePage);
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
    // 預設是「截圖辨識」分頁;既有案例測手動輸入
    el.querySelectorAll<HTMLButtonElement>('.up-tab')[1]?.click();
    fixture.detectChanges();
    const input = (position: number, field: string): HTMLInputElement => el.querySelector<HTMLInputElement>(`[data-row="${position}"] [data-field="${field}"]`)!;
    const type = (position: number, field: string, value: string): void => {
      const i = input(position, field);
      i.value = value;
      i.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    return { fixture, el, input, type };
  }

  it('列出所選工坊的潛艇;工坊下拉選單依畫面順序', () => {
    const { el } = open();
    expect([...el.querySelectorAll('.uf-row')].length).toBe(2);
    expect([...el.querySelectorAll('#uf-ws option')].map((o) => o.textContent!.trim())).toEqual(['貝殼工坊', '鋼鐵之心']);
  });

  it('切換工坊:以該工坊的潛艇重建表單', () => {
    const { el, fixture } = open();
    const select = el.querySelector<HTMLSelectElement>('#uf-ws')!;
    select.value = 'w2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(1);
  });

  it('時間欄位只留數字;填完顯示預計返航(台北時間)', () => {
    const { el, input, type } = open();
    type(1, 'h', '3a');
    expect(input(1, 'h').value).toBe('3');
    type(1, 'd', '0');
    type(1, 'm', '41');
    expect(el.querySelector('[data-row="1"] .uf-eta')!.textContent).toContain('預計返航');
  });

  it('切到探索完成:隱藏時間欄,預計返航改為可收艇說明', () => {
    const { el, fixture } = open();
    el.querySelectorAll<HTMLButtonElement>('[data-row="1"] .uf-seg button')[1].click();
    fixture.detectChanges();
    expect(el.querySelector('[data-row="1"] [data-field="h"]')).toBeNull();
    expect(el.querySelector('[data-row="1"] .uf-eta')!.textContent).toContain('可收艇');
  });

  it('加入第 3 艘 / 移除', () => {
    const { el, fixture } = open();
    el.querySelector<HTMLButtonElement>('.uf-add')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(3);
    expect(el.querySelectorAll('.uf-rm').length).toBe(1);
    el.querySelector<HTMLButtonElement>('.uf-rm')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(2);
  });

  it('送出成功:跳回總覽', async () => {
    const { el, fixture, type } = open();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/'); // 先在總覽路徑上,才能看出導頁
    for (const p of [1, 2]) {
      type(p, 'd', '0');
      type(p, 'h', '2');
      type(p, 'm', '0');
    }
    // 離開欄位 → 起算
    el.querySelectorAll<HTMLInputElement>('[data-field="m"]').forEach((i) => i.dispatchEvent(new FocusEvent('blur')));
    el.querySelector<HTMLButtonElement>('.uf-actions-m .primary-btn')!.click();
    fixture.detectChanges();
    const req = http.expectOne('/api/workshops/w1/submarines');
    const body = req.request.body as { submarines: { remaining_minutes: number }[] };
    // 剛填完就送出:零頭進位多扣 1 分鐘,最多差 1 分鐘(D-124 ④)
    expect([119, 120]).toContain(body.submarines[0].remaining_minutes);
    req.flush({ submarines: workshop('w1', '貝殼工坊', 2).submarines, reminder_skipped_positions: [] });
    await settle();
    http.expectOne('/api/overview').flush({ workshops: store.fetched() });
    await settle();
    expect(router.url).toBe('/');
  });

  it('直接開頁面時資料還沒載入:資料到了之後自動建立表單', async () => {
    store.loaded.set(false);
    store.fetched.set([]);
    const { el, fixture } = open();
    expect(el.querySelectorAll('.uf-row').length).toBe(0);
    store.fetched.set([workshop('w1', '貝殼工坊', 2)]);
    store.loaded.set(true);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    el.querySelectorAll<HTMLButtonElement>('.up-tab')[1].click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.uf-row').length).toBe(2);
  });

  it('沒有任何工坊:顯示引導前往工坊管理', () => {
    store.fetched.set([]);
    const { el } = open();
    expect(el.textContent).toContain('先建立一個工坊');
    expect(el.querySelector('a[href="/workshops"]')).not.toBeNull();
    expect(el.querySelector('.uf-actions-m')).toBeNull();
  });

  describe('截圖辨識分頁', () => {
    const ocrResult = {
      format: 'menu',
      warnings: ['row_count_mismatch'],
      submarines: [
        { position: 1, name: '潘水艇-1', status: 'exploring', days: 0, hours: 8, minutes: 52, remaining_minutes: 532, suspect: { name: true, time: true }, reasons: ['low_confidence'] },
        { position: 2, name: '潛水艇-2', status: 'exploring', days: 0, hours: 1, minutes: 1, remaining_minutes: 61, suspect: { name: false, time: false }, reasons: [] },
      ],
    };
    const openOcr = () => {
      const fixture = TestBed.createComponent(UpdatePage);
      const el = fixture.nativeElement as HTMLElement;
      document.body.appendChild(el);
      fixture.detectChanges();
      return { fixture, el };
    };
    const pick = async (el: HTMLElement, fixture: { detectChanges(): void }, file: File) => {
      const input = el.querySelector<HTMLInputElement>('[data-field="ocr-file"]')!;
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    it('預設是截圖辨識:顯示上傳區,還沒有潛艇列也沒有送出鈕', () => {
      const { el } = openOcr();
      expect(el.querySelector('.up-tab.active')!.textContent).toContain('截圖辨識');
      expect(el.querySelector('.dropzone')).not.toBeNull();
      expect(el.querySelectorAll('.uf-row').length).toBe(0);
      expect(el.querySelector('.uf-actions-m, .uf-actions-d')).toBeNull();
    });

    it('上傳 → 辨識中 → 結果帶入:可疑欄位琥珀色加「請核對」,警告顯示,出現送出鈕', async () => {
      const { el, fixture } = openOcr();
      await pick(el, fixture, new File(['x'], 'a.png', { type: 'image/png' }));
      expect(el.querySelector('.ocr-busy')).not.toBeNull();
      http.expectOne('/api/ocr').flush(ocrResult);
      await settle();
      fixture.detectChanges();
      expect(el.querySelector('.dropzone')).toBeNull();
      expect(el.querySelectorAll('.uf-row').length).toBe(2);
      expect(el.querySelector('[data-row="1"] .uf-name')!.classList.contains('flagged')).toBe(true);
      expect(el.querySelector('[data-row="1"] .uf-num')!.classList.contains('flagged')).toBe(true);
      expect(el.querySelector('[data-row="1"] .uf-flag-msg')!.textContent).toContain('請核對');
      expect(el.querySelector('[data-row="2"] .uf-flag-msg')).toBeNull();
      expect(el.querySelector('.uf-comp')!.textContent).toContain('少讀了某一艘');
      expect(el.querySelector('.uf-actions-m, .uf-actions-d')).not.toBeNull();
    });

    it('使用者修改可疑欄位後標示消失', async () => {
      const { el, fixture } = openOcr();
      await pick(el, fixture, new File(['x'], 'a.png', { type: 'image/png' }));
      http.expectOne('/api/ocr').flush(ocrResult);
      await settle();
      fixture.detectChanges();
      const name = el.querySelector<HTMLInputElement>('[data-row="1"] [data-field="name"]')!;
      name.value = '潛水艇-1';
      name.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(el.querySelector('[data-row="1"] .uf-name')!.classList.contains('flagged')).toBe(false);
      expect(el.querySelector('[data-row="1"] .uf-num')!.classList.contains('flagged')).toBe(true);
      const m = el.querySelector<HTMLInputElement>('[data-row="1"] [data-field="m"]')!;
      m.value = '53';
      m.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(el.querySelector('[data-row="1"] .uf-flag-msg')).toBeNull();
    });

    it('辨識失敗:留在上傳區並顯示說明,可再試', async () => {
      const { el, fixture } = openOcr();
      await pick(el, fixture, new File(['x'], 'a.png', { type: 'image/png' }));
      http.expectOne('/api/ocr').flush({ error: 'unrecognized' }, { status: 422, statusText: 'x' });
      await settle();
      fixture.detectChanges();
      expect(el.querySelector('.dropzone')).not.toBeNull();
      expect(el.querySelector('.uf-err')!.textContent).toContain('看不出這是潛水艇的畫面');
    });

    it('拖放檔案到上傳區也會辨識', async () => {
      const { el, fixture } = openOcr();
      const drop = new Event('drop', { cancelable: true }) as Event & { dataTransfer?: unknown };
      drop.dataTransfer = { files: [new File(['x'], 'a.png', { type: 'image/png' })] };
      el.querySelector('.dropzone')!.dispatchEvent(drop);
      fixture.detectChanges();
      expect(drop.defaultPrevented).toBe(true);
      http.expectOne('/api/ocr').flush(ocrResult);
    });

    it('「重新上傳截圖」回到上傳區;切到手動輸入顯示以既有潛艇建立的表單', async () => {
      const { el, fixture } = openOcr();
      await pick(el, fixture, new File(['x'], 'a.png', { type: 'image/png' }));
      http.expectOne('/api/ocr').flush(ocrResult);
      await settle();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[data-action="ocr-restart"]')!.click();
      fixture.detectChanges();
      expect(el.querySelector('.dropzone')).not.toBeNull();
      el.querySelectorAll<HTMLButtonElement>('.up-tab')[1].click();
      fixture.detectChanges();
      expect(el.querySelector('.dropzone')).toBeNull();
      expect(el.querySelectorAll('.uf-row').length).toBe(2);
      expect(el.querySelector('.uf-flag-msg')).toBeNull();
    });
  });
});
