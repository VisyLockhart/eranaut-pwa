import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { RoutePage } from './route-page';
import { RouteVarietyVm } from './route-variety-vm';
import { RouteVm } from './route-vm';

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('距離型推薦(D-215)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let x: RouteVarietyVm;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(false);
    vm = TestBed.inject(RouteVm);
    x = TestBed.inject(RouteVarietyVm);
    vm.setTab('recommend');
    vm.recGoal.set('range');
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/route-subs').flush([]);
    vm.setLevel(130);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string) => [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(text))!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('進入頁面有條件區,按「找路線」後列出依物品種類排序的結果', async () => {
    mount();
    expect(el.querySelector('app-route-variety')).not.toBeNull();
    expect(el.querySelector('app-route-variety [aria-label=距離結果]')).toBeNull();
    btn('找路線').click();
    f.detectChanges();
    expect(btn('計算中').disabled).toBe(true);
    await tick();
    f.detectChanges();
    const cards = el.querySelectorAll('app-route-variety .rt-hit');
    expect(cards.length).toBeGreaterThan(0);
    const counts = [...cards].map((c) => Number(/可撈到 (\d+) 種/.exec(c.textContent!)![1]));
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(el.querySelector('app-route-variety [role=status]')!.textContent).toContain('條路線');
  });

  it('物品多時預設只列前幾個,「看全部」可展開、「收合」收回', async () => {
    mount();
    btn('找路線').click();
    await tick();
    f.detectChanges();
    const card = el.querySelector('app-route-variety .rt-hit')!;
    const t = card.querySelector<HTMLButtonElement>('.rt-variety-items button')!;
    expect(t.textContent!.trim()).toBe('看全部');
    const before = card.querySelector('.rt-variety-items span')!.textContent!.split('、').length;
    t.click();
    f.detectChanges();
    const after = el.querySelector('app-route-variety .rt-hit .rt-variety-items span')!.textContent!.split('、').length;
    expect(after).toBeGreaterThan(before);
    expect(el.querySelector<HTMLButtonElement>('app-route-variety .rt-hit .rt-variety-items button')!.textContent!.trim()).toBe('收合');
  });

  it('搜尋之後改了配置會顯示過時提醒', async () => {
    mount();
    btn('找路線').click();
    await tick();
    f.detectChanges();
    expect(el.textContent).not.toContain('舊配置算的');
    vm.setPart(0, 1);
    f.detectChanges();
    expect(el.textContent).toContain('舊配置算的');
  });

  it('「帶到航點」把路線放進航點頁', async () => {
    mount();
    btn('找路線').click();
    await tick();
    f.detectChanges();
    btn('帶到航點').click();
    f.detectChanges();
    expect(vm.tab()).toBe('map');
    expect(vm.seq().length).toBeGreaterThan(0);
  });
});
