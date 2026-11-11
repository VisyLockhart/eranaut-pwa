import { NotifyMethod } from './constants.js';
import type { FieldErrorCode } from './api.js';

// 通知允許時段(D-348):白名單。一組 = 名稱 + 適用星期 + 96 格遮罩(每格 15 分鐘,台北時間);同時啟用的組取聯集。
// 純函式,API(算延後的送出時間)與前端(預覽、總覽標籤)共用。台北時間 = UTC+8,沒有日光節約。

export const SLOTS_PER_DAY = 96;
export const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60_000;
const DAY_MS = 86_400_000;
const TAIPEI_OFFSET_MS = 8 * 3_600_000;

/** 適用星期位元:位元 0 = 週一 … 位元 6 = 週日。127 = 每天 */
export const ALL_DAYS = 127;
export const WEEKDAYS = 0b0011111;
export const WEEKEND = 0b1100000;
export const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

/** 找下一個允許時段時最多往後看幾天(涵蓋「只有某一天」的組) */
export const NEXT_ALLOWED_HORIZON_DAYS = 8;

export interface NotifyWindowGroup {
  enabled: boolean;
  /** 適用星期位元,1~127 */
  days: number;
  /** 96 個 '0' / '1':第 i 格 = 台北時間當天 [i×15, i×15+15) 分鐘 */
  slots: string;
}

export interface NotifyWindowDto extends NotifyWindowGroup {
  id: string;
  name: string;
  /** 建立順序 */
  position: number;
}

/** 套用範圍:各通道是否受時段限制 */
export interface NotifyWindowScope {
  dm: boolean;
  channel: boolean;
  push: boolean;
}

/** `GET /api/notify-windows`(SCHEMA §8.12) */
export interface NotifyWindowsDto {
  on: boolean;
  scope: NotifyWindowScope;
  /** 每位使用者組數上限 */
  limit: number;
  groups: NotifyWindowDto[];
  /** 只有展示版(試玩)會帶 true:設定只存在這個瀏覽器、不會真的發通知。正式 API 不回這個欄位 */
  demo?: boolean;
}

/** `POST /api/notify-windows`、`PUT /api/notify-windows/:id` 的請求 */
export interface NotifyWindowInput {
  name: string;
  days: number;
  slots: string;
  enabled?: boolean;
}

/** `PUT /api/notify-window-prefs` 的請求 */
export interface NotifyWindowPrefsInput {
  on: boolean;
  scope: NotifyWindowScope;
}

export interface NotifyWindowValidationErrorBody {
  error: 'validation_failed';
  fields: { name?: FieldErrorCode; days?: FieldErrorCode; slots?: FieldErrorCode | 'empty_slots'; enabled?: FieldErrorCode; on?: FieldErrorCode; scope?: FieldErrorCode };
}

export const DEFAULT_NOTIFY_WINDOW_SCOPE: NotifyWindowScope = { dm: true, channel: true, push: true };

/** 套用範圍 ↔ 位元(同 `users.notify_methods`:1 私訊、2 頻道、4 推播) */
export function scopeToBits(scope: NotifyWindowScope): number {
  return (scope.dm ? NotifyMethod.Dm : 0) | (scope.channel ? NotifyMethod.Channel : 0) | (scope.push ? NotifyMethod.Push : 0);
}
export function bitsToScope(bits: number): NotifyWindowScope {
  return { dm: (bits & NotifyMethod.Dm) !== 0, channel: (bits & NotifyMethod.Channel) !== 0, push: (bits & NotifyMethod.Push) !== 0 };
}

// ---- 遮罩 ----

export function emptySlots(): string {
  return '0'.repeat(SLOTS_PER_DAY);
}
export function fullSlots(): string {
  return '1'.repeat(SLOTS_PER_DAY);
}
export function isValidSlots(s: unknown): s is string {
  return typeof s === 'string' && /^[01]{96}$/.test(s);
}
export function countSlots(slots: string): number {
  let n = 0;
  for (let i = 0; i < slots.length; i++) if (slots[i] === '1') n++;
  return n;
}

/** 分鐘區間 [start, end)(0~1440,15 的倍數)→ 遮罩;超出範圍夾回、非 15 的倍數往內收 */
export function slotsFromRanges(ranges: readonly (readonly [number, number])[]): string {
  const cells = new Array<boolean>(SLOTS_PER_DAY).fill(false);
  for (const [a, b] of ranges) {
    const from = Math.max(0, Math.ceil(a / SLOT_MINUTES));
    const to = Math.min(SLOTS_PER_DAY, Math.floor(b / SLOT_MINUTES));
    for (let i = from; i < to; i++) cells[i] = true;
  }
  return cells.map((c) => (c ? '1' : '0')).join('');
}

/** 遮罩 → 相連格子合併後的分鐘區間 [start, end)(end 最大 1440) */
export function rangesFromSlots(slots: string): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= SLOTS_PER_DAY; i++) {
    const on = i < SLOTS_PER_DAY && slots[i] === '1';
    if (on && start < 0) start = i;
    if (!on && start >= 0) {
      out.push([start * SLOT_MINUTES, i * SLOT_MINUTES]);
      start = -1;
    }
  }
  return out;
}

