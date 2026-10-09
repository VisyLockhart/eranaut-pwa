import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LIMITS } from '@eranaut/shared';
import { RouteBuild } from './route-build';
import { RouteBuildVm } from './route-build-vm';
import { RouteSubs } from './route-subs';
import { RouteVm } from './route-vm';

/**
 * 配置頁(第一個分頁):儲存配置的單一清單(另有「找配置」子畫面,D-223)。每一組可使用、編輯、刪除、綁定工坊潛艇;
 * 編輯與新增都用共用的配置對話框(`RouteVm.openConfig`),這裡不再內嵌編輯器、統計表與儲存區。
 */
@Component({
  selector: 'app-route-editor',
  imports: [RouteBuild, RouteSubs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-editor.html',
})
export class RouteEditor {
  protected readonly vm = inject(RouteVm);
  protected readonly b = inject(RouteBuildVm);
  protected readonly max = LIMITS.maxRouteSubsPerUser;

  protected findBuild(): void {
    this.b.open.set(true);
  }

  protected add(): void {
    this.vm.openConfig('new');
  }
}
