import { calculate, type Selection } from './craft-calc';
import { SLOT_KEYS } from './data';

/**
 * 一組配件(各 1 件)要準備多少東西,給「找配置」比較材料負擔用(D-262)。
 * 骨架一律展開:改版配件的骨架是同級原版配件,不展開會少算一整份材料。
 */
export interface BuildCost {
  /** 改版配件件數(0~4) */
  mods: number;
  /** 基礎素材的種類數 */
  kinds: number;
  /** 基礎素材的總件數(把不同素材直接相加,只是粗略比較用,不是實際花費) */
  total: number;
}

const memo = new Map<string, BuildCost>();

/** parts:四個配件各為 1~10(1~5 原版、6~10 改版),順序同 SLOT_KEYS(船體、船尾、船首、艦橋) */
export function buildCost(parts: readonly number[]): BuildCost {
  const key = parts.join(',');
  const hit = memo.get(key);
  if (hit) return hit;
  const sel: Selection[] = SLOT_KEYS.map((slot, i) => ({ slot, gradeIndex: parts[i]! - 1, qty: 1 }));
  const bases = calculate(sel, { expandFrame: true }).bases;
  const cost: BuildCost = { mods: parts.filter((n) => n >= 6).length, kinds: bases.length, total: bases.reduce((n, r) => n + r.need, 0) };
  memo.set(key, cost);
  return cost;
}
