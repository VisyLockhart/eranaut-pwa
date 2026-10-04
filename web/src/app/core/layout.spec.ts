import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESKTOP_MIN_WIDTH, Layout, SIDEBAR_KEY } from './layout';
import { UiScale } from './ui-scale';

interface FakeMq {
  query: string;
  matches: boolean;
  listeners: Set<(e: { matches: boolean }) => void>;
  addEventListener: (type: string, fn: (e: { matches: boolean }) => void) => void;
  removeEventListener: (type: string, fn: (e: { matches: boolean }) => void) => void;
}

describe('Layout 斷點(D-95、D-164)', () => {
  let queries: FakeMq[];
  let viewport: number;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    queries = [];
    viewport = 1000;
    vi.stubGlobal('matchMedia', (query: string): FakeMq => {
      const min = Number(/min-width: ([\d.]+)px/.exec(query)?.[1]);
      const mq: FakeMq = {
        query,
        matches: viewport >= min,
        listeners: new Set(),
        addEventListener: (_t, fn) => mq.listeners.add(fn),
        removeEventListener: (_t, fn) => mq.listeners.delete(fn),
      };
      queries.push(mq);
      return mq;
    });
    // 讓 zoom 被視為支援,座標模式不是這裡要測的重點(探針回報螢幕像素)
    vi.stubGlobal('CSS', { supports: () => true });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const f = Number(document.documentElement.style.getPropertyValue('--ui-scale')) || 1;
      return { width: 100 * f, height: 100 * f, left: 0, top: 0, right: 100 * f, bottom: 100 * f } as DOMRect;
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('小:門檻 768px,和原本一樣', () => {
    const layout = TestBed.inject(Layout);
    expect(queries[0].query).toBe(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
    expect(layout.isDesktop()).toBe(true);
  });

  it('放大時門檻乘上倍率:視窗不夠寬就切成手機版面,縮回小再切回桌機', () => {
    viewport = 900;
    const layout = TestBed.inject(Layout);
    const scale = TestBed.inject(UiScale);
    expect(layout.isDesktop()).toBe(true); // 900 ≥ 768

    scale.set('large'); // 768 × 1.3 = 998.4 > 900
    TestBed.tick();
    expect(queries.at(-1)?.query).toBe(`(min-width: ${DESKTOP_MIN_WIDTH * 1.3}px)`);
    expect(layout.isDesktop()).toBe(false);

    scale.set('small');
    TestBed.tick();
    expect(layout.isDesktop()).toBe(true);
  });

  it('重建查詢時移除舊的監聽,舊查詢的事件不再影響結果', () => {
    const layout = TestBed.inject(Layout);
    const scale = TestBed.inject(UiScale);
    TestBed.tick();
    const first = queries[0];
    scale.set('medium');
    TestBed.tick();
    expect(first.listeners.size).toBe(0);
    first.listeners.forEach((fn) => fn({ matches: false }));
    expect(layout.isDesktop()).toBe(true);
  });

  it('視窗跨過門檻時(查詢事件)即時切換', () => {
    const layout = TestBed.inject(Layout);
    TestBed.tick();
    const mq = queries.at(-1)!;
    mq.listeners.forEach((fn) => fn({ matches: false }));
    expect(layout.isDesktop()).toBe(false);
    mq.listeners.forEach((fn) => fn({ matches: true }));
    expect(layout.isDesktop()).toBe(true);
  });
});

describe('Layout 側欄收合(D-166)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('預設展開;切換後存 localStorage,重建後保留,再切換回展開', () => {
    const layout = TestBed.inject(Layout);
    expect(layout.sidebarCollapsed()).toBe(false);
    layout.toggleSidebar();
    expect(layout.sidebarCollapsed()).toBe(true);
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('true');
    TestBed.resetTestingModule();
    const again = TestBed.inject(Layout);
    expect(again.sidebarCollapsed()).toBe(true);
    again.toggleSidebar();
    expect(again.sidebarCollapsed()).toBe(false);
    expect(localStorage.getItem(SIDEBAR_KEY)).toBe('false');
  });
});
