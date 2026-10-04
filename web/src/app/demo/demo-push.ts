import { inject, Injectable } from '@angular/core';
import { PushEnv } from '../core/push-env';
import { PushVm } from '../core/push-vm';
import { SettingsVm } from '../core/settings-vm';
import { DemoStore } from './demo-store';

const FLAG_KEY = 'eranaut.demo.push';
const READY_WAIT_MS = 3000;

/** 展示版的使用說明:跟在推播區塊的訊息後面,讓第一次試的人知道要怎麼才收得到 */
const HINT =
  '展示版小提醒：電腦瀏覽器請在跳出的視窗按「允許」通知；手機請先把網頁「加入主畫面」，再從主畫面的圖示開啟（iPhone 需 iOS 16.4 以上）。通知由這台裝置本機顯示，不經過推播伺服器，所以關掉頁面後不會再提醒。';

/**
 * 展示版的推播(D-168 ⑧):沒有推播伺服器,所以「開啟」只是取得通知權限,
 * 「傳送測試通知」改由 service worker 在本機顯示通知。外觀與正式版推播相同(包含 iPhone 主畫面 App 的系統橫幅),
 * 但頁面關掉後不會再提醒。
 */
@Injectable()
export class DemoPushVm extends PushVm {
  private readonly demoEnv = inject(PushEnv);
  private readonly demoStore = inject(DemoStore);
  private readonly demoSettings = inject(SettingsVm);

  override async load(): Promise<void> {
    this.message.set(null);
    if (this.demoEnv.isIos() && !this.demoEnv.isStandalone()) {
      this.state.set('ios-install');
      return;
    }
    if (!this.demoEnv.hasPushApi()) {
      this.state.set('unsupported');
      return;
    }
    const permission = this.demoEnv.permission();
    const on = permission === 'granted' && this.readFlag();
    this.enabled.set(on);
    this.syncPref(on);
    this.state.set(permission === 'denied' && !on ? 'blocked' : 'ready');
    this.say('ok', null);
  }

  override async enable(): Promise<void> {
    if (this.busy() || this.state() !== 'ready') return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const permission = await this.demoEnv.requestPermission();
      if (permission !== 'granted') {
        if (permission === 'denied') this.state.set('blocked');
        else this.say('error', '沒有取得通知權限，推播沒有開啟。');
        return;
      }
      this.writeFlag(true);
      this.enabled.set(true);
      this.syncPref(true);
      this.say('ok', '已在這台裝置開啟推播通知。');
    } finally {
      this.busy.set(false);
    }
  }

  override async disable(): Promise<void> {
    this.writeFlag(false);
    this.enabled.set(false);
    this.syncPref(false);
    this.say('ok', null);
  }

  override async test(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const title = '🔔 測試通知';
      const options: NotificationOptions = { body: '推播運作正常,提醒會像這樣出現。', tag: 'eranaut-test', icon: '/icons/icon-192.png' };
      const reg = await this.registration();
      if (reg) await reg.showNotification(title, options);
      else new Notification(title, options);
      this.say('ok', '已送出測試通知，幾秒內會出現。');
    } catch {
      this.say('error', '測試通知送出失敗，請確認瀏覽器允許這個網站的通知。');
    } finally {
      this.busy.set(false);
    }
  }

  override async releaseThisDevice(): Promise<void> {
    this.writeFlag(false);
    this.enabled.set(false);
  }

  /** service worker 還沒就緒(剛開啟頁面)時最多等 3 秒,逾時改用一般通知 */
  private async registration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    const wait = new Promise<null>((resolve) => setTimeout(() => resolve(null), READY_WAIT_MS));
    return Promise.race([navigator.serviceWorker.ready, wait]);
  }

  /** 狀態訊息;一般情況後面都附上使用說明 */
  private say(kind: 'ok' | 'error', status: string | null): void {
    this.message.set({ kind, text: status === null ? HINT : `${status}${kind === 'ok' ? ` ${HINT}` : ''}` });
  }

  private syncPref(on: boolean): void {
    this.demoStore.prefs.push = on;
    this.demoStore.commit();
    void this.demoSettings.load();
  }

  private readFlag(): boolean {
    try {
      return localStorage.getItem(FLAG_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeFlag(on: boolean): void {
    try {
      if (on) localStorage.setItem(FLAG_KEY, '1');
      else localStorage.removeItem(FLAG_KEY);
    } catch {
      /* 無痕模式等:不保存 */
    }
  }
}
