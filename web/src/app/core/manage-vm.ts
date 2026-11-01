import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LIMITS, type SubmarinesChangeResult, type SubmarineTransferMode } from '@eranaut/shared';
import { DataStore } from './data-store';
import { circled } from './format';
import { OverviewVm, wsInfo, type OverviewItem } from './overview-vm';
import { changedCount, dropOnPool, initLayout, tapPool, tapSlot, toInput, unpin, type LayoutState } from './position-layout';
import { Toast } from './toast';

// 工坊「管理模式」(D-313~D-315):單一工坊檢視下,像檔案總管一樣勾選潛艇做新增 / 刪除 / 搬移 / 複製 / 位置編輯。
// 狀態放在 service,手機 / 桌機兩種版面共用,切換版面不會丟失選取(D-163)。一律不阻擋超過 4 艘,只提醒。

export type ManageDialog = null | 'delete' | 'move' | 'copymove' | 'layout';

/** 目的工坊一列:艘數儀表(已有 / 放入 / 超過)與文字 */
export interface DestRow {
  id: string;
  name: string;
  info: string;
  have: number;
  add: number;
  after: number;
  over: boolean;
  checked: boolean;
  pips: ('have' | 'add' | 'empty' | 'over')[];
  /** `5 / 4 艘・超過` */
  text: string;
}

/** 位置編輯畫面上的一艘 */
export interface LayoutSub {
  id: string;
  name: string;
  level: number | null;
  /** 原本的圈號 */
  from: string;
}

const REC = LIMITS.maxSubmarinesPerWorkshop;
const UNDO_MS = 8000;

export function destPips(have: number, add: number): DestRow['pips'] {
  const after = have + add;
  return Array.from({ length: Math.max(REC, after) }, (_, i) => (i >= REC ? 'over' : i < have ? 'have' : i < after ? 'add' : 'empty'));
}

@Injectable({ providedIn: 'root' })
export class ManageVm {
  private readonly store = inject(DataStore);
  private readonly vm = inject(OverviewVm);
  private readonly toast = inject(Toast);

