import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteExploreVm } from './route-explore-vm';
import { RouteFindVm } from './route-find-vm';
import { RouteMap } from './route-map';
import { RouteVm } from './route-vm';

const drowned = SEA_INDEXES[0]!;
const grey = SEA_INDEXES[1]!;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('找路線的篩選與搜尋狀態(D-222)', () => {
  let vm: RouteVm;
  let f: RouteFindVm;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    vm = TestBed.inject(RouteVm);
    f = TestBed.inject(RouteFindVm);
    vm.setLevel(130);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
  });

  it('點一次選中、兩次排除、三次回到未選', () => {
    const k = ids(grey, 'K')[0]!;
    f.cycleFilter(k);
    expect(f.filterMap().get(k)).toBe('in');
    expect(f.filterCount()).toEqual({ required: 1, excluded: 0 });
    f.cycleFilter(k);
    expect(f.filterMap().get(k)).toBe('out');
    expect(f.filterCount()).toEqual({ required: 0, excluded: 1 });
    f.cycleFilter(k);
    expect(f.filterMap().has(k)).toBe(false);
    expect(f.filterCount()).toEqual({ required: 0, excluded: 0 });
  });

  it('等級不足的點不能選,並留下提示;clearFilter 全部清除', () => {
    vm.setLevel(1);
    const k = ids(grey, 'K')[0]!;
    expect(f.lockedIds().has(k)).toBe(true);
    f.cycleFilter(k);
    expect(f.filterCount()).toEqual({ required: 0, excluded: 0 });
    expect(f.tapNote()).toContain('等級不足');
    vm.setLevel(130);
    f.cycleFilter(k);
    f.cycleFilter(ids(grey, 'A')[0]!);
    f.cycleFilter(ids(grey, 'A')[0]!);
    f.clearFilter();
    expect(f.filterCount()).toEqual({ required: 0, excluded: 0 });
    expect(f.tapNote()).toBe('');
  });

  it('即時提示:超過 5 個、走不完、被海域下拉忽略、探索排序下不是可去的點', () => {
    for (const id of ids(grey, 'ABCDEF')) f.cycleFilter(id);
    expect(f.notes().some((n) => n.text.includes('超過 5 個'))).toBe(true);
    f.clearFilter();

    f.cycleFilter(ids(grey, 'K')[0]!);
    f.sea.set(drowned.sea.sea);
    expect(f.notes().some((n) => n.kind === 'info' && n.text.includes('已忽略'))).toBe(true);
    f.sea.set('all');
    expect(f.notes()).toEqual([]);

    f.setSort('opens');
    expect(f.notes().some((n) => n.text.includes('可去的點'))).toBe(true);
  });

  it('按「找路線」才計算;選項變動後標記結果過時,重新搜尋後恢復', async () => {
    expect(f.result()).toBeNull();
    f.sea.set(grey.sea.sea);
    f.run();
    expect(f.busy()).toBe(true);
    await tick();
    expect(f.busy()).toBe(false);
    expect(f.result()!.length).toBeGreaterThan(0);
    expect(f.stale()).toBe(false);
    f.setSort('variety');
    expect(f.stale()).toBe(true);
    f.run();
    await tick();
    expect(f.stale()).toBe(false);
    expect(f.searchedSort()).toBe('variety');
  });

  it('必選 + 排除:結果每條都包含必選點、不含排除點', async () => {
    const k = ids(grey, 'K')[0]!;
    const a = ids(grey, 'A')[0]!;
    f.cycleFilter(k);
    f.cycleFilter(a);
    f.cycleFilter(a);
    f.run();
    await tick();
    const rs = f.result()!;
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) {
      expect(r.sea).toBe(grey.sea.sea);
      expect(r.order).toContain(k);
      expect(r.order).not.toContain(a);
    }
  });

  it('必選點跨海域:兩個海域都有結果(各海域分開算再合併)', async () => {
    f.cycleFilter(ids(drowned, 'B')[0]!);
    f.cycleFilter(ids(grey, 'K')[0]!);
    f.run();
    await tick();
    expect(new Set(f.result()!.map((r) => r.sea))).toEqual(new Set([drowned.sea.sea, grey.sea.sea]));
  });

  it('探索排序用「去過」的集合,只列可去的點', async () => {
    const x = TestBed.inject(RouteExploreVm);
    x.toggle(ids(drowned, 'A')[0]!);
    x.toggle(ids(drowned, 'B')[0]!);
    f.setSort('opens');
    f.run();
    await tick();
    const rs = f.result()!;
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) for (const id of r.order) expect(x.explored().has(id)).toBe(false);
    expect(rs[0]!.opens.length).toBeGreaterThanOrEqual(rs[rs.length - 1]!.opens.length);
  });
});

describe('RouteMap 篩選模式(D-222)', () => {
  function mount(filter: Map<number, 'in' | 'out' | 'none'>, locked: number[] = []) {
    TestBed.resetTestingModule();
    const fx = TestBed.createComponent(RouteMap);
    fx.componentRef.setInput('sea', grey);
    fx.componentRef.setInput('filter', filter);
    fx.componentRef.setInput('locked', new Set(locked));
    fx.detectChanges();
    const el = fx.nativeElement as HTMLElement;
    const dot = (code: string) => [...el.querySelectorAll<SVGGElement>('.rt-pt')].find((g) => g.querySelector('.code')!.textContent!.trim() === code)!;
    return { fx, el, dot };
  }

  it('未選灰、選中綠 + ＋徽章、排除桃紅 + ✕徽章,不靠顏色也看得出來', () => {
    const { dot } = mount(new Map([[ids(grey, 'A')[0]!, 'in'], [ids(grey, 'B')[0]!, 'out']]));
    expect(dot('A').classList.contains('fin')).toBe(true);
    expect(dot('A').querySelector('.fbadge.in')).not.toBeNull();
    expect(dot('A').getAttribute('aria-pressed')).toBe('true');
    expect(dot('B').classList.contains('fout')).toBe(true);
    expect(dot('B').querySelector('.fbadge.out')).not.toBeNull();
    expect(dot('B').getAttribute('aria-pressed')).toBe('mixed');
    expect(dot('C').classList.contains('fnone')).toBe(true);
    expect(dot('C').querySelector('.badge')).toBeNull();
    expect(dot('A').getAttribute('aria-label')).toContain('必選');
    expect(dot('B').getAttribute('aria-label')).toContain('排除');
  });

  it('等級不足的點變暗加鎖、aria-disabled;點選仍然送出 pick(由 VM 提示原因)', () => {
    const c = ids(grey, 'C')[0]!;
    const { fx, dot } = mount(new Map(), [c]);
    expect(dot('C').classList.contains('flock')).toBe(true);
    expect(dot('C').querySelector('.flockbadge')).not.toBeNull();
    expect(dot('C').getAttribute('aria-disabled')).toBe('true');
    const picked: number[] = [];
    fx.componentInstance.pick.subscribe((id) => picked.push(id));
    dot('C').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picked).toEqual([c]);
  });

  it('篩選模式不畫去過標記', () => {
    TestBed.resetTestingModule();
    const fx = TestBed.createComponent(RouteMap);
    fx.componentRef.setInput('sea', grey);
    fx.componentRef.setInput('filter', new Map());
    fx.componentRef.setInput('explored', new Set(ids(grey, 'A')));
    fx.componentRef.setInput('graph', null);
    fx.detectChanges();
    expect((fx.nativeElement as HTMLElement).querySelector('.badge.check')).toBeNull();
  });
});
