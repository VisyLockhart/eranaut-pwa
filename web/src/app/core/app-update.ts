import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { Toast } from './toast';

/** 新版本下載好後提示一次;下次整理頁面或重開 App 就會套用(D-155) */
@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private readonly sw = inject(SwUpdate, { optional: true });
  private readonly toast = inject(Toast);

  start(): void {
    if (!this.sw?.isEnabled) return;
    this.sw.versionUpdates
      .pipe(filter((e) => e.type === 'VERSION_READY'))
      .subscribe(() => this.toast.show('已有新版本,重新整理後套用。', { ms: 8000 }));
  }
}
