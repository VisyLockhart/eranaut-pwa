import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { Toast } from '../core/toast';
import { RouteVm } from './route-vm';

interface Option {
  id: string;
  label: string;
}
interface Group {
  workshop: string;
  subs: Option[];
}

/**
 * 綁定工坊潛艇(RS-16、RS-26 ①):把一組儲存潛艇綁到工坊潛艇(同配置的艇常有好幾艘,可多選;一艘艇只綁一組),**只改資料庫欄位與顯示**,不帶入更新表單。
 * 潛艇被刪(或其工坊被刪)時,資料庫自動解除綁定。
 */
@Component({
  selector: 'app-route-bind',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-bind.html',
})
export class RouteBind {
  readonly subId = input.required<string>();

  private readonly vm = inject(RouteVm);
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);

  protected readonly open = signal(false);
  protected readonly busy = computed(() => this.vm.pending() > 0);

  protected readonly boundIds = computed(() => this.vm.saved().find((s) => s.id === this.subId())?.bound_submarine_ids ?? []);
  /** 已綁在「別組」配置的潛艇 id → 那組的名稱(再選會搬過來) */
  protected readonly boundElsewhere = computed(() => {
    const m = new Map<string, string>();
    for (const s of this.vm.saved()) if (s.id !== this.subId()) for (const x of s.bound_submarine_ids) m.set(x, s.name);
    return m;
  });

  protected readonly groups = computed<Group[]>(() =>
    this.store.workshops().map((w) => ({
      workshop: w.name,
      subs: w.submarines.map((s) => ({ id: s.id, label: `${circled(s.position)} ${s.name ?? '(未命名)'}` })),
    })).filter((g) => g.subs.length > 0),
  );

  /** 目前綁定的顯示(多艘);工坊資料還沒載入時退回通用文字 */
  protected readonly boundLabels = computed(() =>
    this.boundIds().map((id) => {
      for (const w of this.store.workshops()) {
        const s = w.submarines.find((x) => x.id === id);
        if (s) return `${w.name} ${circled(s.position)}${s.name ? ' ' + s.name : ''}`;
      }
      return '工坊潛艇';
    }),
  );

  protected isBound(id: string): boolean {
    return this.boundIds().includes(id);
  }

  /** 點一艘:已綁就取消,沒綁就加入(馬上存);已綁在別組的會搬過來 */
  protected async toggle(submarineId: string): Promise<void> {
    const cur = this.boundIds();
    const next = cur.includes(submarineId) ? cur.filter((x) => x !== submarineId) : [...cur, submarineId];
    await this.save(next, cur.includes(submarineId) ? '已取消綁定' : '已綁定');
  }

  protected clearAll(): Promise<void> {
    return this.save([], '已解除綁定');
  }

  private async save(ids: string[], message: string): Promise<void> {
    if (this.busy()) return;
    try {
      await this.vm.bind(this.subId(), ids);
      this.toast.show(message);
    } catch {
      this.toast.show('綁定失敗,可能沒有網路,稍後再試', { tone: 'warn' });
    }
  }
}
