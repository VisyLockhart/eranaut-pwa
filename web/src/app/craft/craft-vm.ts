import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CraftLink, type CraftImport } from '../core/craft-link';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { CRAFT_KEY_SEL as KEY_SEL, CRAFT_KEY_STOCK as KEY_STOCK, CRAFT_KEY_VIEW as KEY_VIEW } from './craft-keys';
import { calculate, type CalcResult, type CalcRow, type RowKind, type Selection } from './core/craft-calc';
import { buildTree, hasTree, type TreeNode } from './core/craft-tree';
import { finalsProgress } from './core/craft-stock';
import { sourceTags, type SrcTag } from './core/craft-source';
import { CRAFT_DATA, ITEM_IDS, SLOT_KEYS } from './core/data';
import type { SlotKey } from './core/types';
import {
  DEFAULT_VIEW, allFrameNames, MAX_QTY, buildTray, isCrystalRow, TAB_LABEL, TABS, clampQty, copyLines, emptySel, listGroups, missing, relatedIds, rowId, sanitizeSel, sanitizeStock, sanitizeView,
  type CraftTab, type CraftView, type CrystalTray, type SelMap,
} from './craft-state';


function read(key: string): unknown {
  try {
    const r = localStorage.getItem(key);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* 無痕模式或容量滿:只是不記住 */
  }
}

/** 所有骨架名稱(判斷追蹤中的列是不是骨架) */
const ALL_FRAMES = allFrameNames();

