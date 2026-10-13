import { describe, expect, it } from 'vitest';
import { calculate } from './craft-calc';
import { buildCost } from './craft-cost';
import { SLOT_KEYS } from './data';

describe('buildCost', () => {
  it('與製作頁展開骨架後的基礎素材總量一致', () => {
    const parts = [6, 2, 9, 1];
    const sel = SLOT_KEYS.map((slot, i) => ({ slot, gradeIndex: parts[i]! - 1, qty: 1 }));
    const r = calculate(sel, { expandFrame: true });
    const c = buildCost(parts);
    expect(c.total).toBe(r.bases.reduce((n, x) => n + x.need, 0));
    expect(c.kinds).toBe(r.bases.length);
    expect(c.mods).toBe(2);
  });

  it('改版比同級原版貴(骨架被展開)', () => {
    expect(buildCost([6, 1, 1, 1]).total).toBeGreaterThan(buildCost([1, 1, 1, 1]).total);
    expect(buildCost([1, 1, 1, 1]).mods).toBe(0);
  });

  it('同一組結果會重用(快取)', () => {
    expect(buildCost([3, 3, 3, 3])).toBe(buildCost([3, 3, 3, 3]));
  });

  it('10⁴ 組全部算完要夠快(找配置材料最省排序的上限)', () => {
    const t0 = performance.now();
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) for (let c = 1; c <= 10; c++) for (let d = 1; d <= 10; d++) buildCost([a, b, c, d]);
    const ms = performance.now() - t0;
    console.log('buildCost 10k ms =', Math.round(ms));
    expect(ms).toBeLessThan(15000);
  });
});
