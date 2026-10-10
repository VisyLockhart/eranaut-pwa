import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth } from './auth';
import { PushEnv } from './push-env';
import { readJson, writeJson } from './storage';
import { Toast } from './toast';

/** 「加入主畫面」提示的本機記錄:有值 = 已處理過(按了「是」、「否」或「OK」),之後不再詢問。登出時保留 */
export const INSTALL_PROMPT_KEY = 'eranaut.install-prompt';

export type InstallPlatform = 'android' | 'ios';
/** 桌面瀏覽器的安裝方式:Chrome / Edge 等可由頁面觸發;Mac 的 Safari 17 以上只能手動「加入 Dock」 */
export type DesktopInstall = 'chromium' | 'safari';

/** Chromium 的安裝事件(尚未列入 TypeScript 內建型別) */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Facebook、Instagram、LINE 等 App 內建的瀏覽器:不能加入主畫面,提示了也沒用 */
const IN_APP_BROWSER = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|TikTok|Snapchat/i;

/**
 * 判斷是不是要提示的手機 / 平板(不看畫面寬度)。已經是「從主畫面開啟」的不提示。
 * - Android:UA 含 `Android`(手機與平板都算;桌機 Chrome 不是)。
 * - iOS:iPhone / iPad / iPod,以及假裝成 Mac 的 iPadOS(有觸控的 MacIntel);排除 App 內建瀏覽器。
 */
export function detectInstallPlatform(input: { userAgent: string; ios: boolean; standalone: boolean }): InstallPlatform | null {
  if (input.standalone || IN_APP_BROWSER.test(input.userAgent)) return null;
  if (input.ios) return 'ios';
  if (/Android/i.test(input.userAgent)) return 'android';
  return null;
}

/**
 * 判斷是不是可以「安裝到桌面」的桌面瀏覽器(只看裝置與瀏覽器種類,不看畫面寬度)。
 * 手機、平板(含偽裝成 Mac 的 iPadOS)、已經從已安裝的 App 視窗開啟、Firefox 與舊版 Safari 都不算。
 */
export function detectDesktopInstall(input: { userAgent: string; mobile: boolean | undefined; ios: boolean; standalone: boolean }): DesktopInstall | null {
  const ua = input.userAgent;
  if (input.standalone || input.ios || input.mobile === true) return null;
  if (/Android|Mobile|CriOS|FxiOS/i.test(ua) || /Firefox\//.test(ua)) return null;
  if (/Chrome\/|Chromium\/|Edg\/|OPR\//.test(ua)) return 'chromium';
  const version = /Version\/(\d+)/.exec(ua);
  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && version !== null && Number(version[1]) >= 17) return 'safari';
  return null;
}

/**
 * 「加入主畫面」提示(登入後才出現,每個裝置最多問一次)。
 * - Android:瀏覽器會先送出 `beforeinstallprompt`,收起來;使用者按「是」才呼叫 `prompt()`,由系統顯示安裝確認。
 *   沒收到事件(不符合安裝條件、App 內建瀏覽器、已安裝)就不顯示,免得按了沒反應。
 * - iOS:沒有任何 API 能代為加入,只能提醒並說明步驟。
 * 不論按「是」、「否」或「OK」,都記住、不再詢問(使用者決定,2026-10-09)。
 */
@Injectable({ providedIn: 'root' })
export class InstallPrompt {
  private readonly auth = inject(Auth);
  private readonly toast = inject(Toast);
  private readonly env = inject(PushEnv);

  readonly platform: InstallPlatform | null = detectInstallPlatform({
    userAgent: navigator.userAgent,
    ios: this.env.isIos(),
    standalone: this.env.isStandalone(),
  });

  private readonly deferred = signal<BeforeInstallPromptEvent | null>(null);
  private readonly handled = signal(readJson<unknown>(INSTALL_PROMPT_KEY) !== null);

  /** 桌面瀏覽器的安裝方式(不是桌面瀏覽器為 null);側欄的「安裝到桌面」鈕用,不受「只問一次」限制 */
  readonly desktop: DesktopInstall | null = detectDesktopInstall({
    userAgent: navigator.userAgent,
    mobile: (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile,
    ios: this.env.isIos(),
    standalone: this.env.isStandalone(),
  });
  /** Chrome / Edge:瀏覽器送出安裝事件才顯示(已安裝或不符安裝條件就不顯示);Safari:一律顯示,按下說明步驟 */
  readonly canInstallDesktop = computed(() => this.desktop === 'safari' || (this.desktop === 'chromium' && this.deferred() !== null));

  readonly visible = computed(() => {
    if (this.handled() || this.auth.status() !== 'authenticated') return false;
    return this.platform === 'ios' || (this.platform === 'android' && this.deferred() !== null);
  });

  constructor() {
    if (this.platform === 'android' || this.desktop === 'chromium') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferred.set(e as BeforeInstallPromptEvent);
      });
    }
    if (this.platform !== null || this.desktop === 'chromium') {
      window.addEventListener('appinstalled', () => {
        if (this.platform !== null) this.markHandled();
        this.deferred.set(null);
        this.toast.show(this.platform !== null ? '已加入主畫面' : '已安裝到桌面');
      });
    }
  }

  /** Android 按「是」:顯示系統的安裝確認。確認框取消也視同處理過(不再詢問) */
  async accept(): Promise<void> {
    const event = this.deferred();
    this.markHandled();
    this.deferred.set(null);
    if (!event) return;
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // 瀏覽器拒絕顯示(例如已經顯示過):不再處理
    }
  }

  /** 側欄「安裝到桌面」:Chrome / Edge 顯示系統的安裝確認(事件只能用一次,用過就等瀏覽器重新送出);Safari 顯示手動步驟 */
  async installDesktop(): Promise<void> {
    if (this.desktop === 'safari') {
      this.toast.show('Safari:請從選單列的「檔案」→「加入 Dock」安裝', { ms: 6000 });
      return;
    }
    const event = this.deferred();
    if (!event) return;
    this.deferred.set(null);
    try {
      await event.prompt();
      await event.userChoice;
    } catch {
      // 瀏覽器拒絕顯示:不再處理
    }
  }

  /** 「否」或 iOS 的「OK」 */
  dismiss(): void {
    this.markHandled();
  }

  private markHandled(): void {
    this.handled.set(true);
    writeJson(INSTALL_PROMPT_KEY, true);
  }
}
