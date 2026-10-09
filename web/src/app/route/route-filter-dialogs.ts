import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LIMITS } from '@eranaut/shared';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { IconComponent } from '../ui/icon';
import { autoName, specSummary } from './route-filter-state';
import { RouteFilterVm } from './route-filter-vm';

/**
 * 條件組合的三個對話框(D-229):儲存(新增 / 更新 / 滿 10 組時選一組覆蓋)、管理(改名、刪除按兩下)、
 * 載入前確認「要換掉目前的條件嗎?」。狀態在 root 的 `RouteFilterVm`,換版面重建元件時不會丟。手機是底部面板。
 */
@Component({
  selector: 'app-route-filter-dialogs',
  imports: [CdkTrapFocus, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-filter-dialogs.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RouteFilterDialogs {
  protected readonly fv = inject(RouteFilterVm);
  protected readonly layout = inject(Layout);
  private readonly toast = inject(Toast);
  protected downOnOverlay = false;
  protected readonly nameMax = LIMITS.routeFilterName;
  protected readonly limit = LIMITS.maxRouteFiltersPerUser;

  // ---- 儲存 ----
  protected readonly name = signal('');
  /** update = 更新載入的那一組;new = 另存新組(滿 10 組時改成選一組覆蓋) */
  protected readonly saveMode = signal<'update' | 'new'>('new');
  protected readonly overTarget = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly summary = computed(() => specSummary(this.fv.current()) || '(沒有任何限制)');
  protected readonly canUpdate = computed(() => this.fv.active() !== null && this.fv.modified());
  /** 另存新組但已滿 10 組:要選一組覆蓋 */
  protected readonly mustOverwrite = computed(() => this.saveMode() === 'new' && this.fv.isFull());
  protected readonly nameValid = computed(() => [...this.name().trim()].length >= 1 && [...this.name().trim()].length <= this.nameMax);
  protected readonly canSubmit = computed(() => {
    if (this.fv.pending() > 0) return false;
    if (this.saveMode() === 'update') return true;
    if (this.mustOverwrite()) return this.overTarget() !== null && this.nameValid();
    return this.nameValid();
  });

  // ---- 管理 ----
  protected readonly renaming = signal<string | null>(null);
  protected readonly renameText = signal('');
  protected readonly confirmDelete = signal<string | null>(null);

  constructor() {
    // 每次打開儲存對話框就重設
    effect(() => {
      if (this.fv.dialog() === 'save') {
        untracked(() => {
          const upd = this.fv.active() !== null && this.fv.modified();
          this.saveMode.set(upd ? 'update' : 'new');
          this.name.set(autoName(this.fv.current()));
          this.overTarget.set(null);
          this.error.set('');
        });
      } else if (this.fv.dialog() === 'manage') {
        untracked(() => {
          this.renaming.set(null);
          this.confirmDelete.set(null);
        });
      }
    });
  }

  protected specText(s: Parameters<typeof specSummary>[0]): string {
    return specSummary(s) || '(沒有任何限制)';
  }

  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.close();
    this.downOnOverlay = false;
  }
  protected onEscape(event: Event): void {
    if (event.defaultPrevented || this.fv.dialog() === null) return;
    this.close();
    event.preventDefault();
  }
  protected close = (): void => {
    this.fv.dialog.set(null);
    this.fv.loadTarget.set(null);
  };

  protected pickOver(id: string): void {
    this.overTarget.set(id);
    const t = this.fv.saved().find((s) => s.id === id);
    if (t) this.name.set(t.name);
  }
  protected setMode(m: 'update' | 'new'): void {
    this.saveMode.set(m);
    this.error.set('');
    if (m === 'new') this.name.set(autoName(this.fv.current()));
  }

  protected async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.error.set('');
    try {
      if (this.saveMode() === 'update') {
        const a = this.fv.active()!;
        await this.fv.overwrite(a.id);
        this.toast.show(`已更新「${a.name}」`);
      } else if (this.mustOverwrite()) {
        const id = this.overTarget()!;
        const u = await this.fv.overwrite(id, this.name());
        this.toast.show(`已覆蓋「${u.name}」`);
      } else {
        const c = await this.fv.saveCurrent(this.name());
        this.toast.show(`已儲存「${c.name}」`);
      }
      this.close();
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      if (status === 409) {
        await this.fv.refresh();
        this.error.set(`已滿 ${this.limit} 組,請選一組覆蓋`);
      } else if (status === 404) {
        await this.fv.refresh();
        this.error.set('這一組已在別的裝置刪除,請重新儲存');
        this.saveMode.set('new');
      } else if (status === 400) {
        this.error.set('名稱或條件不合法,請修改後再試');
      } else {
        this.error.set('儲存失敗,請檢查網路後再試');
      }
    }
  }

  // ---- 載入確認 ----
  protected confirmLoad(): void {
    const t = this.fv.loadTarget();
    if (t) this.fv.load(t);
    this.close();
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
      await this.fv.rename(id, n);
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
      await this.fv.remove(id);
      if (this.fv.saved().length === 0) this.close();
    } catch (e) {
      await this.failManage(e, '刪除失敗');
    }
  }
  private async failManage(e: unknown, text: string): Promise<void> {
    if (e instanceof HttpErrorResponse && e.status === 404) {
      await this.fv.refresh();
      this.toast.show('這一組已在別的裝置刪除', { tone: 'warn' });
    } else {
      this.toast.show(`${text},請檢查網路後再試`, { tone: 'warn' });
    }
  }
}
