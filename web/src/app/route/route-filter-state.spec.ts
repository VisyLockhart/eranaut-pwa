import type { RouteFilterSpec } from '@eranaut/shared';
import { describe, expect, it } from 'vitest';
import { SEAS, SEA_INDEXES } from './core/data';
import { DEFAULT_SPEC, autoName, fitToDataset, isDefaultSpec, sameSpec, sanitizeFilters, sanitizeSpec, specSummary } from './route-filter-state';

const pid = () => SEA_INDEXES[1]!.sea.points[0]!.id;
const spec = (over: Partial<RouteFilterSpec> = {}): RouteFilterSpec => ({ ...DEFAULT_SPEC, ...over });

describe('條件組合的純函式(D-229)', () => {
  it('sanitizeSpec:壞資料用預設值、陣列去重、必選與排除不重疊', () => {
    expect(sanitizeSpec(null)).toEqual(DEFAULT_SPEC);
    expect(sanitizeSpec('x')).toEqual(DEFAULT_SPEC);
    const s = sanitizeSpec({ sea: 3, max_hours: 12, sort: 'opens', match: 'any', required: [1, 1, 2, 'x', 0], excluded: [2, 3], item_ids: [5, 5] });
    expect(s).toEqual({ v: 1, sea: 3, max_hours: 12, sort: 'opens', match: 'any', required: [1, 2], excluded: [3], item_ids: [5] });
    expect(sanitizeSpec({ sort: 'nope', sea: 'x', max_hours: 0, match: 'zzz' })).toEqual(DEFAULT_SPEC);
  });

  it('sanitizeFilters:丟掉形狀不對的列,最多 10 組', () => {
    const row = (i: number) => ({ id: `i${i}`, name: `n${i}`, spec: {}, created_at: '', updated_at: '' });
    expect(sanitizeFilters('x')).toEqual([]);
    expect(sanitizeFilters([null, { id: 1 }, { id: 'a' }, row(1)]).map((r) => r.id)).toEqual(['i1']);
    expect(sanitizeFilters(Array.from({ length: 12 }, (_, i) => row(i)))).toHaveLength(10);
  });

  it('fitToDataset:略過資料集沒有的航點、海域、物品、時間選項,並回報數量', () => {
    const ok = fitToDataset(spec({ sea: SEAS[1]!.sea, max_hours: 24, required: [pid()] }));
    expect(ok.dropped).toBe(0);
    const bad = fitToDataset(spec({ sea: 99, max_hours: 7, required: [pid(), 9999], excluded: [9998], item_ids: [999999] }));
    expect(bad.dropped).toBe(5);
    expect(bad.spec).toMatchObject({ sea: 'all', max_hours: null, required: [pid()], excluded: [], item_ids: [] });
  });

  it('sameSpec:陣列不分順序;單一物品時全部 / 任一個視為相同', () => {
    expect(sameSpec(spec({ required: [1, 2] }), spec({ required: [2, 1] }))).toBe(true);
    expect(sameSpec(spec({ required: [1] }), spec({ excluded: [1] }))).toBe(false);
    expect(sameSpec(spec({ item_ids: [5], match: 'all' }), spec({ item_ids: [5], match: 'any' }))).toBe(true);
    expect(sameSpec(spec({ item_ids: [5, 6], match: 'all' }), spec({ item_ids: [5, 6], match: 'any' }))).toBe(false);
    expect(isDefaultSpec(spec())).toBe(true);
    expect(isDefaultSpec(spec({ sort: 'opens' }))).toBe(false);
  });

  it('autoName / specSummary', () => {
    expect(specSummary(spec())).toBe('');
    expect(autoName(spec())).toBe('條件組合');
    const grey = SEAS[1]!;
    expect(autoName(spec({ sea: grey.sea, max_hours: 6, required: [1, 2, 3] }))).toBe(`${grey.name} · 6 小時內 · 3 點`);
    expect([...autoName(spec({ sea: grey.sea, max_hours: 48, required: [1, 2, 3], excluded: [4, 5], item_ids: [1, 2], sort: 'variety' }))].length).toBeLessThanOrEqual(20);
  });
});
