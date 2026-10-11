import type { CalcResult, CalcRow } from './craft-calc';
import { CRAFT_DATA } from './data';
import type { CraftData } from './types';

/**
 * 庫存連動(淨需求,D-256):素材 → 半成品 → 成品的「已有」互相連動。
 * 由上(成品)往下(素材)逐層推:
 *   某品項的淨需求 = 直接被配件使用的量 + 上層「還要製作的次數」× 配方用量;
 *   還缺 = max(0, 淨需求 − 已有);還要製作的次數 = ceil(還缺 / 產量)。
 * 所以成品已達標 → 它底下的半成品與素材淨需求為 0(一起達標);半成品有庫存 → 素材相應扣除;
 * 把庫存改小或清掉,下層需求自動回來。庫存只存使用者輸入,下層數字都是即時算出。
 * 回傳:品項名稱 → 淨需求。
 */
export function netNeeds(result: CalcResult, stock: Readonly<Record<string, number>>, data: CraftData = CRAFT_DATA): Map<string, number> {
  const rows = new Map<string, CalcRow>();
  for (const r of [...result.finals, ...result.semis, ...result.bases]) rows.set(r.name, r);

  // 直接被配件使用的量 = 總需求 − 被其他可製作品用掉的量
  const direct = new Map<string, number>();
  for (const [name, row] of rows) {
    let viaCrafts = 0;
    for (const p of row.usedBy) viaCrafts += rows.get(p)?.inputs[name] ?? 0;
    direct.set(name, Math.max(0, row.need - viaCrafts));
  }

  // 由上往下(Kahn):一個品項的所有上層都處理完,才處理它
  const indeg = new Map<string, number>();
  for (const name of rows.keys()) indeg.set(name, 0);
  for (const name of rows.keys()) {
    const c = data.crafts[name];
    if (!c) continue;
    for (const child of Object.keys(c.recipe)) if (indeg.has(child)) indeg.set(child, indeg.get(child)! + 1);
  }
  const incoming = new Map<string, number>();
  const net = new Map<string, number>();
  const queue = [...rows.keys()].filter((n) => indeg.get(n) === 0);
  while (queue.length > 0) {
    const name = queue.shift()!;
    const eff = (direct.get(name) ?? 0) + (incoming.get(name) ?? 0);
    net.set(name, eff);
    const c = data.crafts[name];
    if (!c) continue;
    const lack = Math.max(0, eff - (stock[name] ?? 0));
    const times = Math.ceil(lack / (c.yield ?? 1));
    for (const [child, q] of Object.entries(c.recipe)) {
      if (!indeg.has(child)) continue;
      incoming.set(child, (incoming.get(child) ?? 0) + times * q);
      indeg.set(child, indeg.get(child)! - 1);
      if (indeg.get(child) === 0) queue.push(child);
    }
  }
  return net;
}

/** 套用庫存連動:每列的 need 換成淨需求(其餘欄位不變) */
export function applyStock(result: CalcResult, stock: Readonly<Record<string, number>>, data: CraftData = CRAFT_DATA): CalcResult {
  const net = netNeeds(result, stock, data);
  const m = (rows: CalcRow[]) => rows.map((r) => ({ ...r, need: net.get(r.name) ?? r.need }));
  return { finals: m(result.finals), semis: m(result.semis), bases: m(result.bases) };
}

/** 備料進度 0~1:以成品計算(成品全部達標 = 100%,不看半成品與素材) */
export function finalsProgress(result: CalcResult, stock: Readonly<Record<string, number>>): number {
  let have = 0;
  let need = 0;
  for (const r of result.finals) {
    need += r.need;
    have += Math.min(r.need, stock[r.name] ?? 0);
  }
  return need === 0 ? 0 : have / need;
}
