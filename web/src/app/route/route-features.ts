import { InjectionToken } from '@angular/core';

/**
 * 航線模擬器的功能開關。正式版全開;展示模式(D-168)關掉「儲存配置」與「綁定工坊潛艇」,
 * 因為這些需要登入與伺服器端的資料表(RS-25、RS-26)。展示版的配置只是臨時配置,留在這個瀏覽器的檢視狀態裡。
 */
export interface RouteFeatures {
  /** 儲存配置(`route_subs`)與綁定工坊潛艇。關閉時 RouteVm 不呼叫 `/api/route-subs`,清單恆為空 */
  readonly saving: boolean;
}

export const ROUTE_FEATURES = new InjectionToken<RouteFeatures>('ROUTE_FEATURES', {
  providedIn: 'root',
  factory: () => ({ saving: true }),
});
