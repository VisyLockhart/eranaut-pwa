import {
  DISTRICTS,
  LIMITS,
  NOTIFY_LEAD_MINUTES,
  SERVERS,
  type District,
  type FieldErrorCode,
  type NotifyLeadMinutes,
  type Server,
  type WorkshopInput,
} from '@eranaut/shared';

// 欄位驗證放在 API(D-137 ⑤):清單是程式常數、DB 不加 CHECK。
// 不限制工坊重名(D-137 ④)、不限制每位使用者的工坊數量(D-137 ⑧)。

export interface ValidWorkshop {
  name: string;
  server: Server;
  captain: string | null;
  address_district: District | null;
  address_ward: number | null;
  address_detail: string | null;
  notify_batched: boolean;
  notify_lead_minutes: NotifyLeadMinutes;
}

export type ValidationResult =
  | { ok: true; value: ValidWorkshop }
  | { ok: false; fields: Partial<Record<keyof WorkshopInput, FieldErrorCode>> };

type Errors = Partial<Record<keyof WorkshopInput, FieldErrorCode>>;

/** 以 Unicode 字元(code point)計長,不用 UTF-16 長度 */
const len = (s: string) => [...s].length;

function text(body: Record<string, unknown>, key: keyof WorkshopInput, max: number, required: boolean, errors: Errors): string | null {
  const raw = body[key];
  if (raw === undefined || raw === null) {
    if (required) errors[key] = 'required';
    return null;
  }
  if (typeof raw !== 'string') {
    errors[key] = 'invalid_type';
    return null;
  }
  const v = raw.trim();
  if (v === '') {
    if (required) errors[key] = 'required';
    return null;
  }
  if (len(v) > max) {
    errors[key] = 'too_long';
    return null;
  }
  return v;
}

export function validateWorkshopInput(input: unknown): ValidationResult {
  const errors: Errors = {};
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, fields: { name: 'required', server: 'required' } };
  }
  const body = input as Record<string, unknown>;

  const name = text(body, 'name', LIMITS.workshopName, true, errors);
  const captain = text(body, 'captain', LIMITS.captain, false, errors);
  const address_detail = text(body, 'address_detail', LIMITS.addressDetail, false, errors);

  // 伺服器必填,固定七選一
  let server: Server | null = null;
  if (body.server === undefined || body.server === null || body.server === '') errors.server = 'required';
  else if (typeof body.server !== 'string') errors.server = 'invalid_type';
  else if (!(SERVERS as readonly string[]).includes(body.server)) errors.server = 'invalid_value';
  else server = body.server as Server;

  // 住宅區選填,固定五選一
  let address_district: District | null = null;
  const d = body.address_district;
  if (d !== undefined && d !== null && d !== '') {
    if (typeof d !== 'string') errors.address_district = 'invalid_type';
    else if (!(DISTRICTS as readonly string[]).includes(d)) errors.address_district = 'invalid_value';
    else address_district = d as District;
  }

  // 房區:正整數、不設上限(D-137 ③)
  let address_ward: number | null = null;
  const w = body.address_ward;
  if (w !== undefined && w !== null) {
    if (typeof w !== 'number') errors.address_ward = 'invalid_type';
    else if (!Number.isSafeInteger(w) || w < 1) errors.address_ward = 'invalid_value';
    else address_ward = w;
  }

  let notify_batched = false;
  if (body.notify_batched !== undefined) {
    if (typeof body.notify_batched !== 'boolean') errors.notify_batched = 'invalid_type';
    else notify_batched = body.notify_batched;
  }

  // 預先提醒:只接受 0 與固定的六個值(D-135)
  let notify_lead_minutes: NotifyLeadMinutes = 0;
  if (body.notify_lead_minutes !== undefined) {
    const m = body.notify_lead_minutes;
    if (typeof m !== 'number') errors.notify_lead_minutes = 'invalid_type';
    else if (!(NOTIFY_LEAD_MINUTES as readonly number[]).includes(m)) errors.notify_lead_minutes = 'invalid_value';
    else notify_lead_minutes = m as NotifyLeadMinutes;
  }

  if (Object.keys(errors).length > 0 || name === null || server === null) {
    return { ok: false, fields: errors };
  }
  return {
    ok: true,
    value: { name, server, captain, address_district, address_ward, address_detail, notify_batched, notify_lead_minutes },
  };
}
