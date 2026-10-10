import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/** App 開著時,每隔多久問一次有沒有新版(Angular 預設只在啟動與換頁時檢查,安裝成 App 長時間開著就不會發現新版) */
export const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
/** 視窗回到前景時,距離上次檢查至少要隔多久才再檢查 */
export const UPDATE_CHECK_MIN_GAP_MS = 5 * 60 * 1000;

/**
 * 新版本提示(D-155 原為一則自動消失的提示,2026-10-10 改為橫幅 + 按鈕):
 * 新版下載好後 `ready` 變 true,橫幅不會自動消失;使用者按「立即更新」才啟用新版並重新載入,
 * 不會在填表單時自動重載。安裝成 App(手機主畫面、桌面)沒有重新整理鈕,所以由這裡提供。
 * 「啟用新版再重載」讀的是 service worker 已下載好的新檔案,比 Ctrl+Shift+R 的略過快取可靠。
 */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly sw = inject(SwUpdate, { optional: true });

  readonly ready = signal(false);
  readonly applying = signal(false);
  private lastCheck = Date.now();

  start(): void {
    if (!this.sw?.isEnabled) return;
    this.sw.versionUpdates.pipe(filter((e) => e.type === 'VERSION_READY')).subscribe(() => this.ready.set(true));
    // 新舊檔案對不上、快取壞掉:同樣請使用者按更新(重載後會取得完整的新版)
    this.sw.unrecoverable.subscribe(() => this.ready.set(true));
    setInterval(() => this.check(), UPDATE_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - this.lastCheck >= UPDATE_CHECK_MIN_GAP_MS) this.check();
    });
  }

  /** 按「立即更新」:啟用已下載好的新版本,再重新載入頁面 */
  async apply(): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    try {
      await this.sw?.activateUpdate();
    } catch {
      // 啟用失敗(例如沒有待啟用的版本)也照樣重載,重載本身會取得最新的檔案
    }
    this.reloadPage();
  }

  protected reloadPage(): void {
    location.reload();
  }

  private check(): void {
    this.lastCheck = Date.now();
    this.sw?.checkForUpdate().catch(() => undefined);
  }
}
