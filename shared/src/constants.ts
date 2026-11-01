// 固定選項與常數(SCHEMA §6、D-135、D-140)。前後端共用,只維護這一份。

/** 遊戲伺服器(workshops.server,必填,由 API 驗證) */
export const SERVERS = ['伊弗利特', '利維坦', '迦樓羅', '泰坦', '巴哈姆特', '奧汀', '鳳凰'] as const;
export type Server = (typeof SERVERS)[number];

/** 住宅區(workshops.address_district,選填,由 API 驗證) */
export const DISTRICTS = ['海霧村', '薰衣草苗圃', '穹頂皓天', '高腳孤丘', '白銀鄉'] as const;
export type District = (typeof DISTRICTS)[number];

/**
 * 潛艇狀態。`registered` = 新登記(D-315):管理模式新增 / 複製出來、還沒派出過的潛艇;
 * 只能由新增 / 複製產生,更新潛艇的請求只接受下面的 `SUBMARINE_INPUT_STATUSES`,第一次派出(探索中)後就不再有此狀態。
 */
export const SUBMARINE_STATUSES = ['exploring', 'complete', 'registered'] as const;
export type SubmarineStatus = (typeof SUBMARINE_STATUSES)[number];
/** 更新潛艇請求可以送的狀態(不含新登記) */
export const SUBMARINE_INPUT_STATUSES = ['exploring', 'complete'] as const;
export type SubmarineInputStatus = (typeof SUBMARINE_INPUT_STATUSES)[number];

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
  /** 一間工坊的潛艇「格子」數(位置 1~4 = 排入,參與提醒與統計)= 建議上限;超過只提醒、不阻擋(D-313、D-314) */
  maxSubmarinesPerWorkshop: 4,
  /** 一間工坊最多存幾艘(位置 5~20 = 未排入,不參與提醒與統計;技術上限,D-314) */
  maxSubmarineRecords: 20,
  /** 儲存潛艇(航線模擬器,RS-25、RS-26):名稱字數、每位使用者組數上限、等級上限(繁中服,RS-20) */
  routeSubName: 20,
  maxRouteSubsPerUser: 30,
  maxRouteSubLevel: 130,
  /** 找路線的條件組合(D-229):名稱字數、每位使用者組數上限 */
  routeFilterName: 20,
  maxRouteFiltersPerUser: 30,
  /** 剩餘時間上限:99 天 23 小時 59 分(D-118 的天≤99、時≤23、分≤59),單位分鐘 */
  maxRemainingMinutes: 99 * 24 * 60 + 23 * 60 + 59,
} as const;

/** 儲存潛艇的四個配件欄位;值為 1~10(1~5 = 原版 1~5 級,6~10 = 改 1~5 級,與 parts.json 的 grades 順序一致) */
export const ROUTE_PART_KEYS = ['hull', 'stern', 'bow', 'bridge'] as const;
export type RoutePartKey = (typeof ROUTE_PART_KEYS)[number];
export const ROUTE_PART_MAX = 10;

/**
 * 找路線的條件組合 `spec`(D-229)的排序選項,與前端 `FindSort` 一致。
 * D-297:可複選(多重排序),權重固定依這個順序由左到右:每分鐘經驗 → 物品種類 → 可能解鎖。
 */
export const ROUTE_FILTER_SORTS = ['perMin', 'value', 'opens'] as const;
export type RouteFilterSort = (typeof ROUTE_FILTER_SORTS)[number];
/** 條件組合 `spec` 的範圍上限:API 不認識航點與物品資料集(D-202),只擋明顯異常的輸入;實際存不存在由前端帶入時處理 */
export const ROUTE_FILTER_LIMITS = {
  pointIdMax: 9999,
  itemIdMax: 1000000,
  seaMax: 99,
  maxHoursMax: 168,
  maxRequired: 128,
  maxExcluded: 128,
  maxItems: 50,
} as const;

// ---- 伺服器維護橫幅(D-283) ----
/** 維護開始前多久開始顯示橫幅 */
export const MAINTENANCE_SHOW_BEFORE_MS = 24 * 60 * 60 * 1000;
/** 超過預計結束時間後,官方仍沒改標題「已開機」時,橫幅最多再顯示多久 */
export const MAINTENANCE_SHOW_AFTER_MS = 6 * 60 * 60 * 1000;
