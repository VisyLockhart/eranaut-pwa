import { HttpBackend } from '@angular/common/http';
import { ApplicationRef, EnvironmentInjector, createComponent, inject, provideAppInitializer, type EnvironmentProviders, type Provider } from '@angular/core';
import { DemoBackend } from './demo-backend';
import { DemoBar } from './demo-bar';
import { DemoStore } from './demo-store';

// 展示模式(D-168):以假的 HTTP 後端取代 `/api/*`,資料只存在這個瀏覽器。畫面與其餘程式碼完全沿用正式版。
export const DEMO_LOGIN_URL: string | null = '/?demo_login=1';

export const demoProviders: (Provider | EnvironmentProviders)[] = [
  DemoStore,
  { provide: HttpBackend, useClass: DemoBackend },
  // 必須在 Auth.init() 之前跑(app.config 的順序):先依網址參數決定登入狀態
  provideAppInitializer(() => {
    const store = inject(DemoStore);
    const url = new URL(window.location.href);
    if (url.searchParams.has('demo_login')) {
      store.setSignedIn(true);
      url.searchParams.delete('demo_login');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } else if (url.searchParams.has('login_error')) {
      // 要看登入失敗畫面,必須是未登入狀態(Auth 會自己讀取並清除 login_error)
      store.setSignedIn(false);
    }
  }),
  // 畫面右上角的「展示模式」小標籤與說明
  provideAppInitializer(() => {
    const appRef = inject(ApplicationRef);
    const ref = createComponent(DemoBar, { environmentInjector: inject(EnvironmentInjector) });
    appRef.attachView(ref.hostView);
    document.body.appendChild(ref.location.nativeElement);
  }),
];
