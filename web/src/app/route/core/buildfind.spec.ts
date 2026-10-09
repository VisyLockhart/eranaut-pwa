import { describe, expect, it } from 'vitest';
import { buildStats, partLabel, PART_GRADE_COUNT } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { BUILD_LIMIT, findBuilds, minsForGoal, minsFromNeed, NEAREST_COUNT, NO_MINS, type BuildMins } from './buildfind';
import { routeNeed } from './need';
import { shortestOrder } from './route';
import { TABLES_145 } from './test-helpers';

const drowned = SEA_INDEXES[0]!;
const jade = SEA_INDEXES[2]!;
const farthest = (si: (typeof SEA_INDEXES)[number], n: number) => [...si.sea.points].sort((a, b) => b.surveyRange - a.surveyRange).slice(0, n).map((p) => p.id);
const lastPoint = (si: (typeof SEA_INDEXES)[number]) => si.sea.points[si.sea.points.length - 1]!.id;
const label = (parts: readonly number[]) => parts.map(partLabel).join(' ');

/** 獨立的窮舉:符合最低性能與重量上限的配置數 */
function brute(level: number, mins: BuildMins, weightLimit?: number): string[] {
  const out: string[] = [];
  for (let a = 1; a <= PART_GRADE_COUNT; a++) for (let b = 1; b <= PART_GRADE_COUNT; b++) for (let c = 1; c <= PART_GRADE_COUNT; c++) for (let d = 1; d <= PART_GRADE_COUNT; d++) {
    const s = buildStats(TABLES, { level, parts: [a, b, c, d] });
    if (s.weight > Math.min(s.weightCap, weightLimit ?? s.weightCap)) continue;
    if (s.surveillance >= mins.surveillance && s.retrieval >= mins.retrieval && s.speed >= mins.speed && s.range >= mins.range && s.favor >= mins.favor) out.push([a, b, c, d].join('-'));
  }
  return out;
}
const keys = (r: { hits: { build: { parts: readonly number[] } }[] }) => r.hits.map((h) => h.build.parts.join('-'));

