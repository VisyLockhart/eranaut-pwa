import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import type { ChartOcrResultDto, OcrErrorCode } from '@eranaut/shared';
import { SEAS } from '../route/core/data';
import { closeExplored, markExplored, unmarkExplored } from '../route/core/unlock';
import { Api } from './api';
import { UNLOCK_GRAPH, changedSeas, foundIn, foundOf, pointCode, seaName } from './charts';
import { DataStore } from './data-store';
import { ImageTools, isImageFile } from './image-input';
import { OverviewVm } from './overview-vm';
import { Toast } from './toast';
import { OCR_MAX_BYTES, fileProblem } from './update-vm';

// 「更新海圖」頁的狀態(D-293)。root 層級:換螢幕使版面在手機/桌機之間切換、頁面元件重建時,草稿與截圖留著(同 D-163);
// 只有導到別的頁面才 close()。截圖只在這次更新中以 object URL 暫存於瀏覽器(對照用),不上傳保存(D-126)。

/** 一張辨識過的截圖 */
export interface ChartShot {
  key: number;
  result: ChartOcrResultDto;
  /** 本機預覽用的 object URL(關閉頁面時釋放) */
  url: string;
}

export interface SeaTab {
  sea: number;
  name: string;
  base: number;
  draft: number;
  total: number;
  /** 這個海域有截圖、而且草稿點數和畫面上的「已發現 N」對不上 */
  warn: boolean;
  /** 還沒開放(上一個海域的解鎖點還沒發現,也沒有任何紀錄) */
  locked: boolean;
}

/** 辨識錯誤 → 畫面文字 */
export function chartErrorMessage(error: unknown): string {
  const code = error instanceof HttpErrorResponse ? ((error.error as { error?: OcrErrorCode } | null)?.error ?? null) : null;
  switch (code) {
    case 'unrecognized':
      return '看不出是哪一張海圖。請截工坊內「選擇航海圖」視窗(含下方的海圖),或直接點下面的海圖修改';
    case 'file_too_large':
      return '圖片超過 10 MB,請縮小後再試';
    case 'unsupported_image':
      return '只支援 PNG、JPEG、WebP 圖片';
    case 'busy':
      return '現在辨識的人比較多,請稍後再試';
    case 'ocr_unavailable':
      return '截圖辨識暫時不能用,請直接點海圖修改';
    default:
      return '辨識失敗,請稍後再試,或直接點海圖修改';
  }
}

@Injectable({ providedIn: 'root' })
export class ChartUpdateVm {
  private readonly api = inject(Api);
  private readonly store = inject(DataStore);
  private readonly overview = inject(OverviewVm);
  private readonly tools = inject(ImageTools);
  private readonly toast = inject(Toast);

  readonly workshopId = signal<string | null>(null);
  readonly workshop = computed(() => this.store.workshops().find((w) => w.id === this.workshopId()) ?? null);
  /** 開始這次更新時的紀錄(比較差異用) */
  readonly base = signal<ReadonlySet<number>>(new Set());
  readonly draft = signal<ReadonlySet<number>>(new Set());
  readonly shots = signal<ChartShot[]>([]);
  readonly viewSea = signal<number>(SEAS[0]!.sea);
  /** 手機版:看 App 的海圖,或對照截圖 */
  readonly view = signal<'app' | 'shot'>('app');
  /** 辨識中的張數 */
  readonly busy = signal(0);
  readonly error = signal<string | null>(null);
  readonly undo = signal<{ text: string; prev: ReadonlySet<number> } | null>(null);
  readonly saving = signal(false);
  private active = false;
  private nextKey = 1;

  readonly added = computed(() => diff(this.draft(), this.base()));
  readonly removed = computed(() => diff(this.base(), this.draft()));
  readonly changes = computed(() => changedSeas(this.base(), this.draft()));
  readonly dirty = computed(() => this.changes().length > 0);
  /** 依海域列出這次的變更(+n / −n) */
  readonly changeList = computed(() => {
    const add = this.added();
    const rem = this.removed();
    return SEAS.map((s) => ({ sea: s.sea, name: s.name, add: s.points.filter((p) => add.has(p.id)).length, rem: s.points.filter((p) => rem.has(p.id)).length })).filter((c) => c.add + c.rem > 0);
  });

  /** 這個海域最新一張截圖 */
  shotOf(sea: number): ChartShot | null {
    return [...this.shots()].reverse().find((s) => s.result.sea === sea) ?? null;
  }

