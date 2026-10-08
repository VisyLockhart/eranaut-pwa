import { describe, expect, it } from 'vitest';
import { SEA_INDEXES } from './data';
import { ids } from './test-helpers';
import { ancestorsOf, buildUnlockGraph, closeExplored, descendantsOf, exploreState, isAvailable, markExplored, unmarkExplored } from './unlock';

const g = buildUnlockGraph(SEA_INDEXES);
const drowned = SEA_INDEXES[0]!;
const grey = SEA_INDEXES[1]!;
const id = (si: (typeof SEA_INDEXES)[number], codes: string) => ids(si, codes);

describe('解鎖樹', () => {
  it('每個點最多一個上一個點;根只有溺沒海的 A、B', () => {
    const all = SEA_INDEXES.flatMap((s) => s.sea.points.map((p) => p.id));
    const roots = all.filter((x) => !g.parent.has(x));
    expect(roots).toEqual(id(drowned, 'AB'));
    const seen = new Map<number, number>();
    for (const si of SEA_INDEXES) for (const p of si.sea.points) for (const c of p.unlocks) {
      expect(seen.has(c)).toBe(false);
      seen.set(c, p.id);
    }
  });

  it('溺沒海 Q 的祖先是 B、E、I、K、P', () => {
    expect(ancestorsOf(g, id(drowned, 'Q')[0]!)).toEqual(id(drowned, 'BEIKP'));
  });

  it('跨海域:灰海 A 的祖先包含溺沒海的一整條路', () => {
    const a = ancestorsOf(g, id(grey, 'A')[0]!);
    expect(a.length).toBeGreaterThan(5);
    expect(g.seaOf.get(a[0]!)).toBe(drowned);
  });

  it('標記 Q 會一併標記 B、E、I、K、P;取消 K 會連 K 之後一起取消', () => {
    const q = id(drowned, 'Q')[0]!;
    const m = markExplored(g, new Set(), q);
    expect([...m.next].sort((a, b) => a - b)).toEqual([...id(drowned, 'BEIKPQ')].sort((a, b) => a - b));
    expect(m.added.at(-1)).toBe(q);
    const k = id(drowned, 'K')[0]!;
    const u = unmarkExplored(g, m.next, k);
    expect([...u.next].sort((a, b) => a - b)).toEqual([...id(drowned, 'BEI')].sort((a, b) => a - b));
    expect(u.removed.sort((a, b) => a - b)).toEqual([...id(drowned, 'KPQ')].sort((a, b) => a - b));
  });

  it('descendantsOf 含跨海域', () => {
    const last = descendantsOf(g, drowned.sea.points.find((x) => x.code === 'AD')!.id);
    expect(last).toContain(id(grey, 'A')[0]!);
    expect(g.seaOf.get(last.find((x) => g.seaOf.get(x) === grey)!)).toBe(grey);
  });

  it('可以去的點:根一開始就能去;其餘要上一個點去過;去過的不能再去', () => {
    const none = new Set<number>();
    const [a, b] = id(drowned, 'AB');
    expect(isAvailable(g, none, a!)).toBe(true);
    expect(isAvailable(g, none, id(drowned, 'C')[0]!)).toBe(false);
    expect(exploreState(g, none, id(drowned, 'C')[0]!)).toBe('locked');
    const ab = new Set([a!, b!]);
    expect(exploreState(g, ab, a!)).toBe('done');
    expect(exploreState(g, ab, id(drowned, 'C')[0]!)).toBe('open');
    expect(exploreState(g, ab, id(drowned, 'F')[0]!)).toBe('locked');
  });

  it('closeExplored:丟掉不認得的值,補上前面的點', () => {
    const q = id(drowned, 'Q')[0]!;
    const s = closeExplored(g, [q, 99999, 'x', null]);
    expect(s.size).toBe(6);
    expect(s.has(q)).toBe(true);
  });
});
