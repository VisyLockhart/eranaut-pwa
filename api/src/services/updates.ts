import type { NotifyPrefs, SubmarineDto, SubmarinesUpdateResult, WorkshopDto } from '@eranaut/shared';
import { prefsToNotifyMethods } from '@eranaut/shared';
import type { Db } from '../db/index.js';
import { upsertSubmarines } from '../repo/submarines.js';
import { replaceWorkshop } from '../repo/workshops.js';
import { setNotifyMethods } from '../repo/users.js';
import { syncUserReminders, syncWorkshopReminders } from './reminders.js';
import type { ValidSubmarine } from './submarines.js';
import type { ValidWorkshop } from './workshops.js';

// 「寫入 + 重算提醒」放在同一個交易內:要嘛都成功,要嘛都不生效,提醒不會和資料脫節(D-139)。

/** 更新潛艇(整坊或單艘);工坊不存在或不屬於該使用者回 undefined */
export function updateSubmarines(db: Db, userId: string, workshopId: string, items: ValidSubmarine[], now: Date): SubmarinesUpdateResult | undefined {
  return db.transaction((): SubmarinesUpdateResult | undefined => {
    const all = upsertSubmarines(db, userId, workshopId, items, now);
    if (!all) return undefined;
    const { leadSkipped } = syncWorkshopReminders(db, workshopId, now);

    const idByPosition = new Map(all.map((s) => [s.position, s.id]));
    const batchSkipped = leadSkipped.includes(null);
    const skipped = items
      .filter((v) => (batchSkipped ? v.status === 'exploring' : leadSkipped.includes(idByPosition.get(v.position) ?? '')))
      .map((v) => v.position)
      .sort((a, b) => a - b);
    return { submarines: all, reminder_skipped_positions: skipped };
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

export function setNotifyPrefs(db: Db, userId: string, prefs: NotifyPrefs, now: Date): void {
  db.transaction(() => {
    setNotifyMethods(db, userId, prefsToNotifyMethods(prefs));
    syncUserReminders(db, userId, now);
  })();
}

export type { SubmarineDto };
