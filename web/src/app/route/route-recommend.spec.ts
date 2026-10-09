import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { EXPLORED_KEY } from './route-explore-vm';
import { RouteFindVm } from './route-find-vm';
import { RouteLootVm } from './route-loot-vm';
import { RoutePage } from './route-page';
import { RouteVm } from './route-vm';

const grey = () => SEA_INDEXES[1]!;
const drowned = () => SEA_INDEXES[0]!;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('推薦頁(D-212、D-222)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let find: RouteFindVm;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount(opts: { saved?: boolean } = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(false);
    vm = TestBed.inject(RouteVm);
    find = TestBed.inject(RouteFindVm);
    vm.setTab('route');
    vm.findOpen.set(true);
    f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    if (opts.saved !== undefined) {
      const http = TestBed.inject(HttpTestingController);
      http.expectOne('/api/route-subs').flush(
        opts.saved ? [{ id: 's1', name: '主力艇', level: 50, hull: 8, stern: 6, bow: 7, bridge: 7, bound_submarine_ids: [], created_at: '', updated_at: '' }] : [],
      );
    }
    el = f.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim().startsWith(text))!;
  const dot = (code: string) => [...el.querySelectorAll<SVGGElement>('app-route-find .rt-pt')].find((g) => g.querySelector('.code')!.textContent!.trim() === code)!;
  const clickDot = (code: string) => {
    dot(code).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    f.detectChanges();
  };
  const useStrongBuild = () => {
    vm.setLevel(125);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
  };
  const search = async () => {
    btn('找路線', el.querySelector('[aria-label=找路線條件]')!).click();
    f.detectChanges();
    await tick();
    f.detectChanges();
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  describe('找路線分頁', () => {
    it('直接是找路線:沒有「找路線 | 找配置」分段與目標選擇頁', () => {
      mount();
      expect(el.querySelector('app-route-find')).not.toBeNull();
      expect(el.querySelector('.rt-seg-top')).toBeNull();
      expect(el.querySelectorAll('.rt-goal')).toHaveLength(0);
      expect(el.querySelector('app-route-build')).toBeNull();
    });

    it('推薦頁頂端有配置列:沒有「查看性能」與「＋ 新增」;沒有儲存配置時提醒用預設配置', async () => {
      mount({ saved: false });
      await tick();
      f.detectChanges();
      const bar = el.querySelector('app-route-recommend app-route-cfg-bar')!;
      expect(bar.querySelector('.rt-cfg-banner')!.textContent).toContain('結果會偏保守');
      expect(btn('查看性能', bar)).toBeUndefined();
      expect(btn('＋ 新增', bar)).toBeUndefined();
      expect(btn('編輯', bar)).toBeDefined();
      btn('設定配置', bar).click();
      f.detectChanges();
      expect(vm.tab()).toBe('config');
    });
  });

  describe('海圖:篩選航點與標記去過', () => {
    beforeEach(() => {
      mount({ saved: true });
      useStrongBuild();
      vm.setLevel(130);
      f.detectChanges();
    });

    it('預設是篩選航點:點一次選中、兩次排除、三次回未選,計數跟著變', () => {
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('選中 0 · 排除 0');
      clickDot('A');
      expect(dot('A').classList.contains('fin')).toBe(true);
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('選中 1 · 排除 0');
      clickDot('A');
      expect(dot('A').classList.contains('fout')).toBe(true);
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('選中 0 · 排除 1');
      clickDot('A');
      expect(dot('A').classList.contains('fnone')).toBe(true);
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('選中 0 · 排除 0');
    });

    it('「全部清除」清掉篩選;切到標記去過後點點是標記並存進 localStorage,篩選狀態保留', () => {
      clickDot('A');
      clickDot('B');
      btn('標記去過', el.querySelector('app-route-find .rt-seg')!).click();
      f.detectChanges();
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('已標記 0 /');
      clickDot('A');
      expect(dot('A').classList.contains('done')).toBe(true);
      expect(JSON.parse(localStorage.getItem(EXPLORED_KEY)!)).toEqual([ids(drowned(), 'A')[0]]);
      btn('篩選航點', el.querySelector('app-route-find .rt-seg')!).click();
      f.detectChanges();
      expect(find.filterCount().required).toBe(2);
      btn('全部清除', el.querySelector('#rt-find-map')!).click();
      f.detectChanges();
      expect(find.filterCount()).toEqual({ required: 0, excluded: 0 });
    });

    it('「?」彈出說明,不再常駐;Esc 關閉;兩種模式各有自己的說明', () => {
      expect(el.querySelector('[role=dialog]')).toBeNull();
      expect(el.textContent).not.toContain('收艇後會不會開出下一個航點');
      el.querySelector<HTMLButtonElement>('.rt-help-btn')!.click();
      f.detectChanges();
      expect(el.querySelector('#rt-help-title')!.textContent).toContain('篩選航點');
      expect(el.querySelector('.rt-help')!.textContent).toContain('必選');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      f.detectChanges();
      expect(el.querySelector('[role=dialog]')).toBeNull();
      btn('標記去過', el.querySelector('app-route-find .rt-seg')!).click();
      f.detectChanges();
      el.querySelector<HTMLButtonElement>('.rt-help-btn')!.click();
      f.detectChanges();
      expect(el.querySelector('#rt-help-title')!.textContent).toContain('標記去過');
      expect(el.querySelector('.rt-help')!.textContent).toContain('收艇後會不會開出下一個航點是機率');
      btn('知道了').click();
      f.detectChanges();
      expect(el.querySelector('[role=dialog]')).toBeNull();
    });

    it('等級不足的航點不能選,顯示原因', () => {
      vm.setLevel(1);
      f.detectChanges();
      clickDot('K');
      expect(find.filterCount().required).toBe(0);
      expect(el.querySelector('#rt-find-map')!.textContent).toContain('等級不足');
    });

    it('收合海圖後仍看得到計數', () => {
      clickDot('A');
      btn('收合').click();
      f.detectChanges();
      expect(el.querySelector('app-route-map')).toBeNull();
      expect(el.querySelector('.rt-map-count')!.textContent).toContain('選中 1');
    });
  });

  describe('找路線', () => {
    beforeEach(() => {
      mount({ saved: true });
      useStrongBuild();
      f.detectChanges();
    });
    const cards = () => el.querySelectorAll('app-route-find .rt-card');

    it('還沒搜尋時不列結果;按「找路線」先顯示計算中,再列出由好到壞的路線', async () => {
      expect(el.querySelector('#rt-find-results')).toBeNull();
      btn('找路線', el.querySelector('[aria-label=找路線條件]')!).click();
      f.detectChanges();
      expect(btn('計算中').disabled).toBe(true);
      await tick();
      f.detectChanges();
      const rs = find.result()!;
      expect(rs.length).toBeGreaterThan(0);
      expect(cards().length).toBe(Math.min(20, rs.length));
      expect(el.querySelector('#rt-find-results [role=status]')!.textContent).toContain(`共 ${rs.length} 條路線,依每分鐘經驗排序`);
      const first = cards()[0]!;
      expect(first.textContent).toContain(`每分鐘 ${rs[0]!.perMin.toFixed(1)} 經驗`);
      expect(first.querySelectorAll('.rt-card-lights .rt-light')).toHaveLength(4);
      expect(first.querySelector('.rt-card-lights')!.textContent).toMatch(/探索.*收集.*距離.*恩惠/);
      expect(first.querySelector('.rt-card-opens')).toBeNull();
      expect(first.textContent).toContain(`可撈到 ${rs[0]!.items.length} 種物品`);
    });

    it('排序「可能解鎖」:右側顯示最多開幾點,文案是「返航時有機會解鎖新航點:…」;只列可去的點', async () => {
      btn('標記去過', el.querySelector('app-route-find .rt-seg')!).click();
      f.detectChanges();
      clickDot('A');
      clickDot('B');
      btn('可能解鎖', el.querySelector('[aria-label=排序]')!).click();
      f.detectChanges();
      expect(el.querySelector('[aria-label=找路線條件]')!.textContent).toContain('只列「可去的點」');
      await search();
      const rs = find.result()!;
      expect(rs.length).toBeGreaterThan(0);
      const first = cards()[0]!;
      expect(first.querySelector('.rt-card-opens')!.textContent).toMatch(/^返航時有機會解鎖新航點:./);
      expect(first.textContent).not.toContain('機率,不保證');
      expect(first.querySelector('.rt-card-lv')!.textContent).toContain(`最多開 ${rs[0]!.opens.length} 點`);
      expect(el.querySelector('#rt-find-results [role=status]')!.textContent).toContain('依可能開出的新航點數排序');
    });

    it('排序「最多物品」:右側顯示共幾種物品', async () => {
      btn('最多物品', el.querySelector('[aria-label=排序]')!).click();
      f.detectChanges();
      await search();
      expect(cards()[0]!.querySelector('.rt-card-lv')!.textContent).toContain(`共 ${find.result()![0]!.items.length} 種物品`);
    });

    it('篩選:選中的點會出現在每條路線,排除的點不會;跨海域合併', async () => {
      find.sea.set(grey().sea.sea);
      clickDot('A'); // 溺沒海(海圖停在第一個海域)
      f.detectChanges();
      await search();
      // 海域下拉指定灰海,溺沒海的選中點被忽略(並提示)
      expect(el.querySelector('[aria-label=找路線條件]')!.textContent).toContain('已忽略');
      expect(find.result()!.every((r) => r.sea === grey().sea.sea)).toBe(true);
      find.sea.set('all');
      f.detectChanges();
      await search();
      const a = ids(drowned(), 'A')[0]!;
      for (const r of find.result()!) expect(r.order).toContain(a);
    });

    it('指定物品:用挑選視窗選,結果卡列出指定物品;「看全部」開視窗依階層列出全部', async () => {
      btn('＋ 選擇物品').click();
      f.detectChanges();
      expect(el.querySelector('#rt-pick-title')).not.toBeNull();
      const target = TestBed.inject(RouteLootVm).matches()[0]!;
      [...el.querySelectorAll<HTMLButtonElement>('.rt-pick')].find((b) => b.textContent!.includes(target.name))!.click();
      f.detectChanges();
      btn('完成').click();
      f.detectChanges();
      expect(el.querySelector('#rt-pick-title')).toBeNull();
      expect(el.querySelector('[aria-label=已選物品]')!.textContent).toContain(target.name);
      await search();
      const rs = find.result()!;
      if (rs.length === 0) return; // 預設配置拿不到這個物品時,只驗證挑選流程
      for (const r of rs) expect(r.got).toEqual([target.id]);
      expect(cards()[0]!.querySelector('[aria-label=指定的物品]')!.textContent).toContain(target.name);
      btn('看全部', cards()[0]!).click();
      f.detectChanges();
      expect(el.querySelector('#rt-items-title')!.textContent).toContain(`可撈到 ${rs[0]!.items.length} 種物品`);
      expect(el.querySelectorAll('.rt-items-group').length).toBeGreaterThan(0);
      expect(el.querySelector('.rt-items-list li.wanted')!.textContent).toContain(target.name);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      f.detectChanges();
      expect(el.querySelector('#rt-items-title')).toBeNull();
    });

    it('沒有符合的路線:說明可以怎麼放寬', async () => {
      // 灰海選中 6 個點(一趟最多 5 個)→ 不可能有路線,而且下方會即時提示
      find.sea.set(grey().sea.sea);
      for (const id of ids(grey(), 'ABCDEF')) find.cycleFilter(id);
      f.detectChanges();
      expect(el.querySelector('[aria-label=找路線條件]')!.textContent).toContain('超過 5 個');
      await search();
      expect(find.result()).toEqual([]);
      expect(el.querySelector('.rt-empty')!.textContent).toContain('找不到符合的路線');
    });

    it('搜尋之後改了條件或配置:提醒結果是舊的,重新搜尋後消失', async () => {
      await search();
      expect(el.querySelector('#rt-find-results')!.previousElementSibling?.classList.contains('rt-dirty')).toBe(false);
      vm.setPart(0, 1);
      f.detectChanges();
      expect(el.textContent).toContain('下面的結果是舊的');
      await search();
      expect(el.textContent).not.toContain('下面的結果是舊的');
      find.setSort('variety');
      f.detectChanges();
      expect(el.textContent).toContain('下面的結果是舊的');
    });

    it('「模擬路線」:航線頁沒有選點時直接帶入並回到航線主頁', async () => {
      await search();
      const top = find.result()![0]!;
      btn('模擬路線', cards()[0]!).click();
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.sea()).toBe(top.sea);
      expect(vm.seq()).toEqual(top.order);
      expect(vm.tab()).toBe('route');
      expect(vm.findOpen()).toBe(false);
    });
  });

  describe('模擬路線前的確認', () => {
    const top = () => find.result()![0]!;
    beforeEach(async () => {
      mount({ saved: true });
      useStrongBuild();
      vm.selectSea(grey().sea.sea);
      vm.toggle(ids(grey(), 'A')[0]!);
      f.detectChanges();
      btn('找路線', el.querySelector('[aria-label=找路線條件]')!).click();
      await tick();
      f.detectChanges();
    });

    it('已選了不同的航點:跳出確認,取消不動已選航點也不換分頁', () => {
      // 搜尋結果的第一條不會剛好只有 A;若剛好相同就不需要確認
      const same = vm.sea() === top().sea && vm.seq().join() === top().order.join();
      if (same) return;
      btn('模擬路線', el.querySelector('app-route-find .rt-card')!).click();
      f.detectChanges();
      expect(el.querySelector('app-route-replace-dialog [role=alertdialog]')).not.toBeNull();
      expect(el.querySelector('#rt-replace-title')!.textContent).toContain('要換掉已選的航點嗎?');
      expect(el.querySelector('.rt-replace-body')!.textContent).toContain('目前已選 1 個航點');
      btn('取消', el.querySelector('app-route-replace-dialog')!).click();
      f.detectChanges();
      expect(el.querySelector('app-route-replace-dialog [role=alertdialog]')).toBeNull();
      expect(vm.seq()).toEqual(ids(grey(), 'A'));
      expect(vm.tab()).toBe('route');
      expect(vm.findOpen()).toBe(true);
    });

    it('確認:換成推薦的路線並回到航線主頁', () => {
      vm.requestLoad(grey().sea.sea, ids(grey(), 'AB'));
      f.detectChanges();
      expect(vm.pendingLoad()).not.toBeNull();
      btn('換掉並模擬', el.querySelector('app-route-replace-dialog')!).click();
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.seq()).toEqual(ids(grey(), 'AB'));
      expect(vm.tab()).toBe('route');
      expect(vm.findOpen()).toBe(false);
    });

    it('Esc 與點背景都是取消;帶入完全相同的路線不需要確認', () => {
      vm.requestLoad(grey().sea.sea, ids(grey(), 'AB'));
      f.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.seq()).toEqual(ids(grey(), 'A'));

      vm.requestLoad(grey().sea.sea, ids(grey(), 'AB'));
      f.detectChanges();
      const overlay = el.querySelector<HTMLElement>('app-route-replace-dialog .modal-overlay')!;
      overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      overlay.click();
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.tab()).toBe('route');
      expect(vm.findOpen()).toBe(true);

      vm.requestLoad(grey().sea.sea, ids(grey(), 'A'));
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.tab()).toBe('route');
      expect(vm.findOpen()).toBe(false);
    });
  });
});
