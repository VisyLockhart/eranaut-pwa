import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteExpVm } from './route-exp-vm';
import { RoutePage } from './route-page';
import { RouteVm } from './route-vm';

const grey = () => SEA_INDEXES[1]!;
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe('推薦頁(D-212)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let exp: RouteExpVm;
  let f: ReturnType<typeof TestBed.createComponent<RoutePage>>;

  function mount(opts: { saved?: boolean } = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(false);
    vm = TestBed.inject(RouteVm);
    exp = TestBed.inject(RouteExpVm);
    vm.setTab('recommend');
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
  const useStrongBuild = () => {
    vm.setLevel(125);
    [10, 10, 10, 10].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  describe('目標選擇頁', () => {
    it('分成找路線與找配置兩組,八個目標都能點', () => {
      mount();
      const goals = [...el.querySelectorAll<HTMLButtonElement>('.rt-goal')];
      expect(goals.map((b) => b.querySelector('b')!.textContent)).toEqual(['練級', '探索', '距離', '掉落', '收集', '恩惠', '速度', '進階']);
      expect(goals.map((b) => !b.disabled)).toEqual([true, true, true, true, true, true, true, true]);
      expect(goals.some((b) => b.textContent!.includes('即將推出'))).toBe(false);
      expect(el.querySelectorAll('.rt-goal.build')).toHaveLength(4);
      expect(el.querySelector('.rt-advanced')).toBeNull();
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

    it('點練級進入、「‹ 目標」回來;換分頁再回來仍停在原處', () => {
      mount();
      el.querySelector<HTMLButtonElement>('.rt-goal')!.click();
      f.detectChanges();
      expect(vm.recGoal()).toBe('exp');
      expect(el.querySelector('app-route-exp')).not.toBeNull();
      vm.setTab('map');
      f.detectChanges();
      vm.setTab('recommend');
      f.detectChanges();
      expect(el.querySelector('app-route-exp')).not.toBeNull();
      btn('‹ 目標').click();
      f.detectChanges();
      expect(vm.recGoal()).toBeNull();
      expect(el.querySelectorAll('.rt-goal')).toHaveLength(8);
    });

    it('進階:顯示原本的數字搜尋,「帶入配置」後切到配置頁', () => {
      mount();
      [...el.querySelectorAll<HTMLButtonElement>('.rt-goal')].find((b) => b.textContent!.includes('進階'))!.click();
      f.detectChanges();
      expect(vm.recGoal()).toBe('advanced');
      expect(el.querySelector('app-route-search')).not.toBeNull();
      expect(el.querySelector('.rt-subhead')!.textContent).toContain('進階');
    });
  });

  describe('練級', () => {
    beforeEach(() => {
      mount({ saved: true });
      useStrongBuild();
      vm.recGoal.set('exp');
      f.detectChanges();
    });

    it('還沒搜尋時不列結果;按「找路線」先顯示計算中,再列出由好到壞的路線', async () => {
      expect(el.querySelector('[aria-label=練級結果]')).toBeNull();
      btn('找路線').click();
      f.detectChanges();
      expect(btn('計算中').disabled).toBe(true);
      await tick();
      f.detectChanges();
      const rs = exp.result()!;
      expect(rs.length).toBeGreaterThan(0);
      expect(el.querySelectorAll('app-route-exp .rt-card').length).toBe(Math.min(20, rs.length));
      expect(el.querySelector('[role=status]')!.textContent).toContain(`共 ${rs.length} 條路線,依每分鐘經驗排序`);
      const first = el.querySelector('app-route-exp .rt-card')!;
      expect(first.textContent).toContain(`每分鐘 ${rs[0]!.perMin.toFixed(1)} 經驗`);
      expect(first.querySelectorAll('.rt-card-lights .rt-light')).toHaveLength(4);
      expect(first.querySelector('.rt-card-lights')!.textContent).toMatch(/探索.*收集.*距離.*恩惠/);
    });

    it('篩選條件:海域、航行時間上限、階層、排序都會帶進搜尋', async () => {
      exp.sea.set(grey().sea.sea);
      exp.maxHours.set(24);
      exp.tier.set('mid');
      exp.sort.set('total');
      btn('找路線').click();
      await tick();
      f.detectChanges();
      const rs = exp.result()!;
      expect(rs.length).toBeGreaterThan(0);
      for (const r of rs) {
        expect(r.sea).toBe(grey().sea.sea);
        expect(r.minutes).toBeLessThanOrEqual(24 * 60);
      }
      expect(rs.map((r) => r.exp)).toEqual([...rs.map((r) => r.exp)].sort((a, b) => b - a));
      expect(el.querySelector('[role=status]')!.textContent).toContain('依一趟總經驗排序');
    });

    it('沒有符合的路線:說明可以怎麼放寬', async () => {
      vm.setLevel(1);
      [1, 1, 1, 1].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
      exp.tier.set('high');
      f.detectChanges();
      btn('找路線').click();
      await tick();
      f.detectChanges();
      expect(exp.result()).toEqual([]);
      expect(el.querySelector('.rt-empty')!.textContent).toContain('找不到符合的路線');
    });

    it('搜尋之後改了配置:提醒結果是舊配置算的,重新搜尋後消失', async () => {
      btn('找路線').click();
      await tick();
      f.detectChanges();
      expect(el.querySelector('.rt-dirty')).toBeNull();
      vm.setPart(0, 1);
      f.detectChanges();
      expect(el.querySelector('.rt-dirty')!.textContent).toContain('舊配置');
      btn('找路線').click();
      await tick();
      f.detectChanges();
      expect(el.querySelector('.rt-dirty')).toBeNull();
    });

    it('「帶到航點」:航點頁沒有選點時直接帶入並切到航點頁', async () => {
      btn('找路線').click();
      await tick();
      f.detectChanges();
      const top = exp.result()![0]!;
      btn('帶到航點', el.querySelector('app-route-exp .rt-card')!).click();
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.sea()).toBe(top.sea);
      expect(vm.seq()).toEqual(top.order);
      expect(vm.tab()).toBe('map');
    });
  });

  describe('帶到航點前的確認', () => {
    const top = () => exp.result()![0]!;
    beforeEach(async () => {
      mount({ saved: true });
      useStrongBuild();
      vm.recGoal.set('exp');
      vm.selectSea(grey().sea.sea);
      vm.toggle(ids(grey(), 'A')[0]!);
      f.detectChanges();
      btn('找路線').click();
      await tick();
      f.detectChanges();
    });

    it('已選了不同的航點:跳出確認,取消不動已選航點也不換分頁', () => {
      // 搜尋結果的第一條不會剛好只有 A;若剛好相同就不需要確認
      const same = vm.sea() === top().sea && vm.seq().join() === top().order.join();
      if (same) return;
      btn('帶到航點', el.querySelector('app-route-exp .rt-card')!).click();
      f.detectChanges();
      expect(el.querySelector('app-route-replace-dialog [role=alertdialog]')).not.toBeNull();
      expect(el.querySelector('#rt-replace-title')!.textContent).toContain('要換掉已選的航點嗎?');
      expect(el.querySelector('.rt-replace-body')!.textContent).toContain('目前已選 1 個航點');
      btn('取消', el.querySelector('app-route-replace-dialog')!).click();
      f.detectChanges();
      expect(el.querySelector('app-route-replace-dialog [role=alertdialog]')).toBeNull();
      expect(vm.seq()).toEqual(ids(grey(), 'A'));
      expect(vm.tab()).toBe('recommend');
    });

    it('確認:換成推薦的路線並切到航點頁', () => {
      vm.requestLoad(grey().sea.sea, ids(grey(), 'BC').length ? ids(grey(), 'AB') : []);
      f.detectChanges();
      expect(vm.pendingLoad()).not.toBeNull();
      btn('換掉並前往航點', el.querySelector('app-route-replace-dialog')!).click();
      f.detectChanges();
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.seq()).toEqual(ids(grey(), 'AB'));
      expect(vm.tab()).toBe('map');
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
      expect(vm.tab()).toBe('recommend');

      vm.requestLoad(grey().sea.sea, ids(grey(), 'A'));
      expect(vm.pendingLoad()).toBeNull();
      expect(vm.tab()).toBe('map');
    });
  });
});
