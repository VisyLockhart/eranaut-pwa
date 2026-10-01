import type { District, NotifyLeadMinutes, Server, SubmarineStatus } from './constants.js';

// 公開 API 的請求/回應型別(D-140)。JSON 欄位沿用資料表的 snake_case(SCHEMA §8)。

/** 工坊(回應)。`notify_batched` 對外是布林,DB 內存 0/1 */
export interface WorkshopDto {
  id: string;
  name: string;
  server: Server;
  captain: string | null;
  address_district: District | null;
  address_ward: number | null;
  address_detail: string | null;
  notify_batched: boolean;
  notify_lead_minutes: NotifyLeadMinutes;
  created_at: string;
}

/** 新增/整筆取代工坊的請求。選填欄位省略或傳 null = 清空;`notify_*` 省略 = 預設值 */
export interface WorkshopInput {
  name: string;
  server: Server;
  captain?: string | null;
  address_district?: District | null;
  address_ward?: number | null;
  address_detail?: string | null;
  notify_batched?: boolean;
  notify_lead_minutes?: NotifyLeadMinutes;
}

/** 欄位驗證錯誤碼,前端依此在欄位旁顯示訊息(D-103) */
export type FieldErrorCode = 'required' | 'invalid_type' | 'too_long' | 'invalid_value';

export interface ValidationErrorBody {
  error: 'validation_failed';
  fields: Partial<Record<keyof WorkshopInput, FieldErrorCode>>;
}

// ---- 潛艇(D-40~D-49、D-117、D-122) ----

/** 潛艇(回應)。`expected_return_at` 只有探索中才有值,由後端以「收到請求當下 + 剩餘時間」計算(D-48) */
export interface SubmarineDto {
  id: string;
  workshop_id: string;
  /** 1~4,固定位置;前端顯示為圈號 ①②③④ */
  position: number;
  name: string | null;
  status: SubmarineStatus;
  expected_return_at: string | null;
  last_synced_at: string;
}

/**
 * 更新單艘潛艇。前端只送「剩餘時間」,不送算好的返航時間(D-48)。
 * `status = 'exploring'` 時 `remaining_minutes` 必填(正整數);`'complete'` 時忽略。
 * `name` 省略或 null = 清空(以位置識別潛艇,不靠名稱,D-43)。
 */
export interface SubmarineInput {
  position: number;
  name?: string | null;
  status: SubmarineStatus;
  remaining_minutes?: number | null;
}

/** 整個工坊一次更新:只對有列出的位置做 UPSERT,沒列出的位置不動(D-40、D-122) */
export interface SubmarinesBatchInput {
  submarines: SubmarineInput[];
}

export type SubmarineField = keyof SubmarineInput;
export type SubmarineFieldErrors = Partial<Record<SubmarineField, FieldErrorCode>>;

/** 單艘端點的驗證錯誤 */
export interface SubmarineValidationErrorBody {
  error: 'validation_failed';
  fields: SubmarineFieldErrors;
}

/** 批次端點的驗證錯誤:`fields.submarines` 為陣列本身的問題,`items` 為各艘的欄位錯誤(index 對應請求陣列) */
export interface SubmarinesBatchValidationErrorBody {
  error: 'validation_failed';
  fields: { submarines?: FieldErrorCode };
  items?: { index: number; fields: SubmarineFieldErrors }[];
}

export interface WorkshopWithSubmarines extends WorkshopDto {
  /** 依 position 排序 */
  submarines: SubmarineDto[];
}

/** `GET /api/overview`:前端總覽一次取得所有工坊與潛艇(D-146) */
export interface OverviewDto {
  workshops: WorkshopWithSubmarines[];
}
