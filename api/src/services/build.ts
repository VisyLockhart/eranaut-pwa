import type { BuildInput } from '@eranaut/shared';
import { ROUTE_PART_KEYS, ROUTE_PART_MAX, upkeepLimitFor, upkeepPartsSig } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { saveBuild } from '../repo/build.js';
import { getUpkeepRouteKey, resyncAfterRepair } from '../repo/upkeep.js';

// 潛艇自己的配件(D-296)。欄位驗證 + 寫入;範圍是程式常數、DB 不加 CHECK。

/** 配件欄位驗證(更新潛艇與 `PUT /api/submarines/:id/build` 共用);不合法回錯誤碼 */
export function validateBuildInput(u: unknown): BuildInput | 'invalid_type' | 'invalid_value' {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) return 'invalid_type';
  const o = u as Record<string, unknown>;
  const out = {} as BuildInput;
  for (const k of ROUTE_PART_KEYS) {
    const v = o[k];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > ROUTE_PART_MAX) return 'invalid_value';
    out[k] = v;
  }
  if (o.mark_repaired !== undefined) {
    if (typeof o.mark_repaired !== 'boolean') return 'invalid_value';
    out.mark_repaired = o.mark_repaired;
  }
  return out;
}

/**
 * 設定這艘的配件。`mark_repaired` 且這艘有開維修提醒:趟數歸 0、記錄維修時間,零件簽名與上限依新配件重算。
 * 沒勾時維修提醒原樣保留(零件簽名不同 = 面板顯示「配件已變更」)。
 */
export function applyBuild(db: Db, submarineId: string, input: BuildInput, now: Date): void {
  const parts = { hull: input.hull, stern: input.stern, bow: input.bow, bridge: input.bridge };
  saveBuild(db, submarineId, parts, now);
  if (!input.mark_repaired) return;
  const routeKey = getUpkeepRouteKey(db, submarineId);
  if (routeKey === undefined) return;
  resyncAfterRepair(db, submarineId, upkeepPartsSig(parts), upkeepLimitFor(parts, routeKey), now);
}
