import partsJson from '../route/data/parts.json';
import { CRAFT_DATA, SLOT_KEYS } from './core/data';
import { groupRank, type CalcRow } from './core/craft-calc';
import type { CraftData, SlotKey } from './core/types';

/** 單一部位的選擇:gradeIndex 0~9(0~4 = 1~5 級,5~9 = 1改~5改),null = 沒選 */
export interface SlotSel {
  gradeIndex: number | null;
  qty: number;
}
export type SelMap = Record<SlotKey, SlotSel>;
export type CraftTab = 'finals' | 'semis' | 'bases';
export interface CraftView {
  expandFrame: boolean;
  stockMode: boolean;
  onlyMissing: boolean;
  slotsCollapsed: boolean;
  tab: CraftTab;
}

export const MAX_QTY = 99;
export const GRADE_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const TAB_LABEL: Record<CraftTab, string> = { finals: '成品', semis: '半成品', bases: '素材' };
export const TABS: CraftTab[] = ['finals', 'semis', 'bases'];

export function gradeLabel(i: number): string {
  return i < 5 ? `${i + 1}` : `${i - 4}改`;
}

export function clampQty(n: unknown): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(MAX_QTY, Math.max(1, v)) : 1;
}

export function emptySel(): SelMap {
  return { hull: { gradeIndex: null, qty: 1 }, stern: { gradeIndex: null, qty: 1 }, bow: { gradeIndex: null, qty: 1 }, bridge: { gradeIndex: null, qty: 1 } };
}

export const DEFAULT_VIEW: CraftView = { expandFrame: false, stockMode: false, onlyMissing: false, slotsCollapsed: false, tab: 'finals' };

/** 讀 localStorage 的內容一律當不可信:型別、範圍不對就丟掉 */
export function sanitizeSel(raw: unknown): SelMap {
  const out = emptySel();
  if (!raw || typeof raw !== 'object') return out;
  for (const k of SLOT_KEYS) {
    const v = (raw as Record<string, unknown>)[k] as Partial<SlotSel> | undefined;
    if (!v || typeof v !== 'object') continue;
    const gi = v.gradeIndex;
    if (typeof gi === 'number' && Number.isInteger(gi) && gi >= 0 && gi <= 9) out[k] = { gradeIndex: gi, qty: clampQty(v.qty) };
  }
  return out;
}

export function sanitizeView(raw: unknown): CraftView {
  const v = { ...DEFAULT_VIEW };
  if (!raw || typeof raw !== 'object') return v;
  const r = raw as Record<string, unknown>;
  if (typeof r['expandFrame'] === 'boolean') v.expandFrame = r['expandFrame'];
  if (typeof r['stockMode'] === 'boolean') v.stockMode = r['stockMode'];
  if (typeof r['onlyMissing'] === 'boolean') v.onlyMissing = r['onlyMissing'];
  if (typeof r['slotsCollapsed'] === 'boolean') v.slotsCollapsed = r['slotsCollapsed'];
  if (r['tab'] === 'finals' || r['tab'] === 'semis' || r['tab'] === 'bases') v.tab = r['tab'];
  return v;
}

/** 庫存:只留已知品項、正整數(上限 99999) */
export function sanitizeStock(raw: unknown, data: CraftData = CRAFT_DATA): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!(name in data.base) && !(name in data.crafts)) continue;
    const n = Math.floor(Number(val));
    if (Number.isFinite(n) && n > 0) out[name] = Math.min(99999, n);
  }
  return out;
}

export function missing(row: CalcRow, stock: Readonly<Record<string, number>>): number {
  return Math.max(0, row.need - (stock[row.name] ?? 0));
}

export interface RowGroup {
  group: string;
  rows: CalcRow[];
}

/** 依固定的分組順序分組;同組內維持計算核心給的順序 */
export function groupRows(rows: readonly CalcRow[]): RowGroup[] {
  const map = new Map<string, CalcRow[]>();
  for (const r of rows) (map.get(r.group) ?? map.set(r.group, []).get(r.group)!).push(r);
  return [...map.entries()].sort((a, b) => groupRank(a[0]) - groupRank(b[0])).map(([group, rs]) => ({ group, rows: rs }));
}

/** 複製清單:一行「名稱 ×數量」;記錄庫存時只列還缺的、數量為缺少量 */
export function copyLines(rows: readonly CalcRow[], stock: Readonly<Record<string, number>> | null): string[] {
  const out: string[] = [];
  for (const g of groupRows(rows)) {
    for (const r of g.rows) {
      const n = stock ? missing(r, stock) : r.need;
      if (n > 0) out.push(`${r.name} ×${n}`);
    }
  }
  return out;
}

/** 選到的配件顯示資訊:名稱(航線資料的等級名稱)、部位名稱、英文代號(改級用後綴「+」,與配置功能一致,例:SM → S+) */
export interface GradeInfo {
  /** 例:鯊魚改級 */
  name: string;
  /** 例:船體 */
  part: string;
  /** 例:S+ */
  code: string;
}

type PartsJson = Record<SlotKey, { label: string; grades: { code: string; name: string }[] }>;

export function gradeInfo(slot: SlotKey, gradeIndex: number): GradeInfo | null {
  const p = (partsJson as unknown as { parts: PartsJson }).parts[slot];
  const g = p?.grades[gradeIndex];
  const base = p?.grades[gradeIndex % 5];
  if (!g || !base) return null;
  return { name: g.name, part: p.label, code: base.code + (gradeIndex >= 5 ? '+' : '') };
}
