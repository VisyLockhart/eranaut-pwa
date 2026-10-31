import { UNLOCK_GRAPH, changedSeas } from './charts';
import { ancestorsOf, descendantsOf } from '../route/core/unlock';

// 選點器的「快速解鎖」(D-311):還沒確認的待解鎖航點。純函式。
// 規則同海圖更新(D-293):解鎖一個點時,前面必經的點一起解鎖(跨海域也算),不補同層的兄弟點;
// 取消一個待解鎖的點時,它後面已待解鎖的點一起取消。已發現的點不在這裡(要取消已發現得到海圖更新)。

/** 點一個未發現的點:補上它前面還沒發現的點,再加它自己。回傳新的待解鎖清單(依解鎖順序) */
export function addPending(found: ReadonlySet<number>, pending: readonly number[], id: number): number[] {
  if (found.has(id) || pending.includes(id)) return [...pending];
  const out = [...pending];
  for (const x of [...ancestorsOf(UNLOCK_GRAPH, id), id]) if (!found.has(x) && !out.includes(x)) out.push(x);
  return out;
}

/** 取消一個待解鎖的點:它和它後面已待解鎖的點一起。回傳新清單與被取消的點 */
export function removePending(pending: readonly number[], id: number): { next: number[]; removed: number[] } {
  const gone = new Set([id, ...descendantsOf(UNLOCK_GRAPH, id)]);
  return { next: pending.filter((x) => !gone.has(x)), removed: pending.filter((x) => gone.has(x)) };
}

/** 確認時要存的海域內容(`PUT /api/workshops/:id/charts`):只含有變動的海域 */
export function unlockPayload(found: ReadonlySet<number>, pending: readonly number[]): { sea: number; points: number[] }[] {
  return changedSeas(found, new Set([...found, ...pending]));
}
