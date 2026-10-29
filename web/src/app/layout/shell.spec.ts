import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Router, provideRouter } from '@angular/router';
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
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', children: [] }]), ...(swEnabled ? [{ provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: new Subject(), unrecoverable: new Subject() } }] : [])],
  });
  TestBed.inject(Auth).status.set('authenticated');
  TestBed.inject(Layout).isDesktop.set(desktop);
  const f = TestBed.createComponent(Shell);
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement };
}

describe('Shell 導覽', () => {
  it('手機底部 5 格:工坊/配件/更新/航線/設定,更新在正中央(D-295);設定回到底部列', () => {
    const { el } = mount(false);
    const labels = [...el.querySelectorAll('.m-nav .nav-item')].map((a) => a.textContent!.trim());
    expect(labels).toEqual(['工坊', '配件', '更新', '航線', '設定']);
    expect(el.querySelector('.m-nav .nav-item:nth-child(3)')!.classList.contains('nav-upload')).toBe(true);
    expect(el.querySelector('.m-nav a[href="/settings"]')).toBeTruthy();
    expect(el.querySelector('.m-nav a[href="/route"]')).toBeTruthy();
  });

  it('手機:點「更新」「配件」只開面板、不跳頁;面板有兩顆大按鈕;暗幕、再點一次、Esc、換頁都會收起(D-295)', async () => {
    const { f, el } = mount(false);
    const router = TestBed.inject(Router);
    const nav = () => [...el.querySelectorAll<HTMLButtonElement>('.m-nav button.nav-group')];
    expect(el.querySelector('.m-subsheet')).toBeNull();
    nav()[0]!.click();
    f.detectChanges();
    expect(router.url).toBe('/');
    expect([...el.querySelectorAll('.m-subsheet a')].map((a) => a.getAttribute('href'))).toEqual(['/gear', '/craft']);
    expect([...el.querySelectorAll('.m-subsheet a')].map((a) => a.textContent!.trim())).toEqual(['清單', '製作']);
    expect(nav()[0]!.getAttribute('aria-expanded')).toBe('true');
    // 再點同一格收起
    nav()[0]!.click();
    f.detectChanges();
    expect(el.querySelector('.m-subsheet')).toBeNull();
    // 換開「更新」
    nav()[1]!.click();
    f.detectChanges();
    expect([...el.querySelectorAll('.m-subsheet a')].map((a) => a.getAttribute('href'))).toEqual(['/update', '/charts']);
    // 暗幕收起
    el.querySelector<HTMLElement>('.m-scrim')!.click();
    f.detectChanges();
    expect(el.querySelector('.m-subsheet')).toBeNull();
    // Esc 收起
    nav()[0]!.click();
    f.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(el.querySelector('.m-subsheet')).toBeNull();
    // 選子項 → 前往並收起
    nav()[1]!.click();
    f.detectChanges();
    el.querySelector<HTMLAnchorElement>('.m-subsheet a[href="/charts"]')!.click();
    await new Promise((r) => setTimeout(r));
    f.detectChanges();
    expect(router.url).toBe('/charts');
    expect(el.querySelector('.m-subsheet')).toBeNull();
    expect(nav()[1]!.classList.contains('active')).toBe(true);
  });

  it('桌機側欄:工坊、配件▾、更新▾、航線、設定(D-295);沒有「更新潛艇」「工坊管理」入口', () => {
    const { el } = mount(true);
    const items = [...el.querySelectorAll('.d-side-scroll .d-nav-item')].map((a) => a.textContent!.trim());
    expect(items).toEqual(['工坊', '配件', '更新', '航線', '設定']);
    const hrefs = [...el.querySelectorAll('a.d-nav-item')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/route', '/settings']);
    expect(el.querySelectorAll('button.d-group')).toHaveLength(2);
    expect(el.querySelector('.d-subs')).toBeNull();
  });

  it('桌機:點「配件」展開 清單/製作(不跳頁);再點收起;開另一個群組時前一個收起;點側欄外收起(D-295)', () => {
    const { f, el } = mount(true);
    const router = TestBed.inject(Router);
    const [gear, update] = [...el.querySelectorAll<HTMLButtonElement>('button.d-group')];
    gear!.click();
    f.detectChanges();
    expect(router.url).toBe('/');
    expect([...el.querySelectorAll('.d-subs a')].map((a) => a.getAttribute('href'))).toEqual(['/gear', '/craft']);
    expect(gear!.getAttribute('aria-expanded')).toBe('true');
    gear!.click();
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
    gear!.click();
    update!.click();
    f.detectChanges();
    expect([...el.querySelectorAll('.d-subs a')].map((a) => a.getAttribute('href'))).toEqual(['/update', '/charts']);
    expect(el.querySelectorAll('.d-subs')).toHaveLength(1);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
    // 點側欄內不收起
    update!.click();
    f.detectChanges();
    el.querySelector('.d-brand')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
  });

  it('桌機:目前頁面所在的群組自動展開、子項高亮、父層弱強調;點側欄外不收起,自己點父層才收起,換頁後恢復(D-295)', async () => {
    const { f, el } = mount(true);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/charts');
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    const update = el.querySelectorAll<HTMLButtonElement>('button.d-group')[1]!;
    expect(update.classList.contains('par')).toBe(true);
    expect(el.querySelector('.d-subs a.active')?.getAttribute('href')).toBe('/charts');
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.d-subs a.active')).toBeTruthy();
    update.click();
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
    await router.navigateByUrl('/update');
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(el.querySelector('.d-subs a.active')?.getAttribute('href')).toBe('/update');
  });

  it('桌機收合成圖示列:點圖示後兩字子項排在圖示下方,點別處收起(D-295)', () => {
    const { f, el } = mount(true);
    TestBed.inject(Layout).sidebarCollapsed.set(true);
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
    el.querySelector<HTMLButtonElement>('button.d-group')!.click();
    f.detectChanges();
    expect([...el.querySelectorAll('.d-subs a')].map((a) => a.textContent!.trim())).toEqual(['清單', '製作']);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(el.querySelector('.d-subs')).toBeNull();
  });

  it('桌機側欄結構(D-268):內容在可捲動的 .d-side-scroll 內,收合把手在它外面(不被裁掉);收合 / 展開照常', () => {
    const { f, el } = mount(true);
    const side = el.querySelector('.d-sidebar')!;
    const scroll = side.querySelector('.d-side-scroll')!;
    expect(scroll.querySelector('.d-brand')).toBeTruthy();
    expect(scroll.querySelectorAll('a.d-nav-item')).toHaveLength(3);
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

  it('頭像按鈕開啟選單(只剩登出;設定已回到底部列,D-295),Esc 與點外面可關閉', () => {
    const { f, el } = mount(false);
    const btn = el.querySelector<HTMLButtonElement>('.m-avatar-btn')!;
    expect(el.querySelector('.m-user-menu')).toBeNull();
    btn.click();
    f.detectChanges();
    const items = [...el.querySelectorAll('.m-user-menu .m-user-item')].map((x) => x.textContent!.trim());
    expect(items).toEqual(['登出']);
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

  it('有更新機制時,選單在登出之前多一項「檢查更新」;檢查中選單保持開啟,結果出來後收起', async () => {
    const { f, el } = mount(false, true);
    let done!: (v: 'latest') => void;
    const spy = vi.spyOn(TestBed.inject(AppUpdate), 'checkAndNotify').mockImplementation(() => new Promise((r) => (done = r as never)));
    el.querySelector<HTMLButtonElement>('.m-avatar-btn')!.click();
    f.detectChanges();
    const items = [...el.querySelectorAll('.m-user-menu .m-user-item')].map((x) => x.textContent!.trim());
    expect(items).toEqual(['檢查更新', '登出']);
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
