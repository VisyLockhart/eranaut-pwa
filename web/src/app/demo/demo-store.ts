import { Injectable } from '@angular/core';
import type { BuildDto, NotifyPrefs, RouteFilterDto, RouteSubDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { CRAFT_STORAGE_KEYS } from '../craft/craft-keys';
import { removeKey } from '../core/storage';
import { ORDER_KEY } from '../core/workshop-order';
import { INSTALL_PROMPT_KEY } from '../core/install-prompt';
import { ROUTE_CACHE_KEY, ROUTE_LAST_KEY } from '../route/route-cache';
import type { ProgressRow, UpkeepRow } from './demo-levels';
import { seedDemo } from './demo-data';

const KEY = 'eranaut.demo';
/** 存檔格式版本:加了維修提醒、等級、儲存配置與條件組合(D-292),3 = 工坊多了海圖探索紀錄(D-293),4 = 潛艇自己的配件、航線輔助欄位、排序多重(D-296~D-298)。舊版存檔直接換成新的假資料 */
const VERSION = 4;

interface DemoState {
  v: number;
  signedIn: boolean;
  workshops: WorkshopWithSubmarines[];
  prefs: NotifyPrefs;
  /** 以潛艇 id 為鍵;有資料 = 已開啟維修提醒(D-288) */
  upkeep: Record<string, UpkeepRow>;
  /** 以潛艇 id 為鍵;有資料 = 有填等級(D-289) */
  progress: Record<string, ProgressRow>;
  /** 以潛艇 id 為鍵;有資料 = 已設定配件(D-296) */
  build: Record<string, BuildDto>;
  /** 儲存的配置(RS-25、RS-26) */
  routeSubs: RouteSubDto[];
  /** 條件組合(D-229) */
  routeFilters: RouteFilterDto[];
  /** 展示標籤的「示範維護橫幅」開關(D-283) */
  maintenance: boolean;
}

function fresh(): DemoState {
  return { v: VERSION, signedIn: true, prefs: { dm: true, channel: false, push: false }, maintenance: false, ...seedDemo(Date.now()) };
}

/** 展示資料的存放處:記憶體 + localStorage(重新整理後保留;無法使用 localStorage 時退回只在記憶體) */
@Injectable()
export class DemoStore {
  private state: DemoState = this.load();

  private load(): DemoState {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoState>;
        if (parsed.v === VERSION && Array.isArray(parsed.workshops) && parsed.prefs && typeof parsed.signedIn === 'boolean') return parsed as DemoState;
        // 舊版存檔:保留登入狀態,其餘換成新的假資料
        if (typeof parsed.signedIn === 'boolean') return { ...fresh(), signedIn: parsed.signedIn };
      }
    } catch {
      // 讀不到就用全新的
    }
    return fresh();
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // 私密瀏覽等情況寫不進去:資料只留在這次載入
    }
  }

  get signedIn(): boolean {
    return this.state.signedIn;
  }
  setSignedIn(value: boolean): void {
    this.state.signedIn = value;
    this.save();
  }

  get workshops(): WorkshopWithSubmarines[] {
    return this.state.workshops;
  }
  commit(): void {
    this.save();
  }

  get prefs(): NotifyPrefs {
    return this.state.prefs;
  }

  get upkeep(): Record<string, UpkeepRow> {
    return this.state.upkeep;
  }
  get progress(): Record<string, ProgressRow> {
    return this.state.progress;
  }
  get build(): Record<string, BuildDto> {
    return this.state.build;
  }
  get routeSubs(): RouteSubDto[] {
    return this.state.routeSubs;
  }
  set routeSubs(list: RouteSubDto[]) {
    this.state.routeSubs = list;
  }
  get routeFilters(): RouteFilterDto[] {
    return this.state.routeFilters;
  }
  set routeFilters(list: RouteFilterDto[]) {
    this.state.routeFilters = list;
  }

  get maintenance(): boolean {
    return this.state.maintenance;
  }
  setMaintenance(on: boolean): void {
    this.state.maintenance = on;
    this.save();
  }

  /** 刪掉工坊時,連帶清掉那些潛艇的維修提醒、等級與配件(正式版是資料庫的 ON DELETE CASCADE) */
  forgetSubmarines(ids: readonly string[]): void {
    for (const id of ids) {
      delete this.state.upkeep[id];
      delete this.state.progress[id];
      delete this.state.build[id];
    }
  }

  /** 重設為全新的假資料(保留登入狀態) */
  reset(): void {
    const signedIn = this.state.signedIn;
    this.state = { ...fresh(), signedIn };
    this.save();
    // 前端自己的快取(總覽快照、工坊排序)也要清,否則重設後會先閃一下舊畫面
    removeKey('eranaut.snapshot');
    removeKey(ORDER_KEY);
    removeKey('eranaut.demo.push');
    // 航線模擬器的檢視狀態(已選航點、分頁)與儲存配置的快取,重設時一併清掉
    removeKey(ROUTE_LAST_KEY);
    removeKey(ROUTE_CACHE_KEY);
    // 配件製作的選擇、檢視設定與庫存(只存在這個瀏覽器)
    for (const k of CRAFT_STORAGE_KEYS) removeKey(k);
    // 「加入主畫面」提示:重設後再看一次
    removeKey(INSTALL_PROMPT_KEY);
  }
}
