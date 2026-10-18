import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { Api } from './api';
import { PushEnv } from './push-env';
import { SettingsVm } from './settings-vm';
import { readJson, removeKey, writeJson } from './storage';

/**
 * 這台裝置的推播狀態(D-165):
 * - `checking`:還在判斷
 * - `ios-install`:iPhone / iPad 還沒加到主畫面(或不是從主畫面開啟),要先安裝
 * - `unsupported`:瀏覽器不支援(沒有 service worker / PushManager,或開發模式沒註冊 service worker)
 * - `unavailable`:伺服器沒有設定推播(`.env` 沒有 VAPID 金鑰)→ 設定頁不顯示這一項
 * - `blocked`:使用者封鎖了這個網站的通知,只能去瀏覽器 / 系統設定改
 * - `ready`:可以開關
 * - `error`:讀取失敗,可重試
 */
export type PushState = 'checking' | 'ios-install' | 'unsupported' | 'unavailable' | 'blocked' | 'ready' | 'error';

export interface PushMessage {
  kind: 'ok' | 'error';
  text: string;
}

const SUBSCRIPTION_WAIT_MS = 5000;
/** 開機自動檢查時等 service worker 就緒的上限:它在頁面穩定後最多 30 秒才註冊(registerWhenStable:30000) */
const SYNC_WAIT_MS = 45000;
/**
 * 「這台裝置要收推播」的意願,存在 localStorage(不會被解除註冊 service worker / 清快取影響)。
 * 瀏覽器的推播訂閱綁在 service worker 註冊上:更新流程在 service worker 卡住時會解除註冊並重設(AppUpdate.apply / repair),
 * 訂閱就跟著消失,設定頁看起來「裝置不見了」、也收不到通知。有這個意願旗標,開機時 `sync()` 就能在權限仍是「已允許」時自動重新訂閱並登記。
 */
export const PUSH_INTENT_KEY = 'eranaut.push-on';

@Injectable({ providedIn: 'root' })
export class PushVm {
  private readonly api = inject(Api);
  private readonly env = inject(PushEnv);
  /** 沒有註冊 service worker(測試、開發模式)時是 null */
  private readonly sw = inject(SwPush, { optional: true });
  private readonly settings = inject(SettingsVm);

  readonly state = signal<PushState>('checking');
  /** 這台裝置是否已開啟(瀏覽器有訂閱,而且伺服器也登記了) */
  readonly enabled = signal(false);
  readonly busy = signal(false);
  readonly message = signal<PushMessage | null>(null);
  private publicKey: string | null = null;
  private syncing = false;

  async load(): Promise<void> {
    this.message.set(null);
    try {
      // 伺服器有沒有設定推播要先問:沒設定時,不管什麼平台都不顯示這一項(也不要叫 iPhone 使用者白白去安裝)
      this.publicKey = (await this.api.pushConfig()).publicKey;
      if (this.publicKey === null) {
        this.state.set('unavailable');
        return;
      }
      if (this.env.isIos() && !this.env.isStandalone()) {
        this.state.set('ios-install');
        return;
      }
      if (!this.sw?.isEnabled || !this.env.hasPushApi()) {
        this.state.set('unsupported');
        return;
      }
      const [sub, list] = await Promise.all([this.currentSubscription(), this.api.pushSubscriptions()]);
      this.enabled.set(sub !== null && list.endpoints.includes(sub.endpoint));
      if (this.enabled()) writeJson(PUSH_INTENT_KEY, true);
      this.state.set(this.env.permission() === 'denied' && !this.enabled() ? 'blocked' : 'ready');
    } catch {
      // 401 由 interceptor 轉成 session 過期畫面;其他錯誤顯示重試
      this.state.set('error');
    }
  }

