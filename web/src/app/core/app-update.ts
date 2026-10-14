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

/**
 * 等 service worker 回覆的上限(D-266)。service worker 進入 SAFE_MODE(初始化失敗)時,收到「檢查 / 啟用」訊息會直接不回覆,
 * Angular 的 `checkForUpdate()` / `activateUpdate()` 沒有逾時,會永遠不結束;超過這個時間就當作沒回應。
 * 這只是一次性的逾時計時器(結束就清掉),不是輪詢,不增加任何檢查頻率。
 */
export const SW_CALL_TIMEOUT_MS = 8000;
/** 直接問伺服器(index.html)的逾時上限(D-266);超過就中止這次請求,視為抓不到 */
export const LIVE_FETCH_TIMEOUT_MS = 8000;

const TIMED_OUT = Symbol('timed-out');
/** 等 promise 最多 ms 毫秒;逾時回傳 TIMED_OUT。計時器一定會清掉 */
async function within<T>(p: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([p, new Promise<typeof TIMED_OUT>((resolve) => (timer = setTimeout(() => resolve(TIMED_OUT), ms)))]);
  } finally {
    clearTimeout(timer);
  }
}

/** Angular service worker 不攔截帶這個參數的請求 */
const BYPASS_PARAM = 'ngsw-bypass';

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
  /** 自動檢查進行中:同時最多一次,不會疊(D-266) */
  private autoInflight = false;
  /** service worker 沒回應過(SAFE_MODE 等):之後的檢查不再等它,只問伺服器;收到它的任何事件就恢復(D-266) */
  private swUnresponsive = false;
  /** service worker 沒回應(逾時過)、尚未恢復:橫幅顯示「更新機制異常 / 修復」(D-267) */
  readonly broken = signal(false);
  /** 使用者按了「稍後」:這個頁面載入期間不再顯示異常橫幅(再手動檢查更新會重新顯示) */
  readonly brokenDismissed = signal(false);
  private lastCheck = Date.now();

  /** 這個環境有沒有更新機制(正式建置、瀏覽器支援 service worker);沒有時不顯示「檢查更新」 */
  get supported(): boolean {
    return this.sw?.isEnabled === true;
  }

  start(): void {
    // 「立即更新」略過 service worker 重載時帶的參數,載入後從網址拿掉(App 視窗沒有網址列,瀏覽器分頁才看得到)
    try {
      const u = new URL(location.href);
      if (u.searchParams.has(BYPASS_PARAM)) {
        u.searchParams.delete(BYPASS_PARAM);
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
    } catch {
      /* 拿不掉也無妨 */
    }
    if (!this.sw?.isEnabled) return;
    this.sw.versionUpdates.subscribe(() => {
      this.swUnresponsive = false;
      this.broken.set(false);
    });
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
    this.brokenDismissed.set(false);
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
    // service worker 與伺服器各自獨立、同時問,互不等待:service worker 卡住(逾時)也不會擋住直接問伺服器的結果(D-266)
    const [swFound, liveText] = await Promise.all([this.swCheck(), this.fetchLiveIndex()]);
    if (swFound || this.ready()) {
      this.ready.set(true);
      return 'available';
    }
    const live = mainScriptOf(liveText);
    if (!live) return 'failed';
    if (this.loadedMain && live !== this.loadedMain) {
      this.ready.set(true);
      return 'available';
    }
    return 'latest';
  }

  /** 問 service worker 有沒有新版:丟錯 = 沒有;超過上限沒回應 = 標記為沒回應,之後不再等它(D-266) */
  private async swCheck(): Promise<boolean> {
    if (!this.sw || this.swUnresponsive) return false;
    try {
      const r = await within(this.sw.checkForUpdate(), SW_CALL_TIMEOUT_MS);
      if (r === TIMED_OUT) {
        this.swUnresponsive = true;
        this.broken.set(true);
        return false;
      }
      return r === true;
    } catch {
      return false;
    }
  }

  /** 按「立即更新」:啟用已下載好的新版本,再重新載入頁面 */
  async apply(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    let activated = false;
    try {
      // service worker 沒回應(SAFE_MODE)時 activateUpdate() 也不會結束:逾時就當作沒有可啟用的新版,走下面的重設(D-266)
      activated = (await within(this.sw?.activateUpdate() ?? Promise.resolve(false), SW_CALL_TIMEOUT_MS)) === true;
    } catch {
      activated = false;
    }
    // 沒有可啟用的新版(service worker 降級、快取壞掉):解除註冊並清掉它的快取,重載才會直接從伺服器取得最新的檔案
    if (!activated) await this.resetServiceWorker();
    this.reloadPage(!activated);
  }

  /**
   * 「修復」(D-267):service worker 沒回應時,使用者按下才執行——解除註冊、清快取,再用略過 service worker 的方式重載。
   * 不自動執行(不自動重載,D-236 ③)。重載後 service worker 會重新註冊。
   */
  async repair(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    await this.resetServiceWorker();
    this.reloadPage(true);
  }

  /** 使用者按「稍後」:先收起異常橫幅 */
  dismissBroken(): void {
    this.brokenDismissed.set(true);
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

  /**
   * 重新載入。重設 service worker 之後要用「略過 service worker」的方式載入(D-266):
   * 剛解除註冊的 service worker 在這個視窗關閉前仍會控制它,普通重載會被它用(已清掉或舊的)內容服務,
   * 實測要重載兩次才會換成新版;帶 `ngsw-bypass` 的導覽不會被 service worker 攔截,一次就取得伺服器上的最新檔案。
   */
  protected reloadPage(bypassServiceWorker = false): void {
    if (!bypassServiceWorker) {
      location.reload();
      return;
    }
    const u = new URL(location.href);
    u.searchParams.set(BYPASS_PARAM, '1');
    location.replace(u.href);
  }

  private checkIfStale(): void {
    if (Date.now() - this.lastCheck >= UPDATE_CHECK_MIN_GAP_MS) this.check();
  }

  /** 自動檢查(定時 / 回前景 / 取得焦點):service worker 與直接問伺服器同時進行,同時最多一次;兩者都有逾時,一定會結束(D-266) */
  private check(): void {
    if (this.autoInflight) return;
    this.autoInflight = true;
    this.lastCheck = Date.now();
    void Promise.all([this.swCheck(), this.checkLive()]).finally(() => (this.autoInflight = false));
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
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LIVE_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(new URL(`index.html?ngsw-bypass=1&t=${Date.now()}`, document.baseURI), { cache: 'no-store', signal: ctrl.signal });
      return res.ok ? await res.text() : '';
    } catch {
      return '';
    } finally {
      clearTimeout(timer);
    }
  }
}
