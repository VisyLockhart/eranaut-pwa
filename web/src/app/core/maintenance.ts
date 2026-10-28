import { DestroyRef, Injectable, computed, effect, inject, untracked } from '@angular/core';
import { MAINTENANCE_SHOW_AFTER_MS, MAINTENANCE_SHOW_BEFORE_MS, type MaintenanceDto } from '@eranaut/shared';
import { Api } from './api';
import { DataStore } from './data-store';
import { formatRemaining, taipeiParts } from './format';

// 伺服器維護橫幅(D-283):資料由 Eranarch 通知 API、前端隨總覽取得(`DataStore.maintenance`)。
// 這裡只負責「現在該顯示什麼」(用 DataStore 既有的 15 秒時鐘重算,不另開計時器)與
// 「橫幅顯示中、分頁在前景」時的低頻重抓。沒有維護的日子,不會多出任何請求。
// 官網維護不會出現在這裡(API 只收遊戲伺服器維護)。

/** 橫幅顯示期間,分頁在前景時每隔多久向 API 確認一次(回應很小);背景分頁不抓 */
export const MAINTENANCE_POLL_MS = 5 * 60_000;

export type MaintenancePhase = 'upcoming' | 'ongoing' | 'overrun';

export interface MaintenanceView {
  phase: MaintenancePhase;
  /** 例:`09/29 13:00 ~ 18:00`;跨日 `09/29 23:00 ~ 09/30 03:00`(台北時間,不顯示年份) */
  range: string;
  /** 例:`伺服器維護 09/29 13:00 ~ 18:00` */
  label: string;
  /** 例:`距開始 4 時 12 分`、`維護中`、`已超過預計時間,等待官方開機公告` */
  status: string;
  title: string;
  url: string;
}

const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;

/** 同一天只在前面寫日期;跨日兩邊都寫日期 */
export function formatMaintenanceRange(startMs: number, endMs: number): string {
  const s = taipeiParts(startMs);
  const e = taipeiParts(endMs);
  const start = `${pad2(s.mo)}/${pad2(s.d)} ${pad2(s.h)}:${pad2(s.mi)}`;
  const sameDay = s.y === e.y && s.mo === e.mo && s.d === e.d;
  const end = sameDay ? `${pad2(e.h)}:${pad2(e.mi)}` : `${pad2(e.mo)}/${pad2(e.d)} ${pad2(e.h)}:${pad2(e.mi)}`;
  return `${start} ~ ${end}`;
}

/** 官網維護(只有官方網站的登入、水晶商城暫停,不影響遊戲)不顯示;API 與 bot 本來就會擋,這裡再擋一次 */
export function isSiteMaintenance(title: string): boolean {
  return /官網/.test(title);
}

/** 現在該顯示的橫幅內容;不在顯示期間(開始前 24 小時之前、預計結束 6 小時之後)回 null */
export function maintenanceView(info: MaintenanceDto | null, nowMs: number): MaintenanceView | null {
  if (!info || isSiteMaintenance(info.title)) return null;
  const startMs = Date.parse(info.start_at);
  const endMs = Date.parse(info.end_at);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  if (nowMs < startMs - MAINTENANCE_SHOW_BEFORE_MS || nowMs >= endMs + MAINTENANCE_SHOW_AFTER_MS) return null;

  const range = formatMaintenanceRange(startMs, endMs);
  let phase: MaintenancePhase;
  let status: string;
  if (nowMs < startMs) {
    phase = 'upcoming';
    status = `距開始 ${formatRemaining(Math.max(1, Math.ceil((startMs - nowMs) / 60_000)))}`;
  } else if (nowMs < endMs) {
    phase = 'ongoing';
    status = '維護中';
  } else {
    phase = 'overrun';
    status = '已超過預計時間,等待官方開機公告';
  }
  return { phase, range, label: `伺服器維護 ${range}`, status, title: info.title, url: info.url };
}

@Injectable({ providedIn: 'root' })
export class Maintenance {
  private readonly api = inject(Api);
  private readonly store = inject(DataStore);

  readonly view = computed(() => maintenanceView(this.store.maintenance(), this.store.now()));
  private readonly active = computed(() => this.view() !== null);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const on = this.active();
      untracked(() => (on ? this.startPolling() : this.stopPolling()));
    });
    inject(DestroyRef).onDestroy(() => this.stopPolling());
  }

  /** 向 API 確認目前的維護狀態(已開機後橫幅就會消失);失敗就保留現狀 */
  async poll(): Promise<void> {
    try {
      const res = await this.api.maintenance();
      this.store.maintenance.set(res.maintenance);
    } catch {
      // 網路暫時失敗或 session 過期(由 interceptor 處理),下一輪再試
    }
  }

  private startPolling(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible') void this.poll();
    }, MAINTENANCE_POLL_MS);
  }

  private stopPolling(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }
}
