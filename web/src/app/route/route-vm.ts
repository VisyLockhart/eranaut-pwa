import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LIMITS, type RouteSubDto, type RouteSubInput } from '@eranaut/shared';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { readJson, writeJson } from '../core/storage';
import { Toast } from '../core/toast';
import { buildStats } from './core/build';
import { SEAS, TABLES, seaIndex } from './core/data';
import { judgeBuild, routeNeed } from './core/need';
import { routeCost, selectability, shortestOrder, travelMinutes } from './core/route';
import type { Build } from './core/types';
import { ROUTE_CACHE_KEY, ROUTE_LAST_KEY, clearRouteCache } from './route-cache';
import { ROUTE_FEATURES } from './route-features';
import { defaultSubName, normalizeSeq, sameBuild, sanitizeLast, sanitizeSubs, subToBuild, type Parts, type RouteTab } from './route-state';

/** 配置編輯對話框的模式:new = 新增(以目前配置為起點)、edit = 編輯某一組儲存潛艇、temp = 編輯臨時配置 */
export type ConfigMode = 'new' | 'edit' | 'temp';

/** 編輯中的草稿;只有按「只套用」或「儲存」才會影響畫面上的配置與已選航點 */
export interface ConfigDraft {
  mode: ConfigMode;
  /** mode = edit 時的儲存潛艇 id */
  id: string | null;
  name: string;
  level: number;
  parts: Parts;
  /** 開啟時的值,用來判斷有沒有改過 */
  base: Build;
  baseName: string;
}

/**
 * 航線模擬器的狀態(root 層級,版面切換或換頁不丟狀態,參照 D-163)。
 *
 * - 檢視狀態(海域、已選航點、等級與零件、目前使用的儲存潛艇)只存 localStorage、各裝置獨立(RS-26 ⑤)。
 * - 儲存潛艇(RS-25)存在伺服器、跨裝置同步:進入頁面載入、App 回前景再抓一次,不輪詢;同一筆以最後寫入為準;
 *   離線時顯示 localStorage 的快照,寫入需要網路(RS-26 ③④)。
 * - 寫入成功才更新畫面;失敗時丟出原始的 HttpErrorResponse 給呼叫端處理(409 = 已滿 10 組、400 = 驗證)。
 * - 登出或 session 失效:停止並清掉快照(檢視狀態保留)。
 */
