import { Injectable } from '@angular/core';

/**
 * 推播需要的瀏覽器環境偵測(D-165),獨立成服務讓測試可以替換。
 * iPhone / iPad 的規則最特別:只有「加到主畫面並從主畫面圖示開啟」的網頁才有 `PushManager`,
 * 在 Safari 分頁裡完全沒有,所以先判斷平台,再判斷 API 是否存在。
 */
@Injectable({ providedIn: 'root' })
export class PushEnv {
  /** iPhone、iPad,以及假裝成 Mac 的 iPadOS(有觸控的 MacIntel) */
  isIos(): boolean {
    const nav = navigator;
    return /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  }

  /** 以「安裝的 App」方式開啟(主畫面圖示) */
  isStandalone(): boolean {
    return window.matchMedia?.('(display-mode: standalone)').matches === true || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  hasPushApi(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  permission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  /** 必須在使用者點擊的處理函式裡呼叫(iOS 的要求) */
  requestPermission(): Promise<NotificationPermission> {
    return Notification.requestPermission();
  }
}
