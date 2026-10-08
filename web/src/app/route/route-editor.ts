import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LIMITS } from '@eranaut/shared';
import { RouteSubs } from './route-subs';
import { RouteVm } from './route-vm';

/**
 * 配置頁(第一個分頁):儲存配置的單一清單。每一組可使用、編輯、刪除、綁定工坊潛艇;
 * 編輯與新增都用共用的配置對話框(`RouteVm.openConfig`),這裡不再內嵌編輯器、統計表與儲存區。
 */
@Component({
  selector: 'app-route-editor',
  imports: [RouteSubs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-editor.html',
})
export class RouteEditor {
  protected readonly vm = inject(RouteVm);
  protected readonly max = LIMITS.maxRouteSubsPerUser;

  protected add(): void {
    this.vm.openConfig('new');
  }
}
