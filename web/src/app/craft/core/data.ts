import baseJson from '../data/base.json';
import craftsJson from '../data/crafts.json';
import recipesJson from '../data/recipes.json';
import type { CraftData } from './types';

// 資料集(來源未附授權條款,不適用 MIT,見 ../data/NOTICE.md)打包進製作頁的 lazy chunk,不查 DB。
export const CRAFT_DATA: CraftData = {
  base: (baseJson as unknown as { items: CraftData['base'] }).items,
  crafts: (craftsJson as unknown as { items: CraftData['crafts'] }).items,
  slots: (recipesJson as unknown as { slots: CraftData['slots'] }).slots,
};

export const SLOT_KEYS = ['hull', 'stern', 'bow', 'bridge'] as const;
