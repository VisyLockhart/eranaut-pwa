import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { AuthScreen } from './auth/auth-screen';
import { Auth } from './core/auth';
import { DataStore } from './core/data-store';
import { Shell } from './layout/shell';

@Component({
  selector: 'app-root',
  imports: [AuthScreen, Shell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (auth.status() === 'authenticated') { <app-shell /> } @else { <app-auth-screen /> }`,
})
export class App {
  protected readonly auth = inject(Auth);
  private readonly store = inject(DataStore);

  constructor() {
    // 登入後開始載入與倒數;登出或 session 失效就停止並清掉本機快取
    effect(() => {
      const authenticated = this.auth.status() === 'authenticated';
      untracked(() => (authenticated ? this.store.start() : this.store.stop()));
    });
  }
}
