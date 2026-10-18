import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_KEY, ThemeService, resolveInitialTheme } from './theme';

describe('resolveInitialTheme(D-277)', () => {
  it('已存的主題優先,不管有沒有其他設定或系統配色', () => {
    expect(resolveInitialTheme('light', true, false)).toBe('light');
    expect(resolveInitialTheme('dark', false, true)).toBe('dark');
    expect(resolveInitialTheme('classic', false, true)).toBe('classic');
  });
  it('沒存過但已有其他設定(既有使用者升級)→ 經典', () => {
    expect(resolveInitialTheme(null, true, true)).toBe('classic');
    expect(resolveInitialTheme(null, true, false)).toBe('classic');
  });
  it('全新使用者依系統配色:淺色系統 → 淺色,其他 → 深色', () => {
    expect(resolveInitialTheme(null, false, true)).toBe('light');
    expect(resolveInitialTheme(null, false, false)).toBe('dark');
  });
  it('存的值不合法時當作沒存過', () => {
    expect(resolveInitialTheme('neon', false, true)).toBe('light');
    expect(resolveInitialTheme(42, true, false)).toBe('classic');
  });
});

describe('ThemeService(D-277)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = '<meta name="theme-color" content="#000000">';
  });
  afterEach(() => vi.unstubAllGlobals());

  const mockSystem = (light: boolean) =>
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('light') ? light : !light, media: q, addEventListener() {}, removeEventListener() {} }));

  it('全新使用者:依系統配色決定,並寫入根元素與存起來', () => {
    mockSystem(true);
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(JSON.parse(localStorage.getItem(THEME_KEY) ?? '')).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#eef4fc');
  });

  it('既有使用者(有別的 eranaut. 設定)沒存過主題 → 經典', () => {
    mockSystem(true);
    localStorage.setItem('eranaut.ui-scale', JSON.stringify('large'));
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('classic');
    expect(document.documentElement.getAttribute('data-theme')).toBe('classic');
  });

  it('切換立即套用、存起來、更新 theme-color,並在切換期間暫停動畫', async () => {
    mockSystem(false);
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('dark');
    s.set('classic');
    expect(document.documentElement.getAttribute('data-theme')).toBe('classic');
    expect(JSON.parse(localStorage.getItem(THEME_KEY) ?? '')).toBe('classic');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#070a14');
    expect(document.documentElement.classList.contains('theme-switching')).toBe(true);
    await new Promise((r) => setTimeout(r, 80));
    expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
  });

  it('下次開啟沿用手動選的主題,不再看系統配色', () => {
    mockSystem(true);
    localStorage.setItem(THEME_KEY, JSON.stringify('dark'));
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });
});
