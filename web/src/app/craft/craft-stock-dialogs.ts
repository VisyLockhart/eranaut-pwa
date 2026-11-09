import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIMITS, type CraftStockDto } from '@eranaut/shared';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { IconComponent } from '../ui/icon';
import { ListView } from '../route/list-view';
import { RouteListTools, RouteStar } from '../route/route-list-ui';
import { CraftStockVm } from './craft-stock-vm';
import { autoName, stockMeta } from './craft-stock-state';

/**
 * 庫存組的三個對話框(D-329、D-330):儲存(更新 / 另存 / 滿 10 組時選一組覆蓋)、管理(改名、刪除按兩下)、
 * 載入前確認「要換掉目前的配件與庫存嗎?」(可選「先儲存目前的」)。狀態在 root 的 `CraftStockVm`,換版面重建元件時不會丟。
 * 外觀沿用條件組合對話框的元件(rt-dlg 等),所以四個主題自動一致;手機是底部面板。
 */
@Component({
  selector: 'app-craft-stock-dialogs',
  imports: [CdkTrapFocus, FormsModule, IconComponent, RouteListTools, RouteStar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './craft-stock-dialogs.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class CraftStockDialogs {
  protected readonly sv = inject(CraftStockVm);
  protected readonly layout = inject(Layout);
  private readonly toast = inject(Toast);
  protected downOnOverlay = false;
  protected readonly nameMax = LIMITS.craftStockName;
  protected readonly limit = LIMITS.maxCraftStocksPerUser;
  protected readonly meta = stockMeta;

  protected readonly manageList = new ListView<CraftStockDto>(() => this.sv.saved());
  protected readonly overList = new ListView<CraftStockDto>(() => this.sv.saved());

  // ---- 儲存 ----
  protected readonly name = signal('');
  /** update = 更新載入的那一組;new = 另存新組(滿 10 組時改成選一組覆蓋) */
  protected readonly saveMode = signal<'update' | 'new'>('new');
  protected readonly overTarget = signal<string | null>(null);
  protected readonly error = signal('');
  /** 儲存完成後要接著載入的那一組(從「先儲存目前的」進來) */
  private afterSave: CraftStockDto | null = null;
  protected readonly canUpdate = computed(() => this.sv.active() !== null && this.sv.modified());
  protected readonly mustOverwrite = computed(() => this.saveMode() === 'new' && this.sv.isFull());
  protected readonly nameValid = computed(() => [...this.name().trim()].length >= 1 && [...this.name().trim()].length <= this.nameMax);
  protected readonly canSubmit = computed(() => {
    if (this.sv.pending() > 0) return false;
    if (this.saveMode() === 'update') return true;
    if (this.mustOverwrite()) return this.overTarget() !== null && this.nameValid();
    return this.nameValid();
  });
  protected readonly used = computed(() => `已用 ${this.sv.saved().length} / ${this.limit} 組`);

  // ---- 管理 ----
  protected readonly renaming = signal<string | null>(null);
  protected readonly renameText = signal('');
  protected readonly confirmDelete = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (this.sv.dialog() === 'save') {
        untracked(() => {
          const upd = this.sv.active() !== null && this.sv.modified();
          this.saveMode.set(upd ? 'update' : 'new');
          this.name.set(autoName());
          this.overTarget.set(null);
          this.overList.clearFilters();
          this.error.set('');
        });
      } else if (this.sv.dialog() === 'manage') {
        untracked(() => {
          this.manageList.clearFilters();
          this.renaming.set(null);
          this.confirmDelete.set(null);
        });
      }
    });
  }

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
    this.downOnOverlay = false;
  }
  protected onEscape(event: Event): void {
    if (event.defaultPrevented || this.sv.dialog() === null) return;
    this.close();
    event.preventDefault();
  }
  protected close = (): void => {
    this.sv.dialog.set(null);
    this.sv.loadTarget.set(null);
    this.afterSave = null;
  };

  protected pickOver(id: string): void {
    this.overTarget.set(id);
    const t = this.sv.saved().find((s) => s.id === id);
    if (t) this.name.set(t.name);
  }
  protected setMode(m: 'update' | 'new'): void {
    this.saveMode.set(m);
    this.error.set('');
    if (m === 'new') this.name.set(autoName());
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.error.set('');
    try {
      if (this.saveMode() === 'update') {
        const a = this.sv.active()!;
        await this.sv.overwrite(a.id);
        this.toast.show(`已更新「${a.name}」`);
      } else if (this.mustOverwrite()) {
        const u = await this.sv.overwrite(this.overTarget()!, this.name());
        this.toast.show(`已覆蓋「${u.name}」`);
      } else {
        const c = await this.sv.saveCurrent(this.name());
        this.toast.show(`已儲存「${c.name}」`);
      }
      const next = this.afterSave;
      this.close();
      if (next) {
        const fresh = this.sv.saved().find((s) => s.id === next.id) ?? next;
        this.sv.load(fresh);
      }
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      if (status === 409) {
        await this.sv.refresh();
        this.error.set(`已滿 ${this.limit} 組,請選一組覆蓋`);
      } else if (status === 404) {
        await this.sv.refresh();
        this.error.set('這一組已在別的裝置刪除,請重新儲存');
        this.saveMode.set('new');
      } else if (status === 400) {
        this.error.set('名稱或內容不合法,請修改後再試');
      } else {
        this.error.set('儲存失敗,請檢查網路後再試');
      }
    }
  }

  // ---- 載入確認 ----
  protected confirmLoad(): void {
    const t = this.sv.loadTarget();
    if (t) this.sv.load(t);
    this.close();
  }
  /** 先把目前的存起來,存好再載入:換成儲存對話框,存完接著載入 */
  protected saveFirst(): void {
    const t = this.sv.loadTarget();
    this.sv.dialog.set('save');
    this.afterSave = t;
  }
  /** 目前載入的那一組改過:直接更新那一組,更新完接著載入(不再另外開儲存對話框) */
  protected async updateFirst(): Promise<void> {
    const a = this.sv.active();
    const next = this.sv.loadTarget();
    if (!a || !next) return;
    try {
      await this.sv.overwrite(a.id);
      this.toast.show(`已更新「${a.name}」`);
      this.close();
      this.sv.load(this.sv.saved().find((s) => s.id === next.id) ?? next);
    } catch {
      await this.sv.refresh();
      this.toast.show('更新失敗,請檢查網路後再試', { tone: 'warn' });
    }
  }
  protected get canSaveFirst(): boolean {
    return this.sv.canSave();
  }

  // ---- 管理 ----
  protected startRename(id: string, name: string): void {
    this.confirmDelete.set(null);
    this.renaming.set(id);
    this.renameText.set(name);
  }
  protected async doRename(id: string): Promise<void> {
    const n = this.renameText().trim();
    if ([...n].length < 1 || [...n].length > this.nameMax) return;
    try {
      await this.sv.rename(id, n);
      this.renaming.set(null);
    } catch (e) {
      await this.failManage(e, '改名失敗');
    }
  }
  protected async doDelete(id: string): Promise<void> {
    if (this.confirmDelete() !== id) {
      this.renaming.set(null);
      this.confirmDelete.set(id);
      return;
    }
    this.confirmDelete.set(null);
    try {
      await this.sv.remove(id);
      if (this.sv.saved().length === 0) this.close();
    } catch (e) {
      await this.failManage(e, '刪除失敗');
    }
  }
  private async failManage(e: unknown, text: string): Promise<void> {
    if (e instanceof HttpErrorResponse && e.status === 404) {
      await this.sv.refresh();
      this.toast.show('這一組已在別的裝置刪除', { tone: 'warn' });
    } else {
      this.toast.show(`${text},請檢查網路後再試`, { tone: 'warn' });
    }
  }
}
