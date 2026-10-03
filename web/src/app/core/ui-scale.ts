import { Injectable, computed, signal } from '@angular/core';
import { readJson, writeJson } from './storage';

/** 介面大小(D-164):小 = 現行外觀,中、大用 CSS zoom 整體放大。 */
export type UiSize = 'small' | 'medium' | 'large';

export const UI_SIZES: readonly { value: UiSize; label: string; factor: number }[] = [
  { value: 'small', label: '小', factor: 1 },
  { value: 'medium', label: '中', factor: 1.15 },
  { value: 'large', label: '大', factor: 1.3 },
];

/** localStorage 鍵;index.html 的開機前小腳本也讀這個鍵與同一組倍率(避免第一幀閃一下小字),兩處要一起改 */
export const UI_SCALE_KEY = 'eranaut.ui-scale';

function isUiSize(v: unknown): v is UiSize {
  return UI_SIZES.some((s) => s.value === v);
}

type CoordMode = 'visual' | 'local';

/**
 * zoom 下 100vh 是否會被乘上倍率:Chrome 會(要除以倍率抵銷),Safari 不會(不能除)。
 * 用 zoom:2 的探針比較「100vh 方塊」與「100px 方塊」的回報高度比,兩種座標回報方式比值相同:
 * 會乘 → 比值 ≈ 視窗高 / 100;不會乘 → 比值 ≈ 視窗高 / (200 × 倍率)。index.html 的開機前小腳本有同一段判斷,兩處要一起改。
 */
function viewportUnitDivisor(factor: number): number {
  if (typeof document === 'undefined' || !(window.innerHeight > 0)) return factor;
  const mk = (h: string) => {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:0;top:0;width:1px;height:${h};zoom:2;visibility:hidden;pointer-events:none`;
    document.body.appendChild(d);
    return d;
  };
  const a = mk('100vh');
  const b = mk('100px');
  const ha = a.getBoundingClientRect().height;
  const hb = b.getBoundingClientRect().height;
  a.remove();
  b.remove();
  if (!(ha > 0 && hb > 0)) return factor;
  return (ha / hb) * 100 / window.innerHeight > 0.75 ? factor : 1;
}

/**
 * 介面大小的狀態與套用(D-164):`--ui-scale` 寫在根元素,樣式表的 `html { zoom: var(--ui-scale) }` 負責放大,
 * 切換時立即生效、不需重新整理。偏好只存這台裝置的 localStorage(D-55、D-56 同一作法),讀不到或值不合法一律當「小」。
 */
@Injectable({ providedIn: 'root' })
export class UiScale {
  readonly size = signal<UiSize>(this.load());
  /** 設定的倍率(1 / 1.15 / 1.3);瀏覽器不支援 zoom 時實際不會放大,見 effective() */
  readonly factor = computed(() => UI_SIZES.find((s) => s.value === this.size())!.factor);

  private probed: { factor: number; zoom: number; mode: CoordMode; vuDiv: number } | null = null;

  constructor() {
    this.apply();
  }

  set(size: UiSize): void {
    if (size === this.size()) return;
    this.size.set(size);
    writeJson(UI_SCALE_KEY, size);
    this.apply();
  }

  /** 瀏覽器實際套用的放大倍率:不支援 zoom 時是 1(此時 `--ui-scale` 不會造成任何放大) */
  effective(): number {
    return this.measure().zoom;
  }

  /**
   * 以「目前元素所在座標」(zoom 後的 CSS 像素)回傳元素的位置與大小。固定定位的浮動面板(自製下拉)用它對位:
   * 新版瀏覽器的 getBoundingClientRect 回傳螢幕像素(要除以倍率),舊版 WebKit 回傳元素本地座標(不必除),
   * 這裡用探針實測區分,不假設瀏覽器行為。
   */
  localRect(el: Element): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
    const r = el.getBoundingClientRect();
    const { zoom, mode } = this.measure();
    const k = mode === 'visual' ? zoom : 1;
    return { left: r.left / k, top: r.top / k, right: r.right / k, bottom: r.bottom / k, width: r.width / k, height: r.height / k };
  }

  /** 視窗大小,換算成 zoom 後的 CSS 像素(固定定位的 left / top / bottom 用這個單位) */
  localViewport(): { width: number; height: number } {
    const { zoom } = this.measure();
    return { width: window.innerWidth / zoom, height: window.innerHeight / zoom };
  }

  private apply(): void {
    this.probed = null;
    if (typeof document === 'undefined') return;
    const root = document.documentElement.style;
    root.setProperty('--ui-scale', String(this.factor()));
    // vh / vw / env(safe-area-*) 在 zoom 下各瀏覽器不一致(Chrome 會乘上倍率,Safari 不會),樣式表統一除以這個值
    root.setProperty('--vu-div', String(this.measure().vuDiv));
  }

  private measure(): { zoom: number; mode: CoordMode; vuDiv: number } {
    const factor = this.factor();
    if (this.probed?.factor === factor) return this.probed;
    let zoom = 1;
    let mode: CoordMode = 'visual';
    let vuDiv = 1;
    if (factor !== 1 && typeof document !== 'undefined' && typeof CSS !== 'undefined' && CSS.supports?.('zoom', String(factor))) {
      zoom = factor;
      // 探針:固定定位的 100px 方塊;回報約 100 × 倍率 = 螢幕像素,回報約 100 = 元素本地座標
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      if (width > 0 && Math.abs(width - 100) < Math.abs(width - 100 * factor)) mode = 'local';
      vuDiv = viewportUnitDivisor(factor);
    }
    this.probed = { factor, zoom, mode, vuDiv };
    return this.probed;
  }

  private load(): UiSize {
    const v = readJson<unknown>(UI_SCALE_KEY);
    return isUiSize(v) ? v : 'small';
  }
}
