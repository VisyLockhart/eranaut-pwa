import baseJson from '../data/base.json';
import craftsJson from '../data/crafts.json';
import itemIdsJson from '../data/item-ids.json';
import recipesJson from '../data/recipes.json';
import type { CraftData } from './types';

// 資料集(來源未附授權條款,不適用 MIT,見 ../data/NOTICE.md)打包進製作頁的 lazy chunk,不查 DB。
export const CRAFT_DATA: CraftData = {
  base: (baseJson as unknown as { items: CraftData['base'] }).items,
  crafts: (craftsJson as unknown as { items: CraftData['crafts'] }).items,
  slots: (recipesJson as unknown as { slots: CraftData['slots'] }).slots,
};

/** 名稱 → 遊戲物品 ID(關連表,與查價工具無關;D-343) */
export const ITEM_IDS: Readonly<Record<string, number>> = (itemIdsJson as unknown as { items: Record<string, number> }).items;

export const SLOT_KEYS = ['hull', 'stern', 'bow', 'bridge'] as const;
