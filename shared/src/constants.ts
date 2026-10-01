// 固定選項與常數(SCHEMA §6、D-135、D-140)。前後端共用,只維護這一份。

/** 遊戲伺服器(workshops.server,必填,由 API 驗證) */
export const SERVERS = ['伊弗利特', '利維坦', '迦樓羅', '泰坦', '巴哈姆特', '奧汀', '鳳凰'] as const;
export type Server = (typeof SERVERS)[number];

/** 住宅區(workshops.address_district,選填,由 API 驗證) */
export const DISTRICTS = ['海霧村', '薰衣草苗圃', '穹頂皓天', '高腳孤丘', '白銀鄉'] as const;
export type District = (typeof DISTRICTS)[number];

/** 潛艇狀態 */
export const SUBMARINE_STATUSES = ['exploring', 'complete'] as const;
export type SubmarineStatus = (typeof SUBMARINE_STATUSES)[number];

/** 預先提醒允許值,0 = 不預先提醒(D-135);前端下拉為 5、10、15、30、60、120 */
export const NOTIFY_LEAD_MINUTES = [0, 5, 10, 15, 30, 60, 120] as const;
export type NotifyLeadMinutes = (typeof NOTIFY_LEAD_MINUTES)[number];
/** 開啟預先提醒時的預設值(D-135 ③) */
export const DEFAULT_NOTIFY_LEAD_MINUTES = 5;

/** users.notify_methods 位元旗標(D-133)。程式碼不直接寫 1/2/4。bit2(4)預留未指定。 */
export const NotifyMethod = {
  Dm: 1,
  Channel: 2,
} as const;
export const DEFAULT_NOTIFY_METHODS = NotifyMethod.Dm;

/** 欄位長度上限(D-137 ⑦) */
export const LIMITS = {
  workshopName: 20,
  captain: 20,
  addressDetail: 30,
  submarineName: 20,
  maxSubmarinesPerWorkshop: 4,
} as const;
