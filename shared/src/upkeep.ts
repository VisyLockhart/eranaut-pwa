// 配件維修提醒(D-288)。前後端共用:耐久資料集、趟數計算、修理材料。
// 命名用 upkeep(維持),避開專案裡已有的「伺服器維護 maintenance」(D-283)。
//
// 資料來源:耐久損耗在遊戲資料採礦檔裡沒有,目前只有玩家實測的「零件撐到壞掉的趟數」(單一來源)。
// 因此資料集每筆都帶 `source` / `verified`,來源待補,Claude 不自填;趟數可由使用者手動修改。

import type { RoutePartKey } from './constants.js';

export type UpkeepParts = Record<RoutePartKey, number>;

/** 維修提醒支援的路線。`key` 是穩定識別碼,存在資料庫;`points` 為有順序的航點代碼(seas.json 的 code) */
export interface UpkeepRouteDef {
  key: string;
  sea: number;
  points: readonly string[];
  /** 畫面顯示用 */
  label: string;
}

export const UPKEEP_ROUTES: readonly UpkeepRouteDef[] = [{ key: '1:OJ', sea: 1, points: ['O', 'J'], label: '溺沒海 O→J' }];

export interface UpkeepDatum {
  /** 第 i 個元素 = 零件編號 i+1(1~5 原版鯊魚/雲海/鯨/腔棘魚/夕拉級,6~10 改造 1~5 級)最多可跑幾趟 */
  voyages: readonly number[];
  /** 來源待補 */
  source: string | null;
  /** 是否已有可靠來源驗證 */
  verified: boolean;
}

/**
 * 耐久資料集:路線 key → 各零件可跑趟數。
 * 目前只有溺沒海 O→J:鯊魚級 6 趟、其餘 7 趟(玩家實測,單一來源);改造級(6~10)沒有實測,暫沿用 7。
 */
export const UPKEEP_DATA: Readonly<Record<string, UpkeepDatum>> = {
  '1:OJ': { voyages: [6, 7, 7, 7, 7, 7, 7, 7, 7, 7], source: null, verified: false },
};

export const UPKEEP_LIMITS = { minVoyages: 1, maxVoyages: 20 } as const;

const PART_KEYS: readonly RoutePartKey[] = ['hull', 'stern', 'bow', 'bridge'];

export function upkeepRoute(key: string): UpkeepRouteDef | undefined {
  return UPKEEP_ROUTES.find((r) => r.key === key);
}

/** 這組零件在該路線最多可跑幾趟(四個零件取最小值);資料集沒有這條路線或缺零件資料回 null */
export function upkeepLimitFor(parts: UpkeepParts, routeKey: string): number | null {
  const datum = UPKEEP_DATA[routeKey];
  if (!datum) return null;
  let min = Infinity;
  for (const k of PART_KEYS) {
    const v = datum.voyages[parts[k] - 1];
    if (v === undefined || !Number.isInteger(v) || v < 1) return null;
    min = Math.min(min, v);
  }
  return min;
}

/** 這組零件可用的路線(資料集有對應資料者)與各自的預設趟數 */
export function upkeepOptionsFor(parts: UpkeepParts): { route: UpkeepRouteDef; limit: number }[] {
  const out: { route: UpkeepRouteDef; limit: number }[] = [];
  for (const route of UPKEEP_ROUTES) {
    const limit = upkeepLimitFor(parts, route.key);
    if (limit !== null) out.push({ route, limit });
  }
  return out;
}

/** 零件組合簽名(存資料庫、用來偵測配置被改過),例如 `3,1,2,4` */
export function upkeepPartsSig(parts: UpkeepParts): string {
  return PART_KEYS.map((k) => parts[k]).join(',');
}

/** 畫面顯示的配置代碼:都是個位數時為 `3124`,有 10 時以逗號分隔 */
export function upkeepPartsLabel(sig: string): string {
  const nums = sig.split(',');
  return nums.every((n) => n.length === 1) ? nums.join('') : sig;
}

/** 單個零件一次維修要的魔導機械修理材數量(遊戲資料採礦 `SubmarinePart.RepairMaterials`):原版 1~5 級 = 1~5,改造一律 6 */
export function repairMaterialsOf(part: number): number {
  return part >= 1 && part <= 5 ? part : 6;
}

/** 整艘潛艇一次維修(四個零件)要的修理材總數;簽名無法解析回 null */
export function repairMaterialsForSig(sig: string): number | null {
  const nums = sig.split(',').map(Number);
  if (nums.length !== PART_KEYS.length || nums.some((n) => !Number.isInteger(n) || n < 1 || n > 10)) return null;
  return nums.reduce((sum, n) => sum + repairMaterialsOf(n), 0);
}

export type UpkeepPhase =
  /** 還有餘裕 */
  | 'ok'
  /** 這趟是最後一趟、還沒回來:返航後需要維修 */
  | 'repair_after_return'
  /** 趟數用盡且已返航:需要維修才能再出航 */
  | 'repair_now';

/** 判斷維修階段。`returned` = 潛艇已返航(探索完成,或預計返航時間已過) */
export function upkeepPhase(voyagesDone: number, limit: number, returned: boolean): UpkeepPhase {
  if (voyagesDone < limit) return 'ok';
  return returned ? 'repair_now' : 'repair_after_return';
}

/** 計次規則(D-288):送出「探索中」且上一筆已返航才算一趟;已用盡又出航視為已維修,重設為第 1 趟 */
export function nextVoyagesDone(
  current: number,
  limit: number,
  prev: { status: 'exploring' | 'complete'; expected_return_at: string | null },
  next: { status: 'exploring' | 'complete' },
  now: Date,
): { voyages_done: number; repaired: boolean } {
  if (next.status !== 'exploring') return { voyages_done: current, repaired: false };
  const prevReturned = prev.status === 'complete' || (prev.expected_return_at !== null && new Date(prev.expected_return_at).getTime() <= now.getTime());
  if (!prevReturned) return { voyages_done: current, repaired: false };
  if (current >= limit) return { voyages_done: 1, repaired: true };
  return { voyages_done: current + 1, repaired: false };
}
