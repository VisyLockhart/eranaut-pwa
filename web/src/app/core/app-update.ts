import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Toast } from './toast';

/** App 開著時,每隔多久問一次有沒有新版(Angular 預設只在啟動與換頁時檢查,安裝成 App 長時間開著就不會發現新版) */
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
/** 視窗回到前景時,距離上次檢查至少要隔多久才再檢查 */
export const UPDATE_CHECK_MIN_GAP_MS = 5 * 60 * 1000;

/** 啟動後多久做第一次「直接問伺服器」的檢查(D-260) */
export const STARTUP_LIVE_CHECK_DELAY_MS = 5000;

const MAIN_SCRIPT = /\bmain-[\w-]+\.js\b/;
/** 從 index.html 的內容(或 script 的 src)取出主程式檔名,例如 main-XG5FWGKL.js;取不到回傳 null */
export function mainScriptOf(text: string): string | null {
  return MAIN_SCRIPT.exec(text)?.[0] ?? null;
}
function loadedMainScript(): string | null {
  const src = typeof document === 'undefined' ? null : document.querySelector('script[src*="main-"]')?.getAttribute('src');
  return src ? mainScriptOf(src) : null;
}

/** 手動「檢查更新」的結果:已是最新 / 有新版本(橫幅會出現)/ 無法確認(連不上伺服器等) */
export type CheckResult = 'latest' | 'available' | 'failed';

/**
 * 新版本提示(D-155 原為一則自動消失的提示,2026-10-10 改為橫幅 + 按鈕):
 * 新版下載好後 `ready` 變 true,橫幅不會自動消失;使用者按「立即更新」才啟用新版並重新載入,
 * 不會在填表單時自動重載。安裝成 App(手機主畫面、桌面)沒有重新整理鈕,所以由這裡提供。
 * 「啟用新版再重載」讀的是 service worker 已下載好的新檔案,比 Ctrl+Shift+R 的略過快取可靠。
 */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly toast = inject(Toast);
  /** 這個頁面載入時用的主程式檔名;和伺服器上最新的 index.html 比對,不靠 service worker(D-260) */
  protected loadedMain: string | null = loadedMainScript();

  readonly ready = signal(false);
  readonly applying = signal(false);
  /** 手動檢查進行中 */
  readonly checking = signal(false);
  private inflight: Promise<CheckResult> | null = null;
  private lastCheck = Date.now();

  /** 這個環境有沒有更新機制(正式建置、瀏覽器支援 service worker);沒有時不顯示「檢查更新」 */
  get supported(): boolean {
    return this.sw?.isEnabled === true;
  }

  start(): void {
    if (!this.sw?.isEnabled) return;
    this.sw.versionUpdates.pipe(filter((e) => e.type === 'VERSION_READY')).subscribe(() => this.ready.set(true));
    // 新舊檔案對不上、快取壞掉:同樣請使用者按更新(重載後會取得完整的新版)
    this.sw.unrecoverable.subscribe(() => this.ready.set(true));
    setInterval(() => this.check(), UPDATE_CHECK_INTERVAL_MS);
    // 回到前景、或視窗取得焦點(桌面 App 常只是被別的視窗蓋住,不一定觸發 visibilitychange)時各檢查一次;
    // 兩者常同時發生,共用同一個最小間隔,所以只會檢查一次。沒有新增任何計時器,視窗不在前景時不執行任何東西
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkIfStale();
    });
    window.addEventListener('focus', () => this.checkIfStale());
    // service worker 卡在降級狀態時永遠不會通知新版(而且會一直用舊快取開啟 App),所以另外直接問伺服器一次(D-260)
    setTimeout(() => void this.checkLive(), STARTUP_LIVE_CHECK_DELAY_MS);
  }

  /**
   * 手動「檢查更新」(設定頁、手機頭像選單):立刻問 service worker,再直接問伺服器(備援,見 `checkLive`)。
   * 有新版只顯示橫幅,不自動套用(D-236 ③);要不要重設 service worker 由「立即更新」依實際狀況決定,
   * 所以檢查本身不動 service worker 與快取,也不重新載入頁面(不會弄丟填到一半的表單)。連按只做一次。
   */
  checkNow(): Promise<CheckResult> {
    this.inflight ??= this.runCheck().finally(() => {
      this.inflight = null;
      this.checking.set(false);
    });
    return this.inflight;
  }

  /** 手動檢查並用提示告訴使用者結果 */
  async checkAndNotify(): Promise<CheckResult> {
    const r = await this.checkNow();
    if (r === 'available') this.toast.show('有新版本，請按上方的「立即更新」');
    else if (r === 'latest') this.toast.show('已是最新版本');
    else this.toast.show('無法確認是否有新版本，請稍後再試', { tone: 'warn' });
    return r;
  }

  private async runCheck(): Promise<CheckResult> {
    this.checking.set(true);
    this.lastCheck = Date.now();
    if (this.ready()) return 'available';
    let found = false;
    try {
      found = (await this.sw?.checkForUpdate()) === true;
    } catch {
      // service worker 降級或失敗:改靠下面直接問伺服器
    }
    if (found || this.ready()) {
      this.ready.set(true);
      return 'available';
    }
    const live = mainScriptOf(await this.fetchLiveIndex());
    if (!live) return 'failed';
    if (this.loadedMain && live !== this.loadedMain) {
      this.ready.set(true);
      return 'available';
    }
    return 'latest';
  }

  /** 按「立即更新」:啟用已下載好的新版本,再重新載入頁面 */
  async apply(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    let activated = false;
    try {
      activated = (await this.sw?.activateUpdate()) === true;
    } catch {
      activated = false;
    }
    // 沒有可啟用的新版(service worker 降級、快取壞掉):解除註冊並清掉它的快取,重載才會直接從伺服器取得最新的檔案
    if (!activated) await this.resetServiceWorker();
    this.reloadPage();
  }

  /** 解除 service worker 並清掉它的快取;失敗也不擋重載 */
  protected async resetServiceWorker(): Promise<void> {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ngsw:')).map((k) => caches.delete(k)));
    } catch {
      /* 失敗就照樣重載 */
    }
  }

  protected reloadPage(): void {
    location.reload();
  }

  private checkIfStale(): void {
    if (Date.now() - this.lastCheck >= UPDATE_CHECK_MIN_GAP_MS) this.check();
  }

  private check(): void {
    this.lastCheck = Date.now();
    const swCheck = this.sw?.checkForUpdate().catch(() => undefined) ?? Promise.resolve();
    // service worker 的檢查結束後,再直接問伺服器一次當作備援
    void swCheck.then(() => this.checkLive());
  }

  /**
   * 備援:不經過 service worker,直接向伺服器要最新的 index.html(帶 `ngsw-bypass`),
   * 主程式檔名和目前頁面載入的不同就視為有新版。伺服器回錯誤頁(504 等)讀不到檔名,一律忽略,不會誤報。
   */
  protected async checkLive(): Promise<void> {
    if (!this.loadedMain || this.ready()) return;
    const live = mainScriptOf(await this.fetchLiveIndex());
    if (live && live !== this.loadedMain) this.ready.set(true);
  }

  protected async fetchLiveIndex(): Promise<string> {
    try {
      const res = await fetch(new URL(`index.html?ngsw-bypass=1&t=${Date.now()}`, document.baseURI), { cache: 'no-store' });
      return res.ok ? await res.text() : '';
    } catch {
      return '';
    }
  }
}
