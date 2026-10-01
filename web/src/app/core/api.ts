import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { MeDto, OverviewDto, PublicConfigDto } from '@eranaut/shared';
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
}
