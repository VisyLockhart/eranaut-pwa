import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Auth, unauthorizedInterceptor } from './core/auth';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor])),
    // 先確認登入狀態再顯示畫面,避免迎賓頁閃一下
    provideAppInitializer(() => inject(Auth).init()),
  ],
};
