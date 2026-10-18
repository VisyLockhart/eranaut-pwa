import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';

/** 全站共用的提示泡泡(單一 DOM 節點,樣式在 styles.scss 的 .tip-bubble,各主題用 token 改外觀) */
let bubble: HTMLElement | null = null;
let owner: HTMLElement | null = null;

function ensureBubble(doc: Document): HTMLElement {
  if (!bubble || !bubble.isConnected) {
    bubble = doc.createElement('div');
    bubble.className = 'tip-bubble';
    bubble.id = 'tip-bubble';
    bubble.setAttribute('role', 'tooltip');
    doc.body.appendChild(bubble);
  }
  return bubble;
}

function hideTip(): void {
  if (bubble) bubble.classList.remove('show');
  if (owner) owner.removeAttribute('aria-describedby');
  owner = null;
}

/**
 * 自製提示(取代瀏覽器內建的 `title` 提示,後者無法套用主題)。
 * 滑鼠停留或鍵盤聚焦時顯示;觸控不顯示(沿用 title 的行為)。空字串或 null 代表不顯示。
 * 元素沒有文字也沒有 aria-label 時,會用提示文字當作無障礙名稱。
 */
@Directive({
  selector: '[tip]',
  host: {
    '(pointerenter)': 'onEnter($event)',
    '(pointerleave)': 'hide()',
    '(focus)': 'onFocus()',
    '(blur)': 'hide()',
    '(keydown.escape)': 'hide()',
    '(click)': 'hide()',
  },
})
export class Tip implements OnDestroy {
  readonly tip = input<string | null | undefined>('');
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly doc = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const text = this.tip();
      if (text) this.el.setAttribute('data-tip', text);
      else this.el.removeAttribute('data-tip');
      if (text && !this.el.getAttribute('aria-label') && !this.el.textContent?.trim()) {
        this.el.setAttribute('aria-label', text);
      }
      if (owner === this.el && bubble) {
        if (text) bubble.textContent = text;
        else hideTip();
      }
    });
  }

  onEnter(ev: PointerEvent): void {
    if (ev.pointerType === 'touch') return;
    this.show();
  }

  onFocus(): void {
    // 只在鍵盤操作時顯示,避免點擊後殘留
    if (this.el.matches(':focus-visible')) this.show();
  }

  hide(): void {
    if (owner === this.el) hideTip();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private show(): void {
    const text = this.tip();
    if (!text) return;
    hideTip();
    const b = ensureBubble(this.doc);
    b.textContent = text;
    b.id = `tip-bubble`;
    this.el.setAttribute('aria-describedby', b.id);
    owner = this.el;
    b.style.left = '0px';
    b.style.top = '0px';
    b.classList.add('show');
    const win = this.doc.defaultView;
    const vw = win?.innerWidth ?? 1024;
    const r = this.el.getBoundingClientRect();
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    const gap = 8;
    let top = r.top - h - gap;
    b.dataset['side'] = 'top';
    if (top < 4) {
      top = r.bottom + gap;
      b.dataset['side'] = 'bottom';
    }
    const left = Math.min(Math.max(4, r.left + r.width / 2 - w / 2), Math.max(4, vw - w - 4));
    b.style.left = `${Math.round(left)}px`;
    b.style.top = `${Math.round(top)}px`;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', hideTip, { capture: true, passive: true });
  window.addEventListener('resize', hideTip);
}
