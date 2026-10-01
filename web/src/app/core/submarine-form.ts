import {
  LIMITS,
  type FieldErrorCode,
  type OcrSubmarineDto,
  type OcrSuspectReason,
  type SubmarineDto,
  type SubmarineFieldErrors,
  type SubmarineInput,
  type SubmarineStatus,
} from '@eranaut/shared';
import { displayFor } from './format';
import { charCount } from './workshop-form';

// 更新潛艇表單的資料與純函式(D-117、D-118、D-122、D-124)。與元件、計時器分開,方便單元測試。

export type TimeField = 'd' | 'h' | 'm';

/** 截圖辨識標出的「請核對」欄位(D-119);使用者修改該欄後那一欄的標示消失 */
export interface RowFlag {
  name: boolean;
  time: boolean;
  reasons: OcrSuspectReason[];
}

/** 表單上的一列(一個船塢位置) */
export interface SubRow {
  /** 列表追蹤用的穩定識別;與位置無關 */
  key: number;
  /** 1~4,固定位置,送出時以位置識別潛艇(D-43) */
  position: number;
  name: string;
  status: SubmarineStatus;
  /** 日、時、分以字串保存(輸入框內容);空白視為 0(D-156) */
  d: string;
  h: string;
  m: string;
  /** 是整坊表單裡新加入的位置(可移除);既有位置不可移除(R-32) */
  added: boolean;
  /** D-124:起算當下的剩餘分鐘;還沒填完時為 null(不補正) */
  base: number | null;
  /** D-124:這一列的起算時間戳 */
  startedAt: number;
  /** D-124:正在編輯這一列,暫停補正 */
  paused: boolean;
  /** 截圖辨識的「請核對」標示(D-119);手動輸入的列沒有 */
  flag?: RowFlag;
}

export function newRow(key: number, position: number, name: string, status: SubmarineStatus, added: boolean): SubRow {
  return { key, position, name, status, d: '', h: '', m: '', added, base: null, startedAt: 0, paused: false };
}

/** 一欄的數值:空白視為 0(D-156);含非數字回 null */
function part(text: string): number | null {
  if (text === '') return 0;
  return /^\d+$/.test(text) ? parseInt(text, 10) : null;
}

/** 日/時/分都空白(還沒填任何東西) */
export function isTimeBlank(row: Pick<SubRow, 'd' | 'h' | 'm'>): boolean {
  return row.d === '' && row.h === '' && row.m === '';
}

/** 換算成分鐘;空白欄位當 0,含非數字回 null */
export function rowMinutes(row: Pick<SubRow, 'd' | 'h' | 'm'>): number | null {
  const d = part(row.d);
  const h = part(row.h);
  const m = part(row.m);
  return d === null || h === null || m === null ? null : d * 1440 + h * 60 + m;
}

/** D-156:至少填了一欄時,把空白欄位明確補成 0(畫面所見即所送);全空白則不動 */
export function fillBlanks(row: SubRow): SubRow {
  if (row.status !== 'exploring' || isTimeBlank(row) || (row.d !== '' && row.h !== '' && row.m !== '')) return row;
  return { ...row, d: row.d === '' ? '0' : row.d, h: row.h === '' ? '0' : row.h, m: row.m === '' ? '0' : row.m };
}

/** D-124:以目前畫面上的數值重新起算(空白當 0,合計大於 0 才有基準) */
export function rebase(row: SubRow, now: number): SubRow {
  const minutes = row.status === 'exploring' ? rowMinutes(row) : null;
  return { ...row, base: minutes !== null && minutes > 0 ? minutes : null, startedAt: now };
}

/** 欄位驗證(D-118、D-156):名稱 ≤20 字;探索中時空白欄位當 0,時 ≤23、分 ≤59、總和 > 0 */
export function rowError(row: SubRow): string | null {
  if (charCount(row.name.trim()) > LIMITS.submarineName) return `潛艇名稱最多 ${LIMITS.submarineName} 字`;
  if (row.status !== 'exploring') return null;
  if (isTimeBlank(row)) return '請填寫剩餘時間（沒填的欄位會當作 0）';
  const minutes = rowMinutes(row);
  if (minutes === null) return '日、時、分只能填數字';
  if ((part(row.h) ?? 0) > 23 || (part(row.m) ?? 0) > 59) return '「時」最多 23、「分」最多 59';
  if (minutes <= 0) return '剩餘時間不能是 0——已經完成請改選「探索完成」';
  if (minutes > LIMITS.maxRemainingMinutes) return '剩餘時間最多 99 天 23 時 59 分';
  return null;
}

