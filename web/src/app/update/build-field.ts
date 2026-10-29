import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { SubmarineDto } from '@eranaut/shared';
import { partLabel } from '../route/core/build';
import { RouteVm } from '../route/route-vm';
import { IconComponent } from '../ui/icon';

/**
 * 快速修改裡的「配件配置」一列(D-296):這艘自己的配件。還沒設定 → 虛線框 +「設定」;已設定 → 顯示配件與等級 +「編輯」。
 * 按下去開啟潛艇配置對話框(蓋在快速修改上面,存好後回到這裡)。展示版沒有儲存,不顯示。
 */
@Component({
  selector: 'app-build-field',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (routeVm.canSave) {
      <div class="bf-field" [class.on]="parts()" [class.dashed]="!parts()">
        <app-icon name="settings" [size]="20" />
        <span class="uk-main">
          <b>配件配置</b>
          <small>{{ summary() }}</small>
        </span>
        <button type="button" class="rt-save-btn" [attr.aria-label]="(parts() ? '編輯' : '設定') + '這艘的配件配置'" (click)="open()">{{ parts() ? '編輯' : '設定' }}</button>
      </div>
    }
  `,
})
export class BuildField {
  readonly sub = input.required<SubmarineDto>();
  protected readonly routeVm = inject(RouteVm);

  protected readonly parts = computed(() => {
    const b = this.sub().build;
    return b ? [b.hull, b.stern, b.bow, b.bridge].map(partLabel).join(' ') : null;
  });
  protected readonly summary = computed(() => {
    const p = this.parts();
    const lv = this.sub().progress?.effective_level;
    if (!p) return lv ? `尚未設定 · Lv${lv}` : '尚未設定';
    return lv ? `${p} · Lv${lv}` : `${p} · 未填等級`;
  });

  protected open(): void {
    this.routeVm.openSubBuild(this.sub().id);
  }
}
