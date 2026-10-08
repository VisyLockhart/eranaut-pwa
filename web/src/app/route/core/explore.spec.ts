import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { findExploreRoutes, opensOf, type ExploreQuery } from './explore';
import { MAX_STOPS, permutations, routeCost, travelMinutes } from './route';
import { ids } from './test-helpers';
import { buildUnlockGraph, isAvailable } from './unlock';

const g = buildUnlockGraph(SEA_INDEXES);
const drowned = SEA_INDEXES[0]!;
const stats = buildStats(TABLES, { level: 130, parts: [10, 10, 10, 10] });
const q = (over: Partial<ExploreQuery> = {}): ExploreQuery => ({ level: 130, stats, sea: 'all', maxMinutes: null, explored: new Set(), ...over });

function brute(query: ExploreQuery) {
  const out: { sea: number; order: number[]; minutes: number; opens: number }[] = [];
  for (const si of SEA_INDEXES) {
    if (query.sea !== 'all' && si.sea.sea !== query.sea) continue;
    const pts = si.sea.points.filter((p) => p.rankReq <= query.level && isAvailable(g, query.explored, p.id));
    const rec = (start: number, cur: number[]): void => {
      if (cur.length > 0) {
        let best: { order: number[]; d: number } | null = null;
        for (const perm of permutations(cur.length)) {
          const order = perm.map((j) => cur[j]!);
          const c = routeCost(si, order);
          if (c.range <= query.stats.range && (!best || c.distance < best.d)) best = { order, d: c.distance };
        }
        if (best) {
          const minutes = travelMinutes(best.d, query.stats.speed);
          if (query.maxMinutes === null || minutes <= query.maxMinutes) out.push({ sea: si.sea.sea, order: best.order, minutes, opens: opensOf(g, best.order).length });
        }
      }
      if (cur.length === MAX_STOPS) return;
      for (let i = start; i < pts.length; i++) rec(i + 1, [...cur, pts[i]!.id]);
    };
    rec(0, []);
  }
  return out.sort((a, b) => b.opens - a.opens || a.minutes - b.minutes);
}

describe('探索推薦 findExploreRoutes', () => {
  it('什麼都沒去過:只有溺沒海的 A、B 可以去,路線不含其他點', () => {
    const rs = findExploreRoutes(SEA_INDEXES, g, q());
    expect(rs.length).toBeGreaterThan(0);
    const ab = new Set(ids(drowned, 'AB'));
    for (const r of rs) for (const id of r.order) expect(ab.has(id)).toBe(true);
    // A+B 一起去,回來就解鎖 C、D、E
    expect(rs[0]!.order.slice().sort()).toEqual(ids(drowned, 'AB').slice().sort());
    expect(rs[0]!.opens).toEqual(expect.arrayContaining(ids(drowned, 'CDE')));
    expect(rs[0]!.opens).toHaveLength(3);
  });

  it('去過的點不會再出現,而且新開的點要上一個點去過才能排進去', () => {
    const explored = new Set(ids(drowned, 'AB'));
    const rs = findExploreRoutes(SEA_INDEXES, g, q({ explored }));
    for (const r of rs) for (const id of r.order) {
      expect(explored.has(id)).toBe(false);
      expect(isAvailable(g, explored, id)).toBe(true);
    }
  });

  it('依開出的新航點數由多到少,一樣多時航行時間短的在前', () => {
    const rs = findExploreRoutes(SEA_INDEXES, g, q({ explored: new Set(ids(drowned, 'AB')) }));
    for (let i = 1; i < rs.length; i++) {
      const a = rs[i - 1]!;
      const b = rs[i]!;
      expect(a.opens.length).toBeGreaterThanOrEqual(b.opens.length);
      if (a.opens.length === b.opens.length) expect(a.minutes).toBeLessThanOrEqual(b.minutes);
    }
  });

  it.each([
    ['全新', new Set<number>(), {}],
    ['去過 A、B', new Set(ids(drowned, 'AB')), {}],
    ['去過 A~E,時間上限 24 小時', new Set(ids(drowned, 'ABCDE')), { maxMinutes: 24 * 60 }],
    ['等級 60', new Set(ids(drowned, 'ABCDEFGH')), { level: 60 }],
  ])('與窮舉一致:%s', (_n, explored, over) => {
    const query = q({ explored, limit: 20, ...over });
    const got = findExploreRoutes(SEA_INDEXES, g, query);
    const want = brute(query).slice(0, 20);
    expect(got.map((r) => r.opens.length)).toEqual(want.map((r) => r.opens));
    expect(got.map((r) => r.minutes)).toEqual(want.map((r) => r.minutes));
  });

  it('跨海域:溺沒海最後一點去過之後,灰海 A 可以去', () => {
    const last = drowned.sea.points.find((x) => x.code === 'AD')!.id;
    const explored = new Set([last, ...[...Array(0)]]);
    const closed = new Set<number>();
    const stack = [last];
    while (stack.length) {
      const x = stack.pop()!;
      closed.add(x);
      const p = g.parent.get(x);
      if (p !== undefined) stack.push(p);
    }
    void explored;
    const grey = SEA_INDEXES[1]!;
    const rs = findExploreRoutes(SEA_INDEXES, g, q({ explored: closed, sea: grey.sea.sea }));
    expect(rs.length).toBeGreaterThan(0);
    expect(rs.every((r) => r.order.every((id) => id === ids(grey, 'A')[0]))).toBe(true);
  });

  it('距離不夠或速度 0 時回空陣列', () => {
    expect(findExploreRoutes(SEA_INDEXES, g, q({ stats: { ...stats, speed: 0 } }))).toEqual([]);
    expect(findExploreRoutes(SEA_INDEXES, g, q({ stats: { ...stats, range: 0 } }))).toEqual([]);
  });
});
