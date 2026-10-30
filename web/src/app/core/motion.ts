import { Injectable, signal } from '@angular/core';
import { readJson, writeJson } from './storage';

/** 動態效果(D-302):標準 = 完整回饋;精簡 = 所有動態時長歸零(只換顏色與狀態) */
export type MotionMode = 'standard' | 'reduced';

export const MOTION_MODES: readonly { value: MotionMode; label: string }[] = [
  { value: 'standard', label: '標準' },
  { value: 'reduced', label: '精簡' },
];

/** localStorage 鍵;只存這台裝置(同主題、介面大小的作法) */
export const MOTION_KEY = 'eranaut.motion';

function isMode(v: unknown): v is MotionMode {
  return v === 'standard' || v === 'reduced';
}

/**
 * 動態效果的狀態與套用:把 `data-motion` 寫在根元素,樣式表的 `html[data-motion='reduced']` 把 `--mo-*` 時長 token 歸零。
 * 沒有儲存值時依系統的「減少動態效果」決定預設,之後以手動選擇為準(不另設「跟隨系統」第三項)。
 */
@Injectable({ providedIn: 'root' })
export class MotionService {
  readonly mode = signal<MotionMode>(this.load());

  constructor() {
    this.apply();
  }

  set(mode: MotionMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    writeJson(MOTION_KEY, mode);
    this.apply();
  }

  private apply(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['motion'] = this.mode();
  }

  private load(): MotionMode {
    const v = readJson<unknown>(MOTION_KEY);
    if (isMode(v)) return v;
    const prefersReduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReduced ? 'reduced' : 'standard';
  }
}
