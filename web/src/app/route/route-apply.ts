import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { Toast } from '../core/toast';
import { partLabel } from './core/build';
import { RouteVm } from './route-vm';

interface Option {
  id: string;
  label: string;
  /** 這艘目前的配件(例:`3 1 2改 4`);還沒設定為空字串 */
  parts: string;
}
interface Group {
  workshop: string;
  subs: Option[];
}

/**
 * 「套用到潛艇」(D-296,取代舊的「綁定工坊潛艇」):把一組配置範本的配件**複製**到工坊潛艇身上。
 * 套用之後兩邊各自獨立:之後改這艘不動範本、改範本也不動已經設定的艇。只複製配件,不動潛艇的等級。
 */
@Component({
  selector: 'app-route-apply',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-apply.html',
})
export class RouteApply {
  /** 要套用的配置範本 id */
  readonly subId = input.required<string>();

  private readonly vm = inject(RouteVm);
  private readonly store = inject(DataStore);
  private readonly toast = inject(Toast);

  protected readonly open = signal(false);
  protected readonly busy = signal(false);

  protected readonly groups = computed<Group[]>(() =>
    this.store
      .workshops()
      .map((w) => ({
        workshop: w.name,
        subs: w.submarines.map((s) => ({
          id: s.id,
          label: `${circled(s.position)} ${s.name ?? `潛艇-${s.position}`}`,
          parts: s.build ? [s.build.hull, s.build.stern, s.build.bow, s.build.bridge].map(partLabel).join(' ') : '',
        })),
      }))
      .filter((g) => g.subs.length > 0),
  );

  /** 點一艘:把這組配置的配件複製過去(馬上存);這艘原本的配件會被覆蓋 */
  protected async apply(o: Option, workshop: string): Promise<void> {
    const cfg = this.vm.saved().find((s) => s.id === this.subId());
    if (!cfg || this.busy()) return;
    this.busy.set(true);
    try {
      await this.store.setBuild(o.id, { hull: cfg.hull, stern: cfg.stern, bow: cfg.bow, bridge: cfg.bridge });
      this.toast.show(`已把「${cfg.name}」的配件套用到 ${workshop} ${o.label}`);
    } catch {
      this.toast.show('套用失敗,可能沒有網路,稍後再試', { tone: 'warn' });
    } finally {
      this.busy.set(false);
    }
  }
}
