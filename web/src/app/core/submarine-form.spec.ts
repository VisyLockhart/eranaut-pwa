import { describe, expect, it } from 'vitest';
import { defaultName, etaText, fillBlanks, newRow, nextFreePosition, rebase, rowError, rowMinutes, serverRowMessage, toSubmarineInput, type SubRow } from './submarine-form';

const row = (over: Partial<SubRow> = {}): SubRow => ({ ...newRow(1, 1, '潛水艇-1', 'exploring', false), d: '0', h: '3', m: '41', ...over });

describe('rowMinutes', () => {
  it('空白欄位當 0(D-156)', () => {
    expect(rowMinutes(row())).toBe(221);
    expect(rowMinutes(row({ d: '1', h: '0', m: '0' }))).toBe(1440);
    expect(rowMinutes(row({ m: '' }))).toBe(180);
    expect(rowMinutes(row({ d: '', h: '', m: '5' }))).toBe(5);
    expect(rowMinutes(row({ d: '', h: '', m: '' }))).toBe(0);
  });
  it('含非數字回 null', () => expect(rowMinutes(row({ m: '1a' }))).toBeNull());
});

describe('fillBlanks(D-156)', () => {
  it('至少填了一欄時,空白補成 0', () => {
    expect(fillBlanks(row({ d: '', h: '', m: '5' }))).toMatchObject({ d: '0', h: '0', m: '5' });
    expect(fillBlanks(row({ d: '1', h: '', m: '' }))).toMatchObject({ d: '1', h: '0', m: '0' });
  });
  it('全空白、已填滿、或探索完成都不動', () => {
    const blank = row({ d: '', h: '', m: '' });
    expect(fillBlanks(blank)).toBe(blank);
    const full = row();
    expect(fillBlanks(full)).toBe(full);
    const done = row({ status: 'complete', d: '', h: '', m: '5' });
    expect(fillBlanks(done)).toBe(done);
  });
});

describe('rebase(D-124 起算)', () => {
  it('填完且大於 0 才有基準,起點為傳入的時間', () => {
    expect(rebase(row(), 500)).toMatchObject({ base: 221, startedAt: 500 });
  });
  it('只填一部分也有基準(空白當 0);全空白、合計為 0、或探索完成都沒有基準', () => {
    expect(rebase(row({ m: '' }), 1).base).toBe(180);
    expect(rebase(row({ d: '', h: '', m: '5' }), 1).base).toBe(5);
    expect(rebase(row({ d: '', h: '', m: '' }), 1).base).toBeNull();
    expect(rebase(row({ d: '0', h: '0', m: '0' }), 1).base).toBeNull();
    expect(rebase(row({ status: 'complete' }), 1).base).toBeNull();
  });
});

describe('rowError(D-118)', () => {
  it('合法的資料沒有錯誤', () => expect(rowError(row())).toBeNull());
  it('空白欄位當 0,不報錯;三欄全空白要求填寫', () => {
    expect(rowError(row({ h: '' }))).toBeNull();
    expect(rowError(row({ d: '', h: '', m: '5' }))).toBeNull();
    expect(rowError(row({ d: '', h: '', m: '' }))).toContain('請填寫剩餘時間');
  });
  it('時最多 23、分最多 59', () => {
    expect(rowError(row({ h: '24' }))).toContain('最多 23');
    expect(rowError(row({ m: '60' }))).toContain('最多 59');
  });
  it('總和不能是 0', () => expect(rowError(row({ d: '0', h: '0', m: '0' }))).toContain('不能是 0'));
  it('探索完成不檢查時間', () => expect(rowError(row({ status: 'complete', d: '', h: '', m: '' }))).toBeNull());
  it('名稱最多 20 字(以字元計,emoji 算 1);空白名稱允許(清空)', () => {
    expect(rowError(row({ name: '長'.repeat(21) }))).toContain('20');
    expect(rowError(row({ name: '😀'.repeat(20) }))).toBeNull();
    expect(rowError(row({ name: '   ' }))).toBeNull();
  });
});

describe('etaText', () => {
  const now = Date.parse('2026-10-01T04:00:00Z'); // 台北 12:00
  it('填完後顯示預計返航(台北時間,以送出當下起算)', () => {
    expect(etaText(row({ d: '0', h: '2', m: '5' }), now)).toBe('預計返航 10/01 14:05（以送出當下起算）');
  });
  it('沒填完顯示提示;探索完成顯示可收艇', () => {
    expect(etaText(row({ d: '', h: '', m: '' }), now)).toContain('填入');
    expect(etaText(row({ m: '' }), now)).toContain('預計返航');
    expect(etaText(row({ status: 'complete' }), now)).toContain('可收艇');
  });
});

describe('toSubmarineInput', () => {
  it('探索中:送剩餘分鐘;名稱去頭尾空白', () => {
    expect(toSubmarineInput(row({ name: ' 阿爾法 ' }), 219)).toEqual({ position: 1, name: '阿爾法', status: 'exploring', remaining_minutes: 219 });
  });
  it('探索完成:不送剩餘時間;空白名稱送 null(清空)', () => {
    expect(toSubmarineInput(row({ status: 'complete', name: '  ' }), null)).toEqual({ position: 1, name: null, status: 'complete' });
  });
});

describe('位置', () => {
  it('nextFreePosition 找第一個沒用到的位置,滿 4 艘回 null', () => {
    expect(nextFreePosition([{ position: 1 }, { position: 3 }])).toBe(2);
    expect(nextFreePosition([1, 2, 3, 4].map((position) => ({ position })))).toBeNull();
    expect(nextFreePosition([])).toBe(1);
  });
  it('預設名稱', () => expect(defaultName(3)).toBe('潛水艇-3'));
});

describe('serverRowMessage', () => {
  it('依欄位錯誤碼給文字', () => {
    expect(serverRowMessage({ name: 'too_long' })).toContain('20');
    expect(serverRowMessage({ remaining_minutes: 'required' })).toContain('請填寫');
    expect(serverRowMessage({ remaining_minutes: 'invalid_value' })).toContain('不正確');
    expect(serverRowMessage({})).toContain('資料不正確');
  });
});
