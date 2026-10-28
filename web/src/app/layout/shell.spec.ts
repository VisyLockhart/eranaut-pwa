import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AppUpdate } from '../core/app-update';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
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
  it('手機底部 4 項:總覽/更新/航線/製作(工坊管理已搬進總覽,D-294),不再有「我的」', () => {
    const { el } = mount(false);
    const labels = [...el.querySelectorAll('.m-nav .nav-item')].map((a) => a.textContent!.trim());
    expect(labels).toEqual(['總覽', '更新', '航線', '製作']);
    expect(el.querySelector('.m-nav .nav-item:nth-child(2)')!.classList.contains('nav-upload')).toBe(true);
    expect(el.querySelector('.m-nav a[href="/craft"]')).toBeTruthy();
  });

  it('桌機側欄:總覽、航線模擬、配件製作、設定(工坊管理與更新潛艇的入口都在總覽,D-294)', () => {
    const { el } = mount(true);
    const hrefs = [...el.querySelectorAll('a.d-nav-item')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/route', '/craft', '/settings']);
  });

  it('桌機側欄結構(D-268):內容在可捲動的 .d-side-scroll 內,收合把手在它外面(不被裁掉);收合 / 展開照常', () => {
    const { f, el } = mount(true);
    const side = el.querySelector('.d-sidebar')!;
    const scroll = side.querySelector('.d-side-scroll')!;
    expect(scroll.querySelector('.d-brand')).toBeTruthy();
    expect(scroll.querySelectorAll('a.d-nav-item')).toHaveLength(4);
    expect(scroll.querySelector('.d-user')).toBeTruthy();
    const handle = side.querySelector('.d-collapse-handle')!;
    expect(handle.parentElement).toBe(side);
    expect(scroll.contains(handle)).toBe(false);
    (handle as HTMLButtonElement).click();
    f.detectChanges();
    expect(side.classList.contains('collapsed')).toBe(true);
    (handle as HTMLButtonElement).click();
    f.detectChanges();
    expect(side.classList.contains('collapsed')).toBe(false);
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

  describe('伺服器維護橫幅(D-283)', () => {
    const START = Date.UTC(2026, 8, 29, 5, 0);
    const info = {
      id: 'MAINT00001',
      title: '09/29 維護更新作業',
      url: 'https://www.ffxiv.com.tw/web/news/news_content.aspx?id=MAINT00001',
      start_at: new Date(START).toISOString(),
      end_at: new Date(START + 5 * 3_600_000).toISOString(),
    };
    function withMaintenance(desktop: boolean) {
      const m = mount(desktop);
      TestBed.inject(DataStore).now.set(START - 3_600_000);
      TestBed.inject(DataStore).maintenance.set(info);
      m.f.detectChanges();
      return m;
    }

    it('沒有維護:手機底部仍是聲明,不出現橫幅', () => {
      const { el } = mount(false);
      expect(el.querySelector('.copyright-bar')).toBeTruthy();
      expect(el.querySelector('.mn')).toBeNull();
    });

    it('手機:橫幅暫時取代底部聲明;維護結束(已開機)後聲明恢復', () => {
      const { f, el } = withMaintenance(false);
      expect(el.querySelector('.mn-line')).toBeTruthy();
      expect(el.querySelector('.copyright-bar')).toBeNull();
      TestBed.inject(DataStore).maintenance.set(null);
      f.detectChanges();
      expect(el.querySelector('.mn-line')).toBeNull();
      expect(el.querySelector('.copyright-bar')).toBeTruthy();
    });

    it('桌機側欄展開 = 卡片;收合 = 圖示', () => {
      const { f, el } = withMaintenance(true);
      TestBed.inject(Layout).sidebarCollapsed.set(false);
      f.detectChanges();
      expect(el.querySelector('.d-sidebar .mn-card')).toBeTruthy();
      expect(el.querySelector('.d-sidebar .mn-icon-btn')).toBeNull();
      TestBed.inject(Layout).sidebarCollapsed.set(true);
      f.detectChanges();
      expect(el.querySelector('.d-sidebar .mn-icon-btn')).toBeTruthy();
      expect(el.querySelector('.d-sidebar .mn-card')).toBeNull();
    });
  });
});
