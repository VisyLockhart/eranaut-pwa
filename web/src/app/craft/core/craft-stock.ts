import type { CalcResult, Stock } from './craft-calc';

/**
 * 庫存聯動已併入 `calculate()`(D-258):庫存由上往下連動,交納素材備齊 → 直接素材與基礎素材相應減少,直接素材備齊 → 基礎素材減少。
 * 庫存只存使用者輸入的值,下層數字都是即時算出;把庫存改小或清掉,下層需求自動回來。
 */

/** 備料進度 0~1:以交納素材計算(全部達標 = 100%,不看直接素材與基礎素材) */
export function finalsProgress(result: CalcResult, stock: Stock): number {
  let have = 0;
  let need = 0;
  for (const r of result.finals) {
    need += r.need;
    have += Math.min(r.need, stock[r.key] ?? 0);
  }
  return need === 0 ? 0 : have / need;
}
