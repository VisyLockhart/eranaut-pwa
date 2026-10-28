import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  ChartOcrResultDto,
  WorkshopChartDto,
  WorkshopChartsInput,
  MaintenanceResponse,
  MeDto,
  NotifyPrefs,
  NotifyPrefsUpdate,
  OcrResultDto,
  OverviewDto,
  ProgressInput,
  PublicConfigDto,
  PushConfigDto,
  PushSubscriptionInput,
  PushSubscriptionsDto,
  PushTestResult,
  RouteFilterDto,
  RouteFilterInput,
  RouteSubDto,
  RouteSubInput,
  SubmarineDto,
  SubmarineInput,
  SubmarinesUpdateResult,
  UpkeepPatch,
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

  /** 伺服器維護橫幅顯示期間的輕量重抓(D-283,回應很小) */
  maintenance(): Promise<MaintenanceResponse> {
    return firstValueFrom(this.http.get<MaintenanceResponse>('/api/maintenance'));
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

  // ---- 配件維修提醒(D-288);開啟隨「更新潛艇」一起送(SubmarineInput.upkeep),這裡是手動調整 ----
  adjustUpkeep(submarineId: string, patch: UpkeepPatch): Promise<SubmarineDto> {
    return firstValueFrom(this.http.put<SubmarineDto>(`/api/submarines/${encodeURIComponent(submarineId)}/upkeep`, patch));
  }
  disableUpkeep(submarineId: string): Promise<SubmarineDto> {
    return firstValueFrom(this.http.delete<SubmarineDto>(`/api/submarines/${encodeURIComponent(submarineId)}/upkeep`));
  }
  /** 標示已維修(同工坊勾選的幾艘),回該工坊全部潛艇 */
  // ---- 潛艇等級與練級輔助(D-289);設定隨「更新潛艇」一起送(SubmarineInput.progress),這裡是單獨儲存 ----
  setProgress(submarineId: string, input: ProgressInput): Promise<SubmarineDto> {
    return firstValueFrom(this.http.put<SubmarineDto>(`/api/submarines/${encodeURIComponent(submarineId)}/progress`, input));
  }
  clearProgress(submarineId: string): Promise<SubmarineDto> {
    return firstValueFrom(this.http.delete<SubmarineDto>(`/api/submarines/${encodeURIComponent(submarineId)}/progress`));
  }

  markUpkeepRepaired(workshopId: string, submarineIds: string[]): Promise<{ submarines: SubmarineDto[] }> {
    return firstValueFrom(this.http.post<{ submarines: SubmarineDto[] }>(`/api/workshops/${encodeURIComponent(workshopId)}/upkeep/repaired`, { submarine_ids: submarineIds }));
  }

  // ---- 截圖辨識(SCHEMA §8.1):只辨識、不寫資料庫、不存圖片(D-49、D-126) ----
  ocr(file: File): Promise<OcrResultDto> {
    const form = new FormData();
    form.append('image', file, file.name);
    return firstValueFrom(this.http.post<OcrResultDto>('/api/ocr', form));
  }

  // ---- 海圖探索(D-293):截圖只辨識、不存;核對後才儲存 ----
  chartOcr(file: File): Promise<ChartOcrResultDto> {
    const form = new FormData();
    form.append('image', file, file.name);
    return firstValueFrom(this.http.post<ChartOcrResultDto>('/api/charts/ocr', form));
  }
  saveCharts(workshopId: string, seas: WorkshopChartsInput['seas']): Promise<WorkshopChartDto[]> {
    return firstValueFrom(this.http.put<WorkshopChartDto[]>(`/api/workshops/${encodeURIComponent(workshopId)}/charts`, { seas }));
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

  // ---- 航線模擬器的儲存潛艇(SCHEMA §8.11;RS-25、RS-26);PUT 是整筆取代 ----
  routeSubs(): Promise<RouteSubDto[]> {
    return firstValueFrom(this.http.get<RouteSubDto[]>('/api/route-subs'));
  }
  createRouteSub(input: RouteSubInput): Promise<RouteSubDto> {
    return firstValueFrom(this.http.post<RouteSubDto>('/api/route-subs', input));
  }
  updateRouteSub(id: string, input: RouteSubInput): Promise<RouteSubDto> {
    return firstValueFrom(this.http.put<RouteSubDto>(`/api/route-subs/${encodeURIComponent(id)}`, input));
  }
  /** 只切換常用(D-237):PATCH 不動其他欄位與 updated_at */
  setRouteSubFavorite(id: string, favorite: boolean): Promise<RouteSubDto> {
    return firstValueFrom(this.http.patch<RouteSubDto>(`/api/route-subs/${encodeURIComponent(id)}`, { favorite }));
  }
  deleteRouteSub(id: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/route-subs/${encodeURIComponent(id)}`));
  }

  // ---- 找路線的條件組合(SCHEMA §8.12;D-229);PUT 是整筆取代 ----
  routeFilters(): Promise<RouteFilterDto[]> {
    return firstValueFrom(this.http.get<RouteFilterDto[]>('/api/route-filters'));
  }
  createRouteFilter(input: RouteFilterInput): Promise<RouteFilterDto> {
    return firstValueFrom(this.http.post<RouteFilterDto>('/api/route-filters', input));
  }
  updateRouteFilter(id: string, input: RouteFilterInput): Promise<RouteFilterDto> {
    return firstValueFrom(this.http.put<RouteFilterDto>(`/api/route-filters/${encodeURIComponent(id)}`, input));
  }
  setRouteFilterFavorite(id: string, favorite: boolean): Promise<RouteFilterDto> {
    return firstValueFrom(this.http.patch<RouteFilterDto>(`/api/route-filters/${encodeURIComponent(id)}`, { favorite }));
  }
  deleteRouteFilter(id: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/route-filters/${encodeURIComponent(id)}`));
  }
}
