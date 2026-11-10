// 查價(D-343)的統一格式。畫面與服務只依賴這裡的型別,不認識任何查價網站的欄位;
// 換查價來源時只換「轉接器」(例如 price-universalis.ts)。

/** 市場板的一筆掛單(已整理成本專案格式) */
export interface PriceListing {
  readonly pricePerUnit: number;
  readonly quantity: number;
  readonly total: number;
  readonly retainerName: string;
  /** 伺服器(世界)名稱,繁中服 */
  readonly world: string;
  readonly hq: boolean;
}

/** 一次查價的結果(掛單已依單價由低到高排序) */
export interface PriceQuote {
  /** 遊戲物品 ID */
  readonly itemId: number;
  /** 查詢時間(epoch 毫秒,本機時鐘) */
  readonly fetchedAt: number;
  /** 來源最新一次收到玩家上傳的時間(epoch 毫秒);來源沒提供則為 null */
  readonly lastUploadAt: number | null;
  readonly listings: readonly PriceListing[];
}

export type PriceErrorKind = 'timeout' | 'rate-limit' | 'network' | 'server' | 'format' | 'not-found';

export class PriceError extends Error {
  constructor(readonly kind: PriceErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'PriceError';
  }
}

/** 查價來源(轉接器)介面:收到中止訊號時要丟出 AbortError */
export interface PriceSource {
  fetchQuote(itemId: number, signal: AbortSignal): Promise<PriceQuote>;
}
