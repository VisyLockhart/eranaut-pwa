import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { SelectField, type SelectOption, type SelectValue } from '../ui/select';
import { partLabel } from './core/build';
import { RouteVm } from './route-vm';

const TEMP = '__temp__';

/**
 * 配置列(航點頁與推薦頁共用):使用的配置下拉、編輯、(航點頁才有)查看性能與新增、說明列。
 * 還沒有儲存配置時顯示「目前使用預設配置」提醒(`hint` 接在提醒後面)。
 * 投影進來的內容(例如燈號)放在下拉列與說明列之間。
 */
@Component({
  selector: 'app-route-cfg-bar',
  imports: [SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-cfg-bar.html',
})
export class RouteCfgBar {
  protected readonly vm = inject(RouteVm);
  /** 顯示「查看性能」(只對已選的路線有意義) */
  readonly showPerf = input(true);
  /** 顯示「＋ 新增」 */
  readonly showNew = input(true);
  /** 預設配置提醒後面接的文字,例如「結果會偏保守」 */
  readonly hint = input('');

  /** 儲存配置,加上「臨時配置」(目前畫面上的配置不是任何一組儲存配置時) */
  protected readonly options = computed<SelectOption[]>(() => {
    // 有常用時分成「★ 常用」「全部配置」兩組(D-237);沒有常用就維持單層清單
    const saved = this.vm.saved();
    const grouped = saved.some((s) => s.favorite);
    const out: SelectOption[] = [...saved.filter((s) => s.favorite), ...saved.filter((s) => !s.favorite)].map((s) => ({
      value: s.id,
      label: s.name,
      ...(grouped ? { group: s.favorite ? '★ 常用' : '全部配置' } : {}),
    }));
    if (this.vm.subId() === null || this.vm.dirty()) out.unshift({ value: TEMP, label: this.vm.saved().length === 0 ? '預設配置(未儲存)' : '臨時配置(未儲存)' });
    return out;
  });
  protected readonly value = computed<SelectValue>(() => (this.vm.subId() === null || this.vm.dirty() ? TEMP : this.vm.subId()!));
  protected readonly caption = computed(() => `Lv${this.vm.level()} · ${this.vm.parts().map(partLabel).join(' ')} · 距離上限 ${this.vm.stats().range}`);

  protected onChange(value: SelectValue): void {
    if (value === TEMP) return;
    this.vm.useSub(String(value));
  }
}
