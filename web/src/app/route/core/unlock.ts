import type { SeaIndex } from './route';

// 解鎖樹(D-213):航點資料的 `unlocks` 是「探索這個點之後會解鎖哪些點」。
// 全部海域的航點 id 不重複,而且每個點最多只有一個「上一個點」(單親樹);
// 沒有上一個點的是根(溺沒海 A、B)。各海域的 A 由前一海域的某個點解鎖(跨海域也算同一棵樹)。
// 遊戲規則:收艇之後,總覽報告才會寫出開啟的新航點,所以「去過」= 派出去並且回來。

export interface UnlockGraph {
  /** 航點 id → 上一個點(根沒有) */
  parent: ReadonlyMap<number, number>;
  /** 航點 id → 它解鎖的點 */
  children: ReadonlyMap<number, readonly number[]>;
  /** 航點 id → 所在海域 */
  seaOf: ReadonlyMap<number, SeaIndex>;
}

export function buildUnlockGraph(seas: readonly SeaIndex[]): UnlockGraph {
  const parent = new Map<number, number>();
  const children = new Map<number, number[]>();
  const seaOf = new Map<number, SeaIndex>();
  for (const si of seas) {
    for (const p of si.sea.points) {
      seaOf.set(p.id, si);
      children.set(p.id, [...p.unlocks]);
    }
  }
  for (const si of seas) {
    for (const p of si.sea.points) for (const c of p.unlocks) if (seaOf.has(c)) parent.set(c, p.id);
  }
  return { parent, children, seaOf };
}

/** 從根到上一個點,不含自己 */
export function ancestorsOf(g: UnlockGraph, id: number): number[] {
  const out: number[] = [];
  for (let p = g.parent.get(id); p !== undefined; p = g.parent.get(p)) out.unshift(p);
  return out;
}

/** 底下全部解鎖的點(含跨海域),不含自己 */
export function descendantsOf(g: UnlockGraph, id: number): number[] {
  const out: number[] = [];
  const stack = [...(g.children.get(id) ?? [])];
  while (stack.length > 0) {
    const c = stack.pop()!;
    out.push(c);
    stack.push(...(g.children.get(c) ?? []));
  }
  return out;
}

/** 標記「去過」:這個點和它前面的所有點一起(去過 Q 就一定去過 B、E、I、K、P) */
export function markExplored(g: UnlockGraph, explored: ReadonlySet<number>, id: number): { next: Set<number>; added: number[] } {
  const next = new Set(explored);
  const added: number[] = [];
  for (const x of [...ancestorsOf(g, id), id]) {
    if (!next.has(x)) {
      next.add(x);
      added.push(x);
    }
  }
  return { next, added };
}

/** 取消「去過」:這個點和它後面的所有點一起(沒去過 K,就不可能去過 K 之後的點) */
export function unmarkExplored(g: UnlockGraph, explored: ReadonlySet<number>, id: number): { next: Set<number>; removed: number[] } {
  const next = new Set(explored);
  const removed: number[] = [];
  for (const x of [id, ...descendantsOf(g, id)]) if (next.delete(x)) removed.push(x);
  return { next, removed };
}

/** 讀回來的資料整理:只留已知的航點,並補上前面的點,維持「去過的點,前面的點一定去過」 */
export function closeExplored(g: UnlockGraph, raw: Iterable<unknown>): Set<number> {
  const out = new Set<number>();
  for (const v of raw) {
    if (typeof v !== 'number' || !g.seaOf.has(v)) continue;
    out.add(v);
    for (const a of ancestorsOf(g, v)) out.add(a);
  }
  return out;
}

/** 現在可以去的點:還沒去過,而且上一個點去過(或沒有上一個點) */
export function isAvailable(g: UnlockGraph, explored: ReadonlySet<number>, id: number): boolean {
  if (explored.has(id)) return false;
  const p = g.parent.get(id);
  return p === undefined || explored.has(p);
}

export type ExploreState = 'done' | 'open' | 'locked';

export function exploreState(g: UnlockGraph, explored: ReadonlySet<number>, id: number): ExploreState {
  if (explored.has(id)) return 'done';
  return isAvailable(g, explored, id) ? 'open' : 'locked';
}
