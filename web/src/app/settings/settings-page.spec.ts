import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SettingsPage } from './settings-page';

const settle = (): Promise<void> => new Promise((r) => setTimeout(r));

describe('SettingsPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    const auth = TestBed.inject(Auth);
    auth.status.set('authenticated');
    auth.user.set({ id: 'u1', displayName: '小艇長', avatarUrl: null } as never);
  });

  async function render() {
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    return fixture;
  }

  it('顯示帳號與兩個提醒開關,頻道有公開訊息警示', async () => {
    const fixture = await render();
    http.expectOne('/api/notify-prefs').flush({ dm: true, channel: false });
    await settle();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('小艇長');
    const boxes = el.querySelectorAll<HTMLInputElement>('.switch input');
    expect(boxes.length).toBe(2);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(false);
    expect(el.textContent).toContain('這是公開訊息');
  });

  it('全部關閉時顯示說明', async () => {
    const fixture = await render();
    http.expectOne('/api/notify-prefs').flush({ dm: false, channel: false });
    await settle();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('不會收到任何潛艇提醒');
  });

  it('點開關會送出 PUT', async () => {
    const fixture = await render();
    http.expectOne('/api/notify-prefs').flush({ dm: true, channel: false });
    await settle();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('.switch input')[1].click();
    const req = http.expectOne('/api/notify-prefs');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ dm: true, channel: true });
    req.flush({ dm: true, channel: true });
  });

  it('讀取失敗顯示重試,桌機與手機標題不同', async () => {
    TestBed.inject(Layout);
    const fixture = await render();
    http.expectOne('/api/notify-prefs').flush({}, { status: 500, statusText: 'x' });
    await settle();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('讀取失敗');
  });
});
