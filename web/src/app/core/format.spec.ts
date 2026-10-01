import { describe, expect, it } from 'vitest';
import { circled, displayFor, formatRemaining, isReady, taipeiParts } from './format';

describe('format', () => {
  it('taipeiParts 轉成 GMT+8', () => {
    expect(taipeiParts(Date.parse('2026-09-28T10:56:00Z'))).toEqual({ y: 2026, mo: 9, d: 28, h: 18, mi: 56 });
  });

  it('circled 超出範圍退回 #n', () => {
    expect(circled(1)).toBe('①');
    expect(circled(4)).toBe('④');
    expect(circled(12)).toBe('#12');
  });

  it('formatRemaining', () => {
    expect(formatRemaining(5)).toBe('5 分');
    expect(formatRemaining(134)).toBe('2 時 14 分');
    expect(formatRemaining(1440 + 61)).toBe('1 日 1 時 01 分');
  });

  it('isReady:完成、或時間已到', () => {
    const now = Date.parse('2026-09-28T10:00:00Z');
    expect(isReady({ status: 'complete', expected_return_at: null }, now)).toBe(true);
    expect(isReady({ status: 'exploring', expected_return_at: '2026-09-28T09:59:00Z' }, now)).toBe(true);
    expect(isReady({ status: 'exploring', expected_return_at: '2026-09-28T10:01:00Z' }, now)).toBe(false);
    expect(isReady({ status: 'exploring', expected_return_at: null }, now)).toBe(false);
  });

  it('displayFor:已完成', () => {
    expect(displayFor(true, null, 0).time).toBe('可收艇');
  });

  it('displayFor:不滿一分鐘顯示 1 分(進位)', () => {
    const now = Date.parse('2026-09-28T10:00:00Z');
    expect(displayFor(false, now + 10_000, now).time).toBe('1 分');
  });

  it('displayFor:當天/隔天/更遠的短版 ETA', () => {
    const now = Date.parse('2026-09-28T02:00:00Z'); // 台北 10:00
    expect(displayFor(false, Date.parse('2026-09-28T05:30:00Z'), now).shortEta).toBe('13:30');
    expect(displayFor(false, Date.parse('2026-09-29T05:30:00Z'), now).shortEta).toBe('明13:30');
    expect(displayFor(false, Date.parse('2026-10-02T05:30:00Z'), now).shortEta).toBe('10/02');
    expect(displayFor(false, Date.parse('2026-09-28T05:30:00Z'), now).eta).toBe('09/28 13:30');
  });
});
