import type { WorkshopChartDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { SEAS, SEA_INDEXES } from '../route/core/data';
import { buildUnlockGraph, closeExplored, type UnlockGraph } from '../route/core/unlock';

// 海圖探索(D-293):每間工坊已發現的航點。純函式,不碰畫面與網路。
// 「已發現」= 海圖上看得到的點(探索相鄰的上一個點時開出、還沒走過也算)。已發現的點,它前一個點一定已探索過、也已發現,
// 所以已發現的集合和「去過」一樣是一棵樹的前綴(跨海域:灰海 A 的上一個點是溺沒海 AD),標記與取消沿用 core/unlock。
// 注意:同一個點解鎖的兄弟點不一定同時出現(樣本:溺沒海 AA 之後 AB 有、AC 沒有),所以不能由「探索了上一個點」推算。

/** 解鎖樹(全部海域);航線頁的「標記去過」也用這一棵 */
export const UNLOCK_GRAPH: UnlockGraph = buildUnlockGraph(SEA_INDEXES);

/** 工坊已發現的航點;還沒有任何紀錄回 null(= 未記錄,不是「什麼都沒發現」) */
export function foundOf(ws: Pick<WorkshopWithSubmarines, 'charts'> | null | undefined): ReadonlySet<number> | null {
  const charts = ws?.charts;
  if (!charts || charts.length === 0) return null;
  return closeExplored(
    UNLOCK_GRAPH,
    charts.flatMap((c) => c.points),
  );
}

export interface ChartSeaSummary {
  sea: number;
  name: string;
  found: number;
  total: number;
}

export interface ChartSummary {
  /** 有已發現航點的海域(依海域順序) */
  seas: ChartSeaSummary[];
  /** 最後一次更新的時間戳;沒有紀錄為 null */
  updatedAt: number | null;
  /** 上次更新後返航過(或更新過潛艇)的艘數:可能開了新點,提示使用者更新海圖 */
  returnedSince: number;
}

/** 各海域已發現 / 全部的點數 */
export function seaCounts(found: ReadonlySet<number>): ChartSeaSummary[] {
  return SEAS.map((s) => ({ sea: s.sea, name: s.name, found: s.points.filter((p) => found.has(p.id)).length, total: s.points.length })).filter((s) => s.found > 0);
}

export function chartSummary(ws: WorkshopWithSubmarines, now: number): ChartSummary {
  const found = foundOf(ws);
  if (!found) return { seas: [], updatedAt: null, returnedSince: 0 };
  const updatedAt = Math.max(...(ws.charts as WorkshopChartDto[]).map((c) => Date.parse(c.updated_at)));
  const returnedSince = ws.submarines.filter((s) => {
    const synced = Date.parse(s.last_synced_at);
    const eta = s.expected_return_at ? Date.parse(s.expected_return_at) : null;
    // 海圖更新後才更新過潛艇(多半是收艇後重新派出),或這段期間內返航了
    return synced > updatedAt || (eta !== null && eta > updatedAt && eta <= now);
  }).length;
  return { seas: seaCounts(found), updatedAt, returnedSince };
}

/** 兩組已發現的點不同的海域,整理成 `PUT /api/workshops/:id/charts` 的內容(該海域整筆取代;空陣列 = 刪除) */
export function changedSeas(base: ReadonlySet<number>, draft: ReadonlySet<number>): { sea: number; points: number[] }[] {
  const out: { sea: number; points: number[] }[] = [];
  for (const s of SEAS) {
    const a = s.points.filter((p) => base.has(p.id)).map((p) => p.id);
    const b = s.points.filter((p) => draft.has(p.id)).map((p) => p.id);
    if (a.length !== b.length || a.some((id, i) => id !== b[i])) out.push({ sea: s.sea, points: b });
  }
  return out;
}

/** 某海域的已發現點數 */
export function foundIn(found: ReadonlySet<number>, sea: number): number {
  return SEAS.find((s) => s.sea === sea)?.points.filter((p) => found.has(p.id)).length ?? 0;
}

export function seaName(sea: number): string {
  return SEAS.find((s) => s.sea === sea)?.name ?? `海域 ${sea}`;
}

/** 航點 id → 代號(找不到回 id 字串) */
export function pointCode(id: number): string {
  for (const s of SEAS) {
    const p = s.points.find((q) => q.id === id);
    if (p) return p.code;
  }
  return String(id);
}

/** 更新日期:今年只寫月/日 */
export function chartDate(ms: number | null, now = Date.now()): string {
  if (ms === null) return '';
  const d = new Date(ms);
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return d.getFullYear() === new Date(now).getFullYear() ? md : `${d.getFullYear()}/${md}`;
}

/** 全部海域已發現的點數 */
export function chartFound(c: ChartSummary): number {
  return c.seas.reduce((n, s) => n + s.found, 0);
}

/** 手機總覽「海圖」按鈕的無障礙說明 */
export function chartLabel(c: ChartSummary): string {
  if (c.seas.length === 0) return '海圖未記錄,開啟更新海圖';
  const seas = c.seas.map((s) => `${s.name} ${s.found}/${s.total}`).join('、');
  return `海圖:${seas}${c.returnedSince > 0 ? `,上次更新後返航 ${c.returnedSince} 艘,可能開了新點` : ''},開啟更新海圖`;
}
