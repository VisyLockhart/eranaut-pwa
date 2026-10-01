import { NotifyMethod } from './constants.js';

/** 對外 API 的提醒方式:具名布林,不暴露位元數字(D-145 ⑦) */
export interface NotifyPrefs {
  dm: boolean;
  channel: boolean;
}

export function notifyMethodsToPrefs(bits: number): NotifyPrefs {
  return {
    dm: (bits & NotifyMethod.Dm) !== 0,
    channel: (bits & NotifyMethod.Channel) !== 0,
  };
}

export function prefsToNotifyMethods(prefs: NotifyPrefs): number {
  return (prefs.dm ? NotifyMethod.Dm : 0) | (prefs.channel ? NotifyMethod.Channel : 0);
}
