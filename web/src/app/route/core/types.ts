// 航線模擬器的資料型別(對應 web/src/app/route/data/*.json,ROUTE-SIM.md §4)。
// core/ 之下全部是純函式、不依賴 Angular。

export interface StatReq {
  surveillanceMid: number;
  surveillanceHigh: number;
  retrievalNorm: number;
  retrievalOptim: number;
  favor: number;
}

export interface Drops {
  low: number[];
  mid: number[];
  high: number[];
}

export interface SeaPoint {
  id: number;
  code: string;
  name: string;
  x: number;
  y: number;
  rankReq: number;
  surveyDistance: number;
  surveyRange: number;
  stars: number;
  expReward: number;
  /** 燃料消耗(RS-22):路線燃料 = 所選航點 tankReq 加總 */
  tankReq: number;
  statReq: StatReq;
  drop: Drops;
  unlocks: number[];
}

export interface SeaHome {
  id: number;
  x: number;
  y: number;
}

export interface SeaData {
  sea: number;
  name: string;
  home: SeaHome;
  points: SeaPoint[];
  /** 地圖連線(RS-11);不是選取限制(RS-09) */
  links: [number, number][];
  /** ids[0] 是出發點;range / distance 為對稱矩陣 */
  matrix: { ids: number[]; range: number[][]; distance: number[][] };
}

export interface PartGrade {
  code: string;
  name: string;
  /** 1~5 */
  grade: number;
  /** 改版 */
  modified: boolean;
  surveillance: number;
  retrieval: number;
  speed: number;
  range: number;
  favor: number;
  weight: number;
}

export type PartKey = 'hull' | 'stern' | 'bow' | 'bridge';
export const PART_KEYS: readonly PartKey[] = ['hull', 'stern', 'bow', 'bridge'];

export interface PartsData {
  parts: Record<PartKey, { label: string; grades: PartGrade[] }>;
}

export interface RankRow {
  rank: number;
  exp: number;
  speed: number;
  range: number;
  surveillance: number;
  retrieval: number;
  favor: number;
  weightCap: number;
}

export interface Tables {
  parts: PartsData;
  ranks: RankRow[];
}

/** 一個潛艇配置:等級 + 四個配件(船體、船尾、船首、艦橋),各為 1~10(1~5 原版,6~10 改版,與 parts.json 的 grades 順序、API 的 hull/stern/bow/bridge 一致) */
export interface Build {
  level: number;
  parts: readonly [number, number, number, number];
}

export interface BuildStats {
  weight: number;
  weightCap: number;
  overweight: boolean;
  surveillance: number;
  retrieval: number;
  speed: number;
  range: number;
  favor: number;
}
