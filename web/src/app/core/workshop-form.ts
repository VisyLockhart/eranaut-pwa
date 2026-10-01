import type { ValidatorFn } from '@angular/forms';
import {
  DEFAULT_NOTIFY_LEAD_MINUTES,
  NOTIFY_LEAD_MINUTES,
  type District,
  type FieldErrorCode,
  type NotifyLeadMinutes,
  type Server,
  type WorkshopDto,
  type WorkshopInput,
  type WorkshopWithSubmarines,
} from '@eranaut/shared';

// 工坊表單的純函式與驗證器(D-103、D-135、D-137)。與元件分開,方便單元測試。

/** 字數以 Unicode 字元計(emoji 算 1),與 API 的驗證一致(SCHEMA §8.3) */
export function charCount(text: string): number {
  return [...text].length;
}

export const requiredTrimmed: ValidatorFn = (c) => (String(c.value ?? '').trim() === '' ? { required: true } : null);

export function maxChars(max: number): ValidatorFn {
  return (c) => (charCount(String(c.value ?? '').trim()) > max ? { tooLong: { max } } : null);
}

/** 房區:選填;有填必須是正整數、不設上限(D-137 ③) */
export const positiveInteger: ValidatorFn = (c) => {
  const v: unknown = c.value;
  if (v === null || v === undefined || v === '') return null;
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 ? null : { invalidValue: true };
};

export function fieldErrorText(code: FieldErrorCode): string {
  switch (code) {
    case 'required':
      return '這個欄位必填';
    case 'too_long':
      return '字數超過上限';
    case 'invalid_type':
      return '格式不正確';
    default:
      return '內容不正確';
  }
}

// ---- 預先提醒(D-135) ----

export type LeadChoice = Exclude<NotifyLeadMinutes, 0>;
/** 下拉選單的選項(0 = 不預先提醒,由開關表達,不在選單裡) */
export const LEAD_CHOICES: readonly LeadChoice[] = NOTIFY_LEAD_MINUTES.filter((m): m is LeadChoice => m > 0);
export const DEFAULT_LEAD: LeadChoice = DEFAULT_NOTIFY_LEAD_MINUTES as LeadChoice;

export function leadLabel(minutes: number): string {
  return minutes < 60 ? `${minutes} 分` : `${minutes / 60} 小時`;
}

/**
 * 預先提醒可選的選項(D-135 ②a):只有**整批模式**需要過濾——整批只有一則提醒,
 * 應發時間 = 最晚返航時間 − 提前分鐘,所以提前分鐘必須小於剩餘時間。
 * 逐艘模式每艘各有自己的提醒,選單不過濾;沒有探索中的艇(`remainingMs` 為 null)也不限制。
 */
export function allowedLeadChoices(batched: boolean, remainingMs: number | null): readonly LeadChoice[] {
  if (!batched || remainingMs === null) return LEAD_CHOICES;
  return LEAD_CHOICES.filter((m) => m * 60_000 < remainingMs);
}

/** 該工坊「探索中且尚未返航」的潛艇裡,最晚返航還要多久(毫秒);沒有則 null */
export function latestRemainingMs(workshop: WorkshopWithSubmarines | null, now: number): number | null {
  if (!workshop) return null;
  let latest: number | null = null;
  for (const s of workshop.submarines) {
    if (s.status !== 'exploring' || s.expected_return_at === null) continue;
    const eta = Date.parse(s.expected_return_at);
    if (eta > now && (latest === null || eta > latest)) latest = eta;
  }
  return latest === null ? null : latest - now;
}

// ---- 表單值 ↔ API ----

export interface WorkshopFormValue {
  name: string;
  server: string;
  captain: string;
  district: string;
  ward: number | null;
  detail: string;
  notifyBatched: boolean;
  leadEnabled: boolean;
  leadMinutes: number;
}

export const EMPTY_FORM: WorkshopFormValue = {
  name: '',
  server: '',
  captain: '',
  district: '',
  ward: null,
  detail: '',
  notifyBatched: false,
  leadEnabled: false,
  leadMinutes: DEFAULT_LEAD,
};

export function toFormValue(w: WorkshopDto | null): WorkshopFormValue {
  if (!w) return { ...EMPTY_FORM };
  return {
    name: w.name,
    server: w.server,
    captain: w.captain ?? '',
    district: w.address_district ?? '',
    ward: w.address_ward,
    detail: w.address_detail ?? '',
    notifyBatched: w.notify_batched,
    leadEnabled: w.notify_lead_minutes > 0,
    leadMinutes: w.notify_lead_minutes > 0 ? w.notify_lead_minutes : DEFAULT_LEAD,
  };
}

/** PUT 是整筆取代:選填欄位空白一律送 null(= 清空) */
export function toInput(v: WorkshopFormValue): WorkshopInput {
  const text = (s: string): string | null => s.trim() || null;
  return {
    name: v.name.trim(),
    server: v.server as Server,
    captain: text(v.captain),
    address_district: (v.district || null) as District | null,
    address_ward: v.ward,
    address_detail: text(v.detail),
    notify_batched: v.notifyBatched,
    notify_lead_minutes: (v.leadEnabled ? v.leadMinutes : 0) as NotifyLeadMinutes,
  };
}
