import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth } from './auth';
import { INSTALL_PROMPT_KEY, InstallPrompt, detectInstallPlatform } from './install-prompt';
import { PushEnv } from './push-env';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36';
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36';
const LINE_IOS = IPHONE + ' Line/14.0.0';

describe('detectInstallPlatform', () => {
  const d = (userAgent: string, ios = false, standalone = false) => detectInstallPlatform({ userAgent, ios, standalone });
  it('Android 手機與平板(UA 沒有 Mobile)都算,桌機不算', () => {
    expect(d(ANDROID)).toBe('android');
    expect(d(ANDROID_TABLET)).toBe('android');
    expect(d(DESKTOP)).toBeNull();
  });
  it('iPhone / iPad(含偽裝成 Mac 的 iPadOS,由 PushEnv 判斷)算 ios', () => {
    expect(d(IPHONE, true)).toBe('ios');
  });
  it('已從主畫面開啟、App 內建瀏覽器都不提示', () => {
    expect(d(ANDROID, false, true)).toBeNull();
    expect(d(IPHONE, true, true)).toBeNull();
    expect(d(LINE_IOS, true)).toBeNull();
  });
});

describe('InstallPrompt', () => {
  const state = { ua: ANDROID, ios: false, standalone: false };
  let auth: Auth;

  function setup(): InstallPrompt {
    TestBed.resetTestingModule();
    vi.spyOn(navigator, 'userAgent', 'get').mockImplementation(() => state.ua);
    TestBed.configureTestingModule({
      providers: [{ provide: PushEnv, useValue: { isIos: () => state.ios, isStandalone: () => state.standalone } }],
    });
    auth = TestBed.inject(Auth);
    auth.status.set('authenticated');
    return TestBed.inject(InstallPrompt);
  }
  function fireInstallEvent(): { prompt: ReturnType<typeof vi.fn> } {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });
    window.dispatchEvent(event);
    return event;
  }

  beforeEach(() => {
    localStorage.clear();
    Object.assign(state, { ua: ANDROID, ios: false, standalone: false });
  });
  afterEach(() => vi.restoreAllMocks());

  it('Android:沒收到安裝事件就不顯示;收到且已登入才顯示', () => {
    const ip = setup();
    expect(ip.visible()).toBe(false);
    fireInstallEvent();
    expect(ip.visible()).toBe(true);
    auth.status.set('anonymous');
    expect(ip.visible()).toBe(false);
  });

  it('Android 按「是」:呼叫系統安裝確認,之後記住、不再詢問', async () => {
    const ip = setup();
    const event = fireInstallEvent();
    await ip.accept();
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(ip.visible()).toBe(false);
    expect(localStorage.getItem(INSTALL_PROMPT_KEY)).not.toBeNull();
    expect(setup().visible()).toBe(false);
    fireInstallEvent();
    expect(TestBed.inject(InstallPrompt).visible()).toBe(false);
  });

  it('按「否」:記住、不再詢問(重新開啟也不會再出現)', () => {
    const ip = setup();
    fireInstallEvent();
    ip.dismiss();
    expect(ip.visible()).toBe(false);
    const again = setup();
    fireInstallEvent();
    expect(again.visible()).toBe(false);
  });

  it('iOS:不需要事件,登入後就顯示;OK 後不再顯示', () => {
    Object.assign(state, { ua: IPHONE, ios: true });
    const ip = setup();
    expect(ip.platform).toBe('ios');
    expect(ip.visible()).toBe(true);
    ip.dismiss();
    expect(ip.visible()).toBe(false);
  });

  it('從主畫面開啟(standalone)與桌機:不顯示', () => {
    Object.assign(state, { standalone: true });
    expect(setup().visible()).toBe(false);
    Object.assign(state, { ua: DESKTOP, standalone: false });
    const ip = setup();
    fireInstallEvent();
    expect(ip.visible()).toBe(false);
  });

  it('安裝完成(appinstalled)後收起並記住', () => {
    const ip = setup();
    fireInstallEvent();
    window.dispatchEvent(new Event('appinstalled'));
    expect(ip.visible()).toBe(false);
    expect(localStorage.getItem(INSTALL_PROMPT_KEY)).not.toBeNull();
  });
});
