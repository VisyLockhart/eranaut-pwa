import { LIMITS, ROUTE_PART_MAX, type RouteSubDto } from '@eranaut/shared';
import { partLabel } from './core/build';
import { MAX_STOPS, routeCost, type SeaIndex } from './core/route';
import { SEAS } from './core/data';
import type { Build } from './core/types';

// 航線模擬器的本機狀態(ROUTE-SIM.md §6.2)與讀回來的資料驗證:
// 讀不到或值不合法一律當預設值,不讓壞資料弄壞畫面。純函式,不依賴 Angular。

export type Parts = [number, number, number, number];

/** 航線頁的分頁(順序即畫面順序:先有配置,再看推薦,最後到航點微調) */
export const ROUTE_TABS = ['config', 'recommend', 'map'] as const;
export type RouteTab = (typeof ROUTE_TABS)[number];

export interface RouteLast {
  /** 海域編號(`SEAS[].sea`) */
  sea: number;
  /** 已選航點 id,順序即航行順序(RS-05) */
  seq: number[];
  level: number;
  parts: Parts;
  /** 目前使用的儲存潛艇 id;null = 臨時配置 */
  subId: string | null;
  /** 使用者上次主動切到的分頁;null = 還沒選過(第一次或沒有儲存配置時由 RouteVm 決定預設分頁) */
  tab: RouteTab | null;
}

export const DEFAULT_LEVEL = LIMITS.maxRouteSubLevel;
export const DEFAULT_PARTS: Parts = [1, 1, 1, 1];

export function defaultLast(): RouteLast {
  return { sea: SEAS[0]!.sea, seq: [], level: DEFAULT_LEVEL, parts: [...DEFAULT_PARTS], subId: null, tab: null };
}

const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export function sanitizeParts(raw: unknown): Parts | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  return raw.every((v) => isInt(v, 1, ROUTE_PART_MAX)) ? ([raw[0], raw[1], raw[2], raw[3]] as Parts) : null;
}

/**
 * 依等級與距離上限整理已選序列(RS-06、RS-07、RS-08):
 * 去掉重複與不在這張海域的點,依序加入,等級不足、超過 5 點或耗用超過上限的點(含其後所有)被丟掉。
 * 換等級、換零件、取消中間的點之後都要重新整理,因為耗用可能變大。
 */
export function normalizeSeq(si: SeaIndex, seq: readonly number[], level: number, rangeCap: number): number[] {
  const kept: number[] = [];
  for (const id of seq) {
    if (kept.length >= MAX_STOPS) break;
    const p = si.byId.get(id);
    if (!p || kept.includes(id)) continue;
    if (level < p.rankReq) continue;
    if (routeCost(si, [...kept, id]).range > rangeCap) continue;
    kept.push(id);
  }
  return kept;
}

/** 讀回 `eranaut.route.last`;任何欄位不合法就用預設值。航點序列此處只做格式檢查,可行性由 `normalizeSeq` 處理 */
export function sanitizeLast(raw: unknown): RouteLast {
  const d = defaultLast();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d;
  const o = raw as Record<string, unknown>;
  const sea = SEAS.find((s) => s.sea === o['sea']);
  if (!sea) return d;
  const ids = new Set(sea.points.map((p) => p.id));
  const seq = Array.isArray(o['seq']) ? o['seq'].filter((x): x is number => typeof x === 'number' && ids.has(x)) : [];
  return {
    sea: sea.sea,
    seq: [...new Set(seq)].slice(0, MAX_STOPS),
    level: isInt(o['level'], 1, LIMITS.maxRouteSubLevel) ? o['level'] : d.level,
    parts: sanitizeParts(o['parts']) ?? d.parts,
    subId: typeof o['subId'] === 'string' && o['subId'] !== '' ? o['subId'] : null,
    // 舊版的「搜尋」分頁改名為「推薦」(原本的數字搜尋收進它的「進階」);「反查」分頁併入推薦的「掉落」(D-218)
    tab: o['tab'] === 'search' || o['tab'] === 'loot' ? 'recommend' : (ROUTE_TABS.find((t) => t === o['tab']) ?? null),
  };
}

/** 儲存潛艇的預設名稱,例如 `Lv76 3/1/2/3`(零件編號 1~10 以「3」「3改」顯示) */
export function defaultSubName(build: Build): string {
  return `Lv${build.level} ${build.parts.map(partLabel).join('/')}`;
}

/** 讀回離線快照:丟掉格式不合法的項目,最多保留上限組數 */
export function sanitizeSubs(raw: unknown): RouteSubDto[] {
  if (!Array.isArray(raw)) return [];
  const out: RouteSubDto[] = [];
  for (const x of raw) {
    if (typeof x !== 'object' || x === null) continue;
    const o = x as Record<string, unknown>;
    const parts = sanitizeParts([o['hull'], o['stern'], o['bow'], o['bridge']]);
    if (typeof o['id'] !== 'string' || typeof o['name'] !== 'string' || !isInt(o['level'], 1, LIMITS.maxRouteSubLevel) || !parts) continue;
    out.push({
      id: o['id'],
      name: o['name'],
      level: o['level'],
      hull: parts[0],
      stern: parts[1],
      bow: parts[2],
      bridge: parts[3],
      bound_submarine_ids: Array.isArray(o['bound_submarine_ids']) ? o['bound_submarine_ids'].filter((x): x is string => typeof x === 'string') : [],
      created_at: typeof o['created_at'] === 'string' ? o['created_at'] : '',
      updated_at: typeof o['updated_at'] === 'string' ? o['updated_at'] : '',
    });
    if (out.length >= LIMITS.maxRouteSubsPerUser) break;
  }
  return out;
}

export function subToBuild(s: Pick<RouteSubDto, 'level' | 'hull' | 'stern' | 'bow' | 'bridge'>): Build {
  return { level: s.level, parts: [s.hull, s.stern, s.bow, s.bridge] };
}

/** 兩個配置是否相同(等級與四個零件) */
export function sameBuild(a: Build, b: Build): boolean {
  return a.level === b.level && a.parts.every((v, i) => v === b.parts[i]);
}
