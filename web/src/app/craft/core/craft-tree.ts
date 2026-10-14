import { CRAFT_DATA } from './data';
import { frameName } from './craft-calc';
import type { CraftData, Recipe, SlotKey } from './types';

/**
 * 配方樹(D-264):把一個品項的配方展開成樹,像遊戲的「配方樹狀圖」。純函式、只讀靜態配方資料。
 * 數量一律是「做一次」的用量(不乘需求量,也不看庫存);晶類(碎晶 / 水晶 / 晶簇)與其他成分分開,集中顯示。
 * 品項可以是可製作品(例如白鋼錠),或「未展開的骨架」(= 同部位同級的原版配件,例如希爾德拉級船體骨架)。
 */

export type CrystalElement = '火' | '冰' | '風' | '土' | '雷' | '水';
export type CrystalTier = '碎晶' | '水晶' | '晶簇';

/** 遊戲內元素順序(與碎晶 / 水晶 / 晶簇分組一致) */
export const CRYSTAL_ELEMENTS: readonly CrystalElement[] = ['火', '冰', '風', '土', '雷', '水'];

export interface TreeCrystal {
  name: string;
  qty: number;
  element: CrystalElement;
  tier: CrystalTier;
}

export interface TreeItem {
  name: string;
  qty: number;
  /** 這個成分本身也能製作時的子樹;基礎素材為 null */
  child: TreeNode | null;
}

export interface TreeNode {
  name: string;
  /** 一次製作產出幾個(沒有標示為 1) */
  yield: number;
  crystals: TreeCrystal[];
  items: TreeItem[];
}

const CRYSTAL = /^(火|冰|風|土|雷|水)之(碎晶|水晶|晶簇)$/;

/** 「火之碎晶」→ { element: '火', tier: '碎晶' };不是晶類回 null */
export function parseCrystal(name: string): { element: CrystalElement; tier: CrystalTier } | null {
  const m = CRYSTAL.exec(name);
  return m ? { element: m[1] as CrystalElement, tier: m[2] as CrystalTier } : null;
}

const MAX_DEPTH = 8;

function nodeOf(name: string, recipe: Recipe, yld: number, data: CraftData, depth: number): TreeNode {
  const crystals: TreeCrystal[] = [];
  const items: TreeItem[] = [];
  for (const [n, qty] of Object.entries(recipe)) {
    const c = parseCrystal(n);
    if (c) {
      crystals.push({ name: n, qty, ...c });
      continue;
    }
    const sub = data.crafts[n];
    items.push({ name: n, qty, child: sub && depth < MAX_DEPTH ? nodeOf(n, sub.recipe, sub.yield ?? 1, data, depth + 1) : null });
  }
  return { name, yield: yld, crystals, items };
}

/** 骨架的名稱 → 它的配方(同部位同級的原版配件);不是骨架回 undefined */
function frameRecipe(name: string, data: CraftData): Recipe | undefined {
  for (const slot of Object.keys(data.slots) as SlotKey[]) {
    for (let grade = 1; grade <= 5; grade++) {
      if (frameName(slot, grade) !== name) continue;
      return data.slots[slot].grades.find((g) => g.grade === grade && !g.modified)?.recipe;
    }
  }
  return undefined;
}

/** 這個品項的配方樹;基礎素材或不認得的名稱回 null */
export function buildTree(name: string, data: CraftData = CRAFT_DATA): TreeNode | null {
  const c = data.crafts[name];
  if (c) return nodeOf(name, c.recipe, c.yield ?? 1, data, 1);
  const f = frameRecipe(name, data);
  return f ? nodeOf(name, f, 1, data, 1) : null;
}

const known = new Map<string, boolean>();
/** 有沒有配方樹(畫面上決定第二次點擊要開配方樹還是取消追蹤);預設資料有記憶化 */
export function hasTree(name: string, data: CraftData = CRAFT_DATA): boolean {
  if (data !== CRAFT_DATA) return buildTree(name, data) !== null;
  let v = known.get(name);
  if (v === undefined) {
    v = buildTree(name, data) !== null;
    known.set(name, v);
  }
  return v;
}
