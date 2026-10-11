import partsJson from '../../route/data/parts.json';
import { CRAFT_DATA } from './data';
import type { CraftData, Recipe, SlotKey } from './types';

/**
 * 配件製作的計算核心(純函式,規則見 docs/CRAFT-PROPOSAL.md §3、D-258)。三層,每一層只由上一層推出,與 5p 工坊一致:
 * 1. 交納素材 = 各選中配件的配方 × 數量(遊戲交納畫面要的東西);改版配件另加骨架 ×qty(骨架 = 同部位同級的原版配件)。
 * 2. 直接素材 = 把還沒備齊的交納素材各做一輪(製作次數 = ceil(還缺 / 產量))所需的成分:半成品與直接用到的素材,
 *    含碎晶/水晶/晶簇——只算做交納素材本身用掉的,做半成品用的算在下一層。
 * 3. 基礎素材 = 把還沒備齊的直接素材(可製作品)再做一輪,加上直接素材裡本來就是素材的部分。
 *    更深的製作鏈(目前資料沒有)照拓撲順序彙總後取整往下推。
 * 同一個品項可以同時在交納素材與直接素材出現(例如白鋼錠:要交的 54 個,加上做鉚釘用的 54 個)。
 * 庫存(stock)由上往下連動:備齊的交納素材不必再做 → 直接素材與基礎素材相應減少;備齊的直接素材同理。
 * 庫存的 key:交納素材與素材用品項名稱;直接素材裡的可製作品用 `d:品項名稱`(與同名的交納素材分開記)。
 * 列一律保留(庫存讓需求變 0 時列不消失)。
 * 展開骨架關:骨架是一列交納素材;開:骨架換成原版配件的配方併入交納素材。
 */

export type RowKind = 'final' | 'direct' | 'base';

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

export type Stock = Readonly<Record<string, number>>;

export interface CalcRow {
  name: string;
  /** 庫存的儲存 key(見檔頭) */
  key: string;
  group: string;
  kind: RowKind;
  /** 需求量(交納素材 = 配方數量;直接素材、基礎素材 = 扣掉上層庫存後的量) */
  need: number;
  /** 還要製作的次數(素材與骨架為 0) */
  crafts: number;
  /** 還要製作的產出量 = 製作次數 × 產量(素材與骨架為 0) */
  made: number;
  /** 未展開的骨架列 */
  frame?: boolean;
  /** 製作它所消耗的直接成分總量(= 製作次數 × 配方;次數為 0 時值為 0,但成分仍列出供追蹤);素材與骨架為空 */
  inputs: Record<string, number>;
  /** 直接使用它的可製作品名稱(不含配件本身) */
  usedBy: string[];
  /** 直接使用它的配件所屬部位(含骨架與展開骨架);只有交納素材會有值 */
  slots: SlotKey[];
}

export interface CalcResult {
  finals: CalcRow[];
  directs: CalcRow[];
  bases: CalcRow[];
}

export const DIRECT_PREFIX = 'd:';
/** 直接素材欄的庫存 key:可製作品加前綴,素材用原名 */
export function directKey(name: string, data: CraftData = CRAFT_DATA): string {
  return name in data.crafts ? DIRECT_PREFIX + name : name;
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

export function calculate(selections: readonly Selection[], opts: CalcOptions = {}, data: CraftData = CRAFT_DATA, stock: Stock = {}): CalcResult {
  const { base, crafts, slots } = data;
  const expand = opts.expandFrame === true;
  const have = (key: string) => stock[key] ?? 0;
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);

  // 1. 交納素材(根需求)
  const roots = new Map<string, number>();
  const rootSlots = new Map<string, Set<SlotKey>>();
  const frames = new Map<string, { qty: number; slot: SlotKey }>();
  const addRoot = (name: string, qty: number, slot: SlotKey) => {
    add(roots, name, qty);
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

  const usedBy = new Map<string, Set<string>>();
  const note = (parent: string, recipe: Recipe) => {
    for (const x of Object.keys(recipe)) (usedBy.get(x) ?? usedBy.set(x, new Set()).get(x)!).add(parent);
  };
  /** 做 times 次:回傳成分用量,並把用量加進 into */
  const craftOnce = (name: string, times: number, into: Map<string, number>): Record<string, number> => {
    const c = crafts[name]!;
    const inp: Record<string, number> = {};
    for (const [x, q] of Object.entries(c.recipe)) {
      inp[x] = times * q;
      add(into, x, times * q);
    }
    note(name, c.recipe);
    return inp;
  };
  const rawGroup = (name: string) => base[name]?.group ?? '其他';

  // 2. 交納素材 → 直接素材
  const finals: CalcRow[] = [];
  const d2 = new Map<string, number>();
  const d3 = new Map<string, number>();
  for (const [name, f] of frames) {
    finals.push({ name, key: name, group: '骨架', kind: 'final', need: f.qty, crafts: 0, made: 0, frame: true, inputs: {}, usedBy: [], slots: [f.slot] });
  }
  for (const [name, n] of roots) {
    const c = crafts[name];
    const sl = [...(rootSlots.get(name) ?? [])];
    if (!c) {
      // 配件直接要的素材(目前資料沒有):算在基礎素材
      add(d3, name, n);
      finals.push({ name, key: name, group: rawGroup(name), kind: 'final', need: n, crafts: 0, made: 0, inputs: {}, usedBy: [], slots: sl });
      continue;
    }
    const times = Math.ceil(Math.max(0, n - have(name)) / (c.yield ?? 1));
    finals.push({ name, key: name, group: c.group, kind: 'final', need: n, crafts: times, made: times * (c.yield ?? 1), inputs: craftOnce(name, times, d2), usedBy: [], slots: sl });
  }

  // 3. 直接素材 → 基礎素材
  const directs: CalcRow[] = [];
  for (const [name, need] of d2) {
    const c = crafts[name];
    if (!c) {
      add(d3, name, need);
      directs.push({ name, key: name, group: rawGroup(name), kind: 'direct', need, crafts: 0, made: 0, inputs: {}, usedBy: [], slots: [] });
      continue;
    }
    const key = DIRECT_PREFIX + name;
    const times = Math.ceil(Math.max(0, need - have(key)) / (c.yield ?? 1));
    directs.push({ name, key, group: c.group, kind: 'direct', need, crafts: times, made: times * (c.yield ?? 1), inputs: craftOnce(name, times, d3), usedBy: [], slots: [] });
  }

  // 4. 更深的製作鏈:d3 裡剩下的可製作品,照拓撲順序彙總後取整往下推
  const order: string[] = [];
  const seen = new Set<string>();
  const dfs = (n: string) => {
    if (seen.has(n) || !(n in crafts)) return;
    seen.add(n);
    for (const x of Object.keys(crafts[n]!.recipe)) dfs(x);
    order.push(n);
  };
  for (const n of [...d3.keys()]) dfs(n);
  order.reverse();
  for (const n of order) craftOnce(n, Math.ceil((d3.get(n) ?? 0) / (crafts[n]!.yield ?? 1)), d3);

  const bases: CalcRow[] = [];
  for (const [name, need] of d3) {
    if (name in crafts) continue;
    bases.push({ name, key: name, group: rawGroup(name), kind: 'base', need, crafts: 0, made: 0, inputs: {}, usedBy: [], slots: [] });
  }
  for (const r of [...finals, ...directs, ...bases]) r.usedBy = [...(usedBy.get(r.name) ?? [])];
  return { finals, directs, bases };
}
