import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { LoginErrorCode, MeDto } from '@eranaut/shared';
import { catchError, throwError } from 'rxjs';
import { Api } from './api';
import { DEMO_LOGIN_URL } from '../demo/demo-providers';
import { PushVm } from './push-vm';

// 登入狀態(D-142):
// - `anonymous`:沒有有效 session(全新造訪或剛登出)→ 迎賓頁;帶 `login_error` 則顯示對應的失敗畫面
// - `expired`:**本次載入期間曾是登入狀態**後才收到 401 → 「Session 過期」橫幅(D-142 ⑦);重新整理後就只會是 anonymous
// - `unreachable`:連不上後端或後端出錯(不是未登入)
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'expired' | 'unreachable';

const LOGIN_ERRORS: readonly LoginErrorCode[] = ['denied', 'failed', 'not_in_guild', 'no_role'];

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly api = inject(Api);
  private readonly push = inject(PushVm);

  readonly status = signal<AuthStatus>('loading');
  readonly user = signal<MeDto | null>(null);
  readonly loginError = signal<LoginErrorCode | null>(null);
  /** 登入失敗畫面的「XX 伺服器」(D-123),取自後端 `.env` 的 GUILD_DISPLAY_NAME */
  readonly guildName = signal('');

  /** 啟動時呼叫一次(也用於「無法連線」畫面的重試) */
  async init(): Promise<void> {
    this.readLoginError();
    this.status.set('loading');
    const [me, config] = await Promise.allSettled([this.api.me(), this.api.publicConfig()]);
    if (config.status === 'fulfilled') this.guildName.set(config.value.guildName);
    if (me.status === 'fulfilled') {
      this.user.set(me.value);
      this.status.set('authenticated');
    } else if (me.reason instanceof HttpErrorResponse && me.reason.status === 401) {
      this.status.set('anonymous');
    } else {
      this.status.set('unreachable');
    }
  }

  /** 去 Discord 授權(整頁導向,回呼由後端處理後 302 回 `/`) */
  login(): void {
    window.location.assign(DEMO_LOGIN_URL ?? '/api/auth/login');
  }

  async logout(): Promise<void> {
    await this.push.releaseThisDevice(); // 先移除這台裝置的推播訂閱(要趁 session 還在),失敗不影響登出(D-165)
    try {
      await this.api.logout();
    } catch {
      // 就算 API 失敗,前端也當作登出(cookie 若還在,下次載入 /api/me 會再確認)
    }
    this.user.set(null);
    this.loginError.set(null);
    this.status.set('anonymous');
  }

  /** 已登入期間收到 401(被停用、session 過期…)→ 顯示「Session 過期」 */
  onUnauthorized(): void {
    if (this.status() !== 'authenticated') return;
    this.user.set(null);
    this.status.set('expired');
  }

  /** 讀取回呼帶回的 `login_error`,讀完以 history.replaceState 清除(只放分類碼、不放個資,D-142 ③) */
  private readLoginError(): void {
    const code = new URLSearchParams(window.location.search).get('login_error');
    if (code === null) return;
    this.loginError.set((LOGIN_ERRORS as readonly string[]).includes(code) ? (code as LoginErrorCode) : 'failed');
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
}

/** 已登入後任何 API 回 401 都視為 session 失效;`/api/me` 的 401 是「還沒登入」,由 init() 自己處理 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.endsWith('/api/me')) auth.onUnauthorized();
      return throwError(() => err);
    }),
  );
};
