import { describe, expect, it } from 'vitest';
import { SEAS, seaIndex } from './core/data';
import { codes, ids } from './core/test-helpers';
import { DEFAULT_LEVEL, defaultLast, normalizeSeq, sameBuild, sanitizeLast, sanitizeParts, sanitizeSubs, subToBuild } from './route-state';

const grey = () => seaIndex(2);
const sub = (over: Record<string, unknown> = {}) => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [], created_at: 't', updated_at: 't', ...over,
});

describe('sanitizeLast', () => {
  it('讀不到或不是物件 → 預設值', () => {
    for (const raw of [null, undefined, 5, 'x', [], true]) expect(sanitizeLast(raw)).toEqual(defaultLast());
    expect(defaultLast()).toMatchObject({ seq: [], level: DEFAULT_LEVEL, parts: [1, 1, 1, 1], subId: null });
  });

  it('合法的值原樣保留', () => {
    const g = grey();
    const last = { sea: 2, seq: ids(g, 'DG'), level: 76, parts: [3, 1, 2, 3], subId: 'abc', tab: 'route' };
    expect(sanitizeLast(last)).toEqual(last);
    expect(sanitizeLast({ ...last, tab: 'search' }).tab).toBe('route'); // 舊版的「搜尋」併入「航線」
    expect(sanitizeLast({ ...last, tab: 'loot' }).tab).toBe('route'); // 舊版的「反查」併入「航線」(D-218)
    expect(sanitizeLast({ ...last, tab: 'recommend' }).tab).toBe('route'); // D-224:推薦 / 航點都併入「航線」
    expect(sanitizeLast({ ...last, tab: 'map' }).tab).toBe('route');
    expect(sanitizeLast({ ...last, tab: 'result' }).tab).toBeNull(); // 已移除的結果頁
    expect(sanitizeLast({ ...last, tab: 'edit' }).tab).toBeNull(); // 舊版的分頁名稱或亂值 → 沒記錄
  });

  it('海域不存在 → 整份預設;其他欄位不合法 → 該欄位用預設值', () => {
    expect(sanitizeLast({ sea: 99, level: 50 })).toEqual(defaultLast());
    const r = sanitizeLast({ sea: 2, seq: 'x', level: 999, parts: [1, 2, 3], subId: 5 });
    expect(r).toEqual({ ...defaultLast(), sea: 2 });
    expect(sanitizeLast({ sea: 2, level: 0 }).level).toBe(DEFAULT_LEVEL);
    expect(sanitizeLast({ sea: 2, level: 50.5 }).level).toBe(DEFAULT_LEVEL);
    expect(sanitizeLast({ sea: 2, parts: [1, 2, 3, 11] }).parts).toEqual([1, 1, 1, 1]);
  });

  it('航點序列:去掉不在這張海域的 id、重複的 id,最多 5 個', () => {
    const g = grey();
    const other = SEAS[3]!.points[0]!.id;
    const all = g.sea.points.map((p) => p.id);
    const r = sanitizeLast({ sea: 2, seq: [other, all[0], all[0], 'x', all[1], all[2], all[3], all[4], all[5]] });
    expect(r.seq).toEqual(all.slice(0, 5));
  });

  it('subId 空字串 → null', () => {
    expect(sanitizeLast({ sea: 2, subId: '' }).subId).toBeNull();
  });
});

describe('sanitizeParts', () => {
  it('必須是 4 個 1~10 的整數', () => {
    expect(sanitizeParts([1, 5, 6, 10])).toEqual([1, 5, 6, 10]);
    for (const bad of [null, [1, 2, 3], [1, 2, 3, 4, 5], [0, 1, 1, 1], [1, 1, 1, 11], [1.5, 1, 1, 1], ['1', 1, 1, 1]]) expect(sanitizeParts(bad)).toBeNull();
  });
});

describe('sanitizeSubs', () => {
  it('合法項目保留;格式不合法的項目被丟掉', () => {
    const list = sanitizeSubs([sub(), sub({ id: 5 }), sub({ level: 131 }), sub({ hull: 0 }), null, 'x', sub({ id: 'b', bound_submarine_ids: ['sub-1', 5] })]);
    expect(list.map((s) => s.id)).toEqual(['a', 'b']);
    expect(list[1]!.bound_submarine_ids).toEqual(['sub-1']);
  });

  it('不是陣列 → 空;最多保留 30 組', () => {
    expect(sanitizeSubs({})).toEqual([]);
    expect(sanitizeSubs(null)).toEqual([]);
    expect(sanitizeSubs(Array.from({ length: 35 }, (_, i) => sub({ id: `s${i}` })))).toHaveLength(30);
  });

  it('缺時間欄位不影響;多餘欄位被忽略', () => {
    const [s] = sanitizeSubs([{ ...sub(), created_at: undefined, extra: 1 }]);
    expect(s).toBeDefined();
    expect(s).not.toHaveProperty('extra');
    expect(s!.created_at).toBe('');
  });
});

describe('normalizeSeq', () => {
  const g = grey();
  const range = 98; // 案例 C:3123、76 級

  it('可行的序列原樣保留', () => {
    expect(normalizeSeq(g, ids(g, 'DGFK'), 76, range)).toEqual(ids(g, 'DGFK'));
  });

  it('耗用超過上限:丟掉造成超過的點與其後的點', () => {
    const out = normalizeSeq(g, ids(g, 'DGFK'), 76, 80);
    expect(out.length).toBeLessThan(4);
    expect(out).toEqual(ids(g, 'DGFK').slice(0, out.length));
  });

  it('等級不足的點被丟掉', () => {
    const rank = (c: string) => g.byId.get(ids(g, c)[0]!)!.rankReq;
    const out = normalizeSeq(g, ids(g, 'DGFK'), rank('D'), 9999);
    expect(out.every((id) => g.byId.get(id)!.rankReq <= rank('D'))).toBe(true);
    expect(normalizeSeq(g, ids(g, 'DGFK'), 1, 9999)).toEqual([]);
  });

  it('重複、不在海域的 id 被忽略;最多 5 點', () => {
    const other = SEAS[3]!.points[0]!.id;
    expect(normalizeSeq(g, [...ids(g, 'DD'), other], 125, 9999)).toEqual(ids(g, 'D'));
    expect(normalizeSeq(g, ids(g, 'ABCDEF'), 125, 9999)).toHaveLength(5);
  });

  it('結果的順序不變、每一步都可行', () => {
    const out = normalizeSeq(g, ids(g, 'KDFG'), 76, range);
    expect(codes(g, out)).toBe(codes(g, out)); // 順序沿用輸入,不重排
    expect(out).toEqual(ids(g, 'KDFG').slice(0, out.length));
  });
});

describe('subToBuild / sameBuild', () => {
  it('轉換與比較', () => {
    const b = subToBuild({ level: 76, hull: 3, stern: 1, bow: 2, bridge: 3 });
    expect(b).toEqual({ level: 76, parts: [3, 1, 2, 3] });
    expect(sameBuild(b, { level: 76, parts: [3, 1, 2, 3] })).toBe(true);
    expect(sameBuild(b, { level: 77, parts: [3, 1, 2, 3] })).toBe(false);
    expect(sameBuild(b, { level: 76, parts: [3, 1, 2, 4] })).toBe(false);
  });
});