/** 填寫時即時顯示的預計返航(以送出當下起算,不是打開表單當下;D-118) */
export function etaText(row: SubRow, now: number): string {
  if (row.status === 'complete') return '這艘會顯示為「可收艇」';
  const minutes = rowMinutes(row);
  if (minutes === null || minutes <= 0) return '填入 日／時／分 後會顯示預計返航時間（沒填的當作 0）';
  return `預計返航 ${displayFor(false, now + minutes * 60_000, now).eta}（以送出當下起算）`;
}

/** 轉成 API 請求的一艘。名稱空白 = 清空(D-146);探索完成不送剩餘時間 */
export function toSubmarineInput(row: SubRow, remainingMinutes: number | null): SubmarineInput {
  const name = row.name.trim();
  return row.status === 'complete'
    ? { position: row.position, name: name === '' ? null : name, status: 'complete' }
    : { position: row.position, name: name === '' ? null : name, status: 'exploring', remaining_minutes: remainingMinutes };
}

/** 從既有潛艇建立一列:名稱與狀態沿用,時間讓使用者重填(對照遊戲畫面,與 demo 一致) */
export function rowFromSubmarine(key: number, sub: SubmarineDto): SubRow {
  return newRow(key, sub.position, sub.name ?? '', sub.status, false);
}

/** 下一個沒用到的位置(1~4);都用完回 null */
export function nextFreePosition(rows: readonly Pick<SubRow, 'position'>[]): number | null {
  const used = new Set(rows.map((r) => r.position));
  for (let p = 1; p <= LIMITS.maxSubmarinesPerWorkshop; p++) if (!used.has(p)) return p;
  return null;
}

/** 預設名稱(demo 沿用):潛水艇-N */
export function defaultName(position: number): string {
  return `潛水艇-${position}`;
}

/** API 單一欄位錯誤碼 → 這一列上顯示的文字 */
export function serverRowMessage(fields: SubmarineFieldErrors): string {
  if (fields.name) return `潛艇名稱最多 ${LIMITS.submarineName} 字`;
  if (fields.remaining_minutes) return fields.remaining_minutes === 'required' ? '請填寫剩餘時間' : '剩餘時間不正確（需大於 0，最多 99 天 23 時 59 分）';
  if (fields.status) return '狀態不正確';
  return '這一艘的資料不正確';
}

export function batchFieldMessage(code: FieldErrorCode): string {
  return code === 'invalid_value' ? '一個工坊最多 4 艘' : '請至少填寫一艘';
}

// ---- 截圖辨識結果帶入表單(D-119、D-124、D-154) ----

/**
 * 辨識到的一艘 → 表單的一列。名稱讀不到(null)就沿用既有名稱,都沒有則用預設名稱(D-154);
 * 時間以辨識結果回來的時間起算 D-124 補正。探索完成沒有時間欄,也就沒有時間的核對標示。
 */
export function rowFromOcr(key: number, dto: OcrSubmarineDto, existing: Pick<SubmarineDto, 'name'> | undefined, now: number): SubRow {
  const exploring = dto.status === 'exploring';
  const flag: RowFlag = { name: dto.suspect.name, time: exploring && dto.suspect.time, reasons: dto.reasons };
  const row: SubRow = {
    ...newRow(key, dto.position, dto.name ?? existing?.name ?? defaultName(dto.position), dto.status, existing === undefined),
    ...(exploring && dto.remaining_minutes !== null
      ? { d: String(dto.days ?? 0), h: String(dto.hours ?? 0), m: String(dto.minutes ?? 0) }
      : {}),
    ...(flag.name || flag.time ? { flag } : {}),
  };
  return rebase(row, now);
}

/** 使用者修改了某一欄:清掉那一欄的核對標示;兩欄都清掉就整個移除 */
export function clearFlag(row: SubRow, field: 'name' | 'time'): SubRow {
  if (!row.flag || !row.flag[field]) return row;
  const flag = { ...row.flag, [field]: false };
  const { flag: _old, ...rest } = row;
  return flag.name || flag.time ? { ...rest, flag } : rest;
}

const REASON_TEXT: Record<OcrSuspectReason, string> = {
  low_confidence: '辨識信心偏低',
  time_unreadable: '沒讀到時間',
  time_out_of_range: '數字超出範圍',
  time_malformed: '時間格式怪怪的',
  name_unreadable: '名稱沒讀到',
  order_uncertain: '列數可能對不上、位置可能錯位',
};

/** 這一列還在核對中時顯示的說明;沒有標示回 null */
export function flagText(row: Pick<SubRow, 'flag'>): string | null {
  const flag = row.flag;
  if (!flag || (!flag.name && !flag.time)) return null;
  const reasons = [...new Set(flag.reasons.map((r) => REASON_TEXT[r]))];
  return `請核對：${reasons.length > 0 ? reasons.join('、') : '辨識結果可能不準'}（修改後標示會消失）`;
}
