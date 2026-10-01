import { LIMITS, type FieldErrorCode, type SubmarineFieldErrors, type SubmarineInput, type SubmarineStatus, type SubmarineDto } from '@eranaut/shared';
import { displayFor } from './format';
import { charCount } from './workshop-form';

// 更新潛艇表單的資料與純函式(D-117、D-118、D-122、D-124)。與元件、計時器分開,方便單元測試。

export type TimeField = 'd' | 'h' | 'm';

/** 表單上的一列(一個船塢位置) */
export interface SubRow {
  /** 列表追蹤用的穩定識別;與位置無關 */
  key: number;
  /** 1~4,固定位置,送出時以位置識別潛艇(D-43) */
  position: number;
  name: string;
  status: SubmarineStatus;
  /** 日、時、分以字串保存(輸入框內容),全為數字才算填完 */
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
}

export function newRow(key: number, position: number, name: string, status: SubmarineStatus, added: boolean): SubRow {
  return { key, position, name, status, d: '', h: '', m: '', added, base: null, startedAt: 0, paused: false };
}

/** 三欄都是數字才換算成分鐘,否則 null */
export function rowMinutes(row: Pick<SubRow, 'd' | 'h' | 'm'>): number | null {
  if (!/^\d+$/.test(row.d) || !/^\d+$/.test(row.h) || !/^\d+$/.test(row.m)) return null;
  return parseInt(row.d, 10) * 1440 + parseInt(row.h, 10) * 60 + parseInt(row.m, 10);
}

/** D-124:以目前畫面上的數值重新起算(填完且大於 0 才有基準) */
export function rebase(row: SubRow, now: number): SubRow {
  const minutes = row.status === 'exploring' ? rowMinutes(row) : null;
  return { ...row, base: minutes !== null && minutes > 0 ? minutes : null, startedAt: now };
}

/** 欄位驗證(D-118):名稱 ≤20 字;探索中時日/時/分都要填、時 ≤23、分 ≤59、總和 > 0 */
export function rowError(row: SubRow): string | null {
  if (charCount(row.name.trim()) > LIMITS.submarineName) return `潛艇名稱最多 ${LIMITS.submarineName} 字`;
  if (row.status !== 'exploring') return null;
  if (!/^\d+$/.test(row.d) || !/^\d+$/.test(row.h) || !/^\d+$/.test(row.m)) return '日、時、分都要填，沒有的填 0';
  if (parseInt(row.h, 10) > 23 || parseInt(row.m, 10) > 59) return '「時」最多 23、「分」最多 59';
  const minutes = rowMinutes(row)!;
  if (minutes <= 0) return '剩餘時間不能是 0——已經完成請改選「探索完成」';
  if (minutes > LIMITS.maxRemainingMinutes) return '剩餘時間最多 99 天 23 時 59 分';
  return null;
}

/** 填寫時即時顯示的預計返航(以送出當下起算,不是打開表單當下;D-118) */
export function etaText(row: SubRow, now: number): string {
  if (row.status === 'complete') return '這艘會顯示為「可收艇」';
  const minutes = rowMinutes(row);
  if (minutes === null || minutes <= 0) return '填完 日／時／分 後會顯示預計返航時間';
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
  if (fields.remaining_minutes) return fields.remaining_minutes === 'required' ? '日、時、分都要填，沒有的填 0' : '剩餘時間不正確（需大於 0，最多 99 天 23 時 59 分）';
  if (fields.status) return '狀態不正確';
  return '這一艘的資料不正確';
}

export function batchFieldMessage(code: FieldErrorCode): string {
  return code === 'invalid_value' ? '一個工坊最多 4 艘' : '請至少填寫一艘';
}