describe('找配置 findBuilds', () => {
  it('預設目標的最低性能由航點需求算出', () => {
    const ids = farthest(drowned, 2);
    const need = routeNeed(drowned, shortestOrder(drowned, ids).order);
    expect(minsForGoal('collect', need)).toEqual({ ...NO_MINS, range: need.range, retrieval: need.retrievalOptim });
    expect(minsForGoal('favor', need)).toEqual({ ...NO_MINS, range: need.range, favor: need.favor });
    expect(minsForGoal('speed', need)).toEqual({ ...NO_MINS, range: need.range, surveillance: need.surveillanceMid, retrieval: need.retrievalNorm, favor: need.favor });
    expect(minsFromNeed(need)).toEqual({ ...NO_MINS, surveillance: need.surveillanceHigh, retrieval: need.retrievalOptim, range: need.range, favor: need.favor });
  });

  for (const goal of ['collect', 'favor', 'speed'] as const) {
    it(`${goal}:與窮舉達標的配置完全一致`, () => {
      for (const ids of [[lastPoint(drowned)], farthest(drowned, 3), farthest(drowned, 5)]) {
        if (goal !== 'speed' && ids.length > 1) continue;
        const r = findBuilds(TABLES, drowned, { level: 130, ids, goal, limit: 20_000 });
        expect(r.levelOk).toBe(true);
        expect(new Set(keys(r))).toEqual(new Set(brute(130, r.mins)));
        for (const h of r.hits) {
          expect(h.shortfall).toBe(0);
          expect(h.stats.weight).toBeLessThanOrEqual(h.stats.weightCap);
        }
      }
    });
  }

  it('速度:依航行時間由短到長,每組都能出航且拿得到東西;順序是航點的排列', () => {
    const ids = farthest(drowned, 2);
    const r = findBuilds(TABLES, drowned, { level: 130, ids, goal: 'speed' });
    expect(r.hits.length).toBeGreaterThan(1);
    for (let i = 1; i < r.hits.length; i++) expect(r.hits[i - 1]!.minutes!).toBeLessThanOrEqual(r.hits[i]!.minutes!);
    for (const h of r.hits) expect(h.judged!.allPass).toBe(true);
    expect(r.hits[0]!.order.slice().sort()).toEqual(ids.slice().sort());
  });

  it('收集 / 恩惠:預設排序也是航行時間短優先,同分重量輕者在前', () => {
    const r = findBuilds(TABLES, drowned, { level: 130, ids: [lastPoint(drowned)], goal: 'collect' });
    for (let i = 1; i < r.hits.length; i++) {
      const a = r.hits[i - 1]!;
      const b = r.hits[i]!;
      expect(a.minutes!).toBeLessThanOrEqual(b.minutes!);
      if (a.minutes === b.minutes) expect(a.stats.weight).toBeLessThanOrEqual(b.stats.weight);
    }
  });

  it('距離高優先:距離性能由大到小', () => {
    const r = findBuilds(TABLES, drowned, { level: 130, ids: farthest(drowned, 2), goal: 'speed', sort: 'range' });
    for (let i = 1; i < r.hits.length; i++) expect(r.hits[i - 1]!.stats.range).toBeGreaterThanOrEqual(r.hits[i]!.stats.range);
  });

  it('等級不夠去:levelOk 為 false,不列任何配置', () => {
    const r = findBuilds(TABLES, jade, { level: 10, ids: [lastPoint(jade)], goal: 'collect' });
    expect(r.levelOk).toBe(false);
    expect(r.minLevel).toBeGreaterThan(10);
    expect(r.hits).toEqual([]);
    expect(r.nearest).toEqual([]);
  });

  it('沒有任何配置達成:列出最接近的幾組(不足由少到多)', () => {
    const r = findBuilds(TABLES, jade, { level: 130, ids: farthest(jade, 5), goal: 'speed' });
    expect(r.total).toBe(0);
    expect(r.nearest).toHaveLength(NEAREST_COUNT);
    for (let i = 1; i < r.nearest.length; i++) expect(r.nearest[i - 1]!.shortfall).toBeLessThanOrEqual(r.nearest[i]!.shortfall);
    expect(r.nearest[0]!.shortfall).toBeGreaterThan(0);
  });

  it('預設目標沒選航點:空結果', () => {
    const r = findBuilds(TABLES, drowned, { level: 130, ids: [], goal: 'collect' });
    expect(r.hits).toEqual([]);
    expect(r.nearest).toEqual([]);
    expect(r.need).toBeNull();
  });

  describe('自訂(原配置搜尋)', () => {
    const EXPECTED = [
      ['5改 5改 5 5', 74],
      ['3改 5 1改 5改', 77],
      ['5改 5改 5改 5', 77],
      ['5改 5改 5 5改', 77],
      ['3改 5改 1改 5改', 80],
      ['5改 5改 5改 5改', 80],
    ] as const;
    const byWiki = (r: ReturnType<typeof findBuilds>) => [...r.hits].sort((a, b) => a.stats.weight - b.stats.weight || b.stats.speed - a.stats.speed).map((h) => [label(h.build.parts), h.stats.weight]);

    it('案例 B(wiki 145 級獎勵):恰好 6 組,與 wiki 一致', () => {
      const r = findBuilds(TABLES_145, drowned, { level: 145, ids: [], goal: 'custom', mins: { surveillance: 235, retrieval: 320, favor: 225, speed: 100, range: 136 }, weightLimit: 80 });
      expect(r.total).toBe(6);
      expect(byWiki(r)).toEqual(EXPECTED.map((e) => [...e]));
    });

    it('案例 B(繁中服 125 級,各項需求同減 20):同樣 6 組;145 級的需求找不到', () => {
      const r = findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom', mins: { surveillance: 215, retrieval: 300, favor: 205, speed: 80, range: 116 }, weightLimit: 80 });
      expect(r.total).toBe(6);
      expect(byWiki(r)).toEqual(EXPECTED.map((e) => [...e]));
      expect(findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom', mins: { surveillance: 235, retrieval: 320, favor: 225, speed: 100, range: 136 }, weightLimit: 80 }).total).toBe(0);
    });

    it('與窮舉一致(沒選航點)', () => {
      const mins = { surveillance: 120, retrieval: 150, favor: 90, speed: 60, range: 50 };
      const r = findBuilds(TABLES, drowned, { level: 100, ids: [], goal: 'custom', mins, limit: 20_000 });
      expect(r.total).toBe(brute(100, mins).length);
      expect(new Set(keys(r))).toEqual(new Set(brute(100, mins)));
      expect(r.hits[0]!.minutes).toBeNull();
      expect(r.hits[0]!.judged).toBeNull();
    });

    it('沒選航點、時間短優先 = 巡航由快到慢;重量上限取較小者', () => {
      const r = findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom', limit: 50 });
      for (let i = 1; i < r.hits.length; i++) expect(r.hits[i - 1]!.stats.speed).toBeGreaterThanOrEqual(r.hits[i]!.stats.speed);
      const light = findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom', weightLimit: 40, limit: 20_000 });
      expect(light.hits.every((h) => h.stats.weight <= 40)).toBe(true);
      expect(new Set(keys(light))).toEqual(new Set(brute(125, NO_MINS, 40)));
      const big = findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom', weightLimit: 999, limit: 20_000 });
      expect(big.hits.every((h) => h.stats.weight <= 80)).toBe(true);
      const lv1 = findBuilds(TABLES, drowned, { level: 1, ids: [], goal: 'custom', limit: 20_000 });
      expect(lv1.hits.every((h) => h.stats.weight <= 20)).toBe(true);
    });

    it('最多回 300 筆,total 是符合的總數', () => {
      const r = findBuilds(TABLES, drowned, { level: 125, ids: [], goal: 'custom' });
      expect(r.hits).toHaveLength(BUILD_LIMIT);
      expect(r.total).toBeGreaterThan(BUILD_LIMIT);
    });

    it('有航點:航行時間用該配置能走的最短距離排列;等級不夠去時不列', () => {
      const ids = farthest(drowned, 2);
      const r = findBuilds(TABLES, drowned, { level: 130, ids, goal: 'custom', mins: NO_MINS, limit: 50 });
      expect(r.hits[0]!.minutes).not.toBeNull();
      expect(r.hits[0]!.order.slice().sort()).toEqual(ids.slice().sort());
      for (let i = 1; i < r.hits.length; i++) expect(r.hits[i - 1]!.minutes!).toBeLessThanOrEqual(r.hits[i]!.minutes!);
      expect(findBuilds(TABLES, jade, { level: 10, ids: [lastPoint(jade)], goal: 'custom' }).levelOk).toBe(false);
    });

    it('沒有符合:列出最接近的幾組', () => {
      const r = findBuilds(TABLES, drowned, { level: 100, ids: [], goal: 'custom', mins: { ...NO_MINS, range: 9999 } });
      expect(r.total).toBe(0);
      expect(r.nearest).toHaveLength(NEAREST_COUNT);
    });
  });
});
