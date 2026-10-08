import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { findExpRoutes, type ExpQuery } from './recommend';
import { MAX_STOPS, permutations, routeCost, travelMinutes } from './route';
import { codes } from './test-helpers';

// 配置:Lv50、船體 3改 / 船尾 1改 / 船首 2改 / 艦橋 2改(部件編號 8、6、7、7)。
// 對照 FFXIVTC(yukixikari.github.io/FFXIVTC)的路線搜尋:灰海 A → B,經驗 881,980、航行 20小時35分、714 經驗/分。
const stats = buildStats(TABLES, { level: 50, parts: [8, 6, 7, 7] });
const base = (over: Partial<ExpQuery> = {}): ExpQuery => ({ level: 50, stats, sea: 'all', maxMinutes: null, tier: 'any', sort: 'perMin', ...over });

/** 不剪枝的窮舉,當作對照 */
function brute(q: ExpQuery) {
  const out: { sea: number; order: number[]; minutes: number; exp: number; perMin: number }[] = [];
  for (const si of SEA_INDEXES) {
    if (q.sea !== 'all' && si.sea.sea !== q.sea) continue;
    const pts = si.sea.points.filter((p) => p.rankReq <= q.level && (q.tier === 'any' || q.stats.surveillance >= (q.tier === 'mid' ? p.statReq.surveillanceMid : p.statReq.surveillanceHigh)));
    const rec = (start: number, cur: number[]): void => {
      if (cur.length > 0) {
        let best: { order: number[]; distance: number } | null = null;
        for (const perm of permutations(cur.length)) {
          const order = perm.map((j) => cur[j]!);
          const c = routeCost(si, order);
          if (c.range <= q.stats.range && (!best || c.distance < best.distance)) best = { order, distance: c.distance };
        }
        if (best) {
          const minutes = travelMinutes(best.distance, q.stats.speed);
          const exp = cur.reduce((s, id) => s + si.byId.get(id)!.expReward, 0);
          if (q.maxMinutes === null || minutes <= q.maxMinutes) out.push({ sea: si.sea.sea, order: best.order, minutes, exp, perMin: exp / minutes });
        }
      }
      if (cur.length === MAX_STOPS) return;
      for (let i = start; i < pts.length; i++) rec(i + 1, [...cur, pts[i]!.id]);
    };
    rec(0, []);
  }
  const key = q.sort === 'perMin' ? 'perMin' : 'exp';
  return out.sort((a, b) => b[key] - a[key] || a.minutes - b.minutes);
}

describe('練級推薦 findExpRoutes', () => {
  it('對照 FFXIVTC:灰海 A → B 為 881,980 經驗、20小時35分、約 714 經驗/分', () => {
    const grey = SEA_INDEXES[1]!;
    const r = findExpRoutes(SEA_INDEXES, base({ sea: grey.sea.sea, limit: 500 })).find((x) => codes(grey, [...x.order].sort((a, b) => a - b)) === 'AB');
    expect(r).toBeDefined();
    expect(r!.exp).toBe(881_980);
    expect(r!.minutes).toBe(20 * 60 + 35);
    expect(Math.floor(r!.perMin)).toBe(714);
    expect(r!.cost.fuel).toBe(12);
    expect(r!.cost.range).toBe(38);
  });

  it('結果由好到壞,每條都不超過距離上限、等級與 5 站', () => {
    const rs = findExpRoutes(SEA_INDEXES, base({ level: 60 }));
    expect(rs.length).toBeGreaterThan(0);
    for (let i = 1; i < rs.length; i++) expect(rs[i - 1]!.perMin).toBeGreaterThanOrEqual(rs[i]!.perMin);
    for (const r of rs) {
      const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
      expect(r.order.length).toBeLessThanOrEqual(MAX_STOPS);
      expect(r.cost.range).toBeLessThanOrEqual(stats.range);
      for (const id of r.order) expect(si.byId.get(id)!.rankReq).toBeLessThanOrEqual(60);
    }
  });

  it.each([
    ['每分鐘經驗', { sort: 'perMin' as const }],
    ['一趟總經驗', { sort: 'total' as const }],
    ['時間上限 24 小時', { maxMinutes: 24 * 60 }],
    ['每站至少中階', { tier: 'mid' as const }],
    ['每站至少高階', { tier: 'high' as const }],
  ])('與窮舉結果一致:%s', (_name, over) => {
    const q = base({ level: 60, sea: 1, limit: 15, ...over });
    const got = findExpRoutes(SEA_INDEXES, q);
    const want = brute(q).slice(0, 15);
    expect(got.length).toBe(want.length);
    const key = q.sort === 'perMin' ? 'perMin' : 'exp';
    expect(got.map((r) => r[key])).toEqual(want.map((r) => r[key]));
    expect(got.map((r) => r.minutes)).toEqual(want.map((r) => r.minutes));
  }, 30_000);

  it('航行時間上限與航點階層篩選', () => {
    const limited = findExpRoutes(SEA_INDEXES, base({ level: 60, maxMinutes: 12 * 60 }));
    for (const r of limited) expect(r.minutes).toBeLessThanOrEqual(12 * 60);
    const high = findExpRoutes(SEA_INDEXES, base({ level: 125, tier: 'high', stats: buildStats(TABLES, { level: 125, parts: [10, 10, 10, 10] }) }));
    const s = buildStats(TABLES, { level: 125, parts: [10, 10, 10, 10] }).surveillance;
    for (const r of high) {
      const si = SEA_INDEXES.find((x) => x.sea.sea === r.sea)!;
      for (const id of r.order) expect(s).toBeGreaterThanOrEqual(si.byId.get(id)!.statReq.surveillanceHigh);
    }
  });

  it('只找指定海域;速度 0 或沒有符合的航點時回空陣列', () => {
    for (const r of findExpRoutes(SEA_INDEXES, base({ sea: 1 }))) expect(r.sea).toBe(1);
    expect(findExpRoutes(SEA_INDEXES, base({ stats: { ...stats, speed: 0 } }))).toEqual([]);
    expect(findExpRoutes(SEA_INDEXES, base({ level: 1, stats: { ...stats, range: 0 } }))).toEqual([]);
  });

  it('最壞情況(125 級、全部海域)也能在合理時間算完', () => {
    const s = buildStats(TABLES, { level: 125, parts: [10, 10, 10, 10] });
    const t0 = performance.now();
    const rs = findExpRoutes(SEA_INDEXES, base({ level: 125, stats: s }));
    const ms = performance.now() - t0;
    console.info(`[練級推薦] 125 級、全部海域:${rs.length} 條,${ms.toFixed(0)} ms`);
    expect(rs.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(10_000);
  });
});
