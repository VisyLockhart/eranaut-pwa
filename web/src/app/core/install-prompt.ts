import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth } from './auth';
import { PushEnv } from './push-env';
import { readJson, writeJson } from './storage';
import { Toast } from './toast';

/** 「加入主畫面」提示的本機記錄:有值 = 已處理過(按了「是」、「否」或「OK」),之後不再詢問。登出時保留 */
export const INSTALL_PROMPT_KEY = 'eranaut.install-prompt';

export type InstallPlatform = 'android' | 'ios';

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

  readonly visible = computed(() => {
    if (this.handled() || this.auth.status() !== 'authenticated') return false;
    return this.platform === 'ios' || (this.platform === 'android' && this.deferred() !== null);
  });

  constructor() {
    if (this.platform === 'android') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferred.set(e as BeforeInstallPromptEvent);
      });
    }
    if (this.platform !== null) {
      window.addEventListener('appinstalled', () => {
        this.markHandled();
        this.deferred.set(null);
        this.toast.show('已加入主畫面');
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

  /** 「否」或 iOS 的「OK」 */
  dismiss(): void {
    this.markHandled();
  }

  private markHandled(): void {
    this.handled.set(true);
    writeJson(INSTALL_PROMPT_KEY, true);
  }
}
