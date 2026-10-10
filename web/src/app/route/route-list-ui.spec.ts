import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListView, type Listable } from './list-view';
import { RouteListTools, RoutePager, RouteStar } from './route-list-ui';

const items = (n: number): Listable[] => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, name: `艇${i}`, favorite: i === 2 }));

@Component({
  imports: [RouteListTools, RoutePager, RouteStar],
  template: `
    <app-route-list-tools [view]="view" noun="配置" />
    <app-route-pager [page]="view.page()" [pages]="view.pages()" [count]="view.filtered().length" (pageChange)="view.setPage($event)" />
    <app-route-star [on]="on()" name="艇A" (toggle)="toggled = toggled + 1" />
  `,
})
class Host {
  data = signal(items(25));
  view = new ListView(this.data, () => 10);
  on = signal(false);
  toggled = 0;
}

describe('清單工具列、分頁列、星號(D-237)', () => {
  let el: HTMLElement;
  let host: Host;
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  const click = (sel: string) => {
    (el.querySelector(sel) as HTMLElement).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('分頁列:顯示目前頁 / 總頁數與總筆數;上一頁 / 下一頁依邊界停用', () => {
    expect(el.querySelector('.sel-label')?.textContent?.trim()).toBe('1 / 3');
    expect(el.querySelector('.rt-pg-count')?.textContent).toContain('共 25 組');
    const [prev, next] = el.querySelectorAll<HTMLButtonElement>('.rt-listpager .pager-btn');
    expect(prev!.disabled).toBe(true);
    expect(next!.disabled).toBe(false);
    next!.click();
    fixture.detectChanges();
    next!.click();
    fixture.detectChanges();
    expect(host.view.page()).toBe(3);
    expect(next!.disabled).toBe(true);
    expect(prev!.disabled).toBe(false);
  });

  it('點開頁碼下拉可以跳頁(自製下拉,不是原生 select)', () => {
    expect(el.querySelector('select')).toBeNull();
    click('.rt-pg-sel .sel-trigger');
    const opts = [...document.querySelectorAll<HTMLElement>('.sel-opt')];
    expect(opts.map((o) => o.textContent?.trim())).toEqual(['1 / 3', '2 / 3', '3 / 3']);
    opts[2]!.click();
    fixture.detectChanges();
    expect(host.view.page()).toBe(3);
  });

  it('只有一頁時不顯示分頁列', () => {
    host.data.set(items(9));
    fixture.detectChanges();
    expect(el.querySelector('.rt-listpager')).toBeNull();
  });

  it('工具列:超過 8 組才顯示;搜尋與「★ 常用」會篩選,並顯示符合筆數', () => {
    expect(el.querySelector('.rt-listtools')).not.toBeNull();
    const q = el.querySelector<HTMLInputElement>('.rt-lt-q')!;
    q.value = '艇1';
    q.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.view.filtered().length).toBe(11); // 艇1、艇10~艇19
    expect(el.querySelector('.rt-lt-count')?.textContent).toContain('符合 11 / 共 25 組');
    q.value = '';
    q.dispatchEvent(new Event('input'));
    click('.rt-listtools .rt-chip');
    expect(host.view.filtered().map((i) => i.id)).toEqual(['i2']);
    expect(el.querySelector('.rt-listtools .rt-chip')?.getAttribute('aria-pressed')).toBe('true');
    host.data.set(items(8));
    fixture.detectChanges();
    expect(el.querySelector('.rt-listtools')).toBeNull();
  });

  it('星號按鈕:aria-pressed 與標籤跟著狀態,點擊通知外層', () => {
    const star = el.querySelector<HTMLButtonElement>('.rt-star')!;
    expect(star.getAttribute('aria-pressed')).toBe('false');
    expect(star.getAttribute('aria-label')).toBe('加入常用 艇A');
    star.click();
    expect(host.toggled).toBe(1);
    host.on.set(true);
    fixture.detectChanges();
    expect(star.getAttribute('aria-pressed')).toBe('true');
    expect(star.getAttribute('aria-label')).toBe('取消常用 艇A');
    expect(star.textContent?.trim()).toBe('★');
  });
});