  /** 截圖讀到的「已發現 N」和目前草稿對不上(使用者改到一致後提示就消失) */
  mismatch(sea: number): { screen: number; draft: number } | null {
    const shot = this.shotOf(sea);
    const screen = shot?.result.screen_count ?? null;
    if (screen === null) return null;
    const n = foundIn(this.draft(), sea);
    return n === screen ? null : { screen, draft: n };
  }

  /** 這個海域是否已開放:第一個海域、或它的入口點的前一個解鎖點已發現 */
  private isOpened(sea: number, draft: ReadonlySet<number>): boolean {
    const s = SEAS.find((x) => x.sea === sea);
    if (!s) return false;
    const root = this.rootPoint(sea);
    const parent = root ? UNLOCK_GRAPH.parent.get(root) : undefined;
    return s.sea === SEAS[0]!.sea || parent === undefined || draft.has(parent);
  }

  private rootPoint(sea: number): number | undefined {
    return SEAS.find((x) => x.sea === sea)?.points.find((p) => !UNLOCK_GRAPH.parent.has(p.id) || UNLOCK_GRAPH.seaOf.get(UNLOCK_GRAPH.parent.get(p.id)!)?.sea.sea !== sea)?.id;
  }

  readonly tabs = computed<SeaTab[]>(() => {
    const base = this.base();
    const draft = this.draft();
    this.shots();
    return SEAS.map((s) => {
      const b = foundIn(base, s.sea);
      const d = foundIn(draft, s.sea);
      return { sea: s.sea, name: s.name, base: b, draft: d, total: s.points.length, warn: this.mismatch(s.sea) !== null, locked: !this.isOpened(s.sea, draft) && b === 0 && d === 0 };
    });
  });

  /** 可以手動加入的海圖(目前沒顯示的分頁) */
  readonly addable = computed(() => this.tabs().filter((t) => t.locked));

  /** 手動加入海圖(D-294 補):標起點 A(1/n),連同前面海域的解鎖點一起標 */
  addSea(sea: number): void {
    const root = this.rootPoint(sea);
    if (root === undefined || !this.addable().some((t) => t.sea === sea)) return;
    const prev = this.draft();
    const { next } = markExplored(UNLOCK_GRAPH, prev, root);
    this.draft.set(next);
    this.undo.set(null);
    this.viewSea.set(sea);
  }

  /** 移除整張海圖:這個海域還沒解鎖的狀態——取消它的所有點,連同前一個海域裡解鎖它的那個點(可復原) */
  removeSea(sea: number): void {
    const s = SEAS.find((x) => x.sea === sea);
    const root = this.rootPoint(sea);
    const parent = root === undefined ? undefined : UNLOCK_GRAPH.parent.get(root);
    if (!s || parent === undefined) return;
    const prev = this.draft();
    let next = unmarkExplored(UNLOCK_GRAPH, prev, parent).next;
    next = new Set([...next].filter((id) => !s.points.some((p) => p.id === id)));
    if (next.size === prev.size) return;
    this.draft.set(next);
    this.undo.set({ text: `已移除 ${s.name} 的海圖(前一個海域的解鎖點也一併取消)`, prev });
    const visible = this.tabs().filter((t) => !t.locked);
    if (!visible.some((t) => t.sea === this.viewSea())) this.viewSea.set(visible[0]?.sea ?? SEAS[0]!.sea);
  }

  /** 進入頁面:表單進行中(同一間工坊)就沿用;否則以總覽正在看的工坊(或指定的)開始 */
  open(preferId: string | null = null): void {
    if (this.active && (preferId === null || preferId === this.workshopId())) return;
    const id = preferId ?? this.overview.currentWorkshop()?.id ?? this.store.workshops()[0]?.id ?? null;
    this.active = true;
    this.reset(id);
  }

  /** 換工坊:放棄目前的草稿與截圖 */
  selectWorkshop(id: string | null): void {
    if (id === this.workshopId()) return;
    this.reset(id);
  }

  /** 資料晚到或工坊被刪掉時補選一間;紀錄晚到(還沒改過草稿)時重新帶入 */
  ensureSelection(): void {
    if (!this.active) return;
    const list = this.store.workshops();
    if (!list.some((w) => w.id === this.workshopId())) {
      this.reset(list[0]?.id ?? null);
      return;
    }
    if (!this.dirty() && this.shots().length === 0) {
      const found = foundOf(this.workshop()) ?? new Set<number>();
      if (!sameSet(found, this.base())) {
        this.base.set(found);
        this.draft.set(found);
      }
    }
  }

  close(): void {
    this.active = false;
    this.reset(null);
  }

