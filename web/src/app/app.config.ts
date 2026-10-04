import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppUpdate } from './core/app-update';
import { Auth, unauthorizedInterceptor } from './core/auth';
import { routes } from './app.routes';
import { demoProviders } from './demo/demo-providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor])),
    // 展示模式(D-168):正式版為空;`demo` 建置會換成假後端。必須排在 Auth.init() 之前
    ...demoProviders,
    // 先確認登入狀態再顯示畫面,避免迎賓頁閃一下
    provideAppInitializer(() => inject(Auth).init()),
    // 只快取 app 殼層;API 一律走網路(D-83、D-141)。開發模式不註冊
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    provideAppInitializer(() => inject(AppUpdate).start()),
  ],
};