/** 配件製作頁的狀態:選擇、檢視設定、庫存都只存在這台裝置的 localStorage(D-239) */
@Injectable({ providedIn: 'root' })
export class CraftVm {
  readonly slots = SLOT_KEYS;
  readonly sel = signal<SelMap>(sanitizeSel(read(KEY_SEL)));
  readonly view = signal<CraftView>(sanitizeView(read(KEY_VIEW)));
  private readonly layout = inject(Layout);
  /**
   * 只看(D-345)是否生效:只有桌機有;手機本來就是分頁單欄,記住的 focus 在手機上不起作用。
   * 只看時不顯示「關聯」(用到它 / 被它用到)的高亮與追蹤分類,因為另外兩欄看不到;追蹤橫幅(查價、來源、骨架)與配方樹照舊。
   */
  readonly focusOn = computed(() => this.view().focus && this.layout.isDesktop());
  readonly stock = signal<Record<string, number>>(sanitizeStock(read(KEY_STOCK)));
  /** 追蹤中的列(點一列:看它用到什麼、被誰用) */
  readonly pin = signal<string | null>(null);
  /** 被追蹤的列在哪一欄(同名的列可在不同欄,D-265) */
  readonly pinKind = signal<RowKind | null>(null);
  /** 開著配方樹的品項名稱(已追蹤的品項再點一次才開,D-264);null = 關。放這裡,換版面重建頁面時不丟 */
  readonly treeFor = signal<string | null>(null);
  readonly tree = computed<TreeNode | null>(() => {
    const n = this.treeFor();
    return n ? buildTree(n) : null;
  });
  /** 開著查價視窗的素材名稱(D-343);null = 關。放這裡,換版面重建頁面時不丟 */
  readonly priceFor = signal<string | null>(null);
  /** 追蹤橫幅的來源詳情是否展開(桌機在橫幅下方,手機是底部面板) */
  readonly srcOpen = signal(false);
  /** 追蹤中素材的其他取得管道(商人、部族、兌換…);需求數量用來換算比值類的通貨數 */
  readonly pinSources = computed<SrcTag[]>(() => {
    const p = this.pin();
    const k = this.pinKind();
    if (!p || !k) return [];
    const r = this.result();
    const row = (k === 'final' ? r.finals : k === 'direct' ? r.directs : r.bases).find((x) => x.name === p);
    return row ? sourceTags(p, row.need) : [];
  });
  /** 收合的分組,key = `${tab}:${group}` */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());
  /** 剛複製完的提示(1.5 秒) */
  readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  /** 「清除全部」第一次點擊後進入確認狀態(3 秒內再點才真的清除) */
  readonly confirmClear = signal(false);
  private confirmTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly link = inject(CraftLink);
  private readonly toast = inject(Toast);
  /** 剛從航線帶入的部位(短暫發光,不靠說明文字提示使用者哪裡變了) */
  readonly flash = signal(false);
  private flashTimer: ReturnType<typeof setTimeout> | undefined;
  /** 帶入前的選擇,給「復原」用 */
  private beforeImport: SelMap | null = null;
  private importToast: number | null = null;

  readonly selections = computed<Selection[]>(() => {
    const s = this.sel();
    const out: Selection[] = [];
    for (const slot of SLOT_KEYS) if (s[slot].gradeIndex !== null) out.push({ slot, gradeIndex: s[slot].gradeIndex, qty: s[slot].qty });
    return out;
  });
  readonly hasSelection = computed(() => this.selections().length > 0);
  /** 三層清單:記錄庫存開啟時,下層的需求會依上層庫存扣除(D-258);關閉時不看庫存 */
  readonly result = computed<CalcResult>(() => calculate(this.selections(), { expandFrames: this.view().expandedFrames }, CRAFT_DATA, this.view().stockMode ? this.stock() : {}));

  /** 要顯示的列(記錄庫存 + 只看缺少時,濾掉已足夠的) */
  readonly visible = computed<Record<CraftTab, CalcRow[]>>(() => {
    const r = this.result();
    const v = this.view();
    const st = this.stock();
    const f = (rows: CalcRow[]) => (v.stockMode && v.onlyMissing ? rows.filter((x) => missing(x, st) > 0) : rows);
    return { finals: f(r.finals), directs: f(r.directs), bases: f(r.bases) };
  });
  /** 各欄的分組:排序方式 + 追蹤置頂(追蹤分類排第一);晶類盤開啟時,晶類列改放晶類盤(D-327),不在列表裡 */
  readonly groups = computed(() => {
    const v = this.visible();
    const sort = this.view().sort;
    const focus = this.focusOn();
    const pin = focus ? null : this.pinId();
    const rel = focus ? new Set<string>() : this.related();
    const tray = this.view().crystalTray;
    const f = (rows: CalcRow[]) => listGroups(tray ? rows.filter((r) => !isCrystalRow(r)) : rows, sort, pin, rel);
    // 已展開的骨架留一列(灰色、可收回),只在交納素材欄(D-338)
    return { finals: f([...v.finals, ...this.result().expandedFrames]), directs: f(v.directs), bases: f(v.bases) };
  });
  /** 各欄的晶類盤;「晶類」開關關閉或該欄沒有晶類 = null */
  readonly trays = computed<Record<CraftTab, CrystalTray | null>>(() => {
    const on = this.view().crystalTray;
    const r = this.result();
    const v = this.visible();
    const t = (all: CalcRow[], shown: CalcRow[]) => (on ? buildTray(all, shown) : null);
    return { finals: t(r.finals, v.finals), directs: t(r.directs, v.directs), bases: t(r.bases, v.bases) };
  });
  readonly counts = computed(() => ({ finals: this.result().finals.length, directs: this.result().directs.length, bases: this.result().bases.length }));

  /** 備料進度 0~1:以交納素材計算,全部達標 = 100%(D-256、D-258) */
  readonly progress = computed(() => finalsProgress(this.result(), this.stock()));
  readonly missingTotal = computed(() => {
    const st = this.stock();
    const r = this.result();
    return [...r.finals, ...r.directs, ...r.bases].filter((x) => missing(x, st) > 0).length;
  });

  /** 追蹤:被點的列 + 它的成分 + 用到它的品項 */
  readonly related = computed<ReadonlySet<string>>(() => {
    const p = this.pin();
    const k = this.pinKind();
    return p && k ? relatedIds(this.result(), { name: p, kind: k }) : new Set<string>();
  });
  /** 被追蹤的那一列的識別(同名可能有多列,見 rowId) */
  readonly pinId = computed(() => {
    const p = this.pin();
    const k = this.pinKind();
    return p && k ? rowId({ name: p, kind: k }) : null;
  });
  /** 追蹤中的是骨架時:它現在是否已展開(追蹤橫幅的「展開 / 收回」鈕用,D-338);不是骨架 = null */
  readonly pinFrame = computed<{ name: string; expanded: boolean } | null>(() => {
    const p = this.pin();
    if (!p || this.pinKind() !== 'final' || !ALL_FRAMES.has(p)) return null;
    return { name: p, expanded: this.view().expandedFrames.includes(p) };
  });
  isFrameExpanded(name: string): boolean {
    return this.view().expandedFrames.includes(name);
  }
  /** 展開 / 收回單一骨架;記在 view,重新整理後還在 */
  toggleFrame(name: string): void {
    if (!ALL_FRAMES.has(name)) return;
    const cur = this.view().expandedFrames;
    this.patchView({ expandedFrames: cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name] });
  }
  isPinned(r: { kind: RowKind; name: string }): boolean {
    return this.pinId() === rowId(r);
  }

  constructor() {
    effect(() => write(KEY_SEL, this.sel()));
    effect(() => write(KEY_VIEW, this.view()));
    effect(() => write(KEY_STOCK, this.stock()));
  }

  /**
   * 從航線配置帶入(D-262):四個部位各設成該配置的配件、數量重設為 1;庫存不動。
   * 不跳確認,改在提示上給「復原」(原本沒有選擇就不需要)與「回配置」。
   */
  importParts(imp: CraftImport): void {
    const prev = this.sel();
    const next = emptySel();
    SLOT_KEYS.forEach((slot, i) => {
      next[slot] = { gradeIndex: imp.parts[i]! - 1, qty: 1 };
    });
    this.beforeImport = this.hasSelection() ? prev : null;
    this.sel.set(next);
    this.pin.set(null);
    this.flash.set(true);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flash.set(false), 1600);
    if (this.importToast !== null) this.toast.dismiss(this.importToast);
    const actions = [{ label: '回配置', run: () => this.link.back() }];
    if (this.beforeImport) actions.unshift({ label: '復原', run: () => this.undoImport() });
    this.importToast = this.toast.show(`已帶入「${imp.name}」`, { ms: 3000, actions });
  }
  undoImport(): void {
    if (!this.beforeImport) return;
    this.sel.set(this.beforeImport);
    this.beforeImport = null;
    this.pin.set(null);
    clearTimeout(this.flashTimer);
    this.flash.set(false);
  }

  /** 選等級;再點同一級 = 取消選擇 */
  setGrade(slot: SlotKey, gradeIndex: number | null): void {
    this.sel.update((s) => ({ ...s, [slot]: { gradeIndex: s[slot].gradeIndex === gradeIndex ? null : gradeIndex, qty: s[slot].qty } }));
    this.pin.set(null);
  }
  setQty(slot: SlotKey, qty: number): void {
    this.sel.update((s) => ({ ...s, [slot]: { ...s[slot], qty: clampQty(qty) } }));
  }
  stepQty(slot: SlotKey, d: number): void {
    this.setQty(slot, Math.min(MAX_QTY, this.sel()[slot].qty + d));
  }
  clearSlot(slot: SlotKey): void {
    this.sel.update((s) => ({ ...s, [slot]: { gradeIndex: null, qty: 1 } }));
  }
  requestClearAll(): void {
    clearTimeout(this.confirmTimer);
    if (this.confirmClear()) {
      this.confirmClear.set(false);
      this.clearAll();
      return;
    }
    this.confirmClear.set(true);
    this.confirmTimer = setTimeout(() => this.confirmClear.set(false), 3000);
  }
  cancelClearAll(): void {
    clearTimeout(this.confirmTimer);
    this.confirmClear.set(false);
  }
  clearAll(): void {
    this.sel.set(emptySel());
    this.pin.set(null);
    this.treeFor.set(null);
  }

  toggleSlots(): void {
    this.patchView({ slotsCollapsed: !this.view().slotsCollapsed });
  }
  /** 「分類」開關(D-337):開 = 按種類分組 + 晶類盤,關 = 按名稱排序、晶類回到列表 */
  setGrouped(on: boolean): void {
    this.patchView({ sort: on ? 'group' : 'name', crystalTray: on });
  }
  /** 進入只看:只顯示這一欄(D-345) */
  enterFocus(tab: CraftTab): void {
    this.patchView({ focus: true, tab });
  }
  exitFocus(): void {
    this.patchView({ focus: false });
  }
  patchView(p: Partial<CraftView>): void {
    this.view.update((v) => ({ ...DEFAULT_VIEW, ...v, ...p }));
  }
  /** 設定庫存;key 是 CalcRow.key(交納素材與素材用品項名稱,直接素材的可製作品是 `d:品項名稱`) */
  setStock(key: string, n: number): void {
    const v = Math.min(99999, Math.max(0, Math.floor(Number(n)) || 0));
    this.stock.update((s) => {
      const next = { ...s };
      if (v > 0) next[key] = v;
      else delete next[key];
      return next;
    });
  }
  /** 整列勾選:已有補到剛好夠;再點一次清零 */
  toggleDone(row: CalcRow): void {
    this.setStock(row.key, (this.stock()[row.key] ?? 0) >= row.need ? 0 : row.need);
  }
  clearStock(): void {
    this.stock.set({});
  }

  /** 這個品項有沒有配方樹(基礎素材沒有) */
  hasTree(name: string): boolean {
    return hasTree(name);
  }
  openTree(name: string): void {
    if (hasTree(name)) this.treeFor.set(name);
  }
  closeTree(): void {
    this.treeFor.set(null);
  }

  /** 這個品項有沒有物品 ID 可查價(骨架不是物品,沒有) */
  hasPrice(name: string): boolean {
    return Object.hasOwn(ITEM_IDS, name);
  }
  openPrice(name: string): void {
    if (this.hasPrice(name)) this.priceFor.set(name);
  }
  closePrice(): void {
    this.priceFor.set(null);
  }

  toggleSrc(): void {
    this.srcOpen.update((v) => !v);
  }

  togglePin(name: string, kind: RowKind): void {
    this.srcOpen.set(false);
    if (this.pin() === name && this.pinKind() === kind) {
      this.pin.set(null);
      this.pinKind.set(null);
    } else {
      this.pin.set(name);
      this.pinKind.set(kind);
    }
  }

  isCollapsed(tab: CraftTab, group: string): boolean {
    return this.collapsed().has(`${tab}:${group}`);
  }
  toggleGroup(tab: CraftTab, group: string): void {
    const k = `${tab}:${group}`;
    this.collapsed.update((c) => {
      const n = new Set(c);
      if (!n.delete(k)) n.add(k);
      return n;
    });
  }
  /** 晶類盤收合(預設展開);D-338 起併入「全部收合」 */
  isTrayCollapsed(tab: CraftTab): boolean {
    return this.collapsed().has(`${tab}:@tray`);
  }
  toggleTray(tab: CraftTab): void {
    this.toggleGroup(tab, '@tray');
  }
  /** 可收合的 key:分組(不含追蹤分類與按名稱時的單一組)+ 有晶類盤的欄的晶類盤(D-338) */
  private groupKeys(tabs: readonly CraftTab[]): string[] {
    return tabs.flatMap((t) => [
      ...(this.trays()[t] ? [`${t}:@tray`] : []),
      ...this.groups()[t].filter((g) => !g.trace && g.group !== '').map((g) => `${t}:${g.group}`),
    ]);
  }
  /** 全部收合;全部都已收合時改為全部展開 */
  toggleAllGroups(tabs: readonly CraftTab[]): void {
    const keys = this.groupKeys(tabs);
    this.collapsed.update((c) => (keys.length > 0 && keys.every((k) => c.has(k)) ? new Set([...c].filter((k) => !keys.includes(k))) : new Set([...c, ...keys])));
  }
  allCollapsed(tabs: readonly CraftTab[]): boolean {
    const keys = this.groupKeys(tabs);
    return keys.length > 0 && keys.every((k) => this.collapsed().has(k));
  }

  /** 要複製的文字:多欄時加【交納素材】等標題 */
  copyText(tabs: readonly CraftTab[]): string {
    const st = this.view().stockMode ? this.stock() : null;
    const parts: string[] = [];
    for (const t of tabs) {
      const lines = copyLines(this.result()[t], st, this.view().sort);
      if (lines.length === 0) continue;
      parts.push(tabs.length > 1 ? [`【${TAB_LABEL[t]}】`, ...lines].join('\n') : lines.join('\n'));
    }
    return parts.join('\n\n');
  }
  async copy(tabs: readonly CraftTab[]): Promise<boolean> {
    const text = this.copyText(tabs);
    if (!text) return false;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    if (ok) {
      this.copied.set(true);
      clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copied.set(false), 1500);
    }
    return ok;
  }

  readonly tabs = TABS;
}
