import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { RouteLootSearch } from './route-loot-search';
import { RouteLootVm } from './route-loot-vm';
import { RouteVm } from './route-vm';

const settle = () => new Promise((r) => setTimeout(r));

/** 只出現在高等級航點(需要 > 1 級)的掉落物:1 級配置拿不到 */
function highLevelOnlyItem(): number {
  const lowest = new Map<number, number>();
  for (const si of SEA_INDEXES) for (const p of si.sea.points) for (const id of [...p.drop.low, ...p.drop.mid, ...p.drop.high]) lowest.set(id, Math.min(lowest.get(id) ?? 999, p.rankReq));
  return [...lowest].find(([, lv]) => lv > 1)![0];
}

/** 出現在最多航點的掉落物(溺沒海) */
function commonItem(): number {
  const si = SEA_INDEXES[0]!;
  const counts = new Map<number, number>();
  for (const p of si.sea.points) for (const id of [...p.drop.low, ...p.drop.mid, ...p.drop.high]) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
}

describe('RouteLootSearch', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let l: RouteLootVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteLootSearch>>;

  async function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    l = TestBed.inject(RouteLootVm);
    vm.start();
    http.expectOne('/api/route-subs').flush([]);
    await settle();
    fixture = TestBed.createComponent(RouteLootSearch);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    vm.setLevel(125);
    for (let i = 0; i < 4; i++) vm.setPart(i as 0 | 1 | 2 | 3, 10);
    fixture.detectChanges();
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('物品清單只列真的會掉落的物品,可用名稱與分類篩選', async () => {
    await mount();
    const all = l.matches().length;
    expect(all).toBeGreaterThan(50);
    l.setQuery(l.matches()[0]!.name.slice(0, 2));
    fixture.detectChanges();
    expect(l.matches().length).toBeLessThan(all);
    l.setQuery('');
    // 每個分類都要有東西可選(資料集的分類代碼是數字,曾因 === 比對字串而全空)
    for (const c of l.categories) {
      l.setCategory(c.id);
      expect(l.matches().length, c.label).toBeGreaterThan(0);
    }
    l.setCategory('3');
    expect(l.matches().every((i) => i.cat === '3')).toBe(true);
    l.setCategory('other');
    expect(l.matches().every((i) => i.cat === null)).toBe(true);
  });

  it('選物品 → 列出路線:依每分鐘經驗由大到小;每條都在配置的距離上限內', async () => {
    await mount();
    l.toggle(commonItem());
    fixture.detectChanges();
    const hits = l.hits();
    expect(hits.length).toBeGreaterThan(0);
    const scores = hits.map((h) => h.route.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    for (const h of hits) {
      expect(h.route.cost.range).toBeLessThanOrEqual(vm.stats().range);
      expect(h.route.order.length).toBeLessThanOrEqual(5);
    }
    expect(el.querySelectorAll('.rt-card').length).toBe(Math.min(20, hits.length));
    expect(el.querySelector('.rt-block-title[role=status]')?.textContent).toContain(`共 ${hits.length} 條路線`);
  });

  it('帶到航點:換到該海域、依序放入航點並切到航點頁;航點頁已有不同選點時先確認', async () => {
    await mount();
    l.toggle(commonItem());
    fixture.detectChanges();
    const top = l.hits()[0]!;
    btn('帶到航點', el.querySelector('.rt-card')!).click();
    expect(vm.sea()).toBe(top.sea);
    expect(vm.seq()).toEqual(top.route.order);
    expect(vm.cost().range).toBe(top.route.cost.range);
    expect(vm.tab()).toBe('map');
  });

  it('航點頁已有不同的選點:帶到航點先要確認,不直接覆蓋', async () => {
    await mount();
    l.toggle(commonItem());
    fixture.detectChanges();
    const top = l.hits()[0]!;
    const other = top.sea === SEA_INDEXES[0]!.sea.sea ? SEA_INDEXES[1]! : SEA_INDEXES[0]!;
    vm.selectSea(other.sea.sea);
    vm.setLevel(125);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    vm.toggle(other.sea.points[0]!.id);
    const before = [...vm.seq()];
    vm.setTab('recommend');
    btn('帶到航點', el.querySelector('.rt-card')!).click();
    expect(vm.pendingLoad()).toEqual({ sea: top.sea, order: top.route.order });
    expect(vm.seq()).toEqual(before);
    expect(vm.tab()).toBe('recommend');
  });

  it('配置太弱拿不到:顯示說明,不列路線', async () => {
    await mount();
    vm.setLevel(1);
    for (let i = 0; i < 4; i++) vm.setPart(i as 0 | 1 | 2 | 3, 1);
    l.toggle(highLevelOnlyItem());
    fixture.detectChanges();
    expect(l.unreachable()).toBe(true);
    expect(el.textContent).toContain('拿不到');
    expect(el.querySelector('.rt-card')).toBeNull();
  });

  it('複選:再點一次取消;全部都要 = 路線拿得到每一個物品,任一個 = 至少一個', async () => {
    await mount();
    const si = SEA_INDEXES[0]!;
    // 找溺沒海同一個航點可掉落的兩個物品,與只在別的航點的物品
    const p = si.sea.points.find((x) => x.drop.low.length >= 2)!;
    const [a, b] = p.drop.low as [number, number];
    l.toggle(a);
    l.toggle(b);
    fixture.detectChanges();
    expect(l.itemIds()).toEqual([a, b]);
    const all = l.hits().filter((h) => h.sea === si.sea.sea);
    expect(all.length).toBeGreaterThan(0);
    const has = (h: (typeof all)[number], id: number) => h.route.order.some((pid) => {
      const q = si.byId.get(pid)!;
      return [...q.drop.low, ...q.drop.mid, ...q.drop.high].includes(id);
    });
    for (const h of all) expect(has(h, a) && has(h, b)).toBe(true);
    // 每條路線顯示它拿得到的想要物品;全部都要時就是所有已選物品
    for (const h of all) expect(h.got).toEqual(l.items().map((i) => i.name));
    fixture.detectChanges();
    expect(el.querySelector('.rt-hit-items li')?.textContent).toContain(l.items()[0]!.name);
    l.setMatch('any');
    const any = l.hits().filter((h) => h.sea === si.sea.sea);
    for (const h of any) expect(has(h, a) || has(h, b)).toBe(true);
    for (const h of any) expect(h.got.length).toBeGreaterThan(0);
    expect(any.length).toBeGreaterThanOrEqual(all.length);
    l.toggle(a);
    expect(l.itemIds()).toEqual([b]);
  });

  it('重選物品:全部清除後回到展開的挑選區', async () => {
    await mount();
    l.toggle(commonItem());
    fixture.detectChanges();
    btn('全部清除').click();
    expect(l.itemIds()).toEqual([]);
    expect(l.pickerExpanded()).toBe(true);
  });

  it('收合:沒選物品一律展開;選物品不自動收;按「看路線」才收,收合後路線仍在,「修改物品」再展開', async () => {
    await mount();
    expect(l.pickerExpanded()).toBe(true);
    expect(el.querySelector('.rt-pick-scroll')).not.toBeNull();
    expect(el.textContent).not.toContain('看路線');
    l.toggle(commonItem());
    fixture.detectChanges();
    expect(el.querySelector('.rt-pick-scroll')).not.toBeNull(); // 選了不自動收,可以繼續複選
    btn('看路線 ›').click();
    fixture.detectChanges();
    expect(el.querySelector('.rt-pick-scroll')).toBeNull();
    expect(el.querySelector('.rt-chip.active')?.textContent).toContain(l.items()[0]!.name); // 摘要列仍看得到已選物品
    expect(el.querySelectorAll('.rt-card').length).toBeGreaterThan(0);
    btn('修改物品').click();
    fixture.detectChanges();
    expect(el.querySelector('.rt-pick-scroll')).not.toBeNull();
    expect(el.querySelectorAll('.rt-card').length).toBeGreaterThan(0);
  });

  it('手算對照:古典水壺的每條路線,距離 / 耗用 / 航行時間 / 分數都等於依資料手算', async () => {
    await mount();
    l.toggle(39387);
    fixture.detectChanges();
    expect(l.items().map((i) => i.name)).toEqual(['古典水壺']);
    expect(l.hits().length).toBeGreaterThan(0);
    for (const h of l.hits()) {
      const si = SEA_INDEXES.find((x) => x.sea.sea === h.sea)!;
      // 手算:依序 出發點 → 各站,距離 / 耗用 = 各段矩陣值 + 各站探索值;時間 = ⌊距離 ÷ 巡航 + 720⌋;分數 = 經驗 ÷ 時間
      let prev = 0;
      let dist = 0;
      let rng = 0;
      let exp = 0;
      let fuel = 0;
      for (const id of h.route.order) {
        const p = si.byId.get(id)!;
        const at = si.at.get(id)!;
        dist += si.sea.matrix.distance[prev]![at]! + p.surveyDistance;
        rng += si.sea.matrix.range[prev]![at]! + p.surveyRange;
        exp += p.expReward;
        fuel += p.tankReq;
        prev = at;
      }
      const minutes = Math.floor(dist / vm.stats().speed + 720);
      expect(h.route.cost).toMatchObject({ distance: dist, range: rng, fuel });
      expect(h.route.minutes).toBe(minutes);
      expect(h.route.score).toBeCloseTo(exp / minutes, 9);
      // 路線裡至少有一站在目前探索值下拿得到古典水壺
      expect(h.route.order.some((id) => { const p = si.byId.get(id)!; return p.drop.low.includes(39387) || (p.drop.mid.includes(39387) && vm.stats().surveillance >= p.statReq.surveillanceMid) || (p.drop.high.includes(39387) && vm.stats().surveillance >= p.statReq.surveillanceHigh); })).toBe(true);
    }
  });
});
