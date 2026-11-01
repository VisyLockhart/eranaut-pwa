// localStorage 的安全包裝:無痕模式、被清除或被封鎖時都不能讓畫面壞掉,讀不到就當沒有。

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 寫不進去就算了,只是少了快取
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 同上
  }
}

/**
 * 「這台裝置要收推播」的意願旗標(D-278)。放在這裡讓 PushVm 與 AppUpdate 共用:
 * 瀏覽器的推播訂閱綁在 service worker 註冊上,重設 service worker 前要先確保這個旗標在,重載後才能自動重新訂閱(D-320)。
 */
export const PUSH_INTENT_KEY = 'eranaut.push-on';
