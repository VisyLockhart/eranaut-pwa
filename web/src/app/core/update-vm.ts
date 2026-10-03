import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { OcrErrorCode, OcrResultDto, OcrWarning, SubmarinesBatchValidationErrorBody, SubmarinesUpdateResult } from '@eranaut/shared';
import { Api } from './api';
import { Auth } from './auth';
import { MINUTE_MS, compensated, displayMinutes, submitMinutes, toParts } from './compensation';
import { DataStore } from './data-store';
import { circled } from './format';
import { ImageTools, isImageFile } from './image-input';
import { OverviewVm } from './overview-vm';
import {
  batchFieldMessage,
  clearFlag,
  defaultName,
  etaText,
  nextFreePosition,
  newRow,
  fillBlanks,
  rebase,
  rowError,
  rowFromOcr,
  rowFromSubmarine,
  rowMinutes,
  serverRowMessage,
  toSubmarineInput,
  type SubRow,
  type TimeField,
} from './submarine-form';
import { Toast } from './toast';

/** 補正計時器的檢查間隔;顯示精度是分鐘,值只在改變時才寫入(D-124 ⑧:以時間戳計算,不累加) */
const TICK_MS = 1000;

/** 上傳截圖的限制,與 API 一致(SCHEMA §8.1):PNG / JPEG / WebP、10 MB */
export const OCR_MAX_BYTES = 10 * 1024 * 1024;
const OCR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type UpdateMode = 'ocr' | 'manual';
/** 截圖辨識分頁的階段:等上傳 → 辨識中 → 結果確認(帶入表單) */
export type OcrPhase = 'idle' | 'busy' | 'review';

/** 上傳前的檢查;沒問題回 null */
export function fileProblem(file: Pick<File, 'type' | 'size'>): string | null {
  if (!OCR_TYPES.includes(file.type)) return '只支援 PNG、JPEG、WebP 圖片';
  if (file.size > OCR_MAX_BYTES) return '圖片超過 10 MB，請縮小後再試';
  if (file.size === 0) return '這個檔案是空的，請重新選擇';
  return null;
}

/** API 的辨識錯誤 → 畫面文字 */
export function ocrErrorMessage(error: unknown): string {
  const code = error instanceof HttpErrorResponse ? ((error.error as { error?: OcrErrorCode } | null)?.error ?? null) : null;
  switch (code) {
    case 'no_file':
      return '沒有收到圖片，請重新選擇';
    case 'file_too_large':
      return '圖片超過 10 MB，請縮小後再試';
    case 'unsupported_image':
      return '只支援 PNG、JPEG、WebP 圖片';
    case 'unrecognized':
      return '看不出這是潛水艇的畫面，請確認截圖包含潛水艇列表，或改用手動輸入';
    case 'busy':
      return '現在辨識的人比較多，請稍後再試';
    case 'ocr_unavailable':
      return '截圖辨識暫時不能用，請改用手動輸入';
    default:
      return '辨識失敗，請稍後再試或改用手動輸入';
  }
}

const WARNING_TEXT: Record<OcrWarning, string> = {
  row_count_mismatch: '讀到的潛艇數和畫面上的對不上，可能少讀了某一艘，位置可能錯位，請逐艘對照遊戲畫面。',
  too_many_rows: '截圖裡讀到超過 4 艘，只取了前 4 艘。',
};

/** 送出結果,給頁面決定要不要離開 */
export type SubmitOutcome = 'ok' | 'invalid' | 'failed' | 'voided' | 'gone';

/**
 * 「更新潛艇」整坊表單的狀態與 D-124 補正(手動輸入;截圖辨識之後接上時共用這份狀態)。
 * 手機與桌機版面共用,所以放在 service。單一計時器、tick 只更新有變的列(D-124 實作備忘)。
 * 離開頁面視同關閉頁籤:不保存草稿(D-145 ⑤)。
 */
