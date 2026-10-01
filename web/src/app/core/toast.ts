import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: number;
  text: string;
  /** `warn` 用琥珀色,給「需要注意但不是錯誤」的提示(例如預先提醒被略過) */
  tone: 'info' | 'warn';
}

/** 頁面切換後仍要看得到的短暫提示(例如更新完成後跳回總覽) */
@Injectable({ providedIn: 'root' })
export class Toast {
  readonly items = signal<ToastItem[]>([]);
  private nextId = 1;

  show(text: string, options: { tone?: ToastItem['tone']; ms?: number } = {}): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, text, tone: options.tone ?? 'info' }]);
    setTimeout(() => this.dismiss(id), options.ms ?? 2600);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }
}
