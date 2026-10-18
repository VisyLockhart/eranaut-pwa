import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { AuthScreen } from './auth/auth-screen';
import { Auth } from './core/auth';
import { DataStore } from './core/data-store';
import { InstallPrompt } from './core/install-prompt';
import { PushVm } from './core/push-vm';
import { ThemeService } from './core/theme';
import { UiScale } from './core/ui-scale';
import { clearRouteCache } from './route/route-cache';
import { Shell } from './layout/shell';
import { InstallPromptCard } from './ui/install-prompt';
import { UpdateBanner } from './ui/update-banner';
import { ToastHost } from './ui/toast-host';

@Component({
  selector: 'app-root',
  imports: [AuthScreen, Shell, ToastHost, InstallPromptCard, UpdateBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (auth.status() === 'authenticated') { <app-shell /> } @else { <app-auth-screen /> }<app-install-prompt /><app-update-banner /><app-toast-host />`,
})
export class App {
  protected readonly auth = inject(Auth);
  private readonly store = inject(DataStore);
  private readonly push = inject(PushVm);
  /** 開機就建立,讓儲存的介面大小在第一次繪製前套用(D-164) */
  private readonly uiScale = inject(UiScale);
  /** 開機就建立,讓主題(D-277)在第一次繪製前套用 */
  private readonly theme = inject(ThemeService);
  /** 開機就建立,才收得到瀏覽器很早送出的 `beforeinstallprompt` */
  private readonly installPrompt = inject(InstallPrompt);

  constructor() {
    // 登入後開始載入與倒數;登出或 session 失效就停止並清掉本機快取
    effect(() => {
      const authenticated = this.auth.status() === 'authenticated';
      untracked(() => {
        if (authenticated) {
          this.store.start();
          void this.push.sync(); // 推播訂閱不見(service worker 被重設)時自動補回,不必重新綁定
        }
        else {
          this.store.stop();
          // 航線儲存潛艇的離線快照(RouteVm 還沒建立也要清;檢視狀態保留)。啟動中('loading')與離線('unreachable')不清
          const status = this.auth.status();
          if (status === 'anonymous' || status === 'expired') clearRouteCache();
        }
      });
    });
  }
}