  private reset(id: string | null): void {
    for (const s of this.shots()) if (s.url) URL.revokeObjectURL(s.url);
    this.workshopId.set(id);
    const found = foundOf(this.workshop()) ?? new Set<number>();
    this.base.set(found);
    this.draft.set(found);
    this.shots.set([]);
    this.error.set(null);
    this.undo.set(null);
    this.view.set('app');
    // 停在最後一個有紀錄的海域
    const last = [...SEAS].reverse().find((s) => foundIn(found, s.sea) > 0);
    this.viewSea.set(last?.sea ?? SEAS[0]!.sea);
  }

  /** 依序辨識多張截圖(一次一張,避免佔滿伺服器的辨識佇列) */
  async recognize(files: readonly File[]): Promise<void> {
    const ws = this.workshopId();
    for (const file of files) {
      if (this.workshopId() !== ws) return; // 期間換了工坊
      let upload = file;
      if (file.size > OCR_MAX_BYTES && isImageFile(file)) upload = (await this.tools.shrink(file, OCR_MAX_BYTES)) ?? file;
      const problem = fileProblem(upload);
      if (problem) {
        this.error.set(problem);
        continue;
      }
      this.error.set(null);
      this.busy.update((n) => n + 1);
      try {
        const result = await this.api.chartOcr(upload);
        if (this.workshopId() !== ws) return;
        this.apply(result, file);
      } catch (error) {
        if (this.workshopId() === ws) this.error.set(chartErrorMessage(error));
      } finally {
        this.busy.update((n) => Math.max(0, n - 1));
      }
    }
  }

  /** 把辨識結果套進草稿:該海域改成辨識到的點(加上前面的點),其他海域不動 */
  private apply(result: ChartOcrResultDto, file: File): void {
    const seaPoints = new Set(SEAS.find((s) => s.sea === result.sea)?.points.map((p) => p.id) ?? []);
    let next = new Set([...this.draft()].filter((id) => !seaPoints.has(id)));
    for (const id of result.points) next = markExplored(UNLOCK_GRAPH, next, id).next;
    this.draft.set(next);
    this.undo.set(null);
    // 沒有海圖位置(例如展示版的示範結果)就不提供對照截圖,避免圈圈對不上
    const url = result.map_box.size > 0 ? URL.createObjectURL(file) : '';
    this.shots.update((list) => [...list.filter((s) => s.result.sea !== result.sea || (s.url && URL.revokeObjectURL(s.url), false)), { key: this.nextKey++, result, url }]);
    this.viewSea.set(result.sea);
  }

  /** 點海圖:未發現 → 連同前面的點標為已發現;已發現 → 連同後面的點取消 */
  toggle(id: number): void {
    const prev = this.draft();
    const name = `${seaName(UNLOCK_GRAPH.seaOf.get(id)?.sea.sea ?? 0)} ${pointCode(id)}`;
    if (prev.has(id)) {
      const { next, removed } = unmarkExplored(UNLOCK_GRAPH, prev, id);
      this.draft.set(next);
      this.undo.set({ text: removed.length > 1 ? `已取消 ${name},後面的 ${removed.length - 1} 個點也一起取消` : `已取消 ${name}`, prev });
    } else {
      const { next, added } = markExplored(UNLOCK_GRAPH, prev, id);
      this.draft.set(next);
      this.undo.set({ text: added.length > 1 ? `已加入 ${name},前面的 ${added.length - 1} 個點也一起加入` : `已加入 ${name}`, prev });
    }
  }

  undoLast(): void {
    const u = this.undo();
    if (!u) return;
    this.draft.set(u.prev);
    this.undo.set(null);
  }

  /** 儲存;成功回 true(失敗時留在頁面並提示) */
  async save(): Promise<boolean> {
    const id = this.workshopId();
    if (!id || this.saving()) return false;
    const draft = closeExplored(UNLOCK_GRAPH, this.draft());
    const seas = changedSeas(this.base(), draft);
    if (seas.length === 0) return true;
    this.saving.set(true);
    try {
      await this.store.saveCharts(id, seas);
      this.toast.show(`已更新 ${seas.map((s) => seaName(s.sea)).join('、')} 的海圖`, { tone: 'info' });
      this.base.set(draft);
      this.draft.set(draft);
      return true;
    } catch (error) {
      this.toast.show(error instanceof HttpErrorResponse && error.status === 404 ? '這間工坊已經不存在了' : '儲存失敗,請稍後再試', { tone: 'warn' });
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}

function diff(a: ReadonlySet<number>, b: ReadonlySet<number>): ReadonlySet<number> {
  return new Set([...a].filter((id) => !b.has(id)));
}

function sameSet(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}
