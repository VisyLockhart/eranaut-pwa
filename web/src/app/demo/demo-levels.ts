import {
  LEVELING_SCHOOLS,
  MAX_RECORDED_LEVEL,
  UPKEEP_LIMITS,
  clampExp,
  levelExp,
  nextVoyagesDone,
  routeExp,
  settleProgress,
  upkeepLimitFor,
  upkeepPartsSig,
  upkeepRoute,
  type LevelingSchool,
  type ProgressDto,
  type ProgressInput,
  type ProgressRoute,
  type ProgressSource,
  type RouteSubDto,
  type SubmarineDto,
  type SubmarineStatus,
  type UpkeepDto,
  type UpkeepInput,
  type UpkeepParts,
} from '@eranaut/shared';

// 展示模式(D-168、D-292)的配件維修提醒(D-288)與等級 / 練級輔助(D-289)。
// 規則照抄正式版 API(api/src/repo/upkeep.ts、services/upkeep.ts、repo/progress.ts),資料改存在瀏覽器(DemoStore)。

/** 維修提醒:一艘一筆,有資料 = 已開啟 */
export interface UpkeepRow {
  route_key: string;
  route_sea: number;
  route_points: string[];
  voyages_done: number;
  limit_voyages: number;
  parts_sig: string;
  repaired_at: string | null;
  updated_at: string;
}

/** 等級:一艘一筆,有資料 = 有填等級 */
export interface ProgressRow {
  level: number;
  exp_in_level: number;
  source: ProgressSource;
  sim_on: boolean;
  school: LevelingSchool | null;
  pending: (ProgressRoute & { exp: number }) | null;
  last: ProgressRoute | null;
  updated_at: string;
}

/** 被拒絕(與正式版相同的原因碼);後端轉成 400 */
export class DemoRejected extends Error {
  constructor(
    readonly field: 'upkeep' | 'progress',
    readonly reason: string,
    readonly position?: number,
  ) {
    super(`${field}_rejected: ${reason}`);
  }
}

type Phase = Pick<SubmarineDto, 'status' | 'expected_return_at'>;

export function hasReturned(s: Phase, now: number): boolean {
  return s.status === 'complete' || (s.expected_return_at !== null && Date.parse(s.expected_return_at) <= now);
}

/** 這艘潛艇目前綁定的配置零件;沒綁定回 undefined */
export function boundParts(routeSubs: readonly RouteSubDto[], submarineId: string): UpkeepParts | undefined {
  const r = routeSubs.find((x) => x.bound_submarine_ids.includes(submarineId));
  return r ? { hull: r.hull, stern: r.stern, bow: r.bow, bridge: r.bridge } : undefined;
}

export function upkeepDto(row: UpkeepRow, parts: UpkeepParts | undefined): UpkeepDto {
  return { ...row, route_points: [...row.route_points], current_sig: parts ? upkeepPartsSig(parts) : null };
}

export function progressDto(row: ProgressRow, returned: boolean): ProgressDto {
  const eff = settleProgress({ level: row.level, exp_in_level: row.exp_in_level, pending: row.pending }, returned);
  return {
    level: row.level,
    exp_in_level: row.exp_in_level,
    source: row.source,
    sim_on: row.sim_on,
    school: row.school,
    pending: row.pending ? { ...row.pending, points: [...row.pending.points] } : null,
    last_route: row.last ? { sea: row.last.sea, points: [...row.last.points] } : null,
    effective_level: eff.level,
    effective_exp: eff.exp_in_level,
    updated_at: row.updated_at,
  };
}

// ---- 驗證(與 api/src/services/submarines.ts 相同的範圍) ----

