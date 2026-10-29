import {
  ASSIST_MAX_HOURS,
  MAX_RECORDED_LEVEL,
  ROUTE_PART_KEYS,
  ROUTE_PART_MAX,
  UPKEEP_LIMITS,
  clampExp,
  levelExp,
  nextVoyagesDone,
  routeExp,
  settleProgress,
  upkeepLimitFor,
  upkeepPartsSig,
  upkeepRoute,
  type AssistMode,
  type BuildDto,
  type BuildInput,
  type ProgressDto,
  type ProgressInput,
  type ProgressRoute,
  type ProgressSource,
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
  assist_on: boolean;
  assist_mode: AssistMode;
  max_hours: number | null;
  filter_id: string | null;
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

/** 這艘潛艇自己的配件(D-296);沒設定回 undefined */
export function buildParts(build: BuildDto | undefined): UpkeepParts | undefined {
  return build ? { hull: build.hull, stern: build.stern, bow: build.bow, bridge: build.bridge } : undefined;
}

/** 配件欄位驗證(同 api/src/services/build.ts) */
export function parseBuildInput(u: unknown): BuildInput | 'invalid' {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) return 'invalid';
  const o = u as Record<string, unknown>;
  const out = {} as BuildInput;
  for (const k of ROUTE_PART_KEYS) {
    const v = o[k];
    if (!int(v, 1, ROUTE_PART_MAX)) return 'invalid';
    out[k] = v;
  }
  if (o['mark_repaired'] !== undefined) {
    if (typeof o['mark_repaired'] !== 'boolean') return 'invalid';
    out.mark_repaired = o['mark_repaired'];
  }
  return out;
}

/** 設定配件;`mark_repaired` 且有維修提醒:趟數歸 0,零件簽名與上限依新配件重算 */
export function applyBuild(upkeep: UpkeepRow | undefined, input: BuildInput, now: number): BuildDto {
  const parts = { hull: input.hull, stern: input.stern, bow: input.bow, bridge: input.bridge };
  const t = new Date(now).toISOString();
  if (input.mark_repaired && upkeep) {
    upkeep.voyages_done = 0;
    upkeep.repaired_at = t;
    upkeep.parts_sig = upkeepPartsSig(parts);
    upkeep.limit_voyages = upkeepLimitFor(parts, upkeep.route_key) ?? upkeep.limit_voyages;
    upkeep.updated_at = t;
  }
  return { ...parts, updated_at: t };
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
    assist_on: row.assist_on,
    assist_mode: row.assist_mode,
    max_hours: row.max_hours,
    filter_id: row.filter_id,
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
  if (o['assist_on'] !== undefined) {
    if (typeof o['assist_on'] !== 'boolean') return 'invalid';
    out.assist_on = o['assist_on'];
  }
  if (o['assist_mode'] !== undefined) {
    if (o['assist_mode'] !== 'level' && o['assist_mode'] !== 'combo') return 'invalid';
    out.assist_mode = o['assist_mode'];
  }
  if (o['max_hours'] !== undefined) {
    if (o['max_hours'] !== null && !ASSIST_MAX_HOURS.includes(o['max_hours'] as number)) return 'invalid';
    out.max_hours = o['max_hours'] as number | null;
  }
  if (o['filter_id'] !== undefined) {
    if (o['filter_id'] !== null && (typeof o['filter_id'] !== 'string' || o['filter_id'].length === 0 || o['filter_id'].length > 64)) return 'invalid';
    out.filter_id = o['filter_id'] as string | null;
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

/** 開啟維修提醒(「開啟的這次更新」算第 1 趟);沒設定配件、路線 / 零件沒有資料、趟數不合理都拒絕 */
export function enableUpkeep(parts: UpkeepParts | undefined, input: UpkeepInput, status: SubmarineStatus, now: number, position?: number): UpkeepRow {
  const route = upkeepRoute(input.route_key);
  if (!parts) throw new DemoRejected('upkeep', 'no_build', position);
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
export function applyProgressInput(
  cur: ProgressRow | undefined,
  input: ProgressInput,
  status: SubmarineStatus,
  now: number,
  ownsFilter: (id: string) => boolean,
  position?: number,
): ProgressRow {
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
  const filterId = input.filter_id === undefined ? (cur?.filter_id ?? null) : input.filter_id;
  // 條件組合只能選自己的條件
  if (filterId !== null && filterId !== (cur?.filter_id ?? null) && !ownsFilter(filterId)) throw new DemoRejected('progress', 'invalid_value', position);
  const last = input.route ? { sea: input.route.sea, points: [...input.route.points] } : (cur?.last ?? null);
  return {
    level,
    exp_in_level: exp,
    source: ocr ? 'ocr' : input.level !== undefined || input.exp_in_level !== undefined ? 'manual' : (cur?.source ?? 'manual'),
    assist_on: input.assist_on ?? cur?.assist_on ?? false,
    assist_mode: input.assist_mode ?? cur?.assist_mode ?? 'level',
    max_hours: input.max_hours === undefined ? (cur?.max_hours ?? null) : input.max_hours,
    filter_id: filterId,
    pending,
    last,
    updated_at: new Date(now).toISOString(),
  };
}
