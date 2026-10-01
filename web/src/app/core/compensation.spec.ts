import { describe, expect, it } from 'vitest';
import { compensated, displayMinutes, submitMinutes, toParts } from './compensation';

// D-124 補正純函式的表格式案例(移植自 demo 的 tests/unit_compensation.js,規格與實作無關)
const S = 1000;
const MIN = 60 * S;

describe('displayMinutes:每滿 1 分鐘減 1(以時間戳計算)', () => {
  it.each([
    [221, 0, 0, 221],
    [221, 0, 59 * S, 221],
    [221, 0, MIN, 220],
    [221, 0, 61 * S, 220],
    [221, 0, 5 * MIN + 59 * S, 216],
    [221, 1000, 500, 221],
  ])('base %i、起點 %i、現在 %i → %i', (base, startedAt, now, want) => {
    expect(displayMinutes(base, startedAt, now)).toBe(want);
  });

  it('只看 now - startedAt,與 tick 次數無關;時鐘倒退不會變多', () => {
    expect(displayMinutes(100, 0, 10 * MIN)).toBe(90);
    expect(displayMinutes(100, 0, -5 * S)).toBe(100);
  });

  it('可自訂分鐘長度(測試加速用)', () => {
    expect(displayMinutes(10, 0, 350, 100)).toBe(7);
  });
});

describe('submitMinutes:零頭進位多扣 1 分鐘', () => {
  it.each([
    [221, 0, 0, 221],
    [221, 0, 1 * S, 220],
    [221, 0, 59 * S, 220],
    [221, 0, MIN, 220],
    [221, 0, 61 * S, 219],
    [10, 0, 9 * MIN + 1, 0],
  ])('base %i、起點 %i、現在 %i → %i', (base, startedAt, now, want) => {
    expect(submitMinutes(base, startedAt, now)).toBe(want);
  });
});

describe('compensated / toParts', () => {
  it('已補正 3 分鐘', () => expect(compensated(0, 3 * MIN + 30 * S)).toBe(3));
  it('分鐘換日/時/分', () => {
    expect(toParts(1 * 1440 + 2 * 60 + 5)).toEqual({ d: 1, h: 2, m: 5 });
    expect(toParts(59)).toEqual({ d: 0, h: 0, m: 59 });
    expect(toParts(99 * 1440 + 23 * 60 + 59)).toEqual({ d: 99, h: 23, m: 59 });
  });
});
