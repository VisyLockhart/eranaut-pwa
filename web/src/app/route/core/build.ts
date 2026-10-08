import type { Build, BuildStats, PartGrade, PartKey, RankRow, Tables } from './types';
import { PART_KEYS } from './types';

// 配置的性能計算(ROUTE-SIM.md §5 第 4 點):性能 = Σ 四個零件 + 等級獎勵;重量 = Σ 零件重量。

export const PART_GRADE_COUNT = 10;

export function rankRow(tables: Tables, level: number): RankRow {
  const row = tables.ranks.find((r) => r.rank === level);
  if (!row) throw new Error(`沒有等級 ${level} 的資料`);
  return row;
}

/** idx 為 1~10(1~5 原版,6~10 改版) */
export function partGrade(tables: Tables, key: PartKey, idx: number): PartGrade {
  const g = tables.parts.parts[key].grades[idx - 1];
  if (!g || !Number.isInteger(idx)) throw new Error(`零件編號 ${idx} 不合法`);
  return g;
}

export function buildStats(tables: Tables, build: Build): BuildStats {
  const rb = rankRow(tables, build.level);
  const s: BuildStats = {
    weight: 0,
    weightCap: rb.weightCap,
    overweight: false,
    surveillance: rb.surveillance,
    retrieval: rb.retrieval,
    speed: rb.speed,
    range: rb.range,
    favor: rb.favor,
  };
  PART_KEYS.forEach((key, i) => {
    const g = partGrade(tables, key, build.parts[i]!);
    s.weight += g.weight;
    s.surveillance += g.surveillance;
    s.retrieval += g.retrieval;
    s.speed += g.speed;
    s.range += g.range;
    s.favor += g.favor;
  });
  s.overweight = s.weight > s.weightCap;
  return s;
}

/** 零件編號的顯示:「3」或「3改」 */
export function partLabel(idx: number): string {
  return idx > 5 ? `${idx - 5}改` : `${idx}`;
}
