import { LIMITS, type SubmarinesLayoutInput } from '@eranaut/shared';

// 潛水艇「位置編輯」的純邏輯(D-314):固定 4 個格子 + 未排入清單。
// 操作方式有兩種,結果相同:點一下拿起、再點格子放下(手機主要用法),或拖曳(拖曳開始 = 拿起,放開 = 放下)。

export interface LayoutState {
  /** 固定 `LIMITS.maxSubmarinesPerWorkshop` 格;null = 空位 */
  slots: (string | null)[];
  /** 未排入的潛艇 id(順序 = 位置 5、6…) */
  pool: string[];
  /** 拿起來、還沒放下的潛艇 */
  held: string | null;
}

const N = LIMITS.maxSubmarinesPerWorkshop;

/** 依目前的潛艇建立初始狀態:位置 1~4 在格子裡,其餘依位置排進未排入 */
export function initLayout(subs: readonly { id: string; position: number }[]): LayoutState {
  const slots: (string | null)[] = Array.from({ length: N }, () => null);
  const pool: string[] = [];
  for (const s of [...subs].sort((a, b) => a.position - b.position)) {
    if (s.position >= 1 && s.position <= N) slots[s.position - 1] = s.id;
    else pool.push(s.id);
  }
  return { slots, pool, held: null };
}

/** 點格子:沒拿東西 → 拿起這格的潛艇;已拿著 → 放進這格(有潛艇就互換,被換下的回到原處) */
export function tapSlot(s: LayoutState, i: number): LayoutState {
  const occupant = s.slots[i] ?? null;
  if (s.held === null) return occupant === null ? s : { ...s, held: occupant };
  if (s.held === occupant) return { ...s, held: null };
  const slots = s.slots.slice();
  let pool = s.pool;
  const from = slots.indexOf(s.held);
  if (from >= 0) {
    slots[from] = occupant; // 格子之間互換(目的格是空位就是搬過去)
    slots[i] = s.held;
  } else {
    slots[i] = s.held; // 從未排入拖進來:有人就被換下去
    pool = pool.filter((x) => x !== s.held);
    if (occupant !== null) pool = [...pool, occupant];
  }
  return { slots, pool, held: null };
}

/** 點未排入清單裡的潛艇:拿起 / 再點一次放回 */
export function tapPool(s: LayoutState, id: string): LayoutState {
  return { ...s, held: s.held === id ? null : id };
}

/** 格子旁的 ✕:取消釘選,該艇移到未排入 */
export function unpin(s: LayoutState, i: number): LayoutState {
  const id = s.slots[i];
  if (id === null || id === undefined) return s;
  const slots = s.slots.slice();
  slots[i] = null;
  return { slots, pool: [...s.pool, id], held: null };
}

/** 把拿著的格子潛艇放回未排入區(拖到清單上放開) */
export function dropOnPool(s: LayoutState): LayoutState {
  if (s.held === null) return s;
  const i = s.slots.indexOf(s.held);
  return i >= 0 ? unpin(s, i) : { ...s, held: null };
}

/** 每艘潛艇現在在哪:格子序號(0~3),或 -1 = 未排入 */
function placement(s: LayoutState): Map<string, number> {
  const m = new Map<string, number>();
  s.slots.forEach((id, i) => id !== null && m.set(id, i));
  s.pool.forEach((id) => m.set(id, -1));
  return m;
}

/** 和起始狀態比,有幾艘換了地方(「有 N 處變動」);未排入清單內部換順序也算 */
export function changedCount(s: LayoutState, base: LayoutState): number {
  const a = placement(s);
  const b = placement(base);
  let n = 0;
  for (const [id, where] of a) if (b.get(id) !== where) n++;
  if (n === 0 && s.pool.some((id, i) => base.pool[i] !== id)) n = 1;
  return n;
}

export function toInput(s: LayoutState): SubmarinesLayoutInput {
  return { slots: s.slots.slice(), unplaced: s.pool.slice() };
}
