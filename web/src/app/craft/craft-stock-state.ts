import { CRAFT_STOCK_LIMITS, LIMITS, type CraftStockDto, type CraftStockSpec } from '@eranaut/shared';
import { SLOT_KEYS } from './core/data';
import { migrateStockKeys, sanitizeSel, sanitizeStock, type SelMap } from './craft-state';

/** 庫存組(D-329)的純函式:規格 ↔ 畫面狀態、比較、摘要、讀快取 */

export const EMPTY_STOCK_SPEC: CraftStockSpec = { v: 1, sel: {}, stock: {} };

/** 畫面上的選擇與庫存 → 要存的規格(沒選的部位、0 庫存不放) */
export function specFrom(sel: SelMap, stock: Readonly<Record<string, number>>): CraftStockSpec {
  const out: CraftStockSpec = { v: 1, sel: {}, stock: {} };
  for (const slot of SLOT_KEYS) {
    const s = sel[slot];
    if (s.gradeIndex !== null) out.sel[slot] = { grade: s.gradeIndex, qty: s.qty };
  }
  for (const k of Object.keys(stock).sort()) {
    const v = stock[k]!;
    if (v > 0) out.stock[k] = v;
  }
  return out;
}

/** 規格 → 選擇(壞資料一律丟掉) */
export function selFromSpec(spec: CraftStockSpec): SelMap {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(spec.sel)) raw[k] = { gradeIndex: v.grade, qty: v.qty };
  return sanitizeSel(raw);
}

/** 規格 → 庫存;資料集已沒有的品項會被略過 */
export function stockFromSpec(spec: CraftStockSpec): Record<string, number> {
  return sanitizeStock(spec.stock);
}

export const selCount = (spec: CraftStockSpec): number => Object.keys(spec.sel).length;
export const stockCount = (spec: CraftStockSpec): number => Object.keys(spec.stock).length;

/** 兩份規格內容相同(不看 key 順序) */
export function sameSpec(a: CraftStockSpec, b: CraftStockSpec): boolean {
  if (selCount(a) !== selCount(b) || stockCount(a) !== stockCount(b)) return false;
  for (const [k, v] of Object.entries(a.sel)) {
    const w = b.sel[k as keyof CraftStockSpec['sel']];
    if (!w || w.grade !== v.grade || w.qty !== v.qty) return false;
  }
  for (const [k, v] of Object.entries(a.stock)) if (b.stock[k] !== v) return false;
  return true;
}

/** 目前畫面沒有任何東西(沒選配件、也沒有庫存) */
export const isBlank = (spec: CraftStockSpec): boolean => selCount(spec) === 0 && stockCount(spec) === 0;

/** 能存成庫存組:至少選了一個部位,而且記錄庫存裡有填東西(開關關著也算) */
export const canSaveSpec = (spec: CraftStockSpec): boolean => selCount(spec) > 0 && stockCount(spec) > 0;

/** 預設名稱:「庫存 月/日」 */
export function autoName(now = new Date()): string {
  return `庫存 ${now.getMonth() + 1}/${now.getDate()}`;
}

/** 「月/日」(本機時區);無法解析回空字串 */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 清單列的次要文字:「庫存 N 項 · 月/日」 */
export function stockMeta(dto: CraftStockDto): string {
  const d = shortDate(dto.updated_at);
  return `庫存 ${stockCount(dto.spec)} 項${d ? ` · ${d}` : ''}`;
}

function sanitizeSpec(raw: unknown): CraftStockSpec {
  const out: CraftStockSpec = { v: 1, sel: {}, stock: {} };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const sel = r['sel'];
  if (sel && typeof sel === 'object') {
    for (const slot of SLOT_KEYS) {
      const v = (sel as Record<string, unknown>)[slot] as { grade?: unknown; qty?: unknown } | undefined;
      if (!v || typeof v !== 'object') continue;
      const g = v.grade;
      const q = v.qty;
      if (typeof g === 'number' && Number.isInteger(g) && g >= 0 && g <= CRAFT_STOCK_LIMITS.gradeMax && typeof q === 'number' && Number.isInteger(q) && q >= 1 && q <= CRAFT_STOCK_LIMITS.qtyMax) {
        out.sel[slot] = { grade: g, qty: q };
      }
    }
  }
  const stock = r['stock'];
  if (stock && typeof stock === 'object') {
    for (const [k, v] of Object.entries(migrateStockKeys(stock as Record<string, unknown>))) {
      if (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= CRAFT_STOCK_LIMITS.stockValueMax) out.stock[k] = v;
    }
  }
  return out;
}

/** 讀伺服器回應或本機快照:形狀不對的列丟掉,最多 10 組 */
export function sanitizeStocks(raw: unknown): CraftStockDto[] {
  if (!Array.isArray(raw)) return [];
  const out: CraftStockDto[] = [];
  for (const x of raw) {
    if (typeof x !== 'object' || x === null) continue;
    const o = x as Record<string, unknown>;
    if (typeof o['id'] !== 'string' || typeof o['name'] !== 'string') continue;
    out.push({
      id: o['id'],
      name: o['name'],
      spec: sanitizeSpec(o['spec']),
      favorite: o['favorite'] === true,
      created_at: typeof o['created_at'] === 'string' ? o['created_at'] : '',
      updated_at: typeof o['updated_at'] === 'string' ? o['updated_at'] : '',
    });
    if (out.length >= LIMITS.maxCraftStocksPerUser) break;
  }
  return out;
}
