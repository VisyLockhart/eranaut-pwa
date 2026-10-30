import { Injectable } from '@angular/core';
import { UiScale } from '../core/ui-scale';

/** 容器 → 其中「目前選取」的項目選擇器。新增分段控制只要把它加進這張表,不必改範本 */
const GROUPS: readonly { container: string; item: string }[] = [
  { container: '.up-tabs', item: '.up-tab.active' },
  { container: '.ct-seg', item: 'button.on' },
  { container: '.rt-seg', item: '.rt-seg-btn.active' },
  { container: '.uk-seg', item: 'button.on' },
  { container: '.uf-seg', item: 'button.on' },
  { container: '.qe-rail-h', item: '.qe-rh.on' },
  { container: '.qe-rail-v', item: '.qe-rv.on' },
  { container: '.pill-toggle', item: '.icon-btn.active' },
  { container: '.d-sidebar', item: '.d-nav-item.active, .d-sub-item.active' },
];
const CONTAINERS = GROUPS.map((g) => g.container).join(',');

/** 讀 CSS token(例 `.22s` / `180ms`)換成毫秒 */
function tokenMs(name: string): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (!(n >= 0)) return 0;
  return v.endsWith('ms') ? n : n * 1000;
}

/**
 * 分段控制與桌機側欄的「選取底色滑動」(D-302):選取項目改變時,在容器裡放一塊暫時的底色塊,從舊位置滑到新位置
 * (只動 transform,結束就移除),新選取項目的底色在動畫期間先隱藏。
 * 全站用同一個 MutationObserver,只看 class / aria 屬性、且只處理符合上面清單的元素。
 * 動態效果「精簡」(時長 token ≤ 1ms)、舊位置不存在或不可見、新選取項目沒有實心底色(例如只畫底線的主題)時一律略過,不動畫。
 */
@Injectable({ providedIn: 'root' })
export class SegSlide {
  private readonly last = new WeakMap<Element, Element>();
  private observer: MutationObserver | null = null;

  constructor(private readonly scale: UiScale) {}

  start(): void {
    if (this.observer || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    this.seed();
    this.observer = new MutationObserver((records) => {
      const seen = new Set<Element>();
      for (const r of records) {
        const t = r.target;
        if (t instanceof Element) {
          const box = t.closest(CONTAINERS);
          if (box && !seen.has(box)) {
            seen.add(box);
            this.check(box);
          }
        }
      }
    });
    this.observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-checked', 'aria-pressed', 'aria-selected'] });
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private active(box: Element): Element | null {
    const g = GROUPS.find((x) => box.matches(x.container));
    if (!g) return null;
    return Array.from(box.querySelectorAll(g.item)).find((el) => (el as HTMLElement).offsetParent !== null) ?? null;
  }

  /** 記下目前每個容器的選取項目(之後只有「改變」才動畫,第一次出現不動) */
  private seed(): void {
    document.querySelectorAll(CONTAINERS).forEach((box) => {
      const a = this.active(box);
      if (a) this.last.set(box, a);
    });
  }

  private check(box: Element): void {
    const now = this.active(box);
    if (!now) return;
    const prev = this.last.get(box);
    this.last.set(box, now);
    if (!prev || prev === now || !prev.isConnected) return;
    this.play(box as HTMLElement, prev as HTMLElement, now as HTMLElement);
  }

  private play(box: HTMLElement, from: HTMLElement, to: HTMLElement): void {
    const dur = tokenMs('--mo-dur');
    if (dur <= 1 || typeof Element.prototype.animate !== 'function') return;
    const cs = getComputedStyle(to);
    const bg = cs.backgroundColor;
    if (!bg || bg === 'transparent' || /rgba?\([^)]*,\s*0\)$/.test(bg)) return;
    const a = this.scale.localRect(from);
    const b = this.scale.localRect(to);
    const c = this.scale.localRect(box);
    if (!(b.width > 0 && b.height > 0 && a.width > 0)) return;
    const ghost = document.createElement('span');
    ghost.className = 'seg-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    const scroll = { x: box.scrollLeft, y: box.scrollTop };
    Object.assign(ghost.style, {
      left: `${b.left - c.left + scroll.x}px`,
      top: `${b.top - c.top + scroll.y}px`,
      width: `${b.width}px`,
      height: `${b.height}px`,
      background: bg,
      borderRadius: cs.borderRadius,
    });
    box.classList.add('seg-anim');
    const rel = getComputedStyle(box).position === 'static';
    if (rel) box.classList.add('seg-rel');
    to.classList.add('seg-hide');
    box.prepend(ghost);
    const easing = getComputedStyle(document.documentElement).getPropertyValue('--mo-ease').trim() || 'ease-out';
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    const anim = ghost.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${a.width / b.width}, ${a.height / b.height})` },
        { transform: 'translate(0, 0) scale(1, 1)' },
      ],
      { duration: dur, easing },
    );
    const done = () => {
      ghost.remove();
      to.classList.remove('seg-hide');
      if (!box.querySelector('.seg-ghost')) box.classList.remove('seg-anim', 'seg-rel');
    };
    anim.onfinish = done;
    anim.oncancel = done;
  }
}
