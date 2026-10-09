import { removeKey } from '../core/storage';

// 航線模擬器的本機鍵(ROUTE-SIM.md §6.2)。這個檔不 import 資料集,
// 讓主 bundle(App 的登出清理)可以用它而不把航線資料集拉進首屏。

/** 檢視狀態:海域、已選航點、等級與配件、目前使用的儲存潛艇。各裝置獨立;登出時保留 */
export const ROUTE_LAST_KEY = 'eranaut.route.last';
/** 儲存潛艇清單的離線快照(不是正本);登出時清除,避免同一台裝置換帳號看到別人的清單 */
export const ROUTE_CACHE_KEY = 'eranaut.route.cache';

/** 條件組合清單的離線快照(同上,登出時清除) */
export const ROUTE_FILTERS_CACHE_KEY = 'eranaut.route.filters.cache';

export function clearRouteCache(): void {
  removeKey(ROUTE_CACHE_KEY);
  removeKey(ROUTE_FILTERS_CACHE_KEY);
}
