import { rowId } from '../craft-state';
import type { CalcResult, CalcRow } from './craft-calc';
import { CRAFT_DATA } from './data';
import type { CraftData } from './types';

/**
 * 素材用途(D-347):某個素材被哪些可製作品用到,由下往上看。純函式。
 * 以「不看庫存」的完整結果計算(用量 = 製作次數 × 配方,庫存不會讓用途消失),
 * 再用實際結果標出哪些已備齊(該品項還要製作的次數為 0)。
 */
export interface UsageItem {
  name: string;
  /** 目前配置下,它製作所消耗的這個素材總量(不看庫存) */
  qty: number;
  layer: 'final' | 'direct';
  layerLabel: string;
  /** 已備齊:有開記錄庫存且庫存已夠做出它(不必再製作) */
  covered: boolean;
  /** 它再被誰用到:交納素材 = 配件部位;直接素材 = 用到它的品項 */
  via: string[];
}
export interface UsageView {
  name: string;
  /** 目前配置共需這個素材的量(不看庫存) */
  total: number;
  items: UsageItem[];
}

const LAYER_LABEL = { final: '交納素材', direct: '直接素材' } as const;

export function usageOf(name: string, full: CalcResult, actual: CalcResult, data: CraftData = CRAFT_DATA): UsageView {
  const done = new Map<string, boolean>();
  for (const r of [...actual.finals, ...actual.directs]) done.set(rowId(r), r.crafts === 0 && r.name in data.crafts);
  const items: UsageItem[] = [];
  const push = (r: CalcRow, layer: 'final' | 'direct') => {
    const qty = r.inputs[name] ?? 0;
    if (qty <= 0) return;
    const via = layer === 'final' ? r.slots.map((s) => data.slots[s]?.label ?? s) : r.usedBy.filter((n) => n !== r.name);
    items.push({ name: r.name, qty, layer, layerLabel: LAYER_LABEL[layer], covered: done.get(rowId(r)) === true, via });
  };
  for (const r of full.finals) push(r, 'final');
  for (const r of full.directs) push(r, 'direct');
  items.sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name, 'zh-Hant'));
  const base = full.bases.find((r) => r.name === name);
  return { name, total: base?.need ?? items.reduce((s, i) => s + i.qty, 0), items };
}
