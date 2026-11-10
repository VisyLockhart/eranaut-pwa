import { taipeiParts } from '../../core/format';

// 查價視窗的顯示格式(D-343)。時間一律台北時間(D-46)。
const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;

/** 金額 / 數量:千分位(例 10,620) */
export const fmtGil = (n: number): string => n.toLocaleString('en-US');

/** 查詢時間 HH:mm(台北時間) */
export function fmtClock(ms: number): string {
  const p = taipeiParts(ms);
  return `${pad2(p.h)}:${pad2(p.mi)}`;
}

/** 來源資料超過這個時間沒更新,頁尾的「更新於…」改為警示色(D-343) */
export const STALE_MS = 24 * 3_600_000;
export const isStale = (now: number, then: number): boolean => now - then > STALE_MS;

/** 「N 分鐘前 / N 小時前 / N 天前」;不到 1 分鐘顯示「不到 1 分鐘前」(時鐘些微誤差造成的負值當作 0) */
export function fmtAgo(now: number, then: number): string {
  const min = Math.floor(Math.max(0, now - then) / 60_000);
  if (min < 1) return '不到 1 分鐘前';
  if (min < 60) return `${min} 分鐘前`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} 小時前` : `${Math.floor(h / 24)} 天前`;
}
