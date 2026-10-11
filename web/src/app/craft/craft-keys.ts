/** 配件製作存在 localStorage 的 key。獨立成檔,讓展示版「重設資料」能清掉它們,又不必把計算核心與資料集拉進主 bundle */
export const CRAFT_KEY_SEL = 'eranaut.craft.sel';
export const CRAFT_KEY_VIEW = 'eranaut.craft.view';
export const CRAFT_KEY_STOCK = 'eranaut.craft.stock';
export const CRAFT_STORAGE_KEYS = [CRAFT_KEY_SEL, CRAFT_KEY_VIEW, CRAFT_KEY_STOCK] as const;
