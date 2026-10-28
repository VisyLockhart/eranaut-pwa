import type { NotifyPrefsUpdate, SubmarineDto, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { applyNotifyPrefsUpdate } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { listSubmarines, upsertSubmarines } from '../repo/submarines.js';
import { applyProgressInput, deleteProgress } from '../repo/progress.js';
import { deleteUpkeep } from '../repo/upkeep.js';
import { replaceWorkshop } from '../repo/workshops.js';
import { getNotifyMethods, setNotifyMethods } from '../repo/users.js';
import { syncUserReminders, syncWorkshopReminders } from './reminders.js';
import type { ValidSubmarine } from './submarines.js';
import { enableUpkeep } from './upkeep.js';
import type { ValidWorkshop } from './workshops.js';

// 「寫入 + 重算提醒」放在同一個交易內:要嘛都成功,要嘛都不生效,提醒不會和資料脫節(D-139)。

/** 更新潛艇(整坊或單艘);工坊不存在或不屬於該使用者回 undefined */
export function updateSubmarines(db: Db, userId: string, workshopId: string, items: ValidSubmarine[], now: Date): SubmarinesUpdateResult | undefined {
  return db.transaction((): SubmarinesUpdateResult | undefined => {
    const all = upsertSubmarines(db, userId, workshopId, items, now);
    if (!all) return undefined;

    // 維修提醒的開啟 / 關閉(D-288)與潛艇更新在同一個交易:被拒絕(沒綁定配置等)整筆不生效
    const idByPos = new Map(all.map((s) => [s.position, s.id]));
    for (const v of items) {
      if (v.upkeep === undefined) continue;
      const sid = idByPos.get(v.position)!;
      if (v.upkeep === null) deleteUpkeep(db, sid);
      else enableUpkeep(db, sid, v.position, v.upkeep, v.status, now);
    }
    // 等級與練級輔助(D-289)同樣和更新在同一個交易:被拒絕整筆不生效
    for (const v of items) {
      if (v.progress === undefined) continue;
      const sid = idByPos.get(v.position)!;
      if (v.progress === null) deleteProgress(db, sid);
      else applyProgressInput(db, sid, v.progress, v.status, now, v.position);
    }
    const { leadSkipped } = syncWorkshopReminders(db, workshopId, now);

    const idByPosition = new Map(all.map((s) => [s.position, s.id]));
    const batchSkipped = leadSkipped.includes(null);
    const skipped = items
      .filter((v) => (batchSkipped ? v.status === 'exploring' : leadSkipped.includes(idByPosition.get(v.position) ?? '')))
      .map((v) => v.position)
      .sort((a, b) => a - b);
    return { submarines: listSubmarines(db, userId, workshopId, now), reminder_skipped_positions: skipped };
  })();
}

/** 整筆取代工坊;整批/預先提醒設定改變時,提醒隨之重算(D-139) */
export function updateWorkshop(db: Db, userId: string, id: string, v: ValidWorkshop, now: Date): WorkshopDto | undefined {
  return db.transaction(() => {
    const w = replaceWorkshop(db, userId, id, v);
    if (w) syncWorkshopReminders(db, id, now);
    return w;
  })();
}

/** 只改 DM 與頻道;推播位元原樣保留(推播由訂閱端點管理,D-165)。回傳新的位元值 */
export function setNotifyPrefs(db: Db, userId: string, update: NotifyPrefsUpdate, now: Date): number {
  return db.transaction(() => {
    const bits = applyNotifyPrefsUpdate(getNotifyMethods(db, userId), update);
    setNotifyMethods(db, userId, bits);
    syncUserReminders(db, userId, now);
    return bits;
  })();
}

export type { SubmarineDto };
