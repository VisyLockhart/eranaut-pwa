import partsJson from '../route/data/parts.json';
import { compareNames } from '../core/name-sort';
import { CRAFT_DATA, SLOT_KEYS } from './core/data';
import { DIRECT_PREFIX, frameName, groupRank, type CalcRow } from './core/craft-calc';
import type { CraftData, SlotKey } from './core/types';

/** 單一部位的選擇:gradeIndex 0~9(0~4 = 1~5 級,5~9 = 1改~5改),null = 沒選 */
export interface SlotSel {
  gradeIndex: number | null;
  qty: number;
}
export type SelMap = Record<SlotKey, SlotSel>;
export type CraftTab = 'finals' | 'directs' | 'bases';
/** 排序方式:按種類(分組,組內按名稱)/ 按名稱(不分組) */
export type CraftSort = 'group' | 'name';
export interface CraftView {
  expandFrame: boolean;
  stockMode: boolean;
  onlyMissing: boolean;
  slotsCollapsed: boolean;
  tab: CraftTab;
  sort: CraftSort;
}

export const MAX_QTY = 99;
export const GRADE_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const TAB_LABEL: Record<CraftTab, string> = { finals: '交納素材', directs: '直接素材', bases: '基礎素材' };
export const TABS: CraftTab[] = ['finals', 'directs', 'bases'];

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

export const DEFAULT_VIEW: CraftView = { expandFrame: false, stockMode: false, onlyMissing: false, slotsCollapsed: false, tab: 'finals', sort: 'group' };

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
  if (r['sort'] === 'group' || r['sort'] === 'name') v.sort = r['sort'];
  if (r['tab'] === 'finals' || r['tab'] === 'directs' || r['tab'] === 'bases') v.tab = r['tab'];
  else if (r['tab'] === 'semis') v.tab = 'directs'; // 舊版的「半成品」欄 = 現在的直接素材
  return v;
}

/**
 * 庫存:只留已知的 key、正整數(上限 99999)。key 的規則見 craft-calc.ts 檔頭:
 * 品項名稱(交納素材、素材、骨架)或 `d:品項名稱`(直接素材裡的可製作品)。
 * 舊版(D-258 以前)沒有前綴:不是任何配件配方直接用到的可製作品(= 舊版的半成品)搬到 `d:`,其餘維持原 key。
 */
export function sanitizeStock(raw: unknown, data: CraftData = CRAFT_DATA): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  const roots = new Set<string>();
  const frames = new Set<string>();
  for (const [slot, s] of Object.entries(data.slots)) {
    for (const g of s.grades) for (const n of Object.keys(g.recipe)) roots.add(n);
    for (let grade = 1; grade <= 5; grade++) frames.add(frameName(slot as SlotKey, grade));
  }
  const legacy: [string, number][] = [];
  for (const [k, val] of Object.entries(raw as Record<string, unknown>)) {
    const n = Math.floor(Number(val));
    if (!Number.isFinite(n) || n <= 0) continue;
    const v = Math.min(99999, n);
    if (k.startsWith(DIRECT_PREFIX)) {
      if (k.slice(DIRECT_PREFIX.length) in data.crafts) out[k] = v;
    } else if (k in data.crafts) {
      if (roots.has(k)) out[k] = v;
      else legacy.push([DIRECT_PREFIX + k, v]);
    } else if (k in data.base || frames.has(k)) out[k] = v;
  }
  for (const [k, v] of legacy) if (!(k in out)) out[k] = v;
  return out;
}

export function missing(row: CalcRow, stock: Readonly<Record<string, number>>): number {
  return Math.max(0, row.need - (stock[row.key] ?? 0));
}

export interface RowGroup {
  group: string;
  rows: CalcRow[];
  /** 追蹤分類(置頂,不收合) */
  trace?: boolean;
}

/** 追蹤分類的名稱 */
export const TRACE_GROUP = '追蹤';

export { compareNames };

/** 碎晶 / 水晶 / 晶簇維持遊戲內的元素順序(不套名稱排序) */
const ELEMENT_ORDER = ['火', '冰', '風', '土', '雷', '水'];
const ELEMENT_GROUPS = new Set(['碎晶', '水晶', '晶簇']);
function elementRank(name: string): number {
  const i = ELEMENT_ORDER.indexOf(name[0] ?? '');
  return i < 0 ? ELEMENT_ORDER.length : i;
}

/** 按種類:依固定的分組順序分組,組內依名稱排序(元素類依遊戲順序);按名稱:單一組(group 為空字串)依名稱排序 */
export function groupRows(rows: readonly CalcRow[], sort: CraftSort = 'group'): RowGroup[] {
  const byName = (a: CalcRow, b: CalcRow) => compareNames(a.name, b.name);
  if (sort === 'name') return rows.length > 0 ? [{ group: '', rows: [...rows].sort(byName) }] : [];
  const map = new Map<string, CalcRow[]>();
  for (const r of rows) (map.get(r.group) ?? map.set(r.group, []).get(r.group)!).push(r);
  return [...map.entries()]
    .sort((a, b) => groupRank(a[0]) - groupRank(b[0]))
    .map(([group, rs]) => ({ group, rows: [...rs].sort(ELEMENT_GROUPS.has(group) ? (a, b) => elementRank(a.name) - elementRank(b.name) || byName(a, b) : byName) }));
}

/** 加上追蹤分類:被追蹤的列與它的關聯項目移到最上面(被點的列排第一),其餘照排序方式 */
export function listGroups(rows: readonly CalcRow[], sort: CraftSort, pin: string | null, related: ReadonlySet<string>): RowGroup[] {
  if (!pin) return groupRows(rows, sort);
  const hit = (r: CalcRow) => r.name === pin || related.has(r.name);
  const traced = rows.filter(hit).sort((a, b) => Number(b.name === pin) - Number(a.name === pin) || compareNames(a.name, b.name));
  const rest = groupRows(rows.filter((r) => !hit(r)), sort);
  return traced.length > 0 ? [{ group: TRACE_GROUP, rows: traced, trace: true }, ...rest] : rest;
}

/** 複製清單:一行「名稱 ×數量」;記錄庫存時只列還缺的、數量為缺少量 */
export function copyLines(rows: readonly CalcRow[], stock: Readonly<Record<string, number>> | null, sort: CraftSort = 'group'): string[] {
  const out: string[] = [];
  for (const g of groupRows(rows, sort)) {
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
