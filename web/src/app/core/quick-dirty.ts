import { clampExp, type SubmarineDto } from '@eranaut/shared';
import { defaultDraft, fmtExp, type QuickProgressDraft } from './leveling-vm';
import type { SubRow } from './submarine-form';
import type { QuickUpkeepDraft } from './upkeep-vm';

/** 快速修改四個區塊的「未送出修改」清單(D-305);空陣列 = 該區沒改 */
export interface QuickChanges {
  quick: string[];
  config: string[];
  upkeep: string[];
  assist: string[];
}

export const EMPTY_CHANGES: QuickChanges = { quick: [], config: [], upkeep: [], assist: [] };

export const changeCount = (c: QuickChanges): number => c.quick.length + c.config.length + c.upkeep.length + c.assist.length;

const STATUS_TEXT = { exploring: '探索中', complete: '探索完成' } as const;

/**
 * 比較「現在填的」和「開啟當下 / 伺服器的紀錄」。維修提醒的「已跑趟數」調整是立即儲存的,不在這裡。
 * 等級 / 經驗只比較有動過的(`edited`);航線輔助比開關、模式、最長時間與條件組合。
 */
export function quickChanges(
  sub: SubmarineDto | null,
  init: SubRow | null,
  row: SubRow | null,
  upkeep: QuickUpkeepDraft | null,
  progress: QuickProgressDraft | null,
): QuickChanges {
  const out: QuickChanges = { quick: [], config: [], upkeep: [], assist: [] };
  if (row && init) {
    if (row.name.trim() !== init.name.trim()) out.quick.push('潛水艇名稱');
    if (row.status !== init.status) out.quick.push(`狀態改為${STATUS_TEXT[row.status]}`);
    if (row.d !== init.d || row.h !== init.h || row.m !== init.m) out.quick.push('剩餘時間');
    if (JSON.stringify(row.route ?? null) !== JSON.stringify(init.route ?? null)) out.quick.push('這次派出的路線');
  }
  if (!sub) return out;
  if (upkeep) {
    const was = sub.upkeep !== undefined && sub.upkeep !== null;
    if (upkeep.enabled && !was) out.upkeep.push('開啟維修提醒');
    else if (upkeep.enabled) out.upkeep.push('維修提醒的起算設定');
    else if (!upkeep.enabled && was) out.upkeep.push('關閉維修提醒');
  }
  if (progress) {
    const base = defaultDraft(sub);
    const p = sub.progress;
    if (progress.edited) {
      if (!p) out.config.push(`記錄等級 Lv ${progress.level}`);
      else {
        if (progress.level !== base.level) out.config.push(`等級 Lv ${base.level} → Lv ${progress.level}`);
        if (progress.exp !== base.exp) out.config.push(`經驗 ${fmtExp(base.exp)} → ${fmtExp(clampExp(progress.level, progress.exp))}`);
      }
    }
    const wasOn = !!p?.assist_on;
    if (progress.enabled !== wasOn) out.assist.push(progress.enabled ? '開啟航線輔助' : '關閉航線輔助');
    else if (progress.enabled && (progress.mode !== base.mode || progress.maxHours !== base.maxHours || progress.filterId !== base.filterId)) out.assist.push('航線輔助的模式設定');
  }
  return out;
}
