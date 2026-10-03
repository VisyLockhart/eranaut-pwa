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

/**
 * 更新潛艇的回應(整坊與單艘共用)。
 * - 整坊更新:`submarines` 為該工坊目前全部潛艇
 * - 單艘更新:`submarines` 只有被更新的那一艘
 * `reminder_skipped_positions`:本次請求中,因「預先提醒時間已過」而不會收到提醒的潛艇位置,前端據此提示(D-135 ②b)。
 * 整批提醒模式下整間工坊只有一則提醒,被略過時列出本次請求中所有探索中的位置。
 */
export interface SubmarinesUpdateResult {
  submarines: SubmarineDto[];
  reminder_skipped_positions: number[];
}

// ---- 截圖辨識(D-49、D-61、D-62、D-119、D-125、D-126;SCHEMA §8.1) ----
// OCR API 只辨識、不寫資料庫、不存圖片;辨識結果交給前端確認後,再走更新潛艇端點(D-49)。

/** 截圖格式:`menu` = 「請選擇潛水艇」選單視窗(有等級、「剩餘時間」字樣);`info` = 「飛空艇探索／潛水艇探索」情報頁(D-61) */
export type OcrFormat = 'menu' | 'info';

/** 讓欄位被標為「請核對」的原因(D-119) */
export type OcrSuspectReason =
  /** 該行文字辨識信心低於門檻 */
  | 'low_confidence'
  /** 找不到可用的時間(沒有 天/小時/分 任一單位) */
  | 'time_unreadable'
  /** 數字超出範圍(小時 > 23、分 > 59、天 > 99)或總和為 0 */
  | 'time_out_of_range'
  /** 時間字串裡有沒對到單位的數字,或單位重複 */
  | 'time_malformed'
  /** 讀不到名稱 */
  | 'name_unreadable'
  /** 讀到的列數和畫面對不上(少讀了某一列),每一艘的位置都不可信 */
  | 'order_uncertain';

/** 整份截圖層級的提醒,不屬於某一艘 */
export type OcrWarning =
  /** 選單視窗標題的「探索機體數 N/…」與讀到的列數不同 */
  | 'row_count_mismatch'
  /** 讀到超過 4 列,只取前 4 列(D-62) */
  | 'too_many_rows';

export interface OcrSubmarineDto {
  /** 1~4,依畫面由上到下的順序(D-62),不看名稱裡的數字 */
  position: number;
  /** 辨識到的名稱;預設名稱的前綴字形誤認會校正成「潛水艇-N」。讀不到為 null(前端沿用既有名稱) */
  name: string | null;
  status: SubmarineStatus;
  /** `exploring` 才有值;沒出現的單位為 0。`complete` 或讀不出時間時三者皆 null */
  days: number | null;
  hours: number | null;
  minutes: number | null;
  /** 天/時/分換算成的分鐘,與 `SubmarineInput.remaining_minutes` 同單位;讀不出為 null */
  remaining_minutes: number | null;
  /** 需要使用者核對的欄位(D-119):前端標琥珀色「請核對」,使用者修改該欄後消失 */
  suspect: { name: boolean; time: boolean };
  reasons: OcrSuspectReason[];
}

/** `POST /api/ocr` 的回應。不含返航時間:前端以收到結果的時間起算補正(D-124),返航時間由更新端點的後端計算(D-48) */
export interface OcrResultDto {
  format: OcrFormat;
  submarines: OcrSubmarineDto[];
  warnings: OcrWarning[];
}

export type OcrErrorCode =
  | 'no_file'
  | 'file_too_large'
  | 'unsupported_image'
  /** 讀得到字,但找不到潛艇列(不是這兩種截圖,或畫面被擋住),前端請使用者改用手動輸入或重拍 */
  | 'unrecognized'
  /** 同時處理的人太多(或你已有一張在處理),稍後重試 */
  | 'busy'
  | 'ocr_unavailable';

// ---- 提醒方式設定(D-72、D-133、D-145 ⑦、D-165) ----
// 回應用 `NotifyPrefs`(`{ dm, channel, push }`),請求用 `NotifyPrefsUpdate`(`{ dm, channel }`),不暴露位元數字。
export interface NotifyPrefsValidationErrorBody {
  error: 'validation_failed';
  fields: { dm?: FieldErrorCode; channel?: FieldErrorCode };
}

// ---- 瀏覽器推播(D-165) ----
/** `GET /api/push/config`:`publicKey` 為 null = 伺服器沒有設定推播(`.env` 沒有 VAPID 金鑰) */
export interface PushConfigDto {
  publicKey: string | null;
}
/** `PUT /api/push/subscription` 的請求:就是瀏覽器 `PushSubscription.toJSON()` 的內容 */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}
/** `GET /api/push/subscriptions`:這位使用者已登記的裝置端點(用來判斷「這台裝置」是否已開啟) */
export interface PushSubscriptionsDto {
  endpoints: string[];
}
/** `POST /api/push/test` 的結果 */
export interface PushTestResult {
  /** 成功送出的裝置數 */
  sent: number;
}
export interface PushValidationErrorBody {
  error: 'validation_failed';
  fields: { endpoint?: FieldErrorCode; keys?: FieldErrorCode };
}

// ---- 登入與公開設定(D-123、D-134、D-142) ----

/** `GET /api/me`:名稱與頭像每次載入都由 API 取得(D-134、D-145 ⑥) */
export interface MeDto {
  displayName: string;
  avatarUrl: string | null;
}

/** `GET /api/public-config`:登入前就要用的公開設定 */
export interface PublicConfigDto {
  guildName: string;
}

/** 登入失敗分類碼,由回呼端點以 `/?login_error=` 帶回(D-142 ③) */
export type LoginErrorCode = 'denied' | 'failed' | 'not_in_guild' | 'no_role';
