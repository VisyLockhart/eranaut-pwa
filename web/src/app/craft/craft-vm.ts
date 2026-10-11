import { Injectable, computed, effect, signal } from '@angular/core';
import { CRAFT_KEY_SEL as KEY_SEL, CRAFT_KEY_STOCK as KEY_STOCK, CRAFT_KEY_VIEW as KEY_VIEW } from './craft-keys';
import { calculate, type CalcResult, type CalcRow, type Selection } from './core/craft-calc';
import { applyStock, finalsProgress } from './core/craft-stock';
import { SLOT_KEYS } from './core/data';
import type { SlotKey } from './core/types';
import {
  DEFAULT_VIEW, MAX_QTY, TAB_LABEL, TABS, clampQty, copyLines, emptySel, groupRows, missing, sanitizeSel, sanitizeStock, sanitizeView,
  type CraftTab, type CraftView, type SelMap,
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

/** 配件製作頁的狀態:選擇、檢視設定、庫存都只存在這台裝置的 localStorage(D-239) */
@Injectable({ providedIn: 'root' })
export class CraftVm {
  readonly slots = SLOT_KEYS;
  readonly sel = signal<SelMap>(sanitizeSel(read(KEY_SEL)));
  readonly view = signal<CraftView>(sanitizeView(read(KEY_VIEW)));
  readonly stock = signal<Record<string, number>>(sanitizeStock(read(KEY_STOCK)));
  /** 追蹤中的列(點一列:看它用到什麼、被誰用) */
  readonly pin = signal<string | null>(null);
  /** 收合的分組,key = `${tab}:${group}` */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());
  /** 剛複製完的提示(1.5 秒) */
  readonly copied = signal(false);
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  /** 「清除全部」第一次點擊後進入確認狀態(3 秒內再點才真的清除) */
  readonly confirmClear = signal(false);
  private confirmTimer: ReturnType<typeof setTimeout> | undefined;

  readonly selections = computed<Selection[]>(() => {
    const s = this.sel();
    const out: Selection[] = [];
    for (const slot of SLOT_KEYS) if (s[slot].gradeIndex !== null) out.push({ slot, gradeIndex: s[slot].gradeIndex, qty: s[slot].qty });
    return out;
  });
  readonly hasSelection = computed(() => this.selections().length > 0);
  /** 配方總需求(不看庫存) */
  readonly result = computed<CalcResult>(() => calculate(this.selections(), { expandFrame: this.view().expandFrame }));
  /** 顯示用:記錄庫存開啟時,下層的需求會依上層庫存扣除(D-256);關閉時等於總需求 */
  readonly eff = computed<CalcResult>(() => (this.view().stockMode ? applyStock(this.result(), this.stock()) : this.result()));

  /** 要顯示的列(記錄庫存 + 只看缺少時,濾掉已足夠的) */
  readonly visible = computed<Record<CraftTab, CalcRow[]>>(() => {
    const r = this.eff();
    const v = this.view();
    const st = this.stock();
    const f = (rows: CalcRow[]) => (v.stockMode && v.onlyMissing ? rows.filter((x) => missing(x, st) > 0) : rows);
    return { finals: f(r.finals), semis: f(r.semis), bases: f(r.bases) };
  });
  readonly groups = computed(() => ({
    finals: groupRows(this.visible().finals),
    semis: groupRows(this.visible().semis),
    bases: groupRows(this.visible().bases),
  }));
  readonly counts = computed(() => ({ finals: this.result().finals.length, semis: this.result().semis.length, bases: this.result().bases.length }));

  /** 備料進度 0~1:以成品計算,成品全部達標 = 100%(D-256) */
  readonly progress = computed(() => finalsProgress(this.result(), this.stock()));
  readonly missingTotal = computed(() => {
    const st = this.stock();
    const r = this.eff();
    return [...r.finals, ...r.semis, ...r.bases].filter((x) => missing(x, st) > 0).length;
  });

  /** 追蹤:被點的列 + 它的成分 + 用到它的品項 */
  readonly related = computed<ReadonlySet<string>>(() => {
    const p = this.pin();
    if (!p) return new Set();
    const r = this.result();
    const row = [...r.finals, ...r.semis, ...r.bases].find((x) => x.name === p);
    return row ? new Set([...Object.keys(row.inputs), ...row.usedBy]) : new Set();
  });

  constructor() {
    effect(() => write(KEY_SEL, this.sel()));
    effect(() => write(KEY_VIEW, this.view()));
    effect(() => write(KEY_STOCK, this.stock()));
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
  }

  toggleSlots(): void {
    this.patchView({ slotsCollapsed: !this.view().slotsCollapsed });
  }
  patchView(p: Partial<CraftView>): void {
    this.view.update((v) => ({ ...DEFAULT_VIEW, ...v, ...p }));
  }
  setStock(name: string, n: number): void {
    const v = Math.min(99999, Math.max(0, Math.floor(Number(n)) || 0));
    this.stock.update((s) => {
      const next = { ...s };
      if (v > 0) next[name] = v;
      else delete next[name];
      return next;
    });
  }
  /** 整列勾選:已有補到剛好夠;再點一次清零 */
  toggleDone(row: CalcRow): void {
    this.setStock(row.name, (this.stock()[row.name] ?? 0) >= row.need ? 0 : row.need);
  }
  clearStock(): void {
    this.stock.set({});
  }

  togglePin(name: string): void {
    this.pin.update((p) => (p === name ? null : name));
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
  /** 全部收合;全部都已收合時改為全部展開 */
  toggleAllGroups(tabs: readonly CraftTab[]): void {
    const keys = tabs.flatMap((t) => this.groups()[t].map((g) => `${t}:${g.group}`));
    this.collapsed.update((c) => (keys.length > 0 && keys.every((k) => c.has(k)) ? new Set([...c].filter((k) => !keys.includes(k))) : new Set([...c, ...keys])));
  }
  allCollapsed(tabs: readonly CraftTab[]): boolean {
    const keys = tabs.flatMap((t) => this.groups()[t].map((g) => `${t}:${g.group}`));
    return keys.length > 0 && keys.every((k) => this.collapsed().has(k));
  }

  /** 要複製的文字:多欄時加【成品】等標題 */
  copyText(tabs: readonly CraftTab[]): string {
    const st = this.view().stockMode ? this.stock() : null;
    const parts: string[] = [];
    for (const t of tabs) {
      const lines = copyLines(this.eff()[t], st);
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
