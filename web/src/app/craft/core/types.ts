/** 配件製作資料集型別(資料檔見 ../data,來源與授權見 ../data/NOTICE.md) */

export type SlotKey = 'hull' | 'stern' | 'bow' | 'bridge';

/** 配方:品項名稱 → 數量 */
export type Recipe = Readonly<Record<string, number>>;

/** 不能再製作的基礎素材 */
export interface BaseItem {
  group: string;
}

/** 可製作品(半成品或成品);yield = 一次製作產出的數量,省略為 1 */
export interface CraftItem {
  group: string;
  recipe: Recipe;
  yield?: number;
}

/**
 * 一個等級的配件。改版配件有 frame:骨架 = 同部位、frame.grade 級的**原版**配件 ×qty。
 * 骨架名稱不存,顯示時用 `${航線資料的等級名稱}${部位名稱}骨架`。
 */
export interface GradeRecipe {
  /** 1~5 */
  grade: number;
  modified: boolean;
  recipe: Recipe;
  frame?: { grade: number; qty: number };
}

export interface SlotRecipes {
  label: string;
  /** 長度 10:1~5 原版、6~10 改版(與 route/data/parts.json 的 grades 順序一致) */
  grades: GradeRecipe[];
}

export interface CraftData {
  base: Readonly<Record<string, BaseItem>>;
  crafts: Readonly<Record<string, CraftItem>>;
  slots: Readonly<Record<SlotKey, SlotRecipes>>;
}