/** 把第 a 到第 b 格(含兩端,順序不拘)全部設成 value */
export function fillSlots(slots: string, a: number, b: number, value: boolean): string {
  const lo = Math.max(0, Math.min(a, b));
  const hi = Math.min(SLOTS_PER_DAY - 1, Math.max(a, b));
  const ch = value ? '1' : '0';
  return slots.slice(0, lo) + ch.repeat(hi - lo + 1) + slots.slice(hi + 1);
}
export function toggleSlot(slots: string, i: number): string {
  if (i < 0 || i >= SLOTS_PER_DAY) return slots;
  return slots.slice(0, i) + (slots[i] === '1' ? '0' : '1') + slots.slice(i + 1);
}
export function invertSlots(slots: string): string {
  return slots.replace(/[01]/g, (c) => (c === '1' ? '0' : '1'));
}

/** 第一次開啟總開關時自動建立的「白天」:每天 08:00–22:00 */
export const DEFAULT_WINDOW_NAME = '白天';
export function defaultWindowSlots(): string {
  return slotsFromRanges([[8 * 60, 22 * 60]]);
}

// ---- 時間 ----

/** 某個時刻在台北時間是「星期幾(0 = 週一)」與「第幾格」 */
export function taipeiSlotOf(ms: number): { day: number; slot: number } {
  const local = ms + TAIPEI_OFFSET_MS;
  const dayNum = Math.floor(local / DAY_MS);
  // 1970-01-01 是週四(週一 = 0 → 3)
  const day = (((dayNum + 3) % 7) + 7) % 7;
  const slot = Math.floor((local - dayNum * DAY_MS) / SLOT_MS);
  return { day, slot };
}

function groupAllows(g: NotifyWindowGroup, day: number, slot: number): boolean {
  return g.enabled && ((g.days >> day) & 1) === 1 && g.slots[slot] === '1';
}

/** 這個時刻是否落在任一啟用中的組的允許範圍(格子為半開區間:第 i 格 = [i×15, i×15+15) 分) */
export function isAllowed(groups: readonly NotifyWindowGroup[], ms: number): boolean {
  const { day, slot } = taipeiSlotOf(ms);
  return groups.some((g) => groupAllows(g, day, slot));
}

/**
 * 從 `ms` 起第一個允許的時刻:已經允許就回傳 `ms` 本身(秒數不動),否則是下一個允許格的起點。
 * 往後最多找 8 天;沒有啟用中的組或找不到回 null。
 */
export function nextAllowed(groups: readonly NotifyWindowGroup[], ms: number, horizonDays: number = NEXT_ALLOWED_HORIZON_DAYS): number | null {
  if (!groups.some((g) => g.enabled)) return null;
  if (isAllowed(groups, ms)) return ms;
  const first = (Math.floor(ms / SLOT_MS) + 1) * SLOT_MS;
  const steps = horizonDays * SLOTS_PER_DAY;
  for (let i = 0; i < steps; i++) {
    const t = first + i * SLOT_MS;
    if (isAllowed(groups, t)) return t;
  }
  return null;
}

/** 某個「星期幾」目前生效的遮罩(啟用中且適用該日的組取聯集) */
export function slotsForDay(groups: readonly NotifyWindowGroup[], day: number): string {
  const cells = new Array<boolean>(SLOTS_PER_DAY).fill(false);
  for (const g of groups) {
    if (!g.enabled || ((g.days >> day) & 1) !== 1) continue;
    for (let i = 0; i < SLOTS_PER_DAY; i++) if (g.slots[i] === '1') cells[i] = true;
  }
  return cells.map((c) => (c ? '1' : '0')).join('');
}

/** 今天(台北時間)生效的區間 */
export function todayRanges(groups: readonly NotifyWindowGroup[], nowMs: number): [number, number][] {
  return rangesFromSlots(slotsForDay(groups, taipeiSlotOf(nowMs).day));
}

// ---- 顯示 ----

export function formatMinute(m: number): string {
  if (m >= 1440) return '24:00';
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
export function formatRanges(ranges: readonly (readonly [number, number])[], sep = '、'): string {
  return ranges.map(([a, b]) => `${formatMinute(a)}–${formatMinute(b)}`).join(sep);
}

/** 適用星期的簡短說明:每天 / 平日 / 假日 / 週一、週三 */
export function formatDays(mask: number): string {
  if (mask === ALL_DAYS) return '每天';
  if (mask === WEEKDAYS) return '平日';
  if (mask === WEEKEND) return '假日';
  const names: string[] = [];
  for (let i = 0; i < 7; i++) if ((mask >> i) & 1) names.push(`週${DAY_LABELS[i]}`);
  return names.join('、');
}

/** 「今天 12:00」「明天 12:00」「週六 09:00」(台北時間,相對於 nowMs) */
export function formatWhen(ms: number, nowMs: number): string {
  const a = Math.floor((ms + TAIPEI_OFFSET_MS) / DAY_MS);
  const b = Math.floor((nowMs + TAIPEI_OFFSET_MS) / DAY_MS);
  const { day, slot } = taipeiSlotOf(ms);
  const minute = Math.floor(((((ms + TAIPEI_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS) / 60_000);
  void slot;
  const hm = formatMinute(minute);
  const diff = a - b;
  const label = diff === 0 ? '今天' : diff === 1 ? '明天' : diff === 2 ? '後天' : `週${DAY_LABELS[day]}`;
  return `${label} ${hm}`;
}

/** 設定頁預覽:現在起還要等多久,例「約 1 小時 50 分後」 */
export function formatWait(ms: number, nowMs: number): string {
  const total = Math.max(0, Math.ceil((ms - nowMs) / 60_000));
  if (total < 1) return '現在';
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} 天`);
  if (h > 0) parts.push(`${h} 小時`);
  if (m > 0 && d === 0) parts.push(`${m} 分`);
  return `約 ${parts.join(' ')}後`;
}
