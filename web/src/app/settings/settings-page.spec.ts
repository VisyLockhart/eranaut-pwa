import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { PushVm } from '../core/push-vm';
import { UiScale } from '../core/ui-scale';
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

  it('介面大小:三個選項,目前的為選取,點了立即切換、不需要網路', async () => {
    localStorage.clear();
    const fixture = await render();
    http.expectOne('/api/notify-prefs').flush({ dm: true, channel: false });
    await settle();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const opts = Array.from(el.querySelectorAll<HTMLButtonElement>('.size-opt'));
    expect(opts.map((b) => b.textContent?.replace('Aa', '').trim())).toEqual(['小', '中', '大']);
    expect(opts.map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);

    opts[2].click();
    fixture.detectChanges();
    expect(TestBed.inject(UiScale).size()).toBe('large');
    expect(opts.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(opts[2].classList.contains('active')).toBe(true);
    http.expectNone('/api/notify-prefs');
    expect(JSON.parse(localStorage.getItem('eranaut.ui-scale') ?? '""')).toBe('large');
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

  describe('推播(D-165)', () => {
    async function withPush(state: 'ready' | 'blocked' | 'ios-install' | 'unsupported' | 'unavailable' | 'error', enabled = false, prefs: object = { dm: true, channel: false, push: false }) {
      const fixture = await render();
      http.expectOne('/api/notify-prefs').flush(prefs);
      const push = TestBed.inject(PushVm);
      push.state.set(state);
      push.enabled.set(enabled);
      await settle();
      fixture.detectChanges();
      return { el: fixture.nativeElement as HTMLElement, push, fixture };
    }

    it('可用:多一個「這台裝置的推播通知」開關,開著時才有測試按鈕', async () => {
      let { el } = await withPush('ready', false);
      expect(el.querySelectorAll('.switch input').length).toBe(3);
      expect(el.textContent).toContain('這台裝置的推播通知');
      expect(el.textContent).not.toContain('傳送測試通知');
      ({ el } = await withPush('ready', true, { dm: true, channel: false, push: true }));
      expect(el.textContent).toContain('傳送測試通知');
    });

    it('其他狀態各有說明、沒有推播開關;伺服器沒設定時整項不顯示', async () => {
      let { el } = await withPush('ios-install');
      expect(el.querySelectorAll('.switch input').length).toBe(2);
      expect(el.textContent).toContain('加入主畫面');
      ({ el } = await withPush('blocked'));
      expect(el.textContent).toContain('被封鎖');
      ({ el } = await withPush('unsupported'));
      expect(el.textContent).toContain('不支援推播通知');
      ({ el } = await withPush('unavailable'));
      expect(el.textContent).not.toContain('推播');
    });

    it('只有推播開著(DM 與頻道都關)時,不顯示「不會收到任何提醒」', async () => {
      let { el } = await withPush('unavailable', false, { dm: false, channel: false, push: false });
      expect(el.textContent).toContain('不會收到任何潛艇提醒');
      ({ el } = await withPush('unavailable', false, { dm: false, channel: false, push: true }));
      expect(el.textContent).not.toContain('不會收到任何潛艇提醒');
    });
  });
});