  /** 開啟:先要權限(必須直接由點擊觸發),再向瀏覽器訂閱,最後登記到伺服器 */
  async enable(): Promise<void> {
    if (this.busy() || this.state() !== 'ready' || !this.sw || this.publicKey === null) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const permission = await this.env.requestPermission();
      if (permission !== 'granted') {
        if (permission === 'denied') this.state.set('blocked');
        else this.message.set({ kind: 'error', text: '沒有取得通知權限，推播沒有開啟。' });
        return;
      }
      const sub = await this.sw.requestSubscription({ serverPublicKey: this.publicKey });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.['p256dh'] || !json.keys['auth']) throw new Error('subscription_incomplete');
      try {
        await this.api.registerPush({ endpoint: json.endpoint, keys: { p256dh: json.keys['p256dh'], auth: json.keys['auth'] } });
      } catch (e) {
        await this.sw.unsubscribe().catch(() => undefined); // 伺服器沒登記成功就不留下孤兒訂閱
        throw e;
      }
      this.markOn();
      this.message.set({ kind: 'ok', text: '已在這台裝置開啟推播通知。' });
      void this.settings.load();
    } catch {
      this.message.set({ kind: 'error', text: '無法開啟推播通知，請稍後再試。' });
    } finally {
      this.busy.set(false);
    }
  }

  /** 關閉這台裝置:先在伺服器移除(失敗就保持開啟),再取消瀏覽器訂閱 */
  async disable(): Promise<void> {
    if (this.busy() || !this.sw) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const sub = await this.currentSubscription();
      if (sub) await this.api.unregisterPush(sub.endpoint);
      await this.sw.unsubscribe().catch(() => undefined);
      removeKey(PUSH_INTENT_KEY);
      this.enabled.set(false);
      void this.settings.load();
    } catch {
      this.message.set({ kind: 'error', text: '無法關閉推播通知，請稍後再試。' });
    } finally {
      this.busy.set(false);
    }
  }

  /** 傳一則測試通知到自己所有的裝置 */
  async test(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set(null);
    try {
      const { sent } = await this.api.testPush();
      this.message.set({ kind: 'ok', text: `已送出測試通知（${sent} 台裝置），幾秒內會出現。` });
    } catch (e) {
      const status = e instanceof HttpErrorResponse ? e.status : 0;
      const text =
        status === 404
          ? '這台裝置還沒有登記推播，請先開啟。'
          : status === 429
            ? '太頻繁了，請等十秒再試。'
            : status === 502
              ? '推播服務沒有回應，請稍後再試。'
              : '測試通知送出失敗，請稍後再試。';
      this.message.set({ kind: 'error', text });
      if (status === 404) this.enabled.set(false);
    } finally {
      this.busy.set(false);
    }
  }

  /** 登出時順手移除這台裝置(盡力而為,失敗不影響登出):避免登出後這台還收到上一個帳號的通知 */
  async releaseThisDevice(): Promise<void> {
    removeKey(PUSH_INTENT_KEY); // 登出就是不要了,不能讓下次開機又自動訂閱
    if (!this.sw?.isEnabled || !this.env.hasPushApi()) return;
    try {
      const sub = await this.currentSubscription();
      if (!sub) return;
      await this.api.unregisterPush(sub.endpoint).catch(() => undefined);
      await this.sw.unsubscribe().catch(() => undefined);
    } catch {
      /* 盡力而為 */
    }
    this.enabled.set(false);
  }

  /**
   * 開機(登入後)自動對帳,不需要使用者進設定頁:
   * - 這台已有訂閱且伺服器有登記 → 記下「要收推播」的意願(讓之前就開啟的裝置也受保護)。
   * - 意願旗標在、權限仍是「已允許」,但訂閱不見了(service worker 被重設)或伺服器沒登記 → 靜默重新訂閱並登記。
   * 不會跳出權限詢問(權限不是「已允許」就什麼都不做);任何失敗都吞掉,下次開機再試。
   */
  async sync(): Promise<void> {
    if (this.syncing || !this.sw?.isEnabled || !this.env.hasPushApi()) return;
    if (this.env.isIos() && !this.env.isStandalone()) return;
    const granted = this.env.permission() === 'granted';
    const intended = readJson<boolean>(PUSH_INTENT_KEY) === true;
    if (!granted && !intended) return;
    this.syncing = true;
    try {
      const publicKey = this.publicKey ?? (await this.api.pushConfig()).publicKey;
      if (publicKey === null) return;
      this.publicKey = publicKey;
      const [sub, list] = await Promise.all([this.currentSubscription(SYNC_WAIT_MS), this.api.pushSubscriptions()]);
      if (sub && list.endpoints.includes(sub.endpoint)) {
        this.markOn();
        return;
      }
      if (!intended || !granted) return;
      const fresh = sub ?? (await this.sw.requestSubscription({ serverPublicKey: publicKey }));
      const json = fresh.toJSON();
      if (!json.endpoint || !json.keys?.['p256dh'] || !json.keys['auth']) return;
      await this.api.registerPush({ endpoint: json.endpoint, keys: { p256dh: json.keys['p256dh'], auth: json.keys['auth'] } });
      this.markOn();
      void this.settings.load();
    } catch {
      /* 盡力而為:下次開機再試 */
    } finally {
      this.syncing = false;
    }
  }

  private markOn(): void {
    this.enabled.set(true);
    writeJson(PUSH_INTENT_KEY, true);
  }

  /** 瀏覽器目前的訂閱;service worker 還沒就緒時最多等 5 秒,逾時當作沒有 */
  private async currentSubscription(waitMs = SUBSCRIPTION_WAIT_MS): Promise<PushSubscription | null> {
    if (!this.sw) return null;
    const wait = new Promise<null>((resolve) => setTimeout(() => resolve(null), waitMs));
    return Promise.race([firstValueFrom(this.sw.subscription, { defaultValue: null }), wait]);
  }
}