const int = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export function parseUpkeepInput(u: unknown): UpkeepInput | null | undefined | 'invalid' {
  if (u === undefined) return undefined;
  if (u === null) return null;
  if (typeof u !== 'object' || Array.isArray(u)) return 'invalid';
  const o = u as Record<string, unknown>;
  if (typeof o['route_key'] !== 'string' || !upkeepRoute(o['route_key'])) return 'invalid';
  if (o['limit_voyages'] !== undefined && !int(o['limit_voyages'], UPKEEP_LIMITS.minVoyages, UPKEEP_LIMITS.maxVoyages)) return 'invalid';
  if (o['already_done'] !== undefined && !int(o['already_done'], 0, UPKEEP_LIMITS.maxVoyages)) return 'invalid';
  return {
    route_key: o['route_key'],
    ...(o['limit_voyages'] !== undefined ? { limit_voyages: o['limit_voyages'] as number } : {}),
    ...(o['already_done'] !== undefined ? { already_done: o['already_done'] as number } : {}),
  };
}

export function parseProgressInput(u: unknown): ProgressInput | null | undefined | 'invalid' {
  if (u === undefined) return undefined;
  if (u === null) return null;
  if (typeof u !== 'object' || Array.isArray(u)) return 'invalid';
  const o = u as Record<string, unknown>;
  const out: ProgressInput = {};
  if (o['level'] !== undefined) {
    if (!int(o['level'], 1, MAX_RECORDED_LEVEL)) return 'invalid';
    out.level = o['level'];
  }
  if (o['exp_in_level'] !== undefined) {
    if (!int(o['exp_in_level'], 0, 100_000_000)) return 'invalid';
    out.exp_in_level = o['exp_in_level'];
  }
  if (o['source'] !== undefined) {
    if (o['source'] !== 'manual' && o['source'] !== 'ocr') return 'invalid';
    out.source = o['source'];
  }
  if (o['sim_on'] !== undefined) {
    if (typeof o['sim_on'] !== 'boolean') return 'invalid';
    out.sim_on = o['sim_on'];
  }
  if (o['school'] !== undefined) {
    if (o['school'] !== null && !(LEVELING_SCHOOLS as readonly unknown[]).includes(o['school'])) return 'invalid';
    out.school = o['school'] as ProgressInput['school'];
  }
  if (o['route'] !== undefined) {
    if (o['route'] === null) out.route = null;
    else {
      const r = o['route'] as Record<string, unknown>;
      if (typeof r !== 'object' || Array.isArray(r) || !int(r['sea'], 1, 2) || !Array.isArray(r['points']) || r['points'].some((c) => typeof c !== 'string')) return 'invalid';
      if (r['points'].length > 5 || routeExp(r['sea'], r['points'] as string[]) === null) return 'invalid';
      out.route = { sea: r['sea'], points: [...(r['points'] as string[])] };
    }
  }
  return out;
}

// ---- 寫入規則 ----

/** 開啟維修提醒(「開啟的這次更新」算第 1 趟);沒綁定配置、路線 / 零件沒有資料、趟數不合理都拒絕 */
export function enableUpkeep(parts: UpkeepParts | undefined, input: UpkeepInput, status: SubmarineStatus, now: number, position?: number): UpkeepRow {
  const route = upkeepRoute(input.route_key);
  if (!parts) throw new DemoRejected('upkeep', 'not_bound', position);
  const computed = route ? upkeepLimitFor(parts, route.key) : null;
  if (!route || computed === null) throw new DemoRejected('upkeep', 'unsupported', position);
  const limit = input.limit_voyages ?? computed;
  const already = input.already_done ?? 0;
  if (limit < UPKEEP_LIMITS.minVoyages || limit > UPKEEP_LIMITS.maxVoyages || already < 0 || already >= limit) throw new DemoRejected('upkeep', 'invalid_value', position);
  const t = new Date(now).toISOString();
  return {
    route_key: route.key,
    route_sea: route.sea,
    route_points: [...route.points],
    voyages_done: already + (status === 'exploring' ? 1 : 0),
    limit_voyages: limit,
    parts_sig: upkeepPartsSig(parts),
    repaired_at: already === 0 ? t : null,
    updated_at: t,
  };
}

