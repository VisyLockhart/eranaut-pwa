import { NotifyMethod } from './constants.js';

/** 對外 API 的提醒方式:具名布林,不暴露位元數字(D-145 ⑦) */
export interface NotifyPrefs {
  dm: boolean;
  channel: boolean;
  /** 瀏覽器推播(D-165):只由「這台裝置的推播訂閱」端點開關,`PUT /api/notify-prefs` 不會改它 */
  push: boolean;
}

/** `PUT /api/notify-prefs` 的請求:只有 DM 與頻道;推播由訂閱端點管理(D-165) */
export type NotifyPrefsUpdate = Pick<NotifyPrefs, 'dm' | 'channel'>;

export function notifyMethodsToPrefs(bits: number): NotifyPrefs {
  return {
    dm: (bits & NotifyMethod.Dm) !== 0,
    channel: (bits & NotifyMethod.Channel) !== 0,
    push: (bits & NotifyMethod.Push) !== 0,
  };
}

export function prefsToNotifyMethods(prefs: NotifyPrefs): number {
  return (prefs.dm ? NotifyMethod.Dm : 0) | (prefs.channel ? NotifyMethod.Channel : 0) | (prefs.push ? NotifyMethod.Push : 0);
}

/** 只換掉 DM 與頻道兩個位元,其餘(推播)原樣保留 */
export function applyNotifyPrefsUpdate(currentBits: number, update: NotifyPrefsUpdate): number {
  const keep = currentBits & ~(NotifyMethod.Dm | NotifyMethod.Channel);
  return keep | (update.dm ? NotifyMethod.Dm : 0) | (update.channel ? NotifyMethod.Channel : 0);
}
