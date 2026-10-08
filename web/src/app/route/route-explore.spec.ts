import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { EXPLORED_KEY, RouteExploreVm } from './route-explore-vm';
import { RoutePage } from './route-page';
import { RouteVm } from './route-vm';

const drowned = () => SEA_INDEXES[0]!;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('探索推薦(D-213)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let x: RouteExploreVm;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(false);
    vm = TestBed.inject(RouteVm);
    x = TestBed.inject(RouteExploreVm);
    vm.setTab('recommend');
    vm.recGoal.set('explore');
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/route-subs').flush([]);
    vm.setLevel(130);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(text))!;
  const dot = (code: string) => [...el.querySelectorAll<SVGGElement>('app-route-explore .rt-pt')].find((g) => g.querySelector('.code')!.textContent!.trim() === code)!;
  const click = (code: string) => {
    dot(code).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('目標選擇頁的「探索」可以點,進去有地圖與篩選條件', () => {
    mount();
    vm.recGoal.set(null);
    f.detectChanges();
    const goals = [...el.querySelectorAll<HTMLButtonElement>('.rt-goal')];
    expect(goals.find((b) => b.querySelector('b')!.textContent === '探索')!.disabled).toBe(false);
    goals.find((b) => b.querySelector('b')!.textContent === '探索')!.click();
    f.detectChanges();
    expect(vm.recGoal()).toBe('explore');
    expect(el.querySelector('app-route-explore app-route-map')).not.toBeNull();
    expect(el.querySelector('[aria-label=去過哪些航點]')!.textContent).toContain('已標記 0 /');
  });

  it('點溺沒海的 Q:一併標記 B、E、I、K、P,顯示提示;復原後回到原狀', () => {
    mount();
    click('Q');
    expect(x.explored().size).toBe(6);
    for (const id of ids(drowned(), 'BEIKPQ')) expect(x.explored().has(id)).toBe(true);
    expect(el.querySelector('.rt-undo')!.textContent).toContain('前面的 5 個航點也一起標記');
    expect(dot('Q').classList.contains('done')).toBe(true);
    expect(dot('A').classList.contains('locked')).toBe(false); // A 是根,可能解鎖(open)
    expect(dot('A').classList.contains('open')).toBe(true); // 虛線外框:可能解鎖,不是已開
    expect(dot('A').classList.contains('done')).toBe(false);
    expect(dot('C').classList.contains('locked')).toBe(true);
    btn('復原', el.querySelector('.rt-undo')!).click();
    f.detectChanges();
    expect(x.explored().size).toBe(0);
    expect(el.querySelector('.rt-undo')).toBeNull();
  });

  it('點已去過的點:取消它和它後面的點', () => {
    mount();
    click('Q');
    click('K');
    expect([...x.explored()].sort((a, b) => a - b)).toEqual(ids(drowned(), 'BEI').sort((a, b) => a - b));
    expect(el.querySelector('.rt-undo')!.textContent).toContain('後面的 2 個航點也一起取消');
  });

  it('去過的航點存在 localStorage,重新載入後還在;壞資料被整理掉', () => {
    mount();
    click('E');
    expect(JSON.parse(localStorage.getItem(EXPLORED_KEY)!)).toEqual(ids(drowned(), 'BE').sort((a, b) => a - b));
    localStorage.setItem(EXPLORED_KEY, JSON.stringify([ids(drowned(), 'E')[0], 'x', 99999]));
    mount();
    expect(x.explored().size).toBe(2); // E 與它前面的 B
  });

  it('全部清除要按兩次;清除後可以復原', () => {
    mount();
    click('E');
    btn('全部清除').click();
    f.detectChanges();
    expect(x.exploredCount()).toBe(2);
    btn('確定清除全部').click();
    f.detectChanges();
    expect(x.exploredCount()).toBe(0);
    btn('復原', el.querySelector('.rt-undo')!).click();
    f.detectChanges();
    expect(x.exploredCount()).toBe(2);
  });

  it('找路線:什麼都沒去過時只推薦 A、B,每條顯示會解鎖幾個新航點', async () => {
    mount();
    btn('找路線').click();
    f.detectChanges();
    expect(btn('計算中').disabled).toBe(true);
    await tick();
    f.detectChanges();
    const rs = x.result()!;
    expect(rs.length).toBeGreaterThan(0);
    const first = el.querySelector('app-route-explore .rt-card')!;
    expect(first.querySelector('.rt-card-opens')!.textContent).toContain('有機會解鎖(機率,不保證)最多 3 個新航點:C、D、E');
    expect(first.querySelector('.rt-card-lights')).not.toBeNull();
    for (const r of rs) expect(r.sea).toBe(drowned().sea.sea);
  });

  it('搜尋之後再標記航點:提醒結果是舊的', async () => {
    mount();
    btn('找路線').click();
    await tick();
    f.detectChanges();
    expect(el.querySelector('.rt-dirty')).toBeNull();
    click('A');
    expect(el.querySelector('.rt-dirty')!.textContent).toContain('已經改過');
  });

  it('全部都去過或沒有可去的點:顯示說明', async () => {
    mount();
    vm.setLevel(1);
    f.detectChanges();
    // 溺沒海 A、B 的等級門檻之下沒有可去的點
    const need = SEA_INDEXES.flatMap((s) => s.sea.points).filter((p) => p.rankReq <= 1 && [...ids(drowned(), 'AB')].includes(p.id));
    if (need.length > 0) return;
    btn('找路線').click();
    await tick();
    f.detectChanges();
    expect(el.querySelector('.rt-empty')!.textContent).toContain('沒有可以去的航點');
  });

  it('「帶到航點」把路線放進航點頁', async () => {
    mount();
    btn('找路線').click();
    await tick();
    f.detectChanges();
    const top = x.result()![0]!;
    btn('帶到航點', el.querySelector('app-route-explore .rt-card')!).click();
    f.detectChanges();
    expect(vm.sea()).toBe(top.sea);
    expect(vm.seq()).toEqual(top.order);
    expect(vm.tab()).toBe('map');
  });

  it('收合地圖後只剩標題與展開鈕', () => {
    mount();
    btn('收合').click();
    f.detectChanges();
    expect(el.querySelector('app-route-explore app-route-map')).toBeNull();
    btn('展開').click();
    f.detectChanges();
    expect(el.querySelector('app-route-explore app-route-map')).not.toBeNull();
  });
});
