// 測試用:用英文字母代號找航點、組出假等級列(145 級獎勵,用來重現 wiki 的案例 A、B)。
import { SEA_INDEXES, TABLES } from './data';
import type { SeaIndex } from './route';
import type { Tables } from './types';

export const SEA = { drowned: 0, grey: 1, jade: 2, siren: 3, violet: 4, south: 5 } as const;

export function sea(i: number): SeaIndex {
  return SEA_INDEXES[i]!;
}

/** 'DGFK' → 航點 id 陣列(依字母代號) */
export function ids(si: SeaIndex, codes: string): number[] {
  return codes.split(/(?=[A-Z])/).map((c) => {
    const p = si.sea.points.find((x) => x.code === c);
    if (!p) throw new Error(`${si.sea.name} 沒有航點 ${c}`);
    return p.id;
  });
}

export function codes(si: SeaIndex, order: readonly number[]): string {
  return order.map((id) => si.byId.get(id)!.code).join('');
}

/** wiki 的 145 級獎勵(繁中服尚未開放,只用來驗證與 wiki 案例一致):探索 110、收集 140、巡航 100、距離 130、恩惠 105 */
export const TABLES_145: Tables = {
  ...TABLES,
  ranks: [...TABLES.ranks, { rank: 145, exp: 0, surveillance: 110, retrieval: 140, speed: 100, range: 130, favor: 105, weightCap: 80 }],
};
