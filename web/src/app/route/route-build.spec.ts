import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import type { BuildGoal } from './core/buildfind';
import { RouteBuildVm } from './route-build-vm';
import { RoutePage } from './route-page';
import { RouteVm } from './route-vm';

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drowned = SEA_INDEXES[0]!;
const jade = SEA_INDEXES[2]!;
const farthestCodes = (si: (typeof SEA_INDEXES)[number], n: number) => [...si.sea.points].sort((a, b) => b.surveyRange - a.surveyRange).slice(0, n).map((p) => p.code);
const idOf = (si: (typeof SEA_INDEXES)[number], code: string) => si.sea.points.find((p) => p.code === code)!.id;

describe('找配置子畫面(D-223)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let b: RouteBuildVm;
  let http: HttpTestingController;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount(goal: BuildGoal, opts: { desktop?: boolean; saved?: RouteSubDto[] } = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(opts.desktop ?? false);
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    b = TestBed.inject(RouteBuildVm);
    vm.setTab('config');
    b.open.set(true);
    b.setGoal(goal);
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    http.expectOne('/api/route-subs').flush(opts.saved ?? []);
    vm.setLevel(130);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((x) => !x.closest('.rt-seg') && x.textContent?.trim().startsWith(text))!;
  const click = (code: string) => {
    const g = [...el.querySelectorAll<SVGGElement>('app-route-build .rt-pt')].find((q) => q.querySelector('.code')!.textContent!.trim() === code)!;
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
  };
  const search = async () => {
    btn('找配置').click();
    f.detectChanges();
    await tick();
    f.detectChanges();
  };
  const seg = (label: string) => [...el.querySelectorAll<HTMLButtonElement>('app-route-build .rt-seg-btn')].find((x) => x.textContent?.trim() === label)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('配置頁有「找配置」入口,點了切成子畫面,「‹ 配置」回列表', () => {
    mount('collect');
    b.open.set(false);
    f.detectChanges();
    expect(el.querySelector('app-route-build')).toBeNull();
    const entry = [...el.querySelectorAll<HTMLButtonElement>('app-route-editor button')].find((x) => x.textContent?.trim() === '找配置')!;
    entry.click();
    f.detectChanges();
    expect(b.open()).toBe(true);
    expect(el.querySelector('app-route-build')).not.toBeNull();
    expect(el.querySelector('app-route-build .rt-subnote')!.textContent).toContain('Lv130');
    btn('‹ 配置').click();
    f.detectChanges();
    expect(el.querySelector('app-route-build')).toBeNull();
  });

  it('目標切換:收集 / 恩惠 / 速度 / 自訂,「?」開說明彈窗並可關閉', () => {
    mount('collect');
    expect([...el.querySelectorAll('app-route-build .rt-seg-btn')].map((x) => x.textContent!.trim())).toEqual(['收集', '恩惠', '速度', '自訂']);
    seg('速度').click();
    f.detectChanges();
    expect(b.goal()).toBe('speed');
    expect(el.querySelector('[role=dialog]')).toBeNull();
    el.querySelector<HTMLButtonElement>('app-route-build .rt-help-btn')!.click();
    f.detectChanges();
    expect(el.querySelector('[role=dialog]')!.textContent).toContain('自訂');
    btn('知道了').click();
    f.detectChanges();
    expect(el.querySelector('[role=dialog]')).toBeNull();
  });

  it('收集:沒選航點不能找;選一個之後顯示需要的最低性能(唯讀)與目前配置的燈號;再點別的點就換掉', () => {
    mount('collect');
    expect(btn('找配置').disabled).toBe(true);
    expect(el.querySelector('.rt-find-cond .rt-mins')).toBeNull();
    click('A');
    expect(el.querySelector('.rt-map-count')!.textContent).toContain('A');
    expect(el.querySelector('.rt-need-list')!.textContent).toContain('距離');
    expect(el.querySelector('.rt-need-list')!.textContent).toContain('收集');
    expect(el.querySelector('.rt-baseline .rt-card-lights')!.children).toHaveLength(4);
    expect(el.querySelector('.rt-find-cond input')).toBeNull();
    expect(btn('找配置').disabled).toBe(false);
    click('B');
    expect(b.ids()).toEqual([idOf(drowned, 'B')]);
    click('B');
    expect(b.ids()).toEqual([]);
  });

  it('收集:找配置先顯示計算中,再列出達成的組合;帶入配置後回到配置列表', async () => {
    mount('collect');
    click('AD');
    btn('找配置').click();
    f.detectChanges();
    expect(btn('計算中').disabled).toBe(true);
    await tick();
    f.detectChanges();
    const r = b.result()!;
    expect(r.total).toBeGreaterThan(0);
    const first = el.querySelector('app-route-build .rt-card')!;
    expect(first.querySelectorAll('.rt-chip5')).toHaveLength(5);
    expect(first.querySelector('.rt-card-lights')).not.toBeNull();
    btn('帶入配置', first).click();
    f.detectChanges();
    expect(vm.parts()).toEqual(r.hits[0]!.build.parts);
    expect(b.open()).toBe(false);
    expect(vm.tab()).toBe('config');
    expect(el.querySelector('app-route-build')).toBeNull();
  });

  it('切到點數較少的目標:只用最後選的點並提示,切回速度還原', () => {
    mount('speed');
    for (const c of ['A', 'B', 'C']) click(c);
    expect(b.ids()).toHaveLength(3);
    seg('收集').click();
    f.detectChanges();
    expect(b.ids()).toEqual([idOf(drowned, 'C')]);
    expect(b.hidden()).toBe(2);
    expect(el.querySelector('.rt-map-count')!.textContent).toContain('先收起來');
    seg('速度').click();
    f.detectChanges();
    expect(b.ids()).toHaveLength(3);
  });

  it('找完之後改了等級:提醒結果是舊的', async () => {
    mount('favor');
    click('A');
    await search();
    expect(el.querySelector('app-route-build .rt-dirty')).toBeNull();
    vm.setLevel(120);
    f.detectChanges();
    expect(el.querySelector('app-route-build .rt-dirty')!.textContent).toContain('已經改過');
  });

  it('速度:可以選多個航點,最多 5 個,結果依航行時間排序', async () => {
    mount('speed');
    for (const c of ['A', 'B', 'C', 'D', 'E', 'F']) click(c);
    expect(b.ids()).toHaveLength(5);
    expect(el.querySelector('app-route-build .rt-hint')!.textContent).toContain('F');
    await search();
    const hits = b.result()!.hits;
    expect(hits.length).toBeGreaterThan(1);
    for (let i = 1; i < hits.length; i++) expect(hits[i - 1]!.minutes!).toBeLessThanOrEqual(hits[i]!.minutes!);
  });

  it('沒有任何配置達成:列出最接近的 3 組與還差多少', async () => {
    mount('speed');
    b.setSea(jade.sea.sea);
    f.detectChanges();
    for (const c of farthestCodes(jade, 5)) click(c);
    expect(b.ids()).toHaveLength(5);
    await search();
    expect(b.result()!.total).toBe(0);
    const sec = el.querySelector('[aria-label=找配置結果]')!;
    expect(sec.textContent).toContain('沒有任何零件組合能達成');
    expect(sec.querySelectorAll('.rt-card')).toHaveLength(3);
    expect(sec.textContent).toContain('還差');
  });

  it('換海域會清掉已選的航點', () => {
    mount('collect');
    click('A');
    b.setSea(jade.sea.sea);
    f.detectChanges();
    expect(b.ids()).toEqual([]);
  });

  it('改成自訂:把算出的最低性能帶過去,出現可編輯的欄位', () => {
    mount('speed');
    click('A');
    const expected = { ...b.shownMins()! };
    btn('改成自訂').click();
    f.detectChanges();
    expect(b.goal()).toBe('custom');
    expect(b.mins()).toEqual(expected);
    expect(el.querySelectorAll('.rt-find-cond .rt-min input')).toHaveLength(6);
    const input = el.querySelector<HTMLInputElement>('.rt-find-cond .rt-min input[aria-label=最低探索]')!;
    input.value = '12';
    input.dispatchEvent(new Event('change'));
    f.detectChanges();
    expect(b.mins().surveillance).toBe(12);
  });

  it('自訂:不選航點也能找(不顯示航行時間),可以用航點需求帶入', async () => {
    mount('custom');
    expect(btn('用航點需求帶入').disabled).toBe(true);
    expect(btn('找配置').disabled).toBe(false);
    b.setMin('range', 40);
    await search();
    const r = b.result()!;
    expect(r.total).toBeGreaterThan(0);
    const first = el.querySelector('app-route-build .rt-card')!;
    expect(first.textContent).not.toContain('航行');
    expect(first.querySelector('.rt-card-lights')).toBeNull();
    click('A');
    btn('用航點需求帶入').click();
    f.detectChanges();
    expect(b.mins().range).toBe(b.need()!.range);
  });

  it('加入儲存:存完留在結果頁,該組變成「已儲存 ✓」', async () => {
    mount('collect');
    click('AD');
    await search();
    const first = el.querySelector('app-route-build .rt-card')!;
    btn('加入儲存', first).click();
    f.detectChanges();
    const req = http.expectOne((r) => r.url === '/api/route-subs' && r.method === 'POST');
    const parts = b.result()!.hits[0]!.build.parts;
    expect(req.request.body.hull).toBe(parts[0]);
    const dto: RouteSubDto = { id: 'n', name: 'x', level: 130, hull: parts[0], stern: parts[1], bow: parts[2], bridge: parts[3], bound_submarine_ids: [], created_at: '2026-10-09T00:00:00.000Z', updated_at: '2026-10-09T00:00:00.000Z' };
    req.flush(dto);
    await tick();
    f.detectChanges();
    expect(b.open()).toBe(true);
    expect(el.querySelector('app-route-build')).not.toBeNull();
    expect(btn('已儲存', el.querySelector('app-route-build .rt-card')!).disabled).toBe(true);
  });

  it('桌機:左邊海圖、右邊條件(rt-grid),結果在下方', () => {
    mount('speed', { desktop: true });
    const top = el.querySelector('app-route-build .rt-find-top')!;
    expect(top.classList.contains('rt-grid')).toBe(true);
    expect(top.children[0]!.getAttribute('aria-label')).toBe('想去的航點');
    expect(top.children[1]!.getAttribute('aria-label')).toBe('找配置條件');
  });
});
