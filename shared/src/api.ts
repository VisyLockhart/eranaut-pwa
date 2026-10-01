import type { District, NotifyLeadMinutes, Server } from './constants.js';

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
