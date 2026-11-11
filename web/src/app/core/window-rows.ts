import { SLOTS_PER_DAY } from '@eranaut/shared';

/** 清單模式的一列:分鐘區間 [start, end),15 的倍數,0 ≤ start < end ≤ 1440 */
export type WindowRow = readonly [start: number, end: number];

const SLOT = 15;

/** 除了第 `except` 列以外,其他列佔用的格子(true = 已被別列選走) */
export function blockedSlots(rows: readonly WindowRow[], except: number): boolean[] {
  const blocked = new Array<boolean>(SLOTS_PER_DAY).fill(false);
  rows.forEach(([a, b], i) => {
    if (i === except) return;
    for (let s = a / SLOT; s < b / SLOT; s++) blocked[s] = true;
  });
  return blocked;
}

/** 從第 `from` 格起,第一個被佔用的格子;沒有就是 96(= 24:00) */
function firstBlockedFrom(blocked: readonly boolean[], from: number): number {
  for (let s = from; s < SLOTS_PER_DAY; s++) if (blocked[s]) return s;
  return SLOTS_PER_DAY;
}

/** 第 i 列「開始時間」的下拉選項:沒被其他列佔用的時間點 */
export function startOptions(rows: readonly WindowRow[], i: number): number[] {
  const blocked = blockedSlots(rows, i);
  const out: number[] = [];
  for (let s = 0; s < SLOTS_PER_DAY; s++) if (!blocked[s]) out.push(s * SLOT);
  return out;
}

/** 第 i 列「結束時間」的下拉選項:開始之後、到下一個被其他列佔用的時段開頭為止 */
export function endOptions(rows: readonly WindowRow[], i: number): number[] {
  const row = rows[i];
  if (!row) return [];
  const limit = firstBlockedFrom(blockedSlots(rows, i), row[0] / SLOT);
  const out: number[] = [];
  for (let s = row[0] / SLOT + 1; s <= limit; s++) out.push(s * SLOT);
  return out;
}

/** 新增一列:第一個沒被選過的時間起一小時(空檔不足就取到空檔結束,最短 15 分鐘);全部被選滿回 null */
export function newRow(rows: readonly WindowRow[]): WindowRow | null {
  const blocked = blockedSlots(rows, -1);
  const first = blocked.indexOf(false);
  if (first < 0) return null;
  const end = Math.min(firstBlockedFrom(blocked, first), first + 4);
  return [first * SLOT, end * SLOT];
}

/** 改第 i 列的開始時間:結束時間若會跨進別列、或不在開始之後,就縮到空檔邊界(盡量保留原長度) */
export function withStart(rows: readonly WindowRow[], i: number, start: number): WindowRow[] {
  const row = rows[i];
  if (!row) return [...rows];
  const limit = firstBlockedFrom(blockedSlots(rows, i), start / SLOT) * SLOT;
  let end = row[1];
  if (end <= start || end > limit) end = Math.min(start + Math.max(row[1] - row[0], SLOT), limit);
  return rows.map((r, k) => (k === i ? ([start, Math.max(end, start + SLOT)] as WindowRow) : r));
}

/** 改第 i 列的結束時間(下拉已限制範圍,這裡再保險:不得早於開始、不得跨進別列) */
export function withEnd(rows: readonly WindowRow[], i: number, end: number): WindowRow[] {
  const row = rows[i];
  if (!row) return [...rows];
  const limit = firstBlockedFrom(blockedSlots(rows, i), row[0] / SLOT) * SLOT;
  const e = Math.min(Math.max(end, row[0] + SLOT), limit);
  return rows.map((r, k) => (k === i ? ([r[0], e] as WindowRow) : r));
}
