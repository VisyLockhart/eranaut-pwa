import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  MeDto,
  NotifyPrefs,
  NotifyPrefsUpdate,
  OcrResultDto,
  OverviewDto,
  PublicConfigDto,
  PushConfigDto,
  PushSubscriptionInput,
  PushSubscriptionsDto,
  PushTestResult,
  SubmarineInput,
  SubmarinesUpdateResult,
  WorkshopDto,
  WorkshopInput,
} from '@eranaut/shared';
import { firstValueFrom } from 'rxjs';

// 對後端公開 API 的薄包裝(同網域,不做 CORS;cookie 由瀏覽器自動帶,D-142)。
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  me(): Promise<MeDto> {
    return firstValueFrom(this.http.get<MeDto>('/api/me'));
  }
  publicConfig(): Promise<PublicConfigDto> {
    return firstValueFrom(this.http.get<PublicConfigDto>('/api/public-config'));
  }
  overview(): Promise<OverviewDto> {
    return firstValueFrom(this.http.get<OverviewDto>('/api/overview'));
  }
  logout(): Promise<unknown> {
    return firstValueFrom(this.http.post('/api/auth/logout', null));
  }

  // ---- 工坊 CRUD(SCHEMA §8.3);PUT 是整筆取代 ----
  createWorkshop(input: WorkshopInput): Promise<WorkshopDto> {
    return firstValueFrom(this.http.post<WorkshopDto>('/api/workshops', input));
  }
  updateWorkshop(id: string, input: WorkshopInput): Promise<WorkshopDto> {
    return firstValueFrom(this.http.put<WorkshopDto>(`/api/workshops/${encodeURIComponent(id)}`, input));
  }
  deleteWorkshop(id: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/workshops/${encodeURIComponent(id)}`));
  }

  // ---- 潛艇更新(SCHEMA §8.4);時間由後端算,前端只送剩餘分鐘(D-48) ----
  /** 整個工坊一次更新:只對有列出的位置 UPSERT,全成功或全不寫 */
  updateSubmarines(workshopId: string, submarines: SubmarineInput[]): Promise<SubmarinesUpdateResult> {
    return firstValueFrom(this.http.put<SubmarinesUpdateResult>(`/api/workshops/${encodeURIComponent(workshopId)}/submarines`, { submarines }));
  }
  /** 單艘快速修改:位置取自網址 */
  updateSubmarine(workshopId: string, input: SubmarineInput): Promise<SubmarinesUpdateResult> {
    return firstValueFrom(this.http.put<SubmarinesUpdateResult>(`/api/workshops/${encodeURIComponent(workshopId)}/submarines/${input.position}`, input));
  }

  // ---- 截圖辨識(SCHEMA §8.1):只辨識、不寫資料庫、不存圖片(D-49、D-126) ----
  ocr(file: File): Promise<OcrResultDto> {
    const form = new FormData();
    form.append('image', file, file.name);
    return firstValueFrom(this.http.post<OcrResultDto>('/api/ocr', form));
  }

  // ---- 提醒方式(SCHEMA §8.5;對外用具名布林,D-145 ⑦) ----
  notifyPrefs(): Promise<NotifyPrefs> {
    return firstValueFrom(this.http.get<NotifyPrefs>('/api/notify-prefs'));
  }
  /** DM 與頻道兩個欄位都必填且為布林;全部取消 = 不收任何提醒(D-133)。推播由下面的訂閱端點管理(D-165) */
  setNotifyPrefs(prefs: NotifyPrefsUpdate): Promise<NotifyPrefs> {
    return firstValueFrom(this.http.put<NotifyPrefs>('/api/notify-prefs', prefs));
  }

  // ---- 瀏覽器推播(D-165) ----
  pushConfig(): Promise<PushConfigDto> {
    return firstValueFrom(this.http.get<PushConfigDto>('/api/push/config'));
  }
  pushSubscriptions(): Promise<PushSubscriptionsDto> {
    return firstValueFrom(this.http.get<PushSubscriptionsDto>('/api/push/subscriptions'));
  }
  registerPush(sub: PushSubscriptionInput): Promise<unknown> {
    return firstValueFrom(this.http.put('/api/push/subscription', sub));
  }
  unregisterPush(endpoint: string): Promise<unknown> {
    return firstValueFrom(this.http.delete('/api/push/subscription', { body: { endpoint } }));
  }
  testPush(): Promise<PushTestResult> {
    return firstValueFrom(this.http.post<PushTestResult>('/api/push/test', null));
  }
}