@Injectable({ providedIn: 'root' })
export class UpdateVm {
  private readonly store = inject(DataStore);
  private readonly overview = inject(OverviewVm);
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);
  private readonly api = inject(Api);
  private readonly tools = inject(ImageTools);

  readonly workshopId = signal<string | null>(null);
  readonly rows = signal<SubRow[]>([]);
  /** 以列的 key 為鍵的錯誤訊息 */
  readonly errors = signal<Record<number, string>>({});
  /** 整張表單層級的錯誤(例如陣列問題、網路失敗) */
  readonly formError = signal<string | null>(null);
  /** 目前已補正的分鐘數(各列中最大者,給提示用) */
  readonly compMin = signal(0);
  readonly submitting = signal(false);
  /** 預計返航文字用的現在時間;每個 tick 更新 */
  readonly now = signal(Date.now());

  // ---- 截圖辨識(D-117 兩個分頁;D-125 API) ----
  readonly mode = signal<UpdateMode>('ocr');
  readonly ocrPhase = signal<OcrPhase>('idle');
  readonly ocrError = signal<string | null>(null);
  /** 整份截圖層級的提醒(列數對不上等) */
  readonly ocrWarnings = signal<string[]>([]);
  /** 表單(送出鈕與各列)是否顯示:手動輸入,或截圖辨識已有結果 */
  readonly formVisible = computed(() => this.workshop() !== null && (this.mode() === 'manual' || this.ocrPhase() === 'review'));

  readonly workshop = computed(() => this.store.workshops().find((w) => w.id === this.workshopId()) ?? null);
  readonly canAdd = computed(() => nextFreePosition(this.rows()) !== null);
  readonly nextPosition = computed(() => nextFreePosition(this.rows()));

  private timer: ReturnType<typeof setInterval> | null = null;
  private nextKey = 1;
  /** 每次開始辨識、或表單被重建就加一;回來得太晚的結果直接丟掉 */
  private ocrSeq = 0;

  constructor() {
    // 登出或 session 失效:丟棄填到一半的表單與辨識結果(頁面元件因版面切換重建時不會經過這裡,D-163)
    effect(() => {
      if (this.auth.status() !== 'authenticated') untracked(() => this.close());
    });
  }

  /** 進入頁面:選好工坊、建立表單、開始計時(已在進行中則沿用目前的表單) */
  open(): void {
    // 頁面元件因版面切換被重建時(狀態還在),不重建表單
    const kept = this.workshopId();
    if (this.timer !== null && kept !== null && this.store.workshops().some((w) => w.id === kept)) return;
    const preferred = this.overview.currentWorkshop()?.id ?? this.store.workshops()[0]?.id ?? null;
    this.selectWorkshop(preferred);
    if (this.timer === null) this.timer = setInterval(() => this.tick(Date.now()), TICK_MS);
  }

  /**
   * 資料晚於頁面到達(直接開 /update、快照還沒有時)或選的工坊被刪掉時,補選一間工坊。
   * 已選且仍存在的工坊不動——重抓資料不會蓋掉使用者正在填的內容。
   */
  ensureSelection(): void {
    const list = this.store.workshops();
    const current = this.workshopId();
    if (current !== null && list.some((w) => w.id === current)) return;
    if (list.length === 0) {
      if (current !== null) this.selectWorkshop(null);
      return;
    }
    this.selectWorkshop(this.overview.currentWorkshop()?.id ?? list[0].id);
  }

  /** 離開頁面:停止計時、丟棄表單 */
  close(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.workshopId.set(null);
    this.rows.set([]);
    this.errors.set({});
    this.formError.set(null);
    this.compMin.set(0);
    this.submitting.set(false);
    this.mode.set('ocr');
  }

  /** 選工坊:以該工坊目前的潛艇建立表單(沒有潛艇則先給第 1 艘空列);重新建立會丟棄已填的內容 */
  selectWorkshop(id: string | null): void {
    this.workshopId.set(id);
    this.errors.set({});
    this.formError.set(null);
    this.compMin.set(0);
    this.resetOcr();
    const ws = this.store.workshops().find((w) => w.id === id);
    if (!ws) {
      this.rows.set([]);
      return;
    }
    const rows = ws.submarines.map((s) => rowFromSubmarine(this.nextKey++, s));
    if (rows.length === 0) rows.push(newRow(this.nextKey++, 1, defaultName(1), 'exploring', true));
    const now = Date.now();
    this.now.set(now);
    this.rows.set(rows.map((r) => rebase(r, now)));
  }

  /** 切換分頁:丟棄目前的表單與辨識結果,以工坊目前的潛艇重建 */
  setMode(mode: UpdateMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.selectWorkshop(this.workshopId());
  }

  private resetOcr(): void {
    this.ocrSeq++;
    this.ocrPhase.set('idle');
    this.ocrError.set(null);
    this.ocrWarnings.set([]);
  }

  /** 「重新上傳」:丟掉這次的辨識結果,回到等上傳(使用者的操作優先,D-124 ③) */
  restartOcr(): void {
    this.selectWorkshop(this.workshopId());
  }

  /**
   * 上傳一張截圖:辨識結果回來的時間就是 D-124 補正的起點(每一艘各自起算,①)。
   * 名稱讀不到的沿用既有名稱(D-154);辨識只填表單,不送出——使用者核對後再按「送出更新」(D-49)。
   */
  async recognize(file: File): Promise<void> {
    if (this.workshopId() === null || this.ocrPhase() === 'busy') return;
    const seq = ++this.ocrSeq;
    let upload = file;
    // 超過上限的圖(例如貼上的 4K 全螢幕 PNG)先在瀏覽器端縮圖重新編碼(D-162);縮不了就沿用原檔,下面照舊提示超過上限
    if (file.size > OCR_MAX_BYTES && isImageFile(file)) {
      this.ocrError.set(null);
      this.ocrPhase.set('busy');
      upload = (await this.tools.shrink(file, OCR_MAX_BYTES)) ?? file;
      if (seq !== this.ocrSeq) return; // 縮圖期間換了工坊或分頁
      this.ocrPhase.set('idle');
    }
    const problem = fileProblem(upload);
    if (problem) {
      this.ocrError.set(problem);
      return;
    }
    this.ocrError.set(null);
    this.ocrPhase.set('busy');
    try {
      const result = await this.api.ocr(upload);
      if (seq !== this.ocrSeq) return; // 期間換了工坊或分頁
      this.applyOcr(result);
    } catch (error) {
      if (seq !== this.ocrSeq) return;
      this.ocrPhase.set('idle');
      this.ocrError.set(ocrErrorMessage(error));
    }
  }

  /** 取得圖片這一步就失敗(例如擷取畫面出錯)時,在上傳區顯示說明 */
  reportOcrError(message: string): void {
    if (this.ocrPhase() === 'busy') return;
    this.ocrError.set(message);
  }

  private applyOcr(result: OcrResultDto): void {
    const existing = new Map((this.workshop()?.submarines ?? []).map((s) => [s.position, s]));
    const now = Date.now();
    this.now.set(now);
    this.rows.set(result.submarines.map((dto) => rowFromOcr(this.nextKey++, dto, existing.get(dto.position), now)));
    this.errors.set({});
    this.formError.set(null);
    this.compMin.set(0);
    this.ocrWarnings.set(result.warnings.map((w) => WARNING_TEXT[w]));
    this.ocrPhase.set('review');
  }

  /** 截圖辨識的列可以不送(辨識多出來的);手動輸入只有這次新加入的位置能移除(R-32、D-122) */
  isRemovable(row: SubRow): boolean {
    return row.added || (this.mode() === 'ocr' && this.rows().length > 1);
  }

  // ---- 編輯 ----

  private patch(key: number, change: (row: SubRow) => SubRow): void {
    this.rows.update((rows) => rows.map((r) => (r.key === key ? change(r) : r)));
  }
  private clearError(key: number): void {
    if (key in this.errors()) this.errors.update(({ [key]: _gone, ...rest }) => rest);
  }

  setName(key: number, name: string): void {
    this.patch(key, (r) => clearFlag({ ...r, name }, 'name'));
    this.clearError(key);
  }

  /** 輸入日/時/分:寫入的同時暫停這一列的補正(使用者的修改優先,D-124 ③) */
  setTime(key: number, field: TimeField, value: string): void {
    this.patch(key, (r) => clearFlag({ ...r, [field]: value, paused: true }, 'time'));
    this.clearError(key);
  }

  setStatus(key: number, status: SubRow['status']): void {
    this.patch(key, (r) => rebase(clearFlag({ ...r, status }, 'time'), Date.now()));
    this.clearError(key);
  }

  /** 進入這一列的時間欄位:暫停補正 */
  pause(key: number): void {
    this.patch(key, (r) => (r.paused ? r : { ...r, paused: true }));
  }

  /** 離開這一列的時間欄位(焦點沒有移到同一列的其他時間欄位時):空白欄位補 0(D-156),再以目前的值重新起算 */
  resume(key: number): void {
    this.patch(key, (r) => rebase(fillBlanks({ ...r, paused: false }), Date.now()));
  }

  addRow(): void {
    const position = nextFreePosition(this.rows());
    if (position === null) return;
    this.rows.update((rows) => [...rows, rebase(newRow(this.nextKey++, position, defaultName(position), 'exploring', true), Date.now())]);
    this.errors.set({});
    this.formError.set(null);
  }

  /** 只有這次表單新加入的位置可以移除(既有位置不提供刪除,R-32) */
  removeRow(key: number): void {
    this.rows.update((rows) => rows.filter((r) => !(r.key === key && this.isRemovable(r))));
    this.errors.set({});
    this.formError.set(null);
  }

  etaOf(row: SubRow): string {
    return etaText(row, this.now());
  }

  // ---- D-124 補正 ----

  /**
   * 計時器每次檢查:每一列依自己的起點(時間戳)重算畫面數值;正在編輯的列暫停。
   * 任一列扣到 0 → 資料作廢。回傳是否作廢(給測試與呼叫端)。
   */
  tick(now: number, minuteMs = MINUTE_MS): boolean {
    if (this.rows().length === 0) return false;
    this.now.set(now);
    let maxComp = 0;
    let voided = false;
    const next = this.rows().map((row) => {
      if (row.status !== 'exploring' || row.base === null || row.paused) return row;
      const current = displayMinutes(row.base, row.startedAt, now, minuteMs);
      if (current <= 0) {
        voided = true;
        return row;
      }
      maxComp = Math.max(maxComp, compensated(row.startedAt, now, minuteMs));
      const p = toParts(current);
      const [d, h, m] = [String(p.d), String(p.h), String(p.m)];
      return d === row.d && h === row.h && m === row.m ? row : { ...row, d, h, m };
    });
    if (voided) {
      this.voidForTimeout();
      return true;
    }
    // 數值沒變就不寫入(D-124 實作備忘)
    if (next.some((r, i) => r !== this.rows()[i])) this.rows.set(next);
    if (maxComp !== this.compMin()) this.compMin.set(maxComp);
    return false;
  }

  /** D-124 ⑥:剩餘時間被扣到 0,代表使用者已離開電腦,這次資料作廢,表單回到全新狀態 */
  private voidForTimeout(): void {
    this.selectWorkshop(this.workshopId());
    const again = this.mode() === 'ocr' ? '請重新上傳截圖' : '請重新輸入';
    this.toast.show(`等待時間過久，剩餘時間已扣到 0，這次的資料已作廢，${again}`, { tone: 'warn', ms: 6000 });
  }

  // ---- 送出 ----

  /** 驗證 → 套用補正(零頭進位)→ 送出。成功時顯示提示並回 'ok',由頁面跳回總覽 */
  async submit(): Promise<SubmitOutcome> {
    const workshopId = this.workshopId();
    const ws = this.workshop();
    if (this.submitting() || workshopId === null || ws === null) return 'failed';

    const rows = this.rows();
    const errors: Record<number, string> = {};
    for (const row of rows) {
      const message = rowError(row);
      if (message) errors[row.key] = message;
    }
    this.errors.set(errors);
    this.formError.set(null);
    if (Object.keys(errors).length > 0) return 'invalid';

    // D-124:送出當下,仍在補正的列把不足一分鐘的零頭再多扣 1 分鐘;任一列歸零 → 作廢
    const now = Date.now();
    const minutes = new Map<number, number | null>();
    for (const row of rows) {
      if (row.status === 'complete') {
        minutes.set(row.key, null);
      } else if (row.base !== null && !row.paused) {
        const m = submitMinutes(row.base, row.startedAt, now);
        if (m <= 0) {
          this.voidForTimeout();
          return 'voided';
        }
        minutes.set(row.key, m);
      } else {
        minutes.set(row.key, rowMinutes(row));
      }
    }

    this.submitting.set(true);
    try {
      const result = await this.store.updateSubmarines(
        workshopId,
        rows.map((r) => toSubmarineInput(r, minutes.get(r.key) ?? null)),
      );
      this.announce(ws.name, ws.notify_batched, rows.length, result);
      this.overview.select(workshopId);
      return 'ok';
    } catch (error) {
      return this.handleError(error, rows);
    } finally {
      this.submitting.set(false);
    }
  }

  private handleError(error: unknown, rows: SubRow[]): SubmitOutcome {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        // 工坊已在別處被刪除:提示並讓頁面離開(畫面資料會在背景重抓後更新)
        this.toast.show('這間工坊已經不存在了', { tone: 'warn' });
        void this.store.refresh();
        return 'gone';
      }
      if (error.status === 400) {
        const body = error.error as SubmarinesBatchValidationErrorBody | null;
        const errors: Record<number, string> = {};
        for (const item of body?.items ?? []) {
          const row = rows[item.index];
          if (row) errors[row.key] = serverRowMessage(item.fields);
        }
        this.errors.set(errors);
        if (body?.fields?.submarines) this.formError.set(batchFieldMessage(body.fields.submarines));
        else if (Object.keys(errors).length === 0) this.formError.set('資料不正確，請檢查後再送出。');
        return 'invalid';
      }
    }
    // 401 由 interceptor 轉成 session 過期畫面;其他錯誤留在表單讓使用者重試(資料保留)
    this.formError.set('送出失敗，請稍後再試。');
    return 'failed';
  }

  /** 完成提示,以及 D-135 ②b 的「預先提醒時間已過」提示 */
  private announce(workshopName: string, batched: boolean, count: number, result: SubmarinesUpdateResult): void {
    this.toast.show(`已更新「${workshopName}」${count} 艘潛水艇`);
    announceSkippedReminders(this.toast, batched, result.reminder_skipped_positions);
  }
}

/** D-135 ②b:預先提醒時間已過的潛艇不會收到提醒,更新後提示使用者。整批模式整間工坊只有一則提醒 */
export function announceSkippedReminders(toast: Toast, batched: boolean, positions: readonly number[]): void {
  if (positions.length === 0) return;
  const text = batched
    ? '預先提醒的時間已過，這間工坊這次不會收到提醒。'
    : `${positions.map(circled).join('')} 的預先提醒時間已過，${positions.length === 1 ? '這艘' : '這幾艘'}這次不會收到提醒。`;
  toast.show(text, { tone: 'warn', ms: 7000 });
}
