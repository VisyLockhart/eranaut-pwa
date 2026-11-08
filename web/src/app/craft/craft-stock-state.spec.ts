import type { CraftStockDto } from '@eranaut/shared';
import { describe, expect, it } from 'vitest';
import { emptySel } from './craft-state';
import { autoName, canSaveSpec, isBlank, sameSpec, sanitizeStocks, selFromSpec, shortDate, specFrom, stockMeta } from './craft-stock-state';

describe('庫存組的純函式(D-329)', () => {
  it('specFrom:只留已選部位與大於 0 的庫存', () => {
    const sel = emptySel();
    sel.hull = { gradeIndex: 3, qty: 2 };
    expect(specFrom(sel, { b: 4, a: 0, c: 1 })).toEqual({ v: 1, sel: { hull: { grade: 3, qty: 2 } }, stock: { b: 4, c: 1 } });
  });

  it('selFromSpec:往返一致,壞資料丟掉', () => {
    const sel = emptySel();
    sel.bow = { gradeIndex: 9, qty: 99 };
    expect(selFromSpec(specFrom(sel, {}))).toEqual(sel);
    expect(selFromSpec({ v: 1, sel: { hull: { grade: 12, qty: 1 } }, stock: {} })).toEqual(emptySel());
  });

  it('sameSpec 不看順序;isBlank / canSaveSpec', () => {
    const a = { v: 1 as const, sel: { hull: { grade: 1, qty: 1 }, bow: { grade: 2, qty: 3 } }, stock: { x: 1, y: 2 } };
    const b = { v: 1 as const, sel: { bow: { grade: 2, qty: 3 }, hull: { grade: 1, qty: 1 } }, stock: { y: 2, x: 1 } };
    expect(sameSpec(a, b)).toBe(true);
    expect(sameSpec(a, { ...b, stock: { x: 1, y: 3 } })).toBe(false);
    expect(sameSpec(a, { ...b, sel: { hull: { grade: 1, qty: 1 } } })).toBe(false);
    expect(isBlank({ v: 1, sel: {}, stock: {} })).toBe(true);
    expect(isBlank(a)).toBe(false);
    expect(canSaveSpec(a)).toBe(true);
    expect(canSaveSpec({ ...a, stock: {} })).toBe(false);
    expect(canSaveSpec({ ...a, sel: {} })).toBe(false);
  });

  it('名稱與日期', () => {
    expect(autoName(new Date(2026, 10, 8))).toBe('庫存 11/8');
    expect(shortDate('nope')).toBe('');
    const dto: CraftStockDto = { id: 'a', name: 'n', spec: { v: 1, sel: {}, stock: { a: 1, b: 2 } }, favorite: false, created_at: '', updated_at: new Date(2026, 9, 5, 12).toISOString() };
    expect(stockMeta(dto)).toBe('庫存 2 項 · 10/5');
    expect(stockMeta({ ...dto, updated_at: '' })).toBe('庫存 2 項');
  });

  it('sanitizeStocks:形狀不對的列丟掉、最多 10 組、壞 spec 用空規格', () => {
    expect(sanitizeStocks('x')).toEqual([]);
    const row = (i: number) => ({ id: `i${i}`, name: `n${i}`, spec: { sel: { hull: { grade: 1, qty: 1 }, stern: { grade: 99, qty: 1 } }, stock: { a: 1, b: -1, c: 'x' } }, created_at: '', updated_at: '' });
    const list = sanitizeStocks([...Array.from({ length: 12 }, (_, i) => row(i)), null, { id: 1 }]);
    expect(list).toHaveLength(10);
    expect(list[0]!.spec).toEqual({ v: 1, sel: { hull: { grade: 1, qty: 1 } }, stock: { a: 1 } });
    expect(sanitizeStocks([{ id: 'x', name: 'y', spec: 5 }])[0]!.spec).toEqual({ v: 1, sel: {}, stock: {} });
  });
});
