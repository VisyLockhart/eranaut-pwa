import { Injectable } from '@angular/core';
import { PriceService } from './core/price-service';
import { createUniversalisSource } from './core/price-universalis';

/** 查價服務的單例:記憶體快取在整個 App 共用,換版面重建頁面時不丟(D-343)。要換查價來源,改這裡的轉接器即可 */
@Injectable({ providedIn: 'root' })
export class CraftPrice extends PriceService {
  constructor() {
    super(createUniversalisSource());
  }
}
