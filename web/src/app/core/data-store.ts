import { Injectable, computed, inject, signal } from '@angular/core';
import type { OverviewDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { Api } from './api';
import { Auth } from './auth';
import { isReady } from './format';
import { readJson, removeKey, writeJson } from './storage';

const SNAPSHOT_KEY = 'eranaut.snapshot';
const VIEW_KEY = 'eranaut.view';
/** 倒數的畫面更新間隔;顯示精度是分鐘,15 秒足夠(D-84:不靠 setInterval 計時,每次都用時間戳重算) */
const TICK_MS = 15_000;

export type ViewMode = 'list' | 'card';

/**
 * 總覽資料(D-84):抓一次 API,前端自己倒數。
 * 重抓時機:啟動、App 從背景回前景(Page Visibility)、手動重新整理、送出更新後。
 * 最後一次快照存 localStorage 加速首屏;登出或 session 失效時清除。
 */
@Injectable({ providedIn: 'root' })
export class DataStore {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  readonly workshops = signal<WorkshopWithSubmarines[]>([]);
  /** 第一次載入完成(含用快照顯示)前為 false */
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  readonly now = signal(Date.now());
  readonly view = signal<ViewMode>(readJson<ViewMode>(VIEW_KEY) === 'card' ? 'card' : 'list');

  readonly submarineCount = computed(() => this.workshops().reduce((n, w) => n + w.submarines.length, 0));
  readonly readyCount = computed(() => {
    const now = this.now();
    return this.workshops().reduce((n, w) => n + w.submarines.filter((s) => isReady(s, now)).length, 0);
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler = (): void => {
    if (document.visibilityState === 'visible') {
      this.now.set(Date.now());
      void this.refresh();
    }
  };

  setView(mode: ViewMode): void {
    this.view.set(mode);
    writeJson(VIEW_KEY, mode);
  }

  /** 登入後呼叫:先用快照顯示,再向 API 取最新資料,並開始倒數與前景重抓 */
  start(): void {
    if (this.timer !== null) return;
    const snapshot = readJson<OverviewDto>(SNAPSHOT_KEY);
    if (snapshot && Array.isArray(snapshot.workshops)) {
      this.workshops.set(snapshot.workshops);
      this.loaded.set(true);
    }
    this.now.set(Date.now());
    this.timer = setInterval(() => this.now.set(Date.now()), TICK_MS);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    void this.refresh();
  }

  /** 登出或 session 失效:停止計時、清空畫面與快照 */
  stop(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.workshops.set([]);
    this.loaded.set(false);
    this.loadError.set(false);
    removeKey(SNAPSHOT_KEY);
  }

  async refresh(): Promise<void> {
    try {
      const overview = await this.api.overview();
      this.workshops.set(overview.workshops);
      this.loadError.set(false);
      this.loaded.set(true);
      writeJson(SNAPSHOT_KEY, overview);
    } catch {
      // 401 由 interceptor 轉成 session 過期;其他錯誤保留現有畫面(快照),只標記失敗
      if (this.auth.status() === 'authenticated') this.loadError.set(true);
    }
  }
}
