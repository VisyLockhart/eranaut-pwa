import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { MaintenanceDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { DataStore } from '../core/data-store';
import { MaintenanceNotice } from './maintenance-notice';

const START = Date.UTC(2026, 8, 29, 5, 0);
const END = Date.UTC(2026, 8, 29, 10, 0);
const info: MaintenanceDto = {
  id: 'MAINT00001',
  title: '09/29 維護更新作業',
  url: 'https://www.ffxiv.com.tw/web/news/news_content.aspx?id=MAINT00001',
  start_at: new Date(START).toISOString(),
  end_at: new Date(END).toISOString(),
};

function mount(variant: 'card' | 'icon' | 'line', data: MaintenanceDto | null = info, now = START - 3_600_000) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  TestBed.inject(Auth).status.set('authenticated');
  const store = TestBed.inject(DataStore);
  store.now.set(now);
  store.maintenance.set(data);
  const f = TestBed.createComponent(MaintenanceNotice);
  f.componentRef.setInput('variant', variant);
  f.detectChanges();
  return { f, el: f.nativeElement as HTMLElement, store };
}

describe('MaintenanceNotice', () => {
  beforeEach(() => localStorage.clear());

  it('沒有維護或不在顯示期間:什麼都不畫', () => {
    expect(mount('card', null).el.querySelector('.mn')).toBeNull();
    expect(mount('card', info, START - 25 * 3_600_000).el.querySelector('.mn')).toBeNull();
  });

  it('card:顯示「伺服器維護」、日期時段與狀態', () => {
    const { el } = mount('card');
    expect(el.querySelector('.mn-card')).toBeTruthy();
    expect(el.querySelector('.mn-label')!.textContent).toBe('伺服器維護');
    expect(el.querySelector('.mn-range')!.textContent).toBe('09/29 13:00 ~ 18:00');
    expect(el.querySelector('.mn-sub')!.textContent).toContain('距開始 1 時 00 分');
  });

  it('line:一行「伺服器維護 09/29 13:00 ~ 18:00」', () => {
    const { el } = mount('line');
    expect(el.querySelector('.mn-line-text')!.textContent!.trim()).toBe('伺服器維護 09/29 13:00 ~ 18:00');
  });

  it('icon:只有圖示,名稱與提示是完整文字;點擊開詳細視窗,可關閉', () => {
    const { f, el } = mount('icon');
    const btn = el.querySelector<HTMLButtonElement>('.mn-icon-btn')!;
    expect(btn.textContent!.trim()).toBe('');
    expect(btn.getAttribute('aria-label')).toBe('伺服器維護 09/29 13:00 ~ 18:00');
    expect(btn.getAttribute('data-tip')).toBe('伺服器維護 09/29 13:00 ~ 18:00');
    expect(el.querySelector('.mn-modal')).toBeNull();

    btn.click();
    f.detectChanges();
    const modal = el.querySelector('.mn-modal')!;
    expect(modal.textContent).toContain('09/29 13:00 ~ 18:00');
    expect(modal.querySelector('a')!.getAttribute('href')).toBe(info.url);
    expect(modal.querySelector('a')!.getAttribute('rel')).toContain('noopener');

    el.querySelector<HTMLButtonElement>('.modal-close')!.click();
    f.detectChanges();
    expect(el.querySelector('.mn-modal')).toBeNull();
  });

  it('點遮罩關閉、點視窗內不關;Esc 關閉', () => {
    const { f, el } = mount('card');
    el.querySelector<HTMLButtonElement>('.mn-card')!.click();
    f.detectChanges();
    el.querySelector<HTMLElement>('.mn-modal')!.click();
    f.detectChanges();
    expect(el.querySelector('.mn-modal')).toBeTruthy();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(el.querySelector('.mn-modal')).toBeNull();

    el.querySelector<HTMLButtonElement>('.mn-card')!.click();
    f.detectChanges();
    el.querySelector<HTMLElement>('.mn-dialog')!.click(); // 點在框外的透明區域(背景)
    f.detectChanges();
    expect(el.querySelector('.mn-modal')).toBeNull();
  });

  it('視窗用原生 <dialog>(最上層),不是放在側欄裡的 fixed 遮罩', () => {
    const { f, el } = mount('icon');
    el.querySelector<HTMLButtonElement>('.mn-icon-btn')!.click();
    f.detectChanges();
    f.detectChanges();
    const dlg = el.querySelector('dialog.mn-dialog') as HTMLDialogElement;
    expect(dlg).toBeTruthy();
    expect(dlg.hasAttribute('open')).toBe(true);
    expect(el.querySelector('.modal-overlay')).toBeNull();
  });

  it('官網維護不顯示(即使資料誤送到)', () => {
    expect(mount('card', { ...info, title: '10/20 官網維護' }).el.querySelector('.mn')).toBeNull();
  });

  it('連結不是官網網址就不輸出(不能被外部資料帶去別的網站)', () => {
    const { f, el } = mount('card', { ...info, url: 'https://evil.example.com/x' });
    el.querySelector<HTMLButtonElement>('.mn-card')!.click();
    f.detectChanges();
    expect(el.querySelector('.mn-modal')).toBeTruthy();
    expect(el.querySelector('.mn-modal a')).toBeNull();
  });

  it('標題等外部文字只當文字顯示,不會被當成 HTML', () => {
    const { f, el } = mount('card', { ...info, title: '<img src=x onerror=alert(1)>' });
    el.querySelector<HTMLButtonElement>('.mn-card')!.click();
    f.detectChanges();
    expect(el.querySelector('img')).toBeNull();
  });

  it('維護中與超過預計時間的狀態文字', () => {
    expect(mount('card', info, START + 1000).el.querySelector('.mn-sub')!.textContent).toBe('維護中');
    expect(mount('card', info, END + 1000).el.querySelector('.mn-sub')!.textContent).toContain('已超過預計時間');
  });
});
