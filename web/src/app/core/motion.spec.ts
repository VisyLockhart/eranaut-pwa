import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOTION_KEY, MotionService } from './motion';

const attr = (): string | undefined => document.documentElement.dataset['motion'];

describe('MotionService(D-302 動態效果)', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    delete document.documentElement.dataset['motion'];
  });
  afterEach(() => vi.unstubAllGlobals());

  it('沒有儲存值且系統沒要求減少動態 → 標準,並寫到根元素', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const m = TestBed.inject(MotionService);
    expect(m.mode()).toBe('standard');
    expect(attr()).toBe('standard');
  });

  it('沒有儲存值但系統要求減少動態 → 精簡', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(TestBed.inject(MotionService).mode()).toBe('reduced');
    expect(attr()).toBe('reduced');
  });

  it('手動選擇優先於系統設定,並存起來', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const m = TestBed.inject(MotionService);
    m.set('standard');
    expect(attr()).toBe('standard');
    expect(JSON.parse(localStorage.getItem(MOTION_KEY)!)).toBe('standard');
    TestBed.resetTestingModule();
    expect(TestBed.inject(MotionService).mode()).toBe('standard');
  });

  it('儲存值不合法時退回系統預設', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    localStorage.setItem(MOTION_KEY, JSON.stringify('wild'));
    expect(TestBed.inject(MotionService).mode()).toBe('standard');
  });
});
