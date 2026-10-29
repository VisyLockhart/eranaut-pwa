import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DataStore } from '../core/data-store';
import { circled } from '../core/format';
import { partLabel } from './core/build';
import { WorkshopPager } from '../ui/workshop-pager';
import type { SelectOption } from '../ui/select';
import { RouteVm } from './route-vm';

interface Row {
  id: string;
  label: string;
  level: string;
  parts: string;
  set: boolean;
}
interface Group {
  id: string;
  workshop: string;
  rows: Row[];
}

/**
 * 「我的潛艇配置」(D-296):每間工坊的每艘潛艇自己的等級與配件,一眼看到哪些艇還沒設定(可用工坊切換列只看一間),
 * 按「編輯」開啟潛艇配置對話框(和快速修改、航線頁的入口是同一個)。
 */
@Component({
  selector: 'app-route-sub-builds',
  imports: [WorkshopPager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (groups().length > 0) {
      <section class="rt-block" aria-label="我的潛艇配置">
        <div class="rt-block-head">
          <div class="rt-block-title">我的潛艇配置</div>
        </div>
        @if (store.workshops().length > 1) {
          <app-workshop-pager [options]="options()" [index]="index()" (indexChange)="requested.set($event)" />
        }
        @for (g of shown(); track g.id) {
          <div class="rt-bind-group">
            <div class="rt-save-label">{{ g.workshop }}</div>
            <ul class="rt-sb-list">
              @for (r of g.rows; track r.id) {
                <li class="rt-sb-row" [class.unset]="!r.set">
                  <b class="rt-sb-name">{{ r.label }}</b>
                  <span class="rt-sb-info">{{ r.level }} · {{ r.parts }}</span>
                  <button type="button" class="rt-link-btn" [attr.aria-label]="'編輯 ' + r.label + ' 的配件配置'" (click)="vm.openSubBuild(r.id)">{{ r.set ? '編輯' : '設定' }}</button>
                </li>
              }
            </ul>
          </div>
        }
      </section>
    }
  `,
})
export class RouteSubBuilds {
  protected readonly vm = inject(RouteVm);
  protected readonly store = inject(DataStore);
  /** 0 = 全部;只是這個畫面的檢視,不影響總覽選的工坊 */
  protected readonly requested = signal(0);
  protected readonly index = computed(() => (this.requested() <= this.groups().length ? this.requested() : 0));
  protected readonly options = computed<SelectOption[]>(() => [{ value: 0, label: '全部' }, ...this.groups().map((g, i) => ({ value: i + 1, label: g.workshop }))]);
  protected readonly shown = computed(() => (this.index() === 0 ? this.groups() : [this.groups()[this.index() - 1]!]));

  protected readonly groups = computed<Group[]>(() =>
    this.store
      .workshops()
      .map((w) => ({
        id: w.id,
        workshop: w.name,
        rows: w.submarines.map((s) => ({
          id: s.id,
          label: `${circled(s.position)} ${s.name ?? `潛艇-${s.position}`}`,
          level: s.progress ? `Lv${s.progress.effective_level}` : '未填等級',
          parts: s.build ? [s.build.hull, s.build.stern, s.build.bow, s.build.bridge].map(partLabel).join(' ') : '未設定配件',
          set: s.build !== undefined,
        })),
      }))
      .filter((g) => g.rows.length > 0),
  );
}