@Injectable({ providedIn: 'root' })
export class RouteVm {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);
  /** 能不能儲存配置與綁定工坊潛艇;展示模式為 false(沒有伺服器),此時 `saved` 恆為空 */
  readonly canSave = inject(ROUTE_FEATURES).saving;

  private readonly init = sanitizeLast(readJson<unknown>(ROUTE_LAST_KEY));

  // ---- 檢視狀態 ----
  readonly sea = signal(this.init.sea);
  /** 已選航點 id,順序即航行順序 */
  readonly seq = signal<number[]>(this.init.seq);
  readonly level = signal(this.init.level);
  readonly parts = signal<Parts>(this.init.parts);
  /** 目前使用的儲存潛艇 id;null = 臨時配置 */
  readonly subId = signal<string | null>(this.init.subId);

  // ---- 分頁與對話框(放在這裡,換版面重建頁面元件時不會丟失) ----
  /** 目前的分頁。預設:沒有儲存配置 → 配置;否則記住上次主動切到的分頁(沒有記錄就進航線) */
  readonly tab = signal<RouteTab>(this.init.tab ?? 'config');
  /** 使用者本次已主動切過分頁(之後不再自動決定預設分頁) */
  private tabTouched = false;
  private tabSettled = false;
  /** 編輯中的配置草稿;null = 對話框關閉 */
  readonly draft = signal<ConfigDraft | null>(null);
  /** 航線頁:燈號下方的「路線需求」是否展開 */
  readonly needOpen = signal(false);
  /** 「查看性能」對話框 */
  readonly perfOpen = signal(false);
  /** 航線頁是否顯示「找路線」子頁(D-224);只放記憶體,換分頁不丟 */
  readonly findOpen = signal(false);
  /** 等待確認的「模擬路線」:航線頁已有不同的選點時,先問再換 */
  readonly pendingLoad = signal<{ sea: number; order: number[] } | null>(null);

  // ---- 儲存潛艇(伺服器) ----
  readonly saved = signal<RouteSubDto[]>([]);
  /** 第一次載入完成(含用快照顯示)前為 false */
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  /** 進行中的寫入數量;> 0 時畫面可以停用按鈕 */
  readonly pending = signal(0);

  // ---- 衍生 ----
  readonly seaIdx = computed(() => seaIndex(this.sea()));
  readonly build = computed<Build>(() => ({ level: this.level(), parts: this.parts() }));
  readonly stats = computed(() => buildStats(TABLES, this.build()));
  readonly cost = computed(() => routeCost(this.seaIdx(), this.seq()));
  /** 預估航行時間(分鐘);速度為 0 時 Infinity */
  readonly minutes = computed(() => travelMinutes(this.cost().distance, this.stats().speed));
  /** 每個航點目前能不能選(RS-06~RS-08、RS-23) */
  readonly selectable = computed(() => selectability(this.seaIdx(), this.seq(), this.level(), this.stats().range));
  readonly need = computed(() => routeNeed(this.seaIdx(), this.seq()));
  readonly judgement = computed(() => judgeBuild(this.stats(), this.need()));
  readonly selectedSub = computed(() => this.saved().find((s) => s.id === this.subId()) ?? null);
  /** 畫面上的配置與目前使用的儲存潛艇不同(可「覆蓋儲存」) */
  readonly dirty = computed(() => {
    const sub = this.selectedSub();
    return sub !== null && !sameBuild(this.build(), subToBuild(sub));
  });
  readonly isFull = computed(() => this.saved().length >= LIMITS.maxRouteSubsPerUser);
  /** 編輯中草稿的配置 */
  readonly draftBuild = computed<Build | null>(() => {
    const d = this.draft();
    return d ? { level: d.level, parts: d.parts } : null;
  });
  /** 草稿與開啟時不同(背景點擊在已改動時不關閉對話框) */
  readonly draftDirty = computed(() => {
    const d = this.draft();
    return d !== null && (d.name !== d.baseName || !sameBuild({ level: d.level, parts: d.parts }, d.base));
  });

  private started = false;
  private readonly visibilityHandler = (): void => {
    if (document.visibilityState === 'visible') void this.refresh();
  };

  constructor() {
    // 檢視狀態有變就存;進頁面時先整理一次(讀回來的序列可能超過目前上限)
    this.seq.set(normalizeSeq(this.seaIdx(), this.seq(), this.level(), this.stats().range));
    effect(() => {
      // 只記住使用者主動切到的分頁;自動決定的預設分頁不寫入,免得下次被當成偏好
      const tab = this.tab();
      const last = { sea: this.sea(), seq: this.seq(), level: this.level(), parts: this.parts(), subId: this.subId(), tab: this.tabTouched ? tab : this.init.tab };
      untracked(() => writeJson(ROUTE_LAST_KEY, last));
    });
    // 登出或 session 失效就停止並清掉快照;'loading'(啟動中)與 'unreachable'(離線)不清,離線時還要靠快照顯示
    effect(() => {
      const status = this.auth.status();
      if (status === 'anonymous' || status === 'expired') untracked(() => this.stop());
    });
  }

  // ---- 分頁 ----

  /** 使用者切換分頁(會被記住) */
  setTab(tab: RouteTab): void {
    this.tabTouched = true;
    this.tab.set(tab);
  }

  /** 載入儲存潛艇後決定預設分頁:沒有儲存配置 → 配置;有但沒有記錄 → 航線;有記錄 → 沿用。只在使用者還沒切過分頁時做 */
  private settleTab(): void {
    if (this.tabTouched || this.tabSettled || !this.loaded()) return;
    this.tabSettled = true;
    if (this.saved().length === 0) this.tab.set('config');
    else if (this.init.tab === null) this.tab.set('route');
  }

  // ---- 路線選取 ----

  selectSea(sea: number): void {
    if (sea === this.sea() || !SEAS.some((s) => s.sea === sea)) return;
    this.sea.set(sea);
    this.seq.set([]);
  }

  /** 點一下:沒選過就接在最後(RS-23);已選就取消。不可選的點沒有反應 */
  toggle(id: number): void {
    const state = this.selectable().get(id);
    if (state === 'selected') this.setSeq(this.seq().filter((x) => x !== id));
    else if (state === 'ok') this.seq.set([...this.seq(), id]);
  }

  /** 把一條現成的路線(例如掉落物反查的結果)放進地圖:換到該海域,依序放入;放不下的尾端會被丟掉 */
  loadRoute(sea: number, order: readonly number[]): void {
    if (!SEAS.some((x) => x.sea === sea)) return;
    this.sea.set(sea);
    this.seq.set([]);
    this.setSeq([...order]);
  }

  /**
   * 找路線結果的「模擬路線」:航線頁已有不同的選點就先請使用者確認(`pendingLoad`),否則直接換過去並回到航線頁。
   * 相同的路線不需要確認。
   */
  requestLoad(sea: number, order: readonly number[]): void {
    const cur = this.seq();
    if (cur.length > 0 && (sea !== this.sea() || cur.join() !== order.join())) {
      this.pendingLoad.set({ sea, order: [...order] });
      return;
    }
    this.finishLoad(sea, order);
  }

  confirmLoad(): void {
    const p = this.pendingLoad();
    if (!p) return;
    this.pendingLoad.set(null);
    this.finishLoad(p.sea, p.order);
  }

  cancelLoad(): void {
    this.pendingLoad.set(null);
  }

  private finishLoad(sea: number, order: readonly number[]): void {
    this.loadRoute(sea, order);
    this.findOpen.set(false);
    this.setTab('route');
  }

  /** 「最短順序」按鈕(RS-05、RS-23) */
  sortShortest(): void {
    if (this.seq().length < 2) return;
    this.seq.set(shortestOrder(this.seaIdx(), this.seq()).order);
  }

  clearSeq(): void {
    this.seq.set([]);
  }

  // ---- 配置 ----

  setLevel(level: number): void {
    if (!Number.isInteger(level) || level < 1 || level > LIMITS.maxRouteSubLevel) return;
    this.level.set(level);
    this.renormalize();
  }

  /** index 0~3 = 船體、船尾、船首、艦橋;idx 為 1~10(6~10 = 改版) */
  setPart(index: 0 | 1 | 2 | 3, idx: number): void {
    if (!Number.isInteger(idx) || idx < 1 || idx > 10) return;
    const next = [...this.parts()] as Parts;
    next[index] = idx;
    this.parts.set(next);
    this.renormalize();
  }

  /** 「帶入」已儲存的潛艇:填入等級與零件,並記住目前使用的是哪一組 */
  useSub(id: string): void {
    const sub = this.saved().find((s) => s.id === id);
    if (!sub) return;
    this.subId.set(sub.id);
    this.level.set(sub.level);
    this.parts.set([sub.hull, sub.stern, sub.bow, sub.bridge]);
    this.renormalize();
  }

  /** 把搜尋結果等「只有零件」的配置帶進畫面:保留目前等級,成為臨時配置(不再使用任何儲存潛艇) */
  applyParts(parts: Parts): void {
    this.subId.set(null);
    this.parts.set(parts);
    this.renormalize();
  }

  /** 不再使用任何儲存潛艇(保留畫面上的等級與零件作為臨時配置) */
  detachSub(): void {
    this.subId.set(null);
  }

  // ---- 配置編輯對話框(草稿) ----

  /** 開啟對話框:new / temp 以目前畫面上的配置為起點;edit 以該組儲存潛艇為起點 */
  openConfig(mode: ConfigMode, id: string | null = null): void {
    if (mode === 'edit') {
      const sub = this.saved().find((s) => s.id === id);
      if (!sub) return;
      const base = subToBuild(sub);
      this.draft.set({ mode, id: sub.id, name: sub.name, baseName: sub.name, level: base.level, parts: [...base.parts], base });
      return;
    }
    const base = this.build();
    const name = defaultSubName(base);
    this.draft.set({ mode, id: null, name, baseName: name, level: base.level, parts: [...base.parts], base: { level: base.level, parts: [...base.parts] } });
  }

  /** 編輯目前正在使用的配置(使用儲存潛艇就編輯那一組,否則編輯臨時配置) */
  editCurrent(): void {
    const sub = this.selectedSub();
    if (sub) this.openConfig('edit', sub.id);
    else this.openConfig('temp');
  }

  closeConfig(): void {
    this.draft.set(null);
  }

  setDraftLevel(level: number): void {
    const d = this.draft();
    if (!d || !Number.isInteger(level) || level < 1 || level > LIMITS.maxRouteSubLevel) return;
    this.patchDraft({ level });
  }

  /** index 0~3 = 船體、船尾、船首、艦橋;idx 為 1~10(6~10 = 改版) */
  setDraftPart(index: 0 | 1 | 2 | 3, idx: number): void {
    const d = this.draft();
    if (!d || !Number.isInteger(idx) || idx < 1 || idx > 10) return;
    const parts = [...d.parts] as Parts;
    parts[index] = idx;
    this.patchDraft({ parts });
  }

  setDraftName(name: string): void {
    const d = this.draft();
    if (d) this.draft.set({ ...d, name });
  }

  /** 改等級或零件時,若名稱還是依舊值產生的預設名稱,就跟著換成新的預設名稱 */
  private patchDraft(patch: { level?: number; parts?: Parts }): void {
    const d = this.draft();
    if (!d) return;
    const next = { ...d, ...patch };
    const wasDefault = d.name === defaultSubName({ level: d.level, parts: d.parts });
    this.draft.set(wasDefault ? { ...next, name: defaultSubName({ level: next.level, parts: next.parts }) } : next);
  }

  /** 「只套用」:草稿成為畫面上的配置,不寫入伺服器。草稿與編輯中的那一組完全相同時,等於改用那一組 */
  applyDraft(): void {
    const d = this.draft();
    if (!d) return;
    const sub = d.id ? this.saved().find((s) => s.id === d.id) : undefined;
    if (d.mode === 'edit' && sub && sameBuild({ level: d.level, parts: d.parts }, subToBuild(sub))) {
      this.useSub(sub.id);
    } else {
      this.subId.set(null);
      this.level.set(d.level);
      this.parts.set(d.parts);
      this.renormalize();
    }
    this.draft.set(null);
  }

  /**
   * 「儲存」:edit 模式覆蓋該組(可改名,保留綁定);new / temp 新增一組。`overwriteId` 用於已滿 10 組時改覆蓋另一組
   * (保留那一組原本的名稱與綁定)。成功後草稿成為畫面上的配置並關閉對話框;失敗時丟出原始錯誤,草稿保留。
   */
  async saveDraft(overwriteId?: string): Promise<RouteSubDto> {
    const d = this.draft();
    if (!d) throw new Error('沒有編輯中的配置');
    const build: Build = { level: d.level, parts: d.parts };
    const targetId = overwriteId ?? (d.mode === 'edit' ? d.id : null);
    const old = targetId ? this.saved().find((s) => s.id === targetId) : undefined;
    if (targetId && !old) throw new Error('找不到這一組儲存潛艇');
    const sub = old
      ? await this.write(() => this.api.updateRouteSub(old.id, this.inputFor(build, overwriteId ? old.name : d.name, old.bound_submarine_ids)))
      : await this.write(() => this.api.createRouteSub(this.inputFor(build, d.name, [])));
    if (old) this.replaceSaved(sub);
    else this.setSaved([...this.saved(), sub]);
    this.subId.set(sub.id);
    this.level.set(build.level);
    this.parts.set([...build.parts]);
    this.renormalize();
    this.draft.set(null);
    return sub;
  }

  // ---- 儲存潛艇(伺服器) ----

  /** 登入後進入航線頁時呼叫:先用快照顯示,再向 API 取最新,並在 App 回前景時重抓 */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (!this.canSave) {
      // 展示模式:沒有儲存潛艇可載入,直接視為載入完成(不碰 API、不留快照)
      this.loaded.set(true);
      return;
    }
    const cached = sanitizeSubs(readJson<unknown>(ROUTE_CACHE_KEY));
    if (cached.length > 0) {
      this.saved.set(cached);
      this.loaded.set(true);
      this.settleTab();
    }
    document.addEventListener('visibilitychange', this.visibilityHandler);
    void this.refresh();
  }

  /** 登出或 session 失效:停止重抓、清空清單與快照(檢視狀態保留) */
  stop(): void {
    if (this.started) document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.started = false;
    this.saved.set([]);
    this.loaded.set(false);
    this.loadError.set(false);
    this.pending.set(0);
    this.subId.set(null);
    this.draft.set(null);
    this.perfOpen.set(false);
    this.pendingLoad.set(null);
    this.tabSettled = false;
    clearRouteCache();
  }

  async refresh(): Promise<void> {
    if (!this.canSave) return;
    try {
      const list = sanitizeSubs(await this.api.routeSubs());
      this.setSaved(list);
      this.loaded.set(true);
      this.loadError.set(false);
      this.settleTab();
    } catch {
      // 401 由 interceptor 轉成 session 過期;其他錯誤保留現有畫面(快照),只標記失敗
      if (this.auth.status() === 'authenticated') this.loadError.set(true);
    }
  }

  /** 把畫面上的等級與零件存成新的一組;已滿 10 組時伺服器回 409,畫面應改問要覆蓋哪一組 */
  async saveCurrent(name: string): Promise<RouteSubDto> {
    const created = await this.write(() => this.api.createRouteSub(this.input(name, [])));
    this.setSaved([...this.saved(), created]);
    this.subId.set(created.id);
    return created;
  }

  /** 用畫面上的等級與零件覆蓋某一組(保留原名稱與綁定;可選擇改名) */
  async overwrite(id: string, name?: string): Promise<RouteSubDto> {
    const old = this.saved().find((s) => s.id === id);
    const updated = await this.write(() => this.api.updateRouteSub(id, this.input(name ?? old?.name ?? '', old?.bound_submarine_ids ?? [])));
    this.replaceSaved(updated);
    this.subId.set(updated.id);
    return updated;
  }

  /** 只改名稱或綁定,不動等級與零件(用該筆已儲存的值送出) */
  async updateSub(id: string, patch: { name?: string; bound_submarine_ids?: string[] }): Promise<RouteSubDto> {
    const old = this.saved().find((s) => s.id === id);
    if (!old) throw new Error('找不到這一組儲存潛艇');
    const input: RouteSubInput = {
      name: patch.name ?? old.name,
      level: old.level,
      hull: old.hull,
      stern: old.stern,
      bow: old.bow,
      bridge: old.bridge,
      bound_submarine_ids: patch.bound_submarine_ids === undefined ? old.bound_submarine_ids : patch.bound_submarine_ids,
    };
    const updated = await this.write(() => this.api.updateRouteSub(id, input));
    this.replaceSaved(updated);
    // 一艘潛艇只綁一組配置:伺服器會把它從別組搬過來,本地同步拿掉
    if (patch.bound_submarine_ids !== undefined) {
      const mine = new Set(updated.bound_submarine_ids);
      this.setSaved(
        this.saved().map((s) =>
          s.id === id || !s.bound_submarine_ids.some((x) => mine.has(x)) ? s : { ...s, bound_submarine_ids: s.bound_submarine_ids.filter((x) => !mine.has(x)) },
        ),
      );
    }
    return updated;
  }

  /** 整組取代綁定的工坊潛艇(RS-26 ①;同一組配置可綁多艘);空陣列 = 全部解除 */
  bind(id: string, submarineIds: string[]): Promise<RouteSubDto> {
    return this.updateSub(id, { bound_submarine_ids: submarineIds });
  }

  /** 404 代表已被刪掉(例如在別的裝置),當作成功 */
  async remove(id: string): Promise<void> {
    try {
      await this.write(() => this.api.deleteRouteSub(id));
    } catch (error) {
      if (!(error instanceof HttpErrorResponse && error.status === 404)) throw error;
    }
    this.setSaved(this.saved().filter((s) => s.id !== id));
  }

  // ---- 內部 ----

  private input(name: string, bound: string[]): RouteSubInput {
    return this.inputFor(this.build(), name, bound);
  }

  private inputFor(build: Build, name: string, bound: string[]): RouteSubInput {
    const [hull, stern, bow, bridge] = build.parts;
    return { name: name.trim(), level: build.level, hull, stern, bow, bridge, bound_submarine_ids: bound };
  }

  private async write<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canSave) throw new Error('展示模式不儲存配置');
    this.pending.update((n) => n + 1);
    try {
      return await fn();
    } finally {
      this.pending.update((n) => Math.max(0, n - 1));
    }
  }

  private replaceSaved(updated: RouteSubDto): void {
    this.setSaved(this.saved().map((s) => (s.id === updated.id ? updated : s)));
  }

  /** 更新清單、同步快照;目前使用的那一組若已不存在(例如在別的裝置刪掉)就解除 */
  private setSaved(list: RouteSubDto[]): void {
    this.saved.set(list);
    writeJson(ROUTE_CACHE_KEY, list);
    const id = this.subId();
    if (id !== null && !list.some((s) => s.id === id)) this.subId.set(null);
  }

  private setSeq(next: number[]): void {
    this.seq.set(normalizeSeq(this.seaIdx(), next, this.level(), this.stats().range));
  }

  /** 配置改變後重整已選航點;有放不下被移除的航點時提示 */
  private renormalize(): void {
    const before = this.seq().length;
    this.setSeq(this.seq());
    const dropped = before - this.seq().length;
    if (dropped > 0) this.toast.show(`已移除 ${dropped} 個放不下的航點`, { tone: 'warn' });
  }
}

