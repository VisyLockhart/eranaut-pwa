import { describe, expect, it } from 'vitest';
import { partLabel } from './build';
import { TABLES } from './data';
import { SEARCH_LIMIT, searchBuilds } from './search';
import { TABLES_145 } from './test-helpers';

const label = (parts: readonly number[]) => parts.map(partLabel).join(' ');

describe('配置搜尋', () => {
  // 案例 B:賽蓮海 R→O、145 級、重量 ≤ 80;需求探索 235、收集 320、恩惠 225、速度 100、距離 136 → 共 6 組
  const EXPECTED = [
    ['5改 5改 5 5', 74],
    ['3改 5 1改 5改', 77],
    ['5改 5改 5改 5', 77],
    ['5改 5改 5 5改', 77],
    ['3改 5改 1改 5改', 80],
    ['5改 5改 5改 5改', 80],
  ] as const;

  it('案例 B(wiki 145 級獎勵):恰好 6 組,與 wiki 一致', () => {
    const r = searchBuilds(TABLES_145, { level: 145, mins: { surveillance: 235, retrieval: 320, favor: 225, speed: 100, range: 136 }, weightLimit: 80 });
    expect(r.total).toBe(6);
    // 與 wiki 表同序:重量由小到大,同重量巡航較快的在前(搜尋本身不再提供「重量輕優先」排序,這裡只為對照)
    const byWiki = [...r.hits].sort((a, b) => a.stats.weight - b.stats.weight || b.stats.speed - a.stats.speed);
    expect(byWiki.map((h) => [label(h.build.parts), h.stats.weight])).toEqual(EXPECTED.map((e) => [...e]));
  });

  it('案例 B(繁中服 125 級,各項需求同減 20):同樣 6 組', () => {
    const r = searchBuilds(TABLES, { level: 125, mins: { surveillance: 215, retrieval: 300, favor: 205, speed: 80, range: 116 }, weightLimit: 80 });
    expect(r.total).toBe(6);
    // 與 wiki 表同序:重量由小到大,同重量巡航較快的在前(搜尋本身不再提供「重量輕優先」排序,這裡只為對照)
    const byWiki = [...r.hits].sort((a, b) => a.stats.weight - b.stats.weight || b.stats.speed - a.stats.speed);
    expect(byWiki.map((h) => [label(h.build.parts), h.stats.weight])).toEqual(EXPECTED.map((e) => [...e]));
  });

  it('125 級用 145 級的需求:找不到', () => {
    expect(searchBuilds(TABLES, { level: 125, mins: { surveillance: 235, retrieval: 320, favor: 225, speed: 100, range: 136 }, weightLimit: 80 }).total).toBe(0);
  });

  it('重量上限:比該等級上限大時取該等級上限;較小時採較小者', () => {
    const none = { surveillance: -999, retrieval: -999, favor: -999, speed: -999, range: -999 };
    const all = searchBuilds(TABLES, { level: 125, mins: none, weightLimit: 999, limit: 20_000 });
    expect(all.hits.every((h) => h.stats.weight <= 80)).toBe(true);
    const light = searchBuilds(TABLES, { level: 125, mins: none, weightLimit: 40, limit: 20_000 });
    expect(light.hits.every((h) => h.stats.weight <= 40)).toBe(true);
    expect(light.total).toBeLessThan(all.total);
    const lv1 = searchBuilds(TABLES, { level: 1, mins: none, limit: 20_000 });
    expect(lv1.hits.every((h) => h.stats.weight <= 20)).toBe(true);
  });

  it('最多回 300 筆,total 是符合的總數', () => {
    const none = { surveillance: -999, retrieval: -999, favor: -999, speed: -999, range: -999 };
    const r = searchBuilds(TABLES, { level: 125, mins: none });
    expect(r.hits).toHaveLength(SEARCH_LIMIT);
    expect(r.total).toBeGreaterThan(SEARCH_LIMIT);
  });

  it('排序:距離性能由大到小;航行時間由短到長', () => {
    const mins = { surveillance: 0, retrieval: 0, favor: 0, speed: 0, range: 0 };
    const rg = searchBuilds(TABLES, { level: 125, mins, sort: 'range', limit: 50 }).hits.map((h) => h.stats.range);
    expect(rg).toEqual([...rg].sort((a, b) => b - a));
    const tm = searchBuilds(TABLES, { level: 125, mins, sort: 'time', routeDistance: 241974, limit: 50 }).hits.map((h) => Math.floor(241974 / h.stats.speed + 720));
    expect(tm).toEqual([...tm].sort((a, b) => a - b));
  });
});
