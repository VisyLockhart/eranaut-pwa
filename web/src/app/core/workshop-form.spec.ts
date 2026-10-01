import { FormControl } from '@angular/forms';
import type { WorkshopDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { describe, expect, it } from 'vitest';
import {
  allowedLeadChoices,
  charCount,
  fieldErrorText,
  latestRemainingMs,
  leadLabel,
  maxChars,
  positiveInteger,
  requiredTrimmed,
  toFormValue,
  toInput,
} from './workshop-form';

const NOW = Date.parse('2026-10-01T00:00:00Z');
const at = (min: number): string => new Date(NOW + min * 60_000).toISOString();

function ws(subs: { status: 'exploring' | 'complete'; eta: number | null }[]): WorkshopWithSubmarines {
  return {
    id: 'w',
    name: 'W',
    server: '迦樓羅',
    captain: null,
    address_district: null,
    address_ward: null,
    address_detail: null,
    notify_batched: true,
    notify_lead_minutes: 0,
    created_at: at(0),
    submarines: subs.map((s, i) => ({
      id: `s${i}`,
      workshop_id: 'w',
      position: i + 1,
      name: null,
      status: s.status,
      expected_return_at: s.eta === null ? null : at(s.eta),
      last_synced_at: at(0),
    })),
  };
}

describe('驗證器', () => {
  it('字數以 Unicode 字元計(emoji 算 1)', () => {
    expect(charCount('潛水艇')).toBe(3);
    expect(charCount('😀'.repeat(20))).toBe(20);
    expect(maxChars(20)(new FormControl('😀'.repeat(20)))).toBeNull();
    expect(maxChars(20)(new FormControl('a'.repeat(21)))).toEqual({ tooLong: { max: 20 } });
  });
  it('字數檢查先去頭尾空白', () => {
    expect(maxChars(3)(new FormControl('  abc  '))).toBeNull();
  });
  it('requiredTrimmed:全空白算沒填', () => {
    expect(requiredTrimmed(new FormControl('   '))).toEqual({ required: true });
    expect(requiredTrimmed(new FormControl(' x '))).toBeNull();
  });
  it('房區:選填、正整數、不設上限', () => {
    expect(positiveInteger(new FormControl(null))).toBeNull();
    expect(positiveInteger(new FormControl(15))).toBeNull();
    expect(positiveInteger(new FormControl(999999))).toBeNull();
    for (const bad of [0, -1, 1.5]) expect(positiveInteger(new FormControl(bad))).toEqual({ invalidValue: true });
  });
  it('API 錯誤碼對應文字', () => {
    expect(fieldErrorText('required')).toBe('這個欄位必填');
    expect(fieldErrorText('too_long')).toBe('字數超過上限');
  });
});

describe('預先提醒選項(D-135 ②a)', () => {
  it('逐艘模式不過濾', () => {
    expect(allowedLeadChoices(false, 3 * 60_000)).toEqual([5, 10, 15, 30, 60, 120]);
  });
  it('整批模式沒有探索中的艇不限制', () => {
    expect(allowedLeadChoices(true, null)).toEqual([5, 10, 15, 30, 60, 120]);
  });
  it('整批模式只列出小於剩餘時間的選項', () => {
    expect(allowedLeadChoices(true, 45 * 60_000)).toEqual([5, 10, 15, 30]);
    expect(allowedLeadChoices(true, 30 * 60_000)).toEqual([5, 10, 15]);
    expect(allowedLeadChoices(true, 5 * 60_000)).toEqual([]);
  });
  it('latestRemainingMs:取探索中且未返航的最晚返航', () => {
    expect(latestRemainingMs(ws([{ status: 'exploring', eta: 30 }, { status: 'exploring', eta: 90 }, { status: 'complete', eta: null }]), NOW)).toBe(90 * 60_000);
    expect(latestRemainingMs(ws([{ status: 'exploring', eta: -5 }, { status: 'complete', eta: null }]), NOW)).toBeNull();
    expect(latestRemainingMs(null, NOW)).toBeNull();
  });
  it('leadLabel', () => {
    expect(leadLabel(5)).toBe('5 分');
    expect(leadLabel(60)).toBe('1 小時');
    expect(leadLabel(120)).toBe('2 小時');
  });
});

describe('表單值 ↔ API', () => {
  const dto: WorkshopDto = {
    id: 'w',
    name: '貝殼工坊',
    server: '伊弗利特',
    captain: '芙寧娜',
    address_district: '海霧村',
    address_ward: 15,
    address_detail: '51巷2號',
    notify_batched: true,
    notify_lead_minutes: 30,
    created_at: at(0),
  };
  it('toFormValue(null) 是空白新增表單,預先提醒預設 5 分但未啟用', () => {
    const v = toFormValue(null);
    expect(v.name).toBe('');
    expect(v.leadEnabled).toBe(false);
    expect(v.leadMinutes).toBe(5);
  });
  it('編輯時帶入既有值;提前分鐘 > 0 即啟用', () => {
    const v = toFormValue(dto);
    expect(v).toMatchObject({ name: '貝殼工坊', captain: '芙寧娜', district: '海霧村', ward: 15, leadEnabled: true, leadMinutes: 30 });
    expect(toFormValue({ ...dto, notify_lead_minutes: 0, captain: null, address_ward: null }).captain).toBe('');
  });
  it('toInput:去空白、空白選填欄位送 null、未啟用預先提醒送 0', () => {
    const input = toInput({ name: '  X  ', server: '泰坦', captain: '  ', district: '', ward: null, detail: ' ', notifyBatched: false, leadEnabled: false, leadMinutes: 30 });
    expect(input).toEqual({
      name: 'X',
      server: '泰坦',
      captain: null,
      address_district: null,
      address_ward: null,
      address_detail: null,
      notify_batched: false,
      notify_lead_minutes: 0,
    });
  });
  it('toInput:啟用預先提醒送選的分鐘', () => {
    expect(toInput({ ...toFormValue(dto), leadMinutes: 60 }).notify_lead_minutes).toBe(60);
  });
});
