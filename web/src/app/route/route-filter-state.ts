import { LIMITS, ROUTE_FILTER_LIMITS, ROUTE_FILTER_SORTS, type RouteFilterDto, type RouteFilterSort, type RouteFilterSpec } from '@eranaut/shared';
import { SEAS, SEA_INDEXES } from './core/data';
import { MAX_HOURS_OPTIONS } from './route-explore-vm';
import { isLootItem } from './route-loot-vm';

// 條件組合(D-229)的純函式:讀回來的資料驗證、對照資料集整理、命名與比較。不依賴 Angular。

export const DEFAULT_SPEC: RouteFilterSpec = { v: 1, sea: 'all', max_hours: null, sort: 'perMin', required: [], excluded: [], item_ids: [], match: 'all' };

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const ids = (v: unknown, max: number, cap: number): number[] =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is number => isInt(x, 1, max)))].slice(0, cap) : [];

/** 讀回來的單一 spec(API 回應或 localStorage 快照):形狀不對的欄位用預設值,不丟例外 */
export function sanitizeSpec(raw: unknown): RouteFilterSpec {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const required = ids(o['required'], ROUTE_FILTER_LIMITS.pointIdMax, ROUTE_FILTER_LIMITS.maxRequired);
  return {
    v: 1,
    sea: isInt(o['sea'], 1, ROUTE_FILTER_LIMITS.seaMax) ? o['sea'] : 'all',
    max_hours: isInt(o['max_hours'], 1, ROUTE_FILTER_LIMITS.maxHoursMax) ? o['max_hours'] : null,
    sort: (ROUTE_FILTER_SORTS as readonly unknown[]).includes(o['sort']) ? (o['sort'] as RouteFilterSort) : 'perMin',
    required,
    excluded: ids(o['excluded'], ROUTE_FILTER_LIMITS.pointIdMax, ROUTE_FILTER_LIMITS.maxExcluded).filter((id) => !required.includes(id)),
    item_ids: ids(o['item_ids'], ROUTE_FILTER_LIMITS.itemIdMax, ROUTE_FILTER_LIMITS.maxItems),
    match: o['match'] === 'any' ? 'any' : 'all',
  };
}

/** 讀回來的清單(API 回應或快照):丟掉形狀不對的列,最多 30 組(上限常數) */
export function sanitizeFilters(raw: unknown): RouteFilterDto[] {
  if (!Array.isArray(raw)) return [];
  const out: RouteFilterDto[] = [];
  for (const x of raw) {
    if (typeof x !== 'object' || x === null) continue;
    const o = x as Record<string, unknown>;
    if (typeof o['id'] !== 'string' || typeof o['name'] !== 'string') continue;
    out.push({
      id: o['id'],
      name: o['name'],
      spec: sanitizeSpec(o['spec']),
      favorite: o['favorite'] === true,
      created_at: typeof o['created_at'] === 'string' ? o['created_at'] : '',
      updated_at: typeof o['updated_at'] === 'string' ? o['updated_at'] : '',
    });
    if (out.length >= LIMITS.maxRouteFiltersPerUser) break;
  }
  return out;
}

/** 對照目前的資料集:資料集已沒有的航點、海域、物品、時間選項會被略過;回傳整理後的 spec 與略過的項目數 */
export function fitToDataset(spec: RouteFilterSpec): { spec: RouteFilterSpec; dropped: number } {
  let dropped = 0;
  const known = (id: number) => SEA_INDEXES.some((s) => s.byId.has(id));
  const keep = (list: number[], ok: (id: number) => boolean) => list.filter((id) => (ok(id) ? true : (dropped++, false)));
  const required = keep(spec.required, known);
  const excluded = keep(spec.excluded, known);
  const item_ids = keep(spec.item_ids, isLootItem);
  let sea = spec.sea;
  if (sea !== 'all' && !SEAS.some((s) => s.sea === sea)) {
    sea = 'all';
    dropped++;
  }
  let max_hours = spec.max_hours;
  if (max_hours !== null && !MAX_HOURS_OPTIONS.includes(max_hours)) {
    max_hours = null;
    dropped++;
  }
  return { spec: { ...spec, sea, max_hours, required, excluded, item_ids }, dropped };
}

const sorted = (a: readonly number[]) => [...a].sort((x, y) => x - y).join(',');

/** 兩組條件是否相同(陣列不分順序;只有一個物品時「全部 / 任一個」沒有差別) */
export function sameSpec(a: RouteFilterSpec, b: RouteFilterSpec): boolean {
  const matchSame = (a.item_ids.length < 2 && b.item_ids.length < 2) || a.match === b.match;
  return (
    a.sea === b.sea &&
    a.max_hours === b.max_hours &&
    a.sort === b.sort &&
    matchSame &&
    sorted(a.required) === sorted(b.required) &&
    sorted(a.excluded) === sorted(b.excluded) &&
    sorted(a.item_ids) === sorted(b.item_ids)
  );
}

/** 條件全是預設值(沒有任何限制) */
export const isDefaultSpec = (s: RouteFilterSpec): boolean => sameSpec(s, DEFAULT_SPEC);

/** 條件的簡短說明,例如「灰海 · 6 小時內 · 3 點」;沒有任何條件回空字串 */
export function specSummary(s: RouteFilterSpec): string {
  const parts: string[] = [];
  if (s.sea !== 'all') parts.push(SEAS.find((x) => x.sea === s.sea)?.name ?? '');
  if (s.max_hours !== null) parts.push(`${s.max_hours} 小時內`);
  if (s.required.length > 0) parts.push(`${s.required.length} 點`);
  if (s.excluded.length > 0) parts.push(`排除 ${s.excluded.length}`);
  if (s.item_ids.length > 0) parts.push(`${s.item_ids.length} 種物品`);
  if (s.sort !== 'perMin') parts.push(s.sort === 'opens' ? '解鎖' : '最多物品');
  return parts.filter((p) => p !== '').join(' · ');
}

/** 預設名稱:條件的簡短說明,不超過名稱上限 */
export function autoName(s: RouteFilterSpec): string {
  return [...(specSummary(s) || '條件組合')].slice(0, LIMITS.routeFilterName).join('');
}
