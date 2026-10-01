import {
  LIMITS,
  SUBMARINE_STATUSES,
  type SubmarineFieldErrors,
  type SubmarineStatus,
  type SubmarinesBatchValidationErrorBody,
} from '@eranaut/shared';

// 更新潛艇的驗證與時間計算。純寫入:不質疑前端送來的剩餘時間對不對,只擋明顯不合法的值(D-49)。
// 前端已在送出前做等待時間補正(D-124),後端不處理補正,返航時間 = 收到請求的時間 + 前端傳的剩餘時間(D-48)。

export interface ValidSubmarine {
  position: number;
  name: string | null;
  status: SubmarineStatus;
  /** 只有探索中才有值 */
  remaining_minutes: number | null;
}

export type ItemResult = { ok: true; value: ValidSubmarine } | { ok: false; fields: SubmarineFieldErrors };

const len = (s: string) => [...s].length;

export function validateSubmarineInput(input: unknown): ItemResult {
  const errors: SubmarineFieldErrors = {};
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, fields: { position: 'required', status: 'required' } };
  }
  const b = input as Record<string, unknown>;

  // 位置:1~4 的整數(固定位置,D-43)
  let position = 0;
  if (b.position === undefined || b.position === null) errors.position = 'required';
  else if (typeof b.position !== 'number') errors.position = 'invalid_type';
  else if (!Number.isInteger(b.position) || b.position < 1 || b.position > LIMITS.maxSubmarinesPerWorkshop) errors.position = 'invalid_value';
  else position = b.position;

  // 名稱:選填,去頭尾空白,≤20 字
  let name: string | null = null;
  if (b.name !== undefined && b.name !== null) {
    if (typeof b.name !== 'string') errors.name = 'invalid_type';
    else {
      const v = b.name.trim();
      if (len(v) > LIMITS.submarineName) errors.name = 'too_long';
      else name = v === '' ? null : v;
    }
  }

  let status: SubmarineStatus | null = null;
  if (b.status === undefined || b.status === null) errors.status = 'required';
  else if (typeof b.status !== 'string') errors.status = 'invalid_type';
  else if (!(SUBMARINE_STATUSES as readonly string[]).includes(b.status)) errors.status = 'invalid_value';
  else status = b.status as SubmarineStatus;

  // 探索中:剩餘時間必填、正整數(D-118:總和必須 > 0)、不超過 UI 上限;探索完成:忽略
  let remaining: number | null = null;
  if (status === 'exploring') {
    const r = b.remaining_minutes;
    if (r === undefined || r === null) errors.remaining_minutes = 'required';
    else if (typeof r !== 'number') errors.remaining_minutes = 'invalid_type';
    else if (!Number.isInteger(r) || r < 1 || r > LIMITS.maxRemainingMinutes) errors.remaining_minutes = 'invalid_value';
    else remaining = r;
  }

  if (Object.keys(errors).length > 0 || status === null) return { ok: false, fields: errors };
  return { ok: true, value: { position, name, status, remaining_minutes: remaining } };
}

export type BatchResult = { ok: true; items: ValidSubmarine[] } | { ok: false; body: SubmarinesBatchValidationErrorBody };

export function validateSubmarinesBatch(input: unknown): BatchResult {
  const fail = (body: Omit<SubmarinesBatchValidationErrorBody, 'error'>): BatchResult => ({ ok: false, body: { error: 'validation_failed', ...body } });
  const list = typeof input === 'object' && input !== null ? (input as Record<string, unknown>).submarines : undefined;
  if (list === undefined || list === null) return fail({ fields: { submarines: 'required' } });
  if (!Array.isArray(list)) return fail({ fields: { submarines: 'invalid_type' } });
  if (list.length === 0) return fail({ fields: { submarines: 'required' } });
  if (list.length > LIMITS.maxSubmarinesPerWorkshop) return fail({ fields: { submarines: 'invalid_value' } });

  const items: ValidSubmarine[] = [];
  const bad: { index: number; fields: SubmarineFieldErrors }[] = [];
  const seen = new Set<number>();
  list.forEach((raw, index) => {
    const r = validateSubmarineInput(raw);
    if (!r.ok) return void bad.push({ index, fields: r.fields });
    if (seen.has(r.value.position)) return void bad.push({ index, fields: { position: 'invalid_value' } });
    seen.add(r.value.position);
    items.push(r.value);
  });
  if (bad.length > 0) return fail({ fields: {}, items: bad });
  return { ok: true, items };
}

/** 後端才是時間權威:返航時間 = 收到請求的時間 + 剩餘時間(D-48) */
export function expectedReturnAt(v: ValidSubmarine, now: Date): string | null {
  return v.status === 'exploring' ? new Date(now.getTime() + v.remaining_minutes! * 60_000).toISOString() : null;
}
