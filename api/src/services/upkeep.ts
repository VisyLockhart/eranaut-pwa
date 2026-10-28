import type { SubmarineDto, SubmarineStatus, UpkeepInput, UpkeepPatch } from '@eranaut/shared';
import { UPKEEP_LIMITS, upkeepLimitFor, upkeepPartsSig, upkeepRoute } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { getBoundParts, markRepaired, patchUpkeep, saveUpkeep } from '../repo/upkeep.js';

// 配件維修提醒的開啟與調整(D-288)。驗證在 API;資料集與計算規則在 @eranaut/shared。

/** 開啟維修提醒被拒絕(沒綁定配置、路線 / 零件沒有資料、趟數不合理);呼叫端轉成 400 */
export class UpkeepRejected extends Error {
  constructor(
    readonly reason: 'not_bound' | 'unsupported' | 'invalid_value',
    readonly position?: number,
  ) {
    super(`upkeep_rejected: ${reason}`);
  }
}

/**
 * 開啟:依目前綁定的配置零件與選定路線算出上限(未指定時),「開啟的這次更新」算第 1 趟。
 * `already_done` = 開啟前已經跑過幾趟(省略 = 0,剛維修完)。送出探索完成則只記錄已跑的趟數,下次出航才 +1。
 */
export function enableUpkeep(db: Db, submarineId: string, position: number, input: UpkeepInput, status: SubmarineStatus, now: Date): void {
  const route = upkeepRoute(input.route_key);
  const parts = getBoundParts(db, submarineId);
  if (!parts) throw new UpkeepRejected('not_bound', position);
  const computed = route ? upkeepLimitFor(parts, route.key) : null;
  if (!route || computed === null) throw new UpkeepRejected('unsupported', position);

  const limit = input.limit_voyages ?? computed;
  const already = input.already_done ?? 0;
  if (limit < UPKEEP_LIMITS.minVoyages || limit > UPKEEP_LIMITS.maxVoyages || already < 0 || already >= limit) throw new UpkeepRejected('invalid_value', position);

  saveUpkeep(
    db,
    submarineId,
    {
      route_key: route.key,
      route_sea: route.sea,
      route_points: [...route.points],
      voyages_done: already + (status === 'exploring' ? 1 : 0),
      limit_voyages: limit,
      parts_sig: upkeepPartsSig(parts),
    },
    already === 0,
    now,
  );
}

export type PatchResult = { ok: true } | { ok: false; error: 'validation_failed' | 'not_found' };

/** 手動調整趟數 / 上限(面板的 ± 修正);趟數 0..上限 */
export function applyUpkeepPatch(db: Db, submarineId: string, input: unknown, now: Date): PatchResult {
  const b = (typeof input === 'object' && input !== null && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const patch: UpkeepPatch = {};
  const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
  if (b.voyages_done !== undefined) {
    if (!isInt(b.voyages_done) || b.voyages_done < 0 || b.voyages_done > UPKEEP_LIMITS.maxVoyages) return { ok: false, error: 'validation_failed' };
    patch.voyages_done = b.voyages_done;
  }
  if (b.limit_voyages !== undefined) {
    if (!isInt(b.limit_voyages) || b.limit_voyages < UPKEEP_LIMITS.minVoyages || b.limit_voyages > UPKEEP_LIMITS.maxVoyages) return { ok: false, error: 'validation_failed' };
    patch.limit_voyages = b.limit_voyages;
  }
  if (patch.voyages_done === undefined && patch.limit_voyages === undefined) return { ok: false, error: 'validation_failed' };
  return patchUpkeep(db, submarineId, patch, now) ? { ok: true } : { ok: false, error: 'not_found' };
}

/** 標示已維修(面板):只處理有開啟維修提醒的潛艇 */
export function repairSubmarines(db: Db, subs: SubmarineDto[], submarineIds: string[], now: Date): void {
  const wanted = new Set(submarineIds);
  markRepaired(db, subs.filter((s) => wanted.has(s.id) && s.upkeep).map((s) => s.id), now);
}
