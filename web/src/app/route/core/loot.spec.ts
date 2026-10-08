import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { CANDIDATE_LIMIT, findLootRoutes, obtainableTier } from './loot';
import { routeCost, shortestOrder, travelMinutes } from './route';

describe('obtainableTier', () => {
  const p = {
    statReq: { surveillanceMid: 205, surveillanceHigh: 235 },
    drop: { low: [1], mid: [2], high: [3] },
  } as never;
  it('低階無門檻、中高階看探索值、不在掉落表回 null', () => {
    expect(obtainableTier(p, 1, 0)).toBe('low');
    expect(obtainableTier(p, 2, 204)).toBeNull();
    expect(obtainableTier(p, 2, 205)).toBe('mid');
    expect(obtainableTier(p, 3, 234)).toBeNull();
    expect(obtainableTier(p, 3, 235)).toBe('high');
    expect(obtainableTier(p, 99, 999)).toBeNull();
  });
});

describe('掉落物反查路線', () => {
  const stats = buildStats(TABLES, { level: 125, parts: [10, 10, 10, 10] });
  const q = (itemId: number, over = {}) => ({ itemIds: [itemId], surveillance: stats.surveillance, speed: stats.speed, rangeCap: stats.range, level: 125, ...over });

  // 找一個出現在最多航點的掉落物(測試較有意義)
  function someItem(si: (typeof SEA_INDEXES)[number]): number {
    const counts = new Map<number, number>();
    for (const p of si.sea.points) for (const id of [...p.drop.low, ...p.drop.mid, ...p.drop.high]) counts.set(id, (counts.get(id) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
  }

  it('每條路線:最多 5 站、都在候選內、耗用 ≤ 上限、為最短順序、分數 = 經驗 ÷ ⌊航行時間⌋', () => {
    const si = SEA_INDEXES[3]!;
    const item = someItem(si);
    const r = findLootRoutes(si, q(item), 30);
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.candidates.length).toBeLessThanOrEqual(CANDIDATE_LIMIT);
    expect(r.routes.length).toBeGreaterThan(0);
    for (const route of r.routes) {
      expect(route.order.length).toBeLessThanOrEqual(5);
      expect(route.order.every((id) => r.candidates.includes(id))).toBe(true);
      expect(route.cost.range).toBeLessThanOrEqual(stats.range);
      expect(shortestOrder(si, route.order).cost.range).toBe(route.cost.range);
      expect(route.cost).toEqual(routeCost(si, route.order));
      expect(route.minutes).toBe(travelMinutes(route.cost.distance, stats.speed));
      expect(route.score).toBeCloseTo(route.exp / Math.floor(route.minutes), 9);
    }
  });

  it('依每分鐘經驗由大到小排序', () => {
    const si = SEA_INDEXES[3]!;
    const r = findLootRoutes(si, q(someItem(si)), 200);
    const scores = r.routes.map((x) => x.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('候選航點依經驗由大到小;等級不足的航點不在候選', () => {
    const si = SEA_INDEXES[3]!;
    const item = someItem(si);
    const full = findLootRoutes(si, q(item), 1);
    const exps = full.candidates.map((id) => si.byId.get(id)!.expReward);
    expect(exps).toEqual([...exps].sort((a, b) => b - a));
    const lowLevel = findLootRoutes(si, q(item, { level: 90 }), 1);
    expect(lowLevel.candidates.every((id) => si.byId.get(id)!.rankReq <= 90)).toBe(true);
  });

  it('探索值不足時,只有中高階才有的物品拿不到 → 沒有候選與路線', () => {
    const si = SEA_INDEXES[3]!;
    const onlyHigh = si.sea.points.flatMap((p) => p.drop.high).find((id) => !si.sea.points.some((p) => p.drop.low.includes(id) || p.drop.mid.includes(id)))!;
    const r = findLootRoutes(si, q(onlyHigh, { surveillance: 0 }));
    expect(r.candidates).toEqual([]);
    expect(r.routes).toEqual([]);
    expect(findLootRoutes(si, q(onlyHigh, { surveillance: 999 })).candidates.length).toBeGreaterThan(0);
  });

  it('不存在的物品 → 空結果;距離上限 0 → 沒有路線', () => {
    const si = SEA_INDEXES[3]!;
    expect(findLootRoutes(si, q(-1))).toEqual({ candidates: [], routes: [] });
    expect(findLootRoutes(si, q(someItem(si), { rangeCap: 0 })).routes).toEqual([]);
  });

  it('單站最佳路線不會比暴力列舉的結果差(抽樣:候選 ≤ 8 時完全比對)', () => {
    const si = SEA_INDEXES[5]!; // 南蒼茫洋 13 點,候選 ≤ 13 組,可完全列舉
    const item = someItem(SEA_INDEXES[5]!);
    const r = findLootRoutes(si, q(item), 1000);
    const cand = r.candidates;
    let best = 0;
    for (let mask = 1; mask < 1 << cand.length; mask++) {
      const set = cand.filter((_, i) => mask & (1 << i));
      if (set.length > 5) continue;
      const o = shortestOrder(si, set);
      if (o.cost.range > stats.range) continue;
      const exp = set.reduce((s, id) => s + si.byId.get(id)!.expReward, 0);
      best = Math.max(best, exp / Math.floor(travelMinutes(o.cost.distance, stats.speed)));
    }
    expect(r.routes[0]?.score ?? 0).toBeCloseTo(best, 9);
  });
});