  /** 管理模式開啟中 */
  readonly active = signal(false);
  private readonly picked = signal<ReadonlySet<string>>(new Set());
  readonly dialog = signal<ManageDialog>(null);
  /** 搬移 / 複製到... 對話框裡勾選的目的工坊 */
  readonly targets = signal<string[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  /** 位置編輯的目前狀態(對話框開著才有) */
  readonly layout = signal<LayoutState | null>(null);
  private layoutBase: LayoutState | null = null;

  constructor() {
    // 回到「全部」檢視、換工坊:離開管理模式,丟棄選取與未送出的對話框
    effect(() => {
      this.vm.currentWorkshop()?.id;
      untracked(() => this.exit());
    });
  }

  readonly workshop = computed(() => this.vm.currentWorkshop());
  /** 目前工坊的全部潛艇(依目前排序) */
  readonly items = this.vm.items;
  readonly selectedItems = computed<OverviewItem[]>(() => {
    const p = this.picked();
    return this.items().filter((i) => p.has(i.id));
  });
  readonly count = computed(() => this.selectedItems().length);
  readonly selectState = computed<'none' | 'some' | 'all'>(() => {
    const n = this.count();
    return n === 0 ? 'none' : n === this.items().length ? 'all' : 'some';
  });
  /** 超過建議的 4 艘或有未排入的:「編排位置」按鈕醒目 */
  readonly needsLayout = computed(() => this.items().length > REC || this.items().some((i) => !i.placed));
  readonly unplacedCount = computed(() => this.items().filter((i) => !i.placed).length);

  isPicked(id: string): boolean {
    return this.picked().has(id);
  }

  // ---- 進出與選取 ----

  enter(): void {
    if (this.workshop()) this.active.set(true);
  }
  exit(): void {
    this.active.set(false);
    this.picked.set(new Set());
    this.closeDialog();
  }
  toggleMode(): void {
    if (this.active()) this.exit();
    else this.enter();
  }
  toggle(id: string): void {
    this.picked.update((s) => {
      const n = new Set(s);
      if (!n.delete(id)) n.add(id);
      return n;
    });
  }
  /** 手機長按:進管理模式並選取該列 */
  longPress(id: string): void {
    this.enter();
    if (this.active()) this.picked.update((s) => new Set(s).add(id));
  }
  /** 表頭全選:全選 → 全不選;其他(沒選、部分選)→ 全選 */
  toggleAll(): void {
    this.picked.set(this.selectState() === 'all' ? new Set() : new Set(this.items().map((i) => i.id)));
  }

  // ---- 對話框 ----

  openDelete(): void {
    if (this.count() > 0) this.open('delete');
  }
  openTransfer(kind: 'move' | 'copymove'): void {
    if (this.count() === 0) return;
    const others = this.otherWorkshops();
    this.targets.set(others.length === 1 ? [others[0]!.id] : []);
    this.open(kind);
  }
  openLayout(): void {
    const ws = this.workshop();
    if (!ws) return;
    this.layoutBase = initLayout(ws.submarines);
    this.layout.set(this.layoutBase);
    this.open('layout');
  }
  private open(d: Exclude<ManageDialog, null>): void {
    this.error.set(null);
    this.dialog.set(d);
  }
  closeDialog(): void {
    this.dialog.set(null);
    this.targets.set([]);
    this.error.set(null);
    this.layout.set(null);
    this.layoutBase = null;
  }

  // ---- 刪除 ----

  /** 刪除後工坊會變成 0 艘(對話框註明「工坊會保留」) */
  readonly emptiesWorkshop = computed(() => this.count() > 0 && this.count() === this.items().length);

  async confirmDelete(): Promise<void> {
    const ws = this.workshop();
    const ids = this.selectedItems().map((i) => i.id);
    if (!ws || ids.length === 0 || this.busy()) return;
    await this.run(async () => {
      await this.store.deleteSubmarines(ws.id, ids);
      this.picked.set(new Set());
      this.closeDialog();
      this.toast.show(`已刪除 ${ids.length} 艘潛水艇${this.items().length === 0 ? '，工坊保留' : ''}`);
    });
  }

  // ---- 搬移 / 複製 ----

  readonly otherWorkshops = computed(() => this.store.workshops().filter((w) => w.id !== this.workshop()?.id));

  readonly destRows = computed<DestRow[]>(() => {
    const picked = new Set(this.targets());
    const n = this.count();
    return this.otherWorkshops().map((w) => {
      const checked = picked.has(w.id);
      const have = w.submarines.length;
      const add = checked ? n : 0;
      const after = have + add;
      return { id: w.id, name: w.name, info: wsInfo(w) || '未設定伺服器', have, add, after, over: after > REC, checked, pips: destPips(have, add), text: `${after} / ${REC} 艘${after > REC ? '・超過' : ''}` };
    });
  });
  readonly overDests = computed(() => this.destRows().filter((r) => r.checked && r.over));
  readonly canConfirmTransfer = computed(() => this.count() > 0 && this.targets().length > 0 && !this.busy());

  toggleTarget(id: string): void {
    if (this.dialog() === 'move') this.targets.set([id]);
    else this.targets.update((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async confirmTransfer(): Promise<void> {
    const kind = this.dialog();
    if ((kind !== 'move' && kind !== 'copymove') || !this.canConfirmTransfer()) return;
    await this.transfer(kind === 'move' ? 'move' : 'copy', this.targets());
  }

  /** 複製:本工坊原地複製(名稱加「(複製)」) */
  async copyHere(): Promise<void> {
    const ws = this.workshop();
    if (!ws || this.count() === 0 || this.busy()) return;
    await this.transfer('copy', [ws.id]);
  }

  private async transfer(mode: SubmarineTransferMode, targetIds: string[]): Promise<void> {
    const ws = this.workshop();
    if (!ws) return;
    const ids = this.selectedItems().map((i) => i.id);
    const n = ids.length;
    await this.run(async () => {
      const result = await this.store.transferSubmarines({ source_workshop_id: ws.id, submarine_ids: ids, mode, target_workshop_ids: targetIds });
      this.picked.set(new Set());
      this.closeDialog();
      const names = targetIds.map((t) => this.nameOf(t)).join('、');
      if (mode === 'move') {
        this.toast.show(`已搬移 ${n} 艘到「${names}」`, { ms: UNDO_MS, actions: [{ label: '復原', run: () => void this.undoMove(ws.id, targetIds[0]!, ids) }] });
      } else {
        const same = targetIds.length === 1 && targetIds[0] === ws.id;
        this.toast.show(`已複製 ${n} 艘${same ? '' : `到「${names}」`}，狀態為新登記`, { ms: UNDO_MS, actions: [{ label: '復原', run: () => void this.undoCopy(result) }] });
        this.warnOver(result, targetIds);
      }
    });
  }

  /** 搬移的復原:搬回原工坊(位置放在原工坊的第一個空位) */
  private async undoMove(sourceId: string, targetId: string, ids: string[]): Promise<void> {
    await this.run(() => this.store.transferSubmarines({ source_workshop_id: targetId, submarine_ids: ids, mode: 'move', target_workshop_ids: [sourceId] }));
  }
  /** 複製的復原:刪除這次產生的複本 */
  private async undoCopy(result: SubmarinesChangeResult): Promise<void> {
    await this.run(async () => {
      for (const w of result.workshops) {
        const mine = w.submarines.filter((s) => result.created_ids.includes(s.id)).map((s) => s.id);
        if (mine.length > 0) await this.store.deleteSubmarines(w.workshop_id, mine);
      }
    });
  }

  // ---- 新增 ----

  async addSubmarine(): Promise<void> {
    const ws = this.workshop();
    if (!ws || this.busy()) return;
    await this.run(async () => {
      const result = await this.store.createSubmarine(ws.id, {});
      const made = result.workshops.flatMap((w) => w.submarines).find((s) => s.id === result.created_ids[0]);
      this.toast.show(`已新增「${made?.name ?? `潛水艇 ${circled(made?.position ?? 0)}`}」，狀態為新登記`);
      this.warnOver(result, [ws.id]);
    });
  }

  // ---- 位置編輯(D-314) ----

  readonly layoutSubs = computed(() => {
    const m = new Map<string, LayoutSub>();
    for (const s of this.workshop()?.submarines ?? []) m.set(s.id, { id: s.id, name: s.name ?? `潛水艇 ${circled(s.position)}`, level: s.progress?.effective_level ?? null, from: circled(s.position) });
    return m;
  });
  readonly layoutChanged = computed(() => {
    const l = this.layout();
    return l && this.layoutBase ? changedCount(l, this.layoutBase) : 0;
  });
  private setLayout(f: (l: LayoutState) => LayoutState): void {
    this.layout.update((l) => (l ? f(l) : l));
  }
  layoutTapSlot(i: number): void {
    this.setLayout((l) => tapSlot(l, i));
  }
  layoutTapPool(id: string): void {
    this.setLayout((l) => tapPool(l, id));
  }
  layoutUnpin(i: number): void {
    this.setLayout((l) => unpin(l, i));
  }
  /** 拖曳開始 = 拿起 */
  layoutHold(id: string): void {
    this.setLayout((l) => ({ ...l, held: id }));
  }
  /** 拖曳在沒有目標的地方放開 = 放下手上的(不動位置) */
  layoutRelease(): void {
    this.setLayout((l) => ({ ...l, held: null }));
  }
  layoutDropPool(): void {
    this.setLayout((l) => dropOnPool(l));
  }
  layoutReset(): void {
    if (this.layoutBase) this.layout.set(this.layoutBase);
  }
  async applyLayout(): Promise<void> {
    const ws = this.workshop();
    const l = this.layout();
    if (!ws || !l || this.busy()) return;
    await this.run(async () => {
      await this.store.layoutSubmarines(ws.id, toInput(l));
      this.closeDialog();
      this.toast.show('已套用位置排列');
    });
  }

  // ---- 共用 ----

  private nameOf(workshopId: string): string {
    return this.store.workshops().find((w) => w.id === workshopId)?.name ?? '';
  }

  /** 超過建議的 4 艘:操作完成後提醒(不阻擋),附「編排位置」捷徑 */
  private warnOver(result: SubmarinesChangeResult, targetIds: string[]): void {
    for (const w of result.workshops) {
      if (!targetIds.includes(w.workshop_id) || w.submarines.length <= REC) continue;
      const here = w.workshop_id === this.workshop()?.id;
      this.toast.show(`「${this.nameOf(w.workshop_id)}」現有 ${w.submarines.length} 艘，超過建議的 ${REC} 艘；第 ${REC + 1} 艘起未排入，不提醒返航`, {
        tone: 'warn',
        ms: 6000,
        actions: here ? [{ label: '編排位置', run: () => this.openLayout() }] : [],
      });
    }
  }

  private async run(job: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      await job();
    } catch (e) {
      const full = e instanceof HttpErrorResponse && e.status === 409;
      const msg = full ? `一間工坊最多存 ${LIMITS.maxSubmarineRecords} 艘，請先刪除不用的潛水艇` : '操作失敗，請檢查網路後再試一次';
      this.error.set(msg);
      if (!this.dialog()) this.toast.show(msg, { tone: 'warn' });
    } finally {
      this.busy.set(false);
    }
  }
}
