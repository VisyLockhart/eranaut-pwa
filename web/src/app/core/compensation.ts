// D-124 等待時間自動補正:純函式區塊(不碰 DOM、不讀時鐘,時間由呼叫端傳入)。
//
// 規格:
// - 以「每列起算時間戳」計算(now - startedAt),不累加計數,瀏覽器把背景頁籤降速/凍結時仍準確(⑧)
// - 畫面數值每滿 1 分鐘減 1;送出時不足一分鐘的零頭再多扣 1 分鐘(無條件進位,返航時間偏早不偏晚)(④)
// - 任一列扣到 0 → 資料作廢(⑥);API 端不處理補正,返航時間 = 後端收到請求時間 + 前端送的剩餘時間(⑤、D-48)

export const MINUTE_MS = 60_000;

function elapsedMs(startedAt: number, now: number): number {
  return Math.max(0, now - startedAt);
}

/** 畫面上顯示的剩餘分鐘:`base` 為起算當下的剩餘分鐘,`startedAt` 為起算時間戳 */
export function displayMinutes(base: number, startedAt: number, now: number, minuteMs = MINUTE_MS): number {
  return base - Math.floor(elapsedMs(startedAt, now) / minuteMs);
}

/** 送出時使用的剩餘分鐘(零頭進位多扣 1 分鐘) */
export function submitMinutes(base: number, startedAt: number, now: number, minuteMs = MINUTE_MS): number {
  return base - Math.ceil(elapsedMs(startedAt, now) / minuteMs);
}

/** 已補正幾分鐘(給「已依等待時間自動補正 N 分鐘」的提示用) */
export function compensated(startedAt: number, now: number, minuteMs = MINUTE_MS): number {
  return Math.floor(elapsedMs(startedAt, now) / minuteMs);
}

/** 分鐘 → 日/時/分(日最多 99,由呼叫端的上限保證) */
export function toParts(minutes: number): { d: number; h: number; m: number } {
  return { d: Math.floor(minutes / 1440), h: Math.floor((minutes % 1440) / 60), m: minutes % 60 };
}
