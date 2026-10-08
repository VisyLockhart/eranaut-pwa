import { describe, expect, it } from 'vitest';
import { formatReturn, formatReturnParts, formatTravel, offReason } from './route-format';

describe('route-format', () => {
  it('航行時間:日/小時/分;0 日不顯示;無法計算為破折號', () => {
    expect(formatTravel(2065)).toBe('1日10小時25分');
    expect(formatTravel(3139)).toBe('2日4小時19分');
    expect(formatTravel(125)).toBe('2小時5分');
    expect(formatTravel(Infinity)).toBe('—');
  });
  it('返航時刻用台北時間', () => {
    // 2026-10-08 02:00 UTC = 10:00 台北;+90 分 = 11:30
    expect(formatReturn(Date.UTC(2026, 9, 8, 2, 0), 90)).toBe('10/08 11:30');
    expect(formatReturn(0, Infinity)).toBe('—');
  });
  it('返航時刻拆成日期與時間兩行', () => {
    expect(formatReturnParts(Date.UTC(2026, 9, 8, 2, 0), 90)).toEqual({ date: '10/08', time: '11:30' });
    expect(formatReturnParts(0, Infinity)).toBeNull();
  });
  it('反灰原因', () => {
    expect(offReason('rank', 70)).toContain('70');
    expect(offReason('full', 1)).toContain('5');
    expect(offReason('range', 1)).toContain('上限');
    expect(offReason('ok', 1)).toBe('');
  });
});
