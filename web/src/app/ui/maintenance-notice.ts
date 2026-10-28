import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { Maintenance } from '../core/maintenance';
import { IconComponent } from './icon';
import { Tip } from './tip';

/**
 * 伺服器維護橫幅(D-283)。同一份狀態、同一組樣式 token(色彩全部來自主題變數,不為各主題另外設計),三種版型:
 * - `card`:桌機側欄展開,放在導覽與使用者卡片之間
 * - `icon`:桌機側欄收合,只有警示圖示;滑鼠移過去出提示、點擊開詳細視窗
 * - `line`:手機,取代底部聲明那一行(維護結束後聲明恢復)
 * 慢閃只動邊框光暈與圖示(`prefers-reduced-motion` 時靜態);文字不動、保持實心。
 */
@Component({
  selector: 'app-maintenance-notice',
  imports: [IconComponent, Tip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    @let v = m.view();
    @if (v) {
      @switch (variant()) {
        @case ('icon') {
          <button type="button" class="mn mn-icon-btn" [attr.data-phase]="v.phase" [tip]="v.label" [attr.aria-label]="v.label" (click)="show()">
            <span class="mn-icon"><app-icon name="warning" [size]="20" /></span>
          </button>
        }
        @case ('line') {
          <button type="button" class="mn mn-line" [attr.data-phase]="v.phase" [attr.aria-label]="v.label + '(' + v.status + ')'" (click)="show()">
            <span class="mn-icon"><app-icon name="warning" [size]="13" /></span>
            <span class="mn-line-text">{{ v.label }}</span>
          </button>
        }
        @default {
          <button type="button" class="mn mn-card" [attr.data-phase]="v.phase" [attr.aria-label]="v.label + '(' + v.status + ')'" (click)="show()">
            <span class="mn-icon"><app-icon name="warning" [size]="20" /></span>
            <span class="mn-text">
              <span class="mn-label">伺服器維護</span>
              <span class="mn-range">{{ v.range }}</span>
              <span class="mn-sub">{{ v.status }}</span>
            </span>
          </button>
        }
      }
      @if (open()) {
        <!-- 原生 <dialog>(最上層):視窗放在側欄裡時,側欄自成一層(sticky),後面的內容會畫到視窗上面,所以不用 position: fixed 的遮罩 -->
        <dialog #dlg class="mn-dialog" aria-label="伺服器維護" (click)="onDialogClick($event)" (cancel)="close()" (close)="close()">
          <div class="modal-box mn-modal">
            <div class="mn-modal-head">
              <span class="mn-icon"><app-icon name="warning" [size]="20" /></span>
              <div class="modal-title">伺服器維護</div>
              <button type="button" class="modal-close" (click)="close()" aria-label="關閉"><app-icon name="close" [size]="14" /></button>
            </div>
            <div class="mn-modal-range">{{ v.range }}</div>
            <div class="mn-modal-note">台北時間 · {{ v.status }}</div>
            <div class="mn-modal-text">維護期間遊戲伺服器無法登入,請提早下線;官方開機後這則提示會自動消失。</div>
            @if (link(); as href) {
              <a class="mn-modal-link" [href]="href" target="_blank" rel="noopener noreferrer">查看官方公告</a>
            }
          </div>
        </dialog>
      }
    }
  `,
})
export class MaintenanceNotice {
  readonly variant = input<'card' | 'icon' | 'line'>('card');
  protected readonly m = inject(Maintenance);
  protected readonly open = signal(false);
  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    // 對話框一出現就以 showModal() 開成最上層(jsdom 等沒有這個方法的環境退回成 open 屬性)
    effect(() => {
      const el = this.dlg()?.nativeElement;
      if (!el || el.open) return;
      if (typeof el.showModal === 'function') el.showModal();
      else el.setAttribute('open', '');
    });
  }

  /** 連結只在確定是官網網址時才輸出(API 已檢查過,這裡再擋一次) */
  protected readonly link = computed(() => {
    const url = this.m.view()?.url ?? '';
    return url.startsWith('https://www.ffxiv.com.tw/') ? url : null;
  });

  protected show(): void {
    this.open.set(true);
  }

  protected close(): void {
    if (this.open()) this.open.set(false);
  }

  /** 點在對話框本身(框外的透明區域)= 點背景,關閉;點到內容框不關 */
  protected onDialogClick(ev: Event): void {
    if (ev.target === ev.currentTarget) this.close();
  }
}
