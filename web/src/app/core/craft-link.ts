import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/** 從航線配置帶到配件製作的請求(D-262):四個配件各為 1~10(1~5 原版、6~10 改版) */
export interface CraftImport {
  parts: readonly [number, number, number, number];
  /** 提示上顯示的配置名稱 */
  name: string;
}

/** 目前畫面的捲動容器:手機是外殼的 `.m-upload-body`,桌機是 `.d-main`,都不是就整頁 */
export function pageScroller(): HTMLElement {
  for (const sel of ['.m-upload-body', '.d-main']) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && getComputedStyle(el).overflowY !== 'visible') return el;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function validParts(parts: readonly number[]): parts is CraftImport['parts'] {
  return parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 1 && n <= 10);
}

/**
 * 航線 ↔ 配件製作的橋(D-262)。只放很小的狀態,不碰配件製作的資料集,
 * 讓航線頁的 chunk 不必把配方資料一起載進來。
 * - 航線端 `send()`:記下要帶的配置與目前捲動位置,切到 /craft。
 * - 製作端 `take()`:頁面建立時取走並套用。
 * - 提示上的「回配置」`back()`:切回 /gear(配件清單),該頁建立時用 `takeRestore()` 還原捲動位置。
 */
@Injectable({ providedIn: 'root' })
export class CraftLink {
  private readonly router = inject(Router);
  private pending: CraftImport | null = null;
  private returnTop: number | null = null;
  private restoreTop: number | null = null;

  send(parts: readonly number[], name: string): boolean {
    if (!validParts(parts)) return false;
    this.pending = { parts: [...parts] as CraftImport['parts'], name };
    this.returnTop = pageScroller().scrollTop;
    void this.router.navigateByUrl('/craft');
    return true;
  }

  take(): CraftImport | null {
    const p = this.pending;
    this.pending = null;
    return p;
  }

  back(): void {
    this.restoreTop = this.returnTop;
    void this.router.navigateByUrl('/gear');
  }

  takeRestore(): number | null {
    const t = this.restoreTop;
    this.restoreTop = null;
    return t;
  }
}
