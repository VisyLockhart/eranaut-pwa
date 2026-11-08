/** 配件製作存在 localStorage 的 key。獨立成檔,讓展示版「重設資料」能清掉它們,又不必把計算核心與資料集拉進主 bundle */
export const CRAFT_KEY_SEL = 'eranaut.craft.sel';
export const CRAFT_KEY_VIEW = 'eranaut.craft.view';
export const CRAFT_KEY_STOCK = 'eranaut.craft.stock';
export const CRAFT_STORAGE_KEYS = [CRAFT_KEY_SEL, CRAFT_KEY_VIEW, CRAFT_KEY_STOCK] as const;
/** 庫存組清單的離線快照(不是正本);登出時清除,避免同一台裝置換帳號看到別人的清單。不屬於 CRAFT_STORAGE_KEYS(展示版沒有庫存組) */
export const CRAFT_STOCKS_CACHE_KEY = 'eranaut.craft.stocks.cache';
