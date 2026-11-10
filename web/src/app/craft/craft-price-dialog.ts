import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';
import { CraftPrice } from './craft-price';
import { CraftVm } from './craft-vm';
import { ITEM_IDS } from './core/data';
import { fmtAgo, fmtClock, fmtGil, isStale } from './core/price-format';
import { isAbortError } from './core/price-service';
import { PriceError, type PriceErrorKind, type PriceQuote } from './core/price-types';

type PriceState = { kind: 'loading' } | { kind: 'ok'; quote: PriceQuote } | { kind: 'error'; error: PriceErrorKind };

const ERROR_TEXT: Record<PriceErrorKind, [string, string]> = {
  timeout: ['查詢逾時', '查價服務沒有及時回應,請稍後再試。'],
  'rate-limit': ['查詢太頻繁', '查價服務暫時限制了查詢次數,請等一會兒再試。'],
  network: ['連不上查價服務', '請確認網路連線後再試。'],
  server: ['查價服務暫時無法使用', '這不是你的問題,請稍後再試。'],
  format: ['查價服務回傳了無法辨識的資料', '請稍後再試。'],
  'not-found': ['查價服務沒有這個物品', '市場板可能沒有收錄它。'],
};

/**
 * 素材查價視窗(D-343):陸行鳥市場板最低的 10 筆掛單(單價 / 數量 / 總計 / 雇員 / 服務器)。
 * 狀態(開哪個物品)放在 root 的 `CraftVm.priceFor`,換版面重建元件時不會丟;取價走 `CraftPrice`(快取、逾時、重試)。
 * 外觀沿用 rt-dlg(桌機置中,手機底部面板),所以四個主題自動一致。
 */
@Component({
  selector: 'app-craft-price',
  imports: [CdkTrapFocus, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './craft-price-dialog.html',
})
export class CraftPriceDialog {
  protected readonly vm = inject(CraftVm);
  protected readonly layout = inject(Layout);
  private readonly price = inject(CraftPrice);
  protected readonly st = signal<PriceState>({ kind: 'loading' });
  /** 「更新於 N 分鐘前」用的現在時間(開著時每 30 秒更新) */
  private readonly now = signal(Date.now());
  private ctl: AbortController | null = null;
  private downOnOverlay = false;
  /** 骨架列數(與 listings=10 一致) */
  protected readonly skeleton = Array.from({ length: 10 }, (_, i) => i);
  protected readonly fmtGil = fmtGil;

  constructor() {
    effect(() => {
      const name = this.vm.priceFor();
      untracked(() => (name ? this.load(name, false) : this.stop()));
    });
    effect((onCleanup) => {
      if (this.st().kind !== 'ok') return;
      untracked(() => this.now.set(Date.now()));
      const t = setInterval(() => this.now.set(Date.now()), 30_000);
      onCleanup(() => clearInterval(t));
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private stop(): void {
    this.ctl?.abort();
    this.ctl = null;
  }

  private load(name: string, force: boolean): void {
    this.stop();
    const id = Object.hasOwn(ITEM_IDS, name) ? ITEM_IDS[name] : undefined;
    if (id === undefined) {
      this.st.set({ kind: 'error', error: 'not-found' });
      return;
    }
    const ctl = new AbortController();
    this.ctl = ctl;
    this.st.set({ kind: 'loading' });
    (force ? this.price.refresh(id, ctl.signal) : this.price.get(id, ctl.signal)).then(
      (quote) => {
        if (!ctl.signal.aborted) this.st.set({ kind: 'ok', quote });
      },
      (e: unknown) => {
        if (ctl.signal.aborted || isAbortError(e)) return;
        this.st.set({ kind: 'error', error: e instanceof PriceError ? e.kind : 'network' });
      },
    );
  }

  protected retry(): void {
    const n = this.vm.priceFor();
    if (n) this.load(n, true);
  }
  protected close(): void {
    this.vm.closePrice();
  }
  protected overlayDown(ev: Event): void {
    this.downOnOverlay = ev.target === ev.currentTarget;
  }
  protected overlayClick(ev: Event): void {
    if (this.downOnOverlay && ev.target === ev.currentTarget) this.close();
    this.downOnOverlay = false;
  }

  protected errorText(k: PriceErrorKind): [string, string] {
    return ERROR_TEXT[k];
  }
  protected clock(q: PriceQuote): string {
    return fmtClock(q.fetchedAt);
  }
  protected ago(q: PriceQuote): string {
    return fmtAgo(this.now(), q.lastUploadAt!);
  }
  protected stale(q: PriceQuote): boolean {
    return q.lastUploadAt !== null && isStale(this.now(), q.lastUploadAt);
  }
}
