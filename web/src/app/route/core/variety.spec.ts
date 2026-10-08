import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { MAX_STOPS, permutations, routeCost, travelMinutes } from './route';
import { findVarietyRoutes, pointItems, type VarietyQuery } from './variety';

const stats = buildStats(TABLES, { level: 130, parts: [10, 10, 10, 10] });
const q = (over: Partial<VarietyQuery> = {}): VarietyQuery => ({ level: 130, stats, sea: 'all', maxMinutes: null, ...over });

function brute(query: VarietyQuery) {
  const out: { sea: number; order: number[]; minutes: number; n: number }[] = [];
  for (const si of SEA_INDEXES) {
    if (query.sea !== 'all' && si.sea.sea !== query.sea) continue;
    const pts = si.sea.points.filter((p) => p.rankReq <= query.level);
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
          if (query.maxMinutes === null || minutes <= query.maxMinutes) {
            const set = new Set(cur.flatMap((id) => pointItems(si.byId.get(id)!, query.stats.surveillance)));
            out.push({ sea: si.sea.sea, order: best.order, minutes, n: set.size });
          }
        }
      }
      if (cur.length === MAX_STOPS) return;
      for (let i = start; i < pts.length; i++) rec(i + 1, [...cur, pts[i]!.id]);
    };
    rec(0, []);
  }
  return out.sort((a, b) => b.n - a.n || a.minutes - b.minutes);
}

describe('距離型推薦 findVarietyRoutes', () => {
  it('pointItems:探索不足時拿不到中、高階物品', () => {
    const p = SEA_INDEXES[0]!.sea.points.find((x) => x.drop.high.length > 0 && x.statReq.surveillanceHigh > 0)!;
    const low = pointItems(p, 0);
    const all = pointItems(p, 9999);
    expect(low.length).toBeLessThanOrEqual(all.length);
    expect(all).toEqual(expect.arrayContaining(p.drop.high));
  });

  it('結果依物品種類由多到少、一樣多時時間短的在前;條目不超過 5 站與距離上限', () => {
    const rs = findVarietyRoutes(SEA_INDEXES, q());
    expect(rs.length).toBeGreaterThan(0);
    for (let i = 1; i < rs.length; i++) {
      expect(rs[i - 1]!.items.length).toBeGreaterThanOrEqual(rs[i]!.items.length);
      if (rs[i - 1]!.items.length === rs[i]!.items.length) expect(rs[i - 1]!.minutes).toBeLessThanOrEqual(rs[i]!.minutes);
    }
    for (const r of rs) {
      expect(r.order.length).toBeLessThanOrEqual(MAX_STOPS);
      expect(r.cost.range).toBeLessThanOrEqual(stats.range);
    }
  });

  it.each([
    ['溺沒海', { sea: 1 }],
    ['灰海,時間上限 24 小時', { sea: 2, maxMinutes: 24 * 60 }],
    ['翠浪海,等級 90', { sea: 3, level: 90 }],
    ['探索只有 50', { sea: 2, stats: { ...stats, surveillance: 50 } }],
  ])('與窮舉一致:%s', (_n, over) => {
    const query = q({ limit: 15, ...over });
    const got = findVarietyRoutes(SEA_INDEXES, query);
    const want = brute(query).slice(0, 15);
    expect(got.map((r) => r.items.length)).toEqual(want.map((r) => r.n));
    expect(got.map((r) => r.minutes)).toEqual(want.map((r) => r.minutes));
  });

  it('速度 0 或距離 0:空陣列', () => {
    expect(findVarietyRoutes(SEA_INDEXES, q({ stats: { ...stats, speed: 0 } }))).toEqual([]);
    expect(findVarietyRoutes(SEA_INDEXES, q({ stats: { ...stats, range: 0 } }))).toEqual([]);
  });

  it('最壞情況(130 級、全部海域)算得完', () => {
    const t0 = performance.now();
    const rs = findVarietyRoutes(SEA_INDEXES, q());
    const ms = performance.now() - t0;
    console.info(`[距離型] 全部海域 ${rs.length} 條,${ms.toFixed(0)} ms`);
    expect(ms).toBeLessThan(10_000);
  });
});
