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

/** users.notify_methods 位元旗標(D-133)。程式碼不直接寫 1/2/4。bit2(4)= 瀏覽器推播(D-165)。 */
export const NotifyMethod = {
  Dm: 1,
  Channel: 2,
  Push: 4,
} as const;
export const DEFAULT_NOTIFY_METHODS = NotifyMethod.Dm;

/** 欄位長度上限(D-137 ⑦) */
export const LIMITS = {
  workshopName: 20,
  captain: 20,
  addressDetail: 30,
  submarineName: 20,
  maxSubmarinesPerWorkshop: 4,
  /** 儲存潛艇(航線模擬器,RS-25、RS-26):名稱字數、每位使用者組數上限、等級上限(繁中服,RS-20) */
  routeSubName: 20,
  maxRouteSubsPerUser: 10,
  maxRouteSubLevel: 130,
  /** 一組儲存潛艇最多綁幾艘工坊潛艇(只是擋異常輸入;一般使用者的潛艇總數遠少於此) */
  maxRouteSubBindings: 32,
  /** 剩餘時間上限:99 天 23 小時 59 分(D-118 的天≤99、時≤23、分≤59),單位分鐘 */
  maxRemainingMinutes: 99 * 24 * 60 + 23 * 60 + 59,
} as const;

/** 儲存潛艇的四個配件欄位;值為 1~10(1~5 = 原版 1~5 級,6~10 = 改 1~5 級,與 parts.json 的 grades 順序一致) */
export const ROUTE_PART_KEYS = ['hull', 'stern', 'bow', 'bridge'] as const;
export type RoutePartKey = (typeof ROUTE_PART_KEYS)[number];
export const ROUTE_PART_MAX = 10;
