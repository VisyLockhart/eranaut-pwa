import { InjectionToken } from '@angular/core';

/**
 * 配件製作的功能開關。正式版全開;展示模式(D-168)關掉「庫存組」(D-329),
 * 因為它需要登入與伺服器端的資料表;展示版的選擇與庫存維持只存在這個瀏覽器的 localStorage。
 */
export interface CraftFeatures {
  /** 庫存組(`craft_stocks`)。關閉時整列不顯示、不呼叫 `/api/craft-stocks` */
  readonly stockSets: boolean;
}

export const CRAFT_FEATURES = new InjectionToken<CraftFeatures>('CRAFT_FEATURES', {
  providedIn: 'root',
  factory: () => ({ stockSets: true }),
});
