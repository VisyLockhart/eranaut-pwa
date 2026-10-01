import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { OverviewDto, SubmarineDto, SubmarineInput, SubmarinesUpdateResult, WorkshopDto, WorkshopInput, WorkshopWithSubmarines } from '@eranaut/shared';
import { Api } from './api';
import { Auth } from './auth';
import { isReady } from './format';
import { readJson, removeKey, writeJson } from './storage';
import { ORDER_KEY, applyOrder, moveItem } from './workshop-order';

const SNAPSHOT_KEY = 'eranaut.snapshot';
const VIEW_KEY = 'eranaut.view';
/** 倒數的畫面更新間隔;顯示精度是分鐘,15 秒足夠(D-84:不靠 setInterval 計時,每次都用時間戳重算) */
const TICK_MS = 15_000;

export type ViewMode = 'list' | 'card';

function loadOrder(): string[] {
  const stored = readJson<unknown>(ORDER_KEY);
  return Array.isArray(stored) ? stored.filter((x): x is string => typeof x === 'string') : [];
}

/**
 * 總覽資料(D-84):抓一次 API,前端自己倒數。
 * 重抓時機:啟動、App 從背景回前景(Page Visibility)、手動重新整理、送出更新後。
 * 最後一次快照存 localStorage 加速首屏;登出或 session 失效時清除。
 * 工坊顯示排序只存 localStorage(D-55);登出時保留(類似檢視模式,是個人偏好,id 對不上的會被過濾掉)。
 */
@Injectable({ providedIn: 'root' })
export class DataStore {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);

  /** API 回來的原始順序(建立順序);畫面一律使用套用過排序的 `workshops` */
  readonly fetched = signal<WorkshopWithSubmarines[]>([]);
  /** 使用者自訂的工坊順序(工坊 id 清單),見 SCHEMA §7 */
  readonly order = signal<string[]>(loadOrder());
  readonly workshops = computed(() => applyOrder(this.fetched(), this.order()));
  /** 第一次載入完成(含用快照顯示)前為 false */
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  readonly now = signal(Date.now());
  readonly view = signal<ViewMode>(readJson<ViewMode>(VIEW_KEY) === 'card' ? 'card' : 'list');

  readonly submarineCount = computed(() => this.fetched().reduce((n, w) => n + w.submarines.length, 0));
  readonly readyCount = computed(() => {
    const now = this.now();
    return this.fetched().reduce((n, w) => n + w.submarines.filter((s) => isReady(s, now)).length, 0);
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
      this.fetched.set(snapshot.workshops);
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
    this.fetched.set([]);
    this.loaded.set(false);
    this.loadError.set(false);
    removeKey(SNAPSHOT_KEY);
  }

  async refresh(): Promise<void> {
    try {
      const overview = await this.api.overview();
      this.fetched.set(overview.workshops);
      this.loadError.set(false);
      this.loaded.set(true);
      writeJson(SNAPSHOT_KEY, overview);
    } catch {
      // 401 由 interceptor 轉成 session 過期;其他錯誤保留現有畫面(快照),只標記失敗
      if (this.auth.status() === 'authenticated') this.loadError.set(true);
    }
  }

  // ---- 工坊管理(階段 3) ----
  // 寫入成功才更新畫面(驗證錯誤要讓表單顯示);失敗時丟出原始的 HttpErrorResponse 給呼叫端處理。

  async createWorkshop(input: WorkshopInput): Promise<WorkshopDto> {
    const created = await this.api.createWorkshop(input);
    this.fetched.update((list) => [...list, { ...created, submarines: [] }]);
    this.persist();
    return created;
  }

  /** PUT 只改工坊欄位;潛艇資料不受影響,沿用畫面上現有的 */
  async updateWorkshop(id: string, input: WorkshopInput): Promise<WorkshopDto> {
    const updated = await this.api.updateWorkshop(id, input);
    this.fetched.update((list) => list.map((w) => (w.id === id ? { ...updated, submarines: w.submarines } : w)));
    this.persist();
    return updated;
  }

  /** 潛艇與提醒由 API 端 CASCADE 連帶刪除。404 代表已被刪掉(例如在別的裝置),當作成功 */
  async deleteWorkshop(id: string): Promise<void> {
    try {
      await this.api.deleteWorkshop(id);
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 404)) throw error;
    }
    this.fetched.update((list) => list.filter((w) => w.id !== id));
    if (this.order().includes(id)) this.setOrder(this.order().filter((x) => x !== id));
    this.persist();
  }

  // ---- 更新潛艇(階段 4) ----
  // 寫入成功才更新畫面;驗證錯誤(400)等原始的 HttpErrorResponse 交給表單顯示。
  // D-84:送出後先用回應更新畫面(樂觀),再於背景重抓確認。

  /** 整個工坊一次更新(D-117、D-122) */
  async updateSubmarines(workshopId: string, submarines: SubmarineInput[]): Promise<SubmarinesUpdateResult> {
    const result = await this.api.updateSubmarines(workshopId, submarines);
    this.applySubmarines(workshopId, result.submarines);
    return result;
  }

  /** 單艘快速修改 */
  async updateSubmarine(workshopId: string, input: SubmarineInput): Promise<SubmarinesUpdateResult> {
    const result = await this.api.updateSubmarine(workshopId, input);
    this.applySubmarines(workshopId, result.submarines);
    return result;
  }

  /** 以位置為鍵合併回應裡的潛艇(整坊回應含全部、單艘回應只有一艘,合併後都正確),存快照並在背景重抓確認 */
  private applySubmarines(workshopId: string, updated: SubmarineDto[]): void {
    this.fetched.update((list) =>
      list.map((w) => {
        if (w.id !== workshopId) return w;
        const byPosition = new Map(w.submarines.map((s) => [s.position, s]));
        for (const s of updated) byPosition.set(s.position, s);
        return { ...w, submarines: [...byPosition.values()].sort((a, b) => a.position - b.position) };
      }),
    );
    this.persist();
    void this.refresh();
  }

  // ---- 排序(只存 localStorage,D-55) ----

  /** 把畫面上第 `from` 個工坊移到第 `to` 個位置 */
  reorderWorkshops(from: number, to: number): void {
    const ids = this.workshops().map((w) => w.id);
    if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return;
    this.setOrder(moveItem(ids, from, to));
  }

  /** ▲▼ 按鈕:往上(-1)或往下(+1)移一格 */
  moveWorkshop(id: string, delta: -1 | 1): void {
    const index = this.workshops().findIndex((w) => w.id === id);
    if (index >= 0) this.reorderWorkshops(index, index + delta);
  }

  private setOrder(ids: string[]): void {
    this.order.set(ids);
    writeJson(ORDER_KEY, ids);
  }

  private persist(): void {
    writeJson(SNAPSHOT_KEY, { workshops: this.fetched() } satisfies OverviewDto);
  }
}
