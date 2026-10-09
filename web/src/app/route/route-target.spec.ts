import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import type { BuildGoal } from './core/target';
import { RoutePage } from './route-page';
import { RouteTargetVm } from './route-target-vm';
import { RouteVm } from './route-vm';

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drowned = SEA_INDEXES[0]!;
const jade = SEA_INDEXES[2]!;
const farthestCodes = (si: (typeof SEA_INDEXES)[number], n: number) => [...si.sea.points].sort((a, b) => b.surveyRange - a.surveyRange).slice(0, n).map((p) => p.code);

describe('找配置:收集 / 恩惠 / 速度(D-214)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let x: RouteTargetVm;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount(goal: BuildGoal) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(false);
    vm = TestBed.inject(RouteVm);
    x = TestBed.inject(RouteTargetVm);
    vm.setTab('recommend');
    vm.recGoal.set(goal);
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/route-subs').flush([]);
    vm.setLevel(130);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => !b.closest('.rt-seg') && b.textContent?.trim().startsWith(text))!;
  const click = (code: string) => {
    const g = [...el.querySelectorAll<SVGGElement>('app-route-target .rt-pt')].find((q) => q.querySelector('.code')!.textContent!.trim() === code)!;
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
  };
  const search = async () => {
    btn('找配置').click();
    f.detectChanges();
    await tick();
    f.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('目標選擇頁:收集、恩惠、速度、進階都可以點', () => {
    mount('collect');
    vm.recGoal.set(null);
    f.detectChanges();
    const ready = [...el.querySelectorAll<HTMLButtonElement>('.rt-goal.build')].map((b) => !b.disabled);
    expect(ready).toEqual([true, true, true, true]);
  });

  it('收集:沒選航點不能找;選一個之後顯示已選與目前配置的燈號;再點別的點就換掉', () => {
    mount('collect');
    expect(btn('找配置').disabled).toBe(true);
    click('A');
    expect(el.querySelector('.rt-target-picked')!.textContent).toContain('A');
    expect(el.querySelector('.rt-baseline .rt-card-lights')!.children).toHaveLength(4);
    expect(btn('找配置').disabled).toBe(false);
    click('B');
    expect(x.ids('collect')).toEqual([drowned.sea.points.find((p) => p.code === 'B')!.id]);
    click('B');
    expect(x.ids('collect')).toEqual([]);
  });

  it('收集:找配置先顯示計算中,再列出達成的組合;帶入配置後到配置頁', async () => {
    mount('collect');
    click('AD');
    btn('找配置').click();
    f.detectChanges();
    expect(btn('計算中').disabled).toBe(true);
    await tick();
    f.detectChanges();
    const r = x.result()!;
    expect(r.total).toBeGreaterThan(0);
    expect(el.querySelector('[role=status]')).not.toBeNull();
    expect(el.querySelector('[aria-label=找配置結果]')!.textContent).toContain(`共 ${r.total} 組達成`.replace(/共 (\d+) 組達成/, (m) => (r.total > r.hits.length ? `共 ${r.total} 組達成,只列前 ${r.hits.length} 組` : m)));
    const first = el.querySelector('app-route-target .rt-card')!;
    expect(first.querySelectorAll('.rt-chip5')).toHaveLength(5);
    btn('帶入配置', first).click();
    f.detectChanges();
    expect(vm.parts()).toEqual(r.hits[0]!.build.parts);
    expect(vm.tab()).toBe('config');
  });

  it('找完之後改了等級:提醒結果是舊的', async () => {
    mount('favor');
    click('A');
    await search();
    expect(el.querySelector('.rt-dirty')).toBeNull();
    vm.setLevel(120);
    f.detectChanges();
    expect(el.querySelector('.rt-dirty')!.textContent).toContain('已經改過');
  });

  it('速度:可以選多個航點,最多 5 個,結果依航行時間排序', async () => {
    mount('speed');
    for (const c of ['A', 'B', 'C', 'D', 'E', 'F']) click(c);
    expect(x.ids('speed')).toHaveLength(5);
    expect(el.querySelector('.rt-hint')!.textContent).toContain('F');
    await search();
    const hits = x.result()!.hits;
    expect(hits.length).toBeGreaterThan(1);
    for (let i = 1; i < hits.length; i++) expect(hits[i - 1]!.minutes).toBeLessThanOrEqual(hits[i]!.minutes);
  });

  it('沒有任何配置達成:列出最接近的 3 組', async () => {
    mount('speed');
    vm.recGoal.set('speed');
    x.setSea(jade.sea.sea);
    f.detectChanges();
    for (const c of farthestCodes(jade, 5)) click(c);
    expect(x.ids('speed')).toHaveLength(5);
    await search();
    expect(x.result()!.total).toBe(0);
    const text = el.querySelector('[aria-label=找配置結果]')!.textContent!;
    expect(text).toContain('沒有任何零件組合能達成');
    expect(el.querySelectorAll('[aria-label=找配置結果] .rt-card')).toHaveLength(3);
  });

  it('換海域會清掉已選的航點', () => {
    mount('collect');
    click('A');
    x.setSea(jade.sea.sea);
    f.detectChanges();
    expect(x.ids('collect')).toEqual([]);
  });
});
