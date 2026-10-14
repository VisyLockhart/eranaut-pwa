import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AppUpdate } from '../core/app-update';
import { UpdateBanner } from './update-banner';

describe('UpdateBanner', () => {
  function mount() {
    TestBed.resetTestingModule();
    const up = TestBed.inject(AppUpdate);
    const f = TestBed.createComponent(UpdateBanner);
    f.detectChanges();
    return { up, f, el: f.nativeElement as HTMLElement };
  }

  it('平常不顯示', () => {
    expect(mount().el.querySelector('.update-banner')).toBeNull();
  });

  it('有新版:顯示「立即更新」;同時異常時以新版為主', () => {
    const { up, f, el } = mount();
    up.broken.set(true);
    up.ready.set(true);
    f.detectChanges();
    expect(el.textContent).toContain('已有新版本');
    expect(el.textContent).not.toContain('更新機制異常');
  });

  it('service worker 沒回應:顯示「更新機制異常」與「稍後 / 修復」,「稍後」收起', () => {
    const { up, f, el } = mount();
    up.broken.set(true);
    f.detectChanges();
    expect(el.textContent).toContain('更新機制異常');
    expect([...el.querySelectorAll('button')].map((b) => b.textContent!.trim())).toEqual(['稍後', '修復']);
    el.querySelector<HTMLButtonElement>('.ghost-btn')!.click();
    f.detectChanges();
    expect(el.querySelector('.update-banner')).toBeNull();
  });
});
