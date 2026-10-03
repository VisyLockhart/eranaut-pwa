import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UI_SCALE_KEY, UiScale } from './ui-scale';

const cssVar = (): string => document.documentElement.style.getPropertyValue('--ui-scale');

describe('UiScale(D-164)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.style.removeProperty('--ui-scale');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('預設是小(1 倍),並把倍率寫到根元素', () => {
    const s = TestBed.inject(UiScale);
    expect(s.size()).toBe('small');
    expect(s.factor()).toBe(1);
    expect(cssVar()).toBe('1');
  });

  it('同時寫出 --vu-div(vh / safe-area 的除數);小一定是 1', () => {
    const s = TestBed.inject(UiScale);
    expect(document.documentElement.style.getPropertyValue('--vu-div')).toBe('1');
    s.set('large');
    expect(['1', '1.3']).toContain(document.documentElement.style.getPropertyValue('--vu-div'));
  });

  it('讀取儲存的偏好;值不合法或讀不到一律當小', () => {
    localStorage.setItem(UI_SCALE_KEY, JSON.stringify('large'));
    expect(TestBed.inject(UiScale).size()).toBe('large');
    TestBed.resetTestingModule();
    localStorage.setItem(UI_SCALE_KEY, JSON.stringify('huge'));
    expect(TestBed.inject(UiScale).size()).toBe('small');
    TestBed.resetTestingModule();
    localStorage.setItem(UI_SCALE_KEY, '{壞掉');
    expect(TestBed.inject(UiScale).size()).toBe('small');
  });

  it('切換立即套用並存起來:中 1.15、大 1.3、回到小 1', () => {
    const s = TestBed.inject(UiScale);
    s.set('medium');
    expect(s.factor()).toBe(1.15);
    expect(cssVar()).toBe('1.15');
    expect(JSON.parse(localStorage.getItem(UI_SCALE_KEY) ?? '')).toBe('medium');
    s.set('large');
    expect(cssVar()).toBe('1.3');
    s.set('small');
    expect(cssVar()).toBe('1');
    expect(JSON.parse(localStorage.getItem(UI_SCALE_KEY) ?? '')).toBe('small');
  });

  it('小:座標換算是原值(不探測、不改動)', () => {
    const s = TestBed.inject(UiScale);
    const el = document.createElement('div');
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 } as DOMRect);
    expect(s.localRect(el)).toEqual({ left: 10, top: 20, right: 110, bottom: 60, width: 100, height: 40 });
    expect(s.effective()).toBe(1);
  });

  describe('放大時的座標(固定定位的浮動面板用)', () => {
    function setup(probeWidth: number): UiScale {
      vi.stubGlobal('CSS', { supports: () => true });
      const original = Element.prototype.getBoundingClientRect;
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        // 探針是 100px 的方塊;其餘元素交給測試用的固定值
        if ((this as HTMLElement).style?.width === '100px') return { width: probeWidth, height: probeWidth, left: 0, top: 0, right: probeWidth, bottom: probeWidth } as DOMRect;
        return original.call(this);
      });
      const s = TestBed.inject(UiScale);
      s.set('medium');
      return s;
    }

    it('新版瀏覽器回報螢幕像素:位置除以倍率', () => {
      const s = setup(115);
      const el = document.createElement('div');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ left: 115, top: 230, right: 230, bottom: 345, width: 115, height: 115 } as DOMRect);
      expect(s.effective()).toBe(1.15);
      const r = s.localRect(el);
      expect(r.left).toBeCloseTo(100);
      expect(r.top).toBeCloseTo(200);
      expect(r.width).toBeCloseTo(100);
    });

    it('舊版 WebKit 回報元素本地座標:位置不必再除', () => {
      const s = setup(100);
      const el = document.createElement('div');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 200, right: 200, bottom: 300, width: 100, height: 100 } as DOMRect);
      const r = s.localRect(el);
      expect([r.left, r.top, r.width]).toEqual([100, 200, 100]);
    });

    it('視窗大小一律換算成 zoom 後的 CSS 像素', () => {
      const s = setup(115);
      expect(s.localViewport().width).toBeCloseTo(window.innerWidth / 1.15);
      expect(s.localViewport().height).toBeCloseTo(window.innerHeight / 1.15);
    });

    it('瀏覽器不支援 zoom:實際倍率是 1,什麼都不換算', () => {
      vi.stubGlobal('CSS', { supports: () => false });
      const s = TestBed.inject(UiScale);
      s.set('large');
      expect(s.effective()).toBe(1);
      expect(s.localViewport().width).toBe(window.innerWidth);
    });
  });
});
