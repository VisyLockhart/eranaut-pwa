import { Injectable, inject, signal } from '@angular/core';
import type { NotifyPrefs } from '@eranaut/shared';
import { Api } from './api';

type PrefKey = keyof NotifyPrefs;

/**
 * 設定頁的提醒方式(D-72、D-133、D-145 ⑦):DM(預設開)與伺服器頻道 @(公開訊息)可同時勾選,也可全部關閉。
 * 切換開關立即儲存(沒有「儲存」按鈕);失敗時還原並提示。手機與桌機版面共用。
 */
@Injectable({ providedIn: 'root' })
export class SettingsVm {
  private readonly api = inject(Api);

  /** null = 還沒載入 */
  readonly prefs = signal<NotifyPrefs | null>(null);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  async load(): Promise<void> {
    this.loadError.set(false);
    try {
      this.prefs.set(await this.api.notifyPrefs());
    } catch {
      // 401 由 interceptor 轉成 session 過期畫面;其他錯誤顯示重試
      this.loadError.set(true);
    }
  }

  /** 切換一項:先更新畫面,再送出;失敗還原。儲存中不接受下一次切換(避免兩個請求互相覆蓋) */
  async toggle(key: PrefKey): Promise<void> {
    const before = this.prefs();
    if (before === null || this.saving()) return;
    const next = { ...before, [key]: !before[key] };
    this.prefs.set(next);
    this.saving.set(true);
    this.saveError.set(null);
    try {
      this.prefs.set(await this.api.setNotifyPrefs(next));
    } catch {
      this.prefs.set(before);
      this.saveError.set('儲存失敗，已還原。請稍後再試。');
    } finally {
      this.saving.set(false);
    }
  }
}
