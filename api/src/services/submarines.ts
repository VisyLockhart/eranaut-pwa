import { validateBuildInput } from './build.js';
import {
  LIMITS,
  SUBMARINE_STATUSES,
  ASSIST_MAX_HOURS,
  MAX_RECORDED_LEVEL,
  UPKEEP_LIMITS,
  routeExp,
  upkeepRoute,
  type BuildInput,
  type ProgressInput,
  type UpkeepInput,
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
  /** 維修提醒(D-288):物件 = 開啟;null = 關閉;undefined = 不變 */
  upkeep?: UpkeepInput | null;
  /** 等級與練級輔助(D-289):物件 = 設定;null = 清除;undefined = 不變 */
  progress?: ProgressInput | null;
  /** 配件(D-296):物件 = 設定;null = 清除;undefined = 不變 */
  build?: BuildInput | null;
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

  // 維修提醒:省略 = 不變;null = 關閉;物件 = 開啟(路線必須是資料集支援的、趟數在合理範圍;能不能開由 API 依綁定配置再判斷)
  let upkeep: UpkeepInput | null | undefined;
  if (b.upkeep === null) upkeep = null;
  else if (b.upkeep !== undefined) {
    const u = b.upkeep;
    const int = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
    if (typeof u !== 'object' || Array.isArray(u)) errors.upkeep = 'invalid_type';
    else {
      const o = u as Record<string, unknown>;
      if (typeof o.route_key !== 'string' || !upkeepRoute(o.route_key)) errors.upkeep = 'invalid_value';
      else if (o.limit_voyages !== undefined && !int(o.limit_voyages, UPKEEP_LIMITS.minVoyages, UPKEEP_LIMITS.maxVoyages)) errors.upkeep = 'invalid_value';
      else if (o.already_done !== undefined && !int(o.already_done, 0, UPKEEP_LIMITS.maxVoyages)) errors.upkeep = 'invalid_value';
      else {
        upkeep = { route_key: o.route_key };
        if (o.limit_voyages !== undefined) upkeep.limit_voyages = o.limit_voyages as number;
        if (o.already_done !== undefined) upkeep.already_done = o.already_done as number;
      }
    }
  }

  // 等級:省略 = 不變;null = 清除;物件 = 設定(欄位範圍在這裡驗,「沒有等級卻想記路線」等情況在寫入時判斷)
  let progress: ProgressInput | null | undefined;
  if (b.progress === null) progress = null;
  else if (b.progress !== undefined) {
    const r = validateProgressInput(b.progress);
    if (r === 'invalid_type' || r === 'invalid_value') errors.progress = r;
    else progress = r;
  }

  // 配件:省略 = 不變;null = 清除;物件 = 設定(四個部位各 1~10,可附 mark_repaired)
  let build: BuildInput | null | undefined;
  if (b.build === null) build = null;
  else if (b.build !== undefined) {
    const r = validateBuildInput(b.build);
    if (r === 'invalid_type' || r === 'invalid_value') errors.build = r;
    else build = r;
  }

  if (Object.keys(errors).length > 0 || status === null) return { ok: false, fields: errors };
  return {
    ok: true,
    value: {
      position,
      name,
      status,
      remaining_minutes: remaining,
      ...(upkeep !== undefined ? { upkeep } : {}),
      ...(progress !== undefined ? { progress } : {}),
      ...(build !== undefined ? { build } : {}),
    },
  };
}

/** 等級資料的欄位驗證(更新潛艇與 `PUT /api/submarines/:id/progress` 共用) */
export function validateProgressInput(u: unknown): ProgressInput | 'invalid_type' | 'invalid_value' {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) return 'invalid_type';
  const o = u as Record<string, unknown>;
  const int = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  const out: ProgressInput = {};
  if (o.level !== undefined) {
    if (!int(o.level, 1, MAX_RECORDED_LEVEL)) return 'invalid_value';
    out.level = o.level as number;
  }
  if (o.exp_in_level !== undefined) {
    if (!int(o.exp_in_level, 0, 100_000_000)) return 'invalid_value';
    out.exp_in_level = o.exp_in_level as number;
  }
  if (o.source !== undefined) {
    if (o.source !== 'manual' && o.source !== 'ocr') return 'invalid_value';
    out.source = o.source;
  }
  if (o.assist_on !== undefined) {
    if (typeof o.assist_on !== 'boolean') return 'invalid_value';
    out.assist_on = o.assist_on;
  }
  if (o.assist_mode !== undefined) {
    if (o.assist_mode !== 'level' && o.assist_mode !== 'combo') return 'invalid_value';
    out.assist_mode = o.assist_mode;
  }
  if (o.max_hours !== undefined) {
    if (o.max_hours !== null && !(ASSIST_MAX_HOURS as readonly unknown[]).includes(o.max_hours)) return 'invalid_value';
    out.max_hours = o.max_hours as number | null;
  }
  if (o.filter_id !== undefined) {
    if (o.filter_id !== null && (typeof o.filter_id !== 'string' || o.filter_id.length === 0 || o.filter_id.length > 64)) return 'invalid_value';
    out.filter_id = o.filter_id as string | null;
  }
  if (o.route !== undefined) {
    if (o.route === null) out.route = null;
    else {
      const r = o.route as Record<string, unknown>;
      if (typeof r !== 'object' || Array.isArray(r) || !int(r.sea, 1, 2) || !Array.isArray(r.points) || r.points.some((c) => typeof c !== 'string')) return 'invalid_value';
      if (r.points.length > 5 || routeExp(r.sea as number, r.points as string[]) === null) return 'invalid_value';
      out.route = { sea: r.sea as number, points: [...(r.points as string[])] };
    }
  }
  return out;
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
