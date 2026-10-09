import { describe, expect, it } from 'vitest';
import { buildStats, partGrade, partLabel, rankRow } from './build';
import { MAX_LEVEL, TABLES } from './data';
import { TABLES_145 } from './test-helpers';

describe('配置性能', () => {
  it('等級上限 130(RS-20),重量上限 50 級起為 80', () => {
    expect(MAX_LEVEL).toBe(130);
    expect(TABLES.ranks).toHaveLength(130);
    for (const r of TABLES.ranks) expect(r.weightCap).toBe(r.rank >= 50 ? 80 : r.weightCap);
    expect(rankRow(TABLES, 1).weightCap).toBe(20);
    expect(() => rankRow(TABLES, 131)).toThrow();
  });

  it('案例 C:76 級、配件 3 1 2 3(原版)→ 距離 98、速度 155', () => {
    const s = buildStats(TABLES, { level: 76, parts: [3, 1, 2, 3] });
    expect(s.range).toBe(98);
    expect(s.speed).toBe(155);
  });

  it('案例 C:改版會是 118(所以使用者的是原版)', () => {
    expect(buildStats(TABLES, { level: 76, parts: [8, 6, 7, 8] }).range).toBe(118);
  });

  it('案例 A(wiki 145 級獎勵):5改 5改 4改 4改 → 重量 80、探索 270、收集 315、巡航 190、距離 125、恩惠 185', () => {
    const s = buildStats(TABLES_145, { level: 145, parts: [10, 10, 9, 9] });
    expect(s).toEqual({ weight: 80, weightCap: 80, overweight: false, surveillance: 270, retrieval: 315, speed: 190, range: 125, favor: 185 });
  });

  it('案例 A(繁中服 125 級)同配置:探索 250、收集 295、巡航 170、距離 105、恩惠 165', () => {
    const s = buildStats(TABLES, { level: 125, parts: [10, 10, 9, 9] });
    expect(s).toEqual({ weight: 80, weightCap: 80, overweight: false, surveillance: 250, retrieval: 295, speed: 170, range: 105, favor: 165 });
  });

  it('超重:重量大於該等級上限', () => {
    const s = buildStats(TABLES, { level: 1, parts: [10, 10, 10, 10] });
    expect(s.weightCap).toBe(20);
    expect(s.overweight).toBe(true);
  });

  it('配件編號不合法會丟錯', () => {
    expect(() => partGrade(TABLES, 'hull', 0)).toThrow();
    expect(() => partGrade(TABLES, 'hull', 11)).toThrow();
    expect(() => partGrade(TABLES, 'hull', 1.5)).toThrow();
  });

  it('編號 6~10 是改版,與 1~5 同級', () => {
    for (const key of ['hull', 'stern', 'bow', 'bridge'] as const) {
      for (let i = 1; i <= 5; i++) {
        expect(partGrade(TABLES, key, i).grade).toBe(i);
        expect(partGrade(TABLES, key, i).modified).toBe(false);
        expect(partGrade(TABLES, key, i + 5).grade).toBe(i);
        expect(partGrade(TABLES, key, i + 5).modified).toBe(true);
      }
    }
  });

  it('partLabel', () => {
    expect([1, 5, 6, 10].map(partLabel)).toEqual(['1', '5', '1改', '5改']);
  });
});