/** 更新潛艇時的計次:送出探索中且上一趟已返航才 +1;已用盡又出航視為已維修 */
export function countVoyage(row: UpkeepRow, prev: Phase, next: { status: SubmarineStatus }, now: number): void {
  const r = nextVoyagesDone(row.voyages_done, row.limit_voyages, prev, next, new Date(now));
  if (r.voyages_done === row.voyages_done && !r.repaired) return;
  const t = new Date(now).toISOString();
  row.voyages_done = r.voyages_done;
  if (r.repaired) row.repaired_at = t;
  row.updated_at = t;
}

/** 手動調整趟數 / 上限;不合法回 false */
export function patchUpkeep(row: UpkeepRow, input: unknown, now: number): boolean {
  const b = (typeof input === 'object' && input !== null && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const done = b['voyages_done'];
  const limit = b['limit_voyages'];
  if (done !== undefined && !int(done, 0, UPKEEP_LIMITS.maxVoyages)) return false;
  if (limit !== undefined && !int(limit, UPKEEP_LIMITS.minVoyages, UPKEEP_LIMITS.maxVoyages)) return false;
  if (done === undefined && limit === undefined) return false;
  if (done !== undefined) row.voyages_done = done;
  if (limit !== undefined) row.limit_voyages = limit;
  row.updated_at = new Date(now).toISOString();
  return true;
}

/** 上一趟已返航又派出:把待結算的經驗寫進等級 */
export function settleOnDispatch(row: ProgressRow, prev: Phase, next: { status: SubmarineStatus }, now: number): void {
  if (next.status !== 'exploring' || !hasReturned(prev, now) || !row.pending) return;
  const s = settleProgress({ level: row.level, exp_in_level: row.exp_in_level, pending: row.pending }, true);
  row.level = s.level;
  row.exp_in_level = s.exp_in_level;
  row.source = 'sim';
  row.pending = null;
  row.updated_at = new Date(now).toISOString();
}

/** 套用等級資料(同正式版 applyProgressInput);回傳新的列 */
export function applyProgressInput(cur: ProgressRow | undefined, input: ProgressInput, status: SubmarineStatus, now: number, position?: number): ProgressRow {
  if (!cur && input.level === undefined) throw new DemoRejected('progress', 'level_required', position);
  const level = input.level ?? cur!.level;
  const levelChanged = cur !== undefined && level !== cur.level;
  let exp = input.exp_in_level ?? (cur && !levelChanged ? cur.exp_in_level : 0);
  const need = levelExp(level);
  if (need !== null && exp >= need) {
    if (input.exp_in_level !== undefined) throw new DemoRejected('progress', 'invalid_value', position);
    exp = clampExp(level, exp);
  }
  const ocr = input.source === 'ocr';
  let pending = cur?.pending ?? null;
  // 明確給了等級 / 經驗(或截圖辨識)= 以那個數字為準,舊的待結算路線作廢,否則返航後會重複加一次
  if (ocr || input.level !== undefined || input.exp_in_level !== undefined) pending = null;
  if (input.route === null) pending = null;
  else if (input.route !== undefined) {
    const e = routeExp(input.route.sea, input.route.points);
    if (e === null || status !== 'exploring') throw new DemoRejected('progress', 'invalid_value', position);
    pending = { sea: input.route.sea, points: [...input.route.points], exp: e };
  }
  const last = input.route ? { sea: input.route.sea, points: [...input.route.points] } : (cur?.last ?? null);
  return {
    level,
    exp_in_level: exp,
    source: ocr ? 'ocr' : input.level !== undefined || input.exp_in_level !== undefined ? 'manual' : (cur?.source ?? 'manual'),
    sim_on: input.sim_on ?? cur?.sim_on ?? false,
    school: input.school === undefined ? (cur?.school ?? null) : input.school,
    pending,
    last,
    updated_at: new Date(now).toISOString(),
  };
}
