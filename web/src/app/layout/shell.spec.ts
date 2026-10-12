import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AppUpdate } from '../core/app-update';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { Shell } from './shell';

function mount(desktop: boolean, swEnabled = false) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), ...(swEnabled ? [{ provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: new Subject(), unrecoverable: new Subject() } }] : [])],
  });
  TestBed.inject(Auth).status.set('authenticated');
  TestBed.inject(Layout).isDesktop.set(desktop);
  const f = TestBed.createComponent(Shell);
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement };
}

describe('Shell 導覽', () => {
  it('手機底部 5 項:總覽/工坊/更新/航線/製作,不再有「我的」', () => {
    const { el } = mount(false);
    const labels = [...el.querySelectorAll('.m-nav .nav-item')].map((a) => a.textContent!.trim());
    expect(labels).toEqual(['總覽', '工坊', '更新', '航線', '製作']);
    expect(el.querySelector('.m-nav .nav-item:nth-child(3)')!.classList.contains('nav-upload')).toBe(true);
    expect(el.querySelector('.m-nav a[href="/craft"]')).toBeTruthy();
  });

  it('桌機側欄:配件製作在航線模擬之後、設定之前', () => {
    const { el } = mount(true);
    const hrefs = [...el.querySelectorAll('a.d-nav-item')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/workshops', '/update', '/route', '/craft', '/settings']);
  });

  it('頭像按鈕開啟選單(設定 / 登出),Esc 與點外面可關閉', () => {
    const { f, el } = mount(false);
    const btn = el.querySelector<HTMLButtonElement>('.m-avatar-btn')!;
    expect(el.querySelector('.m-user-menu')).toBeNull();
    btn.click();
    f.detectChanges();
    const items = [...el.querySelectorAll('.m-user-menu .m-user-item')].map((x) => x.textContent!.trim());
    expect(items).toEqual(['設定', '登出']);
    expect(btn.classList.contains('on')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(el.querySelector('.m-user-menu')).toBeNull();
    btn.click();
    f.detectChanges();
    document.body.click();
    f.detectChanges();
    expect(el.querySelector('.m-user-menu')).toBeNull();
  });

  it('有更新機制時,選單在設定與登出之間多一項「檢查更新」;檢查中選單保持開啟,結果出來後收起', async () => {
    const { f, el } = mount(false, true);
    let done!: (v: 'latest') => void;
    const spy = vi.spyOn(TestBed.inject(AppUpdate), 'checkAndNotify').mockImplementation(() => new Promise((r) => (done = r as never)));
    el.querySelector<HTMLButtonElement>('.m-avatar-btn')!.click();
    f.detectChanges();
    const items = [...el.querySelectorAll('.m-user-menu .m-user-item')].map((x) => x.textContent!.trim());
    expect(items).toEqual(['設定', '檢查更新', '登出']);
    el.querySelectorAll<HTMLButtonElement>('.m-user-menu button.m-user-item')[0]!.click();
    f.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.m-user-menu')).toBeTruthy();
    done('latest');
    await Promise.resolve();
    await Promise.resolve();
    f.detectChanges();
    expect(el.querySelector('.m-user-menu')).toBeNull();
  });

  it('選單的登出會呼叫 logout 並關閉選單', () => {
    const { f, el } = mount(false);
    const spy = vi.spyOn(TestBed.inject(Auth), 'logout').mockImplementation(() => undefined as never);
    el.querySelector<HTMLButtonElement>('.m-avatar-btn')!.click();
    f.detectChanges();
    el.querySelector<HTMLButtonElement>('.m-user-item.danger')!.click();
    f.detectChanges();
    expect(spy).toHaveBeenCalled();
    expect(el.querySelector('.m-user-menu')).toBeNull();
  });
});
