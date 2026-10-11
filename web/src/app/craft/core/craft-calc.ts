import partsJson from '../../route/data/parts.json';
import { CRAFT_DATA } from './data';
import type { CraftData, SlotKey } from './types';

/**
 * 配件製作的計算核心(純函式,規則見 docs/CRAFT-PROPOSAL.md §3):
 * 1. 根需求 = 各選中配件的配方 × 數量;改版配件另加骨架 ×qty(骨架 = 同部位同級的原版配件)。
 * 2. 對整份清單做拓撲排序,每個可製作品先把所有用到它的需求加總,再 `製作次數 = ceil(總需求 / 產量)`,
 *    最後依製作次數把成分往下推(不逐筆取整)。
 * 3. 欄位歸屬:不能再製作 → 素材;直接被配件(含展開的骨架)使用的可製作品 → 成品;其餘可製作品 → 半成品。數量一律是總需求。
 * 4. 展開骨架關:骨架是一列成品;開:骨架換成原版配件的配方併入根需求。
 */

export type RowKind = 'final' | 'semi' | 'base';

export interface Selection {
  slot: SlotKey;
  /** 0~9:對應 recipes.json 的 grades 順序(0~4 = 1~5 級,5~9 = 1改~5改) */
  gradeIndex: number;
  qty: number;
}

export interface CalcOptions {
  /** 展開骨架(預設 false) */
  expandFrame?: boolean;
}

export interface CalcRow {
  name: string;
  group: string;
  kind: RowKind;
  /** 總需求量 */
  need: number;
  /** 製作次數(素材與骨架為 0) */
  crafts: number;
  /** 實際產出量 = 製作次數 × 產量(素材與骨架為 0);大於 need 代表有剩餘 */
  made: number;
  /** 未展開的骨架列 */
  frame?: boolean;
  /** 製作它所消耗的直接成分總量(= 製作次數 × 配方);素材與骨架為空 */
  inputs: Record<string, number>;
  /** 直接使用它的可製作品名稱(不含配件本身) */
  usedBy: string[];
  /** 直接使用它的配件所屬部位(含骨架與展開骨架);只列成品會有值 */
  slots: SlotKey[];
}

export interface CalcResult {
  finals: CalcRow[];
  semis: CalcRow[];
  bases: CalcRow[];
}

/** 骨架的顯示名稱:航線資料的等級名稱 + 部位名稱 + 「骨架」,例如「希爾德拉級船體骨架」 */
export function frameName(slot: SlotKey, grade: number): string {
  const p = (partsJson as unknown as { parts: Record<SlotKey, { label: string; grades: { grade: number; modified: boolean; name: string }[] }> }).parts[slot];
  const g = p.grades.find((x) => x.grade === grade && !x.modified);
  return `${g?.name ?? `${grade}級`}${p.label}骨架`;
}

const GROUP_ORDER = ['碎晶', '水晶', '晶簇', '礦石', '石材', '金屬', '木材', '布料與皮革', '鍊金原料', '骨架', '其他'];
/** 分組的固定顯示順序(未知分組排最後) */
export function groupRank(group: string): number {
  const i = GROUP_ORDER.indexOf(group);
  return i < 0 ? GROUP_ORDER.length : i;
}

export function calculate(selections: readonly Selection[], opts: CalcOptions = {}, data: CraftData = CRAFT_DATA): CalcResult {
  const { base, crafts, slots } = data;
  const expand = opts.expandFrame === true;

  // 1. 根需求
  const roots = new Map<string, number>(); // 可製作品或素材 → 數量
  const rootSlots = new Map<string, Set<SlotKey>>();
  const frames = new Map<string, { qty: number; slot: SlotKey }>();
  const addRoot = (name: string, qty: number, slot: SlotKey) => {
    roots.set(name, (roots.get(name) ?? 0) + qty);
    (rootSlots.get(name) ?? rootSlots.set(name, new Set()).get(name)!).add(slot);
  };
  for (const s of selections) {
    const qty = Math.floor(s.qty);
    const g = slots[s.slot]?.grades[s.gradeIndex];
    if (!g || !(qty >= 1)) continue;
    for (const [n, q] of Object.entries(g.recipe)) addRoot(n, q * qty, s.slot);
    if (g.frame) {
      const fq = g.frame.qty * qty;
      if (expand) {
        const orig = slots[s.slot].grades.find((x) => x.grade === g.frame!.grade && !x.modified);
        if (orig) for (const [n, q] of Object.entries(orig.recipe)) addRoot(n, q * fq, s.slot);
      } else {
        const name = frameName(s.slot, g.frame.grade);
        const prev = frames.get(name);
        frames.set(name, { qty: (prev?.qty ?? 0) + fq, slot: s.slot });
      }
    }
  }

  // 2. 拓撲排序(只含可製作品):被用到的排在前面
  const order: string[] = [];
  const seen = new Set<string>();
  const dfs = (n: string) => {
    if (seen.has(n) || !(n in crafts)) return;
    seen.add(n);
    for (const c of Object.keys(crafts[n]!.recipe)) dfs(c);
    order.push(n);
  };
  for (const n of roots.keys()) dfs(n);
  order.reverse();

  // 3. 彙總需求、取整、往下推
  const need = new Map<string, number>(roots);
  const craftCount = new Map<string, number>();
  const inputs = new Map<string, Record<string, number>>();
  const usedBy = new Map<string, Set<string>>();
  for (const n of order) {
    const c = crafts[n]!;
    const times = Math.ceil((need.get(n) ?? 0) / (c.yield ?? 1));
    craftCount.set(n, times);
    const inp: Record<string, number> = {};
    for (const [x, q] of Object.entries(c.recipe)) {
      inp[x] = times * q;
      need.set(x, (need.get(x) ?? 0) + times * q);
      (usedBy.get(x) ?? usedBy.set(x, new Set()).get(x)!).add(n);
    }
    inputs.set(n, inp);
  }

  // 4. 歸類
  const finals: CalcRow[] = [];
  const semis: CalcRow[] = [];
  const bases: CalcRow[] = [];
  for (const [name, f] of frames) {
    finals.push({ name, group: '骨架', kind: 'final', need: f.qty, crafts: 0, made: 0, frame: true, inputs: {}, usedBy: [], slots: [f.slot] });
  }
  for (const [name, total] of need) {
    const ub = [...(usedBy.get(name) ?? [])];
    if (name in crafts) {
      const c = crafts[name]!;
      const times = craftCount.get(name) ?? 0;
      const row: CalcRow = {
        name, group: c.group, kind: roots.has(name) ? 'final' : 'semi', need: total, crafts: times, made: times * (c.yield ?? 1),
        inputs: inputs.get(name) ?? {}, usedBy: ub, slots: [...(rootSlots.get(name) ?? [])],
      };
      (row.kind === 'final' ? finals : semis).push(row);
    } else {
      bases.push({ name, group: base[name]?.group ?? '其他', kind: 'base', need: total, crafts: 0, made: 0, inputs: {}, usedBy: ub, slots: [...(rootSlots.get(name) ?? [])] });
    }
  }
  return { finals, semis, bases };
}
