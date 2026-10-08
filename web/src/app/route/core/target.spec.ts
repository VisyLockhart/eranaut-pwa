import { describe, expect, it } from 'vitest';
import { buildStats, PART_GRADE_COUNT } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { shortestOrder } from './route';
import { findBuildsForTarget, NEAREST_COUNT } from './target';
import { routeNeed } from './need';

const drowned = SEA_INDEXES[0]!;
const jade = SEA_INDEXES[2]!;
const farthest = (si: (typeof SEA_INDEXES)[number], n: number) => [...si.sea.points].sort((a, b) => b.surveyRange - a.surveyRange).slice(0, n).map((p) => p.id);
const lastPoint = (si: (typeof SEA_INDEXES)[number]) => si.sea.points[si.sea.points.length - 1]!.id;

function bruteCount(si: (typeof SEA_INDEXES)[number], ids: number[], level: number, ok: (n: ReturnType<typeof routeNeed>, s: ReturnType<typeof buildStats>) => boolean): number {
  const need = routeNeed(si, shortestOrder(si, ids).order);
  let n = 0;
  for (let a = 1; a <= PART_GRADE_COUNT; a++) for (let b = 1; b <= PART_GRADE_COUNT; b++) for (let c = 1; c <= PART_GRADE_COUNT; c++) for (let d = 1; d <= PART_GRADE_COUNT; d++) {
    const s = buildStats(TABLES, { level, parts: [a, b, c, d] });
    if (s.weight <= s.weightCap && ok(need, s)) n++;
  }
  return n;
}

describe('找配置 findBuildsForTarget', () => {
  it('收集:每組都達到最高階收集、距離走得完;組數與窮舉一致', () => {
    const ids = [lastPoint(drowned)];
    const r = findBuildsForTarget(TABLES, drowned, ids, 130, 'collect');
    expect(r.levelOk).toBe(true);
    expect(r.total).toBe(bruteCount(drowned, ids, 130, (n, s) => s.range >= n.range && s.retrieval >= n.retrievalOptim));
    expect(r.hits.length).toBe(Math.min(100, r.total));
    for (const h of r.hits) {
      expect(h.stats.retrieval).toBeGreaterThanOrEqual(r.need.retrievalOptim);
      expect(h.stats.range).toBeGreaterThanOrEqual(r.need.range);
      expect(h.stats.weight).toBeLessThanOrEqual(h.stats.weightCap);
      expect(h.shortfall).toBe(0);
    }
    expect(r.nearest).toEqual([]);
  });

  it('恩惠:恩惠與距離達標;組數與窮舉一致', () => {
    const ids = farthest(drowned, 3);
    const r = findBuildsForTarget(TABLES, drowned, ids, 130, 'favor');
    expect(r.total).toBe(bruteCount(drowned, ids, 130, (n, s) => s.range >= n.range && s.favor >= n.favor));
    for (const h of r.hits) expect(h.stats.favor).toBeGreaterThanOrEqual(r.need.favor);
  });

  it('速度:依航行時間由短到長;每組都能出航且拿得到東西', () => {
    const ids = farthest(drowned, 2);
    const r = findBuildsForTarget(TABLES, drowned, ids, 130, 'speed');
    expect(r.hits.length).toBeGreaterThan(1);
    for (let i = 1; i < r.hits.length; i++) expect(r.hits[i - 1]!.minutes).toBeLessThanOrEqual(r.hits[i]!.minutes);
    for (const h of r.hits) expect(h.judged.allPass).toBe(true);
    // 順序是距離走得完的排列中總距離最短者:航行時間不會比最短耗用順序更長
    expect(r.hits[0]!.order.slice().sort()).toEqual(ids.slice().sort());
  });

  it('等級不夠去:levelOk 為 false,不列任何配置', () => {
    const r = findBuildsForTarget(TABLES, jade, [lastPoint(jade)], 10, 'collect');
    expect(r.levelOk).toBe(false);
    expect(r.minLevel).toBeGreaterThan(10);
    expect(r.hits).toEqual([]);
    expect(r.nearest).toEqual([]);
  });

  it('沒有任何配置達成:列出最接近的幾組(不足由少到多)', () => {
    const r = findBuildsForTarget(TABLES, jade, farthest(jade, 5), 130, 'collect');
    expect(r.total).toBe(0);
    expect(r.hits).toEqual([]);
    expect(r.nearest).toHaveLength(NEAREST_COUNT);
    for (let i = 1; i < r.nearest.length; i++) expect(r.nearest[i - 1]!.shortfall).toBeLessThanOrEqual(r.nearest[i]!.shortfall);
    expect(r.nearest[0]!.shortfall).toBeGreaterThan(0);
  });

  it('沒有選航點:空結果', () => {
    const r = findBuildsForTarget(TABLES, drowned, [], 130, 'collect');
    expect(r.hits).toEqual([]);
    expect(r.nearest).toEqual([]);
  });
});
