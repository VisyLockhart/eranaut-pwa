import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SegSlide } from './seg-slide';

/** jsdom 沒有版面與 Web Animations;這裡只驗證「什麼時候放底色塊、什麼時候略過」 */
describe('SegSlide(D-302 選取底色滑動)', () => {
  let box: HTMLElement;
  let a: HTMLButtonElement;
  let b: HTMLButtonElement;
  const flush = () => new Promise<void>((r) => setTimeout(r, 0));

  beforeEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.style.setProperty('--mo-dur', '.2s');
    document.body.innerHTML = '<div class="ct-seg"><button class="on">A</button><button>B</button></div>';
    box = document.querySelector('.ct-seg')!;
    [a, b] = Array.from(box.querySelectorAll('button')) as HTMLButtonElement[];
    for (const el of [a, b]) {
      Object.defineProperty(el, 'offsetParent', { get: () => box });
      el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 40, bottom: 20, width: 40, height: 20, x: 0, y: 0, toJSON: () => ({}) });
    }
    box.getBoundingClientRect = () => ({ left: 0, top: 0, right: 80, bottom: 20, width: 80, height: 20, x: 0, y: 0, toJSON: () => ({}) });
  });
  afterEach(() => {
    document.documentElement.style.removeProperty('--mo-dur');
    document.body.innerHTML = '';
    delete (Element.prototype as unknown as { animate?: unknown }).animate;
  });

  it('選取項目改變且有實心底色 → 放進底色塊並暫時隱藏新項目的底色', async () => {
    const anim = { onfinish: null as null | (() => void), oncancel: null as null | (() => void) };
    (Element.prototype as unknown as { animate: unknown }).animate = vi.fn(() => anim);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) =>
      ({ backgroundColor: 'rgb(10, 108, 200)', borderRadius: '4px', position: 'static', getPropertyValue: (n: string) => (el === document.documentElement ? (n === '--mo-dur' ? '.2s' : '') : '') }) as unknown as CSSStyleDeclaration);
    const s = TestBed.inject(SegSlide);
    s.start();
    a.classList.remove('on');
    b.classList.add('on');
    await flush();
    expect(box.querySelector('.seg-ghost')).not.toBeNull();
    expect(b.classList.contains('seg-hide')).toBe(true);
    anim.onfinish?.();
    expect(box.querySelector('.seg-ghost')).toBeNull();
    expect(b.classList.contains('seg-hide')).toBe(false);
    expect(box.classList.contains('seg-anim')).toBe(false);
    s.stop();
    vi.restoreAllMocks();
  });

  it('動態效果精簡(時長 token 為 0)→ 不放底色塊', async () => {
    document.documentElement.style.setProperty('--mo-dur', '0.01ms');
    (Element.prototype as unknown as { animate: unknown }).animate = vi.fn();
    const s = TestBed.inject(SegSlide);
    s.start();
    a.classList.remove('on');
    b.classList.add('on');
    await flush();
    expect(box.querySelector('.seg-ghost')).toBeNull();
    s.stop();
  });

  it('第一次出現(沒有舊位置)不動畫', async () => {
    box.innerHTML = '<button>A</button><button>B</button>';
    (Element.prototype as unknown as { animate: unknown }).animate = vi.fn();
    const s = TestBed.inject(SegSlide);
    s.start();
    (box.children[0] as HTMLElement).classList.add('on');
    await flush();
    expect(box.querySelector('.seg-ghost')).toBeNull();
    s.stop();
  });
});
