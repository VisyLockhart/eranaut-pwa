import { applyExp, type RouteFilterSpec } from '@eranaut/shared';
import { SEA_INDEXES } from '../route/core/data';
import { checkRequired, compareRoutes, findRoutes, searchSeas } from '../route/core/find';
import { fitToDataset } from '../route/route-filter-state';
import { UNLOCK_GRAPH } from './charts';
import { planRoute, statsFor, type RoutePlan } from './leveling-vm';

// 航線輔助「條件組合」模式(D-297):用已儲存的條件(找路線的條件組合)、這艘出發時的等級與配置、工坊海圖,
// 只推薦第 1 名。純函式,不碰畫面與網路。搜尋最壞約 1 秒,所以結果記起來(同條件只算一次)。

type Parts = readonly [number, number, number, number];

export type ComboOutcome =
  | { ok: true; plan: RoutePlan; after: number }
  /** 找不到:`reason` 是給人看的說明(必選點等級不足、走不完、還沒發現…) */
  | { ok: false; reason: string };

const memo = new Map<string, ComboOutcome>();
const MEMO_LIMIT = 200;

/** 測試用 */
export function clearComboMemo(): void {
  memo.clear();
}

const codeOf = (id: number): string => SEA_INDEXES.find((s) => s.byId.has(id))?.byId.get(id)?.code ?? String(id);

export function comboSuggest(
  specIn: RouteFilterSpec,
  level: number,
  exp: number,
  parts: Parts,
  /** 工坊海圖已發現的點;沒有紀錄 null(不過濾) */
  found: ReadonlySet<number> | null,
  /** 沒有海圖紀錄時,排序含「可能解鎖」用的「去過」(本機);預設都沒去過 */
  explored: ReadonlySet<number> = new Set(),
): ComboOutcome {
  const { spec } = fitToDataset(specIn);
  const key = JSON.stringify([spec, level, parts, found ? [...found].sort((a, b) => a - b) : null, spec.sort.includes('opens') && !found ? [...explored].sort((a, b) => a - b) : null]);
  const hit = memo.get(key);
  if (hit) return hit;
  const out = compute(spec, level, exp, parts, found, explored);
  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(key, out);
  return out;
}

function compute(spec: RouteFilterSpec, level: number, exp: number, parts: Parts, found: ReadonlySet<number> | null, explored: ReadonlySet<number>): ComboOutcome {
  const stats = statsFor(parts, level);
  const required = new Set(spec.required);
  const q = {
    level,
    stats,
    sea: spec.sea,
    maxMinutes: spec.max_hours === null ? null : spec.max_hours * 60,
    sort: spec.sort,
    required,
    excluded: new Set(spec.excluded),
    itemIds: spec.item_ids,
    match: spec.match,
    explored,
    graph: UNLOCK_GRAPH,
    discovered: found,
    limit: 1,
  };
  // 必選點跨海域:各海域分開算再取最好的,和找路線頁一致
  const { seas } = searchSeas(SEA_INDEXES, q);
  const all = seas.length <= 1 || required.size === 0 ? findRoutes(SEA_INDEXES, q) : seas.flatMap((si) => findRoutes(SEA_INDEXES, { ...q, sea: si.sea.sea }));
  const best = all.length <= 1 ? all[0] : [...all].sort((a, b) => compareRoutes(a, b, spec.sort) || a.minutes - b.minutes || a.sea - b.sea)[0];
  if (best) {
    const si = SEA_INDEXES.find((s) => s.sea.sea === best.sea)!;
    const plan = planRoute(best.sea, best.order.map((id) => si.byId.get(id)!.code), parts, level);
    if (plan) return { ok: true, plan, after: applyExp({ level, exp_in_level: exp }, plan.exp).level };
  }
  return { ok: false, reason: explain(spec, level, parts, stats.range, found) };
}

/** 沒有結果時,盡量說出最可能的原因(只列一條,最先發現的) */
function explain(spec: RouteFilterSpec, level: number, _parts: Parts, rangeCap: number, found: ReadonlySet<number> | null): string {
  const req = new Set(spec.required);
  const { seas } = searchSeas(SEA_INDEXES, { sea: spec.sea, required: req });
  for (const si of seas) {
    const c = checkRequired(si, req, level, rangeCap);
    if (c.tooMany) return '必選的航點超過 5 個,一趟最多只能去 5 個';
    if (c.rankLocked.length > 0) {
      const id = c.rankLocked[0]!;
      return `必選點 ${codeOf(id)} 需要 Lv ${si.byId.get(id)!.rankReq},這艘出發時才 Lv ${level}`;
    }
    if (!c.ok) return `必選的航點合起來走不完(耗用 ${c.range},這艘距離上限 ${rangeCap})`;
  }
  if (found) {
    const hidden = [...req].filter((id) => !found.has(id));
    if (hidden.length > 0) return `必選點 ${codeOf(hidden[0]!)} 在這間工坊的海圖還沒發現`;
  }
  return '沒有符合條件的路線(可能是航行時間上限太短、指定物品拿不到,或探索值不夠)';
}
