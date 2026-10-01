import { HttpErrorResponse, provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth, unauthorizedInterceptor } from './auth';

function setup(): { auth: Auth; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(withInterceptors([unauthorizedInterceptor])), provideHttpClientTesting()],
  });
  return { auth: TestBed.inject(Auth), http: TestBed.inject(HttpTestingController) };
}

describe('Auth', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    TestBed.resetTestingModule();
  });

  it('已登入:me 成功', async () => {
    const { auth, http } = setup();
    const p = auth.init();
    http.expectOne('/api/me').flush({ displayName: 'Winter', avatarUrl: null });
    http.expectOne('/api/public-config').flush({ guildName: '貝殼公會' });
    await p;
    expect(auth.status()).toBe('authenticated');
    expect(auth.user()?.displayName).toBe('Winter');
    expect(auth.guildName()).toBe('貝殼公會');
  });

  it('401 → anonymous', async () => {
    const { auth, http } = setup();
    const p = auth.init();
    http.expectOne('/api/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/public-config').flush({ guildName: 'x' });
    await p;
    expect(auth.status()).toBe('anonymous');
  });

  it('500 / 連不上 → unreachable', async () => {
    const { auth, http } = setup();
    const p = auth.init();
    http.expectOne('/api/me').flush(null, { status: 500, statusText: 'err' });
    http.expectOne('/api/public-config').error(new ProgressEvent('error'));
    await p;
    expect(auth.status()).toBe('unreachable');
    expect(auth.guildName()).toBe('伺服器');
  });

  it('讀取 login_error 並清除網址參數;未知代碼視為 failed', async () => {
    window.history.replaceState(null, '', '/?login_error=no_role');
    const a = setup();
    const p = a.auth.init();
    a.http.expectOne('/api/me').flush(null, { status: 401, statusText: 'x' });
    a.http.expectOne('/api/public-config').flush({ guildName: 'x' });
    await p;
    expect(a.auth.loginError()).toBe('no_role');
    expect(window.location.search).toBe('');

    TestBed.resetTestingModule();
    window.history.replaceState(null, '', '/?login_error=weird');
    const b = setup();
    const q = b.auth.init();
    b.http.expectOne('/api/me').flush(null, { status: 401, statusText: 'x' });
    b.http.expectOne('/api/public-config').flush({ guildName: 'x' });
    await q;
    expect(b.auth.loginError()).toBe('failed');
  });

  it('登入期間其他 API 回 401 → expired;/api/me 的 401 不觸發', async () => {
    const { auth, http } = setup();
    const p = auth.init();
    http.expectOne('/api/me').flush({ displayName: 'W', avatarUrl: null });
    http.expectOne('/api/public-config').flush({ guildName: 'x' });
    await p;
    TestBed.inject(HttpClient).get('/api/overview').subscribe({ error: (e: unknown) => expect(e).toBeInstanceOf(HttpErrorResponse) });
    http.expectOne('/api/overview').flush(null, { status: 401, statusText: 'x' });
    expect(auth.status()).toBe('expired');
    expect(auth.user()).toBeNull();
  });

  it('非登入狀態收到 401 不變成 expired', () => {
    const { auth } = setup();
    auth.status.set('anonymous');
    auth.onUnauthorized();
    expect(auth.status()).toBe('anonymous');
  });
});
