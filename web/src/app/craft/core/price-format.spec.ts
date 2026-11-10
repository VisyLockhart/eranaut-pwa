import { describe, expect, it } from 'vitest';
import { fmtAgo, fmtClock, fmtGil, isStale } from './price-format';

describe('查價顯示格式(D-343)', () => {
  it('金額千分位', () => {
    expect(fmtGil(118)).toBe('118');
    expect(fmtGil(10620)).toBe('10,620');
    expect(fmtGil(1234567)).toBe('1,234,567');
  });

  it('查詢時間以台北時間 HH:mm 顯示(UTC 06:05 = 14:05)', () => {
    expect(fmtClock(Date.UTC(2026, 10, 10, 6, 5))).toBe('14:05');
    expect(fmtClock(Date.UTC(2026, 10, 10, 16, 0))).toBe('00:00');
  });

  it('更新於 N 分鐘 / 小時 / 天前', () => {
    const now = 1_000_000_000_000;
    expect(fmtAgo(now, now - 5_000)).toBe('不到 1 分鐘前');
    expect(fmtAgo(now, now + 5_000)).toBe('不到 1 分鐘前');
    expect(fmtAgo(now, now - 60_000)).toBe('1 分鐘前');
    expect(fmtAgo(now, now - 59 * 60_000)).toBe('59 分鐘前');
    expect(fmtAgo(now, now - 60 * 60_000)).toBe('1 小時前');
    expect(fmtAgo(now, now - 23 * 3_600_000)).toBe('23 小時前');
    expect(fmtAgo(now, now - 49 * 3_600_000)).toBe('2 天前');
  });

  it('超過 24 小時才算過期', () => {
    const now = 1_000_000_000_000;
    expect(isStale(now, now - 24 * 3_600_000)).toBe(false);
    expect(isStale(now, now - 24 * 3_600_000 - 1)).toBe(true);
  });
});
