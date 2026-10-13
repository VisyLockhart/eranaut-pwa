import { Injectable, signal } from '@angular/core';

/** 提示上的按鈕(例如「復原」)。按下後先執行,再關閉這則提示 */
export interface ToastAction {
  label: string;
  run: () => void;
}

export interface ToastItem {
  id: number;
  text: string;
  /** `warn` 用琥珀色,給「需要注意但不是錯誤」的提示(例如預先提醒被略過) */
  tone: 'info' | 'warn';
  actions: ToastAction[];
}

/** 頁面切換後仍要看得到的短暫提示(例如更新完成後跳回總覽) */
@Injectable({ providedIn: 'root' })
export class Toast {
  readonly items = signal<ToastItem[]>([]);
  private nextId = 1;

  /** 回傳這則提示的 id,方便呼叫端提早關掉 */
  show(text: string, options: { tone?: ToastItem['tone']; ms?: number; actions?: ToastAction[] } = {}): number {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, text, tone: options.tone ?? 'info', actions: options.actions ?? [] }]);
    setTimeout(() => this.dismiss(id), options.ms ?? 2600);
    return id;
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  /** 按下提示上的按鈕:先做事,再關掉 */
  act(item: ToastItem, action: ToastAction): void {
    this.dismiss(item.id);
    action.run();
  }
}
