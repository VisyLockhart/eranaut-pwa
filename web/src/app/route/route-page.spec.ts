import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RoutePage } from './route-page';
import { RouteFindVm } from './route-find-vm';
import { RouteVm } from './route-vm';

const g = () => SEA_INDEXES[1]!; // 灰海

describe('RoutePage', () => {
  let el: HTMLElement;
  let vm: RouteVm;

  function mount(desktop = false, tab: 'config' | 'route' = 'route') {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(desktop);
    vm = TestBed.inject(RouteVm);
    vm.setTab(tab);
    const f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    el = f.nativeElement as HTMLElement;
    return f;
  }
  const point = (code: string) => {
    const label = `${code} `;
    return [...el.querySelectorAll<SVGGElement>('.rt-pt')].find((n) => n.getAttribute('aria-label')?.startsWith(label))!;
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('地圖畫出全部航點與全部連線(RS-09)', () => {
    mount();
    vm.selectSea(2);
    TestBed.tick();
    expect(el.querySelectorAll('.rt-pt')).toHaveLength(g().sea.points.length);
    expect(el.querySelectorAll('.rt-link')).toHaveLength(g().sea.links.length);
    expect(el.querySelector('.rt-home')).not.toBeNull();
  });

  it('點航點依序加入;摘要列顯示航行時間、返航時刻與燃料;再點取消', () => {
    const f = mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    f.detectChanges();
    for (const c of ['D', 'G', 'F', 'K']) {
      point(c).dispatchEvent(new Event('click'));
      f.detectChanges();
    }
    expect(vm.seq()).toEqual(ids(g(), 'DGFK'));
    expect(el.querySelectorAll('.rt-picked li')).toHaveLength(4);
    const nums = [...el.querySelectorAll('.rt-stat .num')].map((n) => n.textContent?.trim());
    expect(nums[0]).toBe('1日10小時25分');
    expect(nums[2]).toBe('24');
    expect(el.querySelector('.rt-meter-row')?.textContent).toContain('87');
    expect(point('D').classList.contains('sel')).toBe(true);
    point('G').dispatchEvent(new Event('click'));
    f.detectChanges();
    expect(vm.seq()).toEqual(ids(g(), 'DFK'));
  });

  it('反灰的航點點了不會加入,並顯示原因', () => {
    const f = mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
    f.detectChanges();
    const other = [...el.querySelectorAll<SVGGElement>('.rt-pt.off')][0]!;
    expect(other).toBeDefined();
    other.dispatchEvent(new Event('click'));
    f.detectChanges();
    expect(vm.seq()).toHaveLength(4);
    expect(el.querySelector('.rt-hint')?.textContent).toMatch(/超過|最多|等級/);
    expect(other.getAttribute('aria-disabled')).toBe('true');
  });

  it('海域翻頁:換海域清空已選;第一個海域的「上一個」停用', () => {
    const f = mount();
    vm.selectSea(1);
    f.detectChanges();
    const [prev, next] = [...el.querySelectorAll<HTMLButtonElement>('.rt-pager .pager-btn')];
    expect(prev!.disabled).toBe(true);
    vm.toggle(vm.seaIdx().sea.points[0]!.id);
    next!.click();
    f.detectChanges();
    expect(vm.sea()).toBe(2);
    expect(vm.seq()).toEqual([]);
  });

  it('航點頁沒有等級輸入框;配置列顯示目前配置、距離上限與四個燈號', () => {
    mount();
    expect(el.querySelector('#rt-level')).toBeNull();
    const bar = el.querySelector('.rt-cfgbar')!;
    expect(bar.textContent).toContain('距離上限');
    expect(bar.querySelectorAll('.rt-light')).toHaveLength(4);
    // 沒選航點時燈號中性
    expect(bar.querySelectorAll('.rt-light.g-plain')).toHaveLength(4);
  });

  it('燈號依目前配置對路線判定;「查看性能」開啟性能彈窗', () => {
    const f = mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
    f.detectChanges();
    expect(el.querySelectorAll('.rt-light.g-plain')).toHaveLength(0);
    expect(el.querySelector('.rt-perf')).toBeNull();
    [...el.querySelectorAll<HTMLButtonElement>('.rt-cfgbar button')].find((b) => b.textContent?.trim() === '查看性能')!.click();
    f.detectChanges();
    expect(vm.perfOpen()).toBe(true);
    expect(el.querySelector('.rt-perf')).not.toBeNull();
  });

  it('沒有儲存配置時顯示預設配置提示,「設定配置」切到配置頁', () => {
    const f = mount();
    vm.loaded.set(true);
    f.detectChanges();
    const banner = el.querySelector('.rt-cfg-banner')!;
    expect(banner.textContent).toContain('預設配置');
    banner.querySelector('button')!.click();
    f.detectChanges();
    expect(vm.tab()).toBe('config');
    expect(el.querySelector('app-route-editor')).not.toBeNull();
  });

  it('「編輯」/「＋ 新增」從航點頁開啟配置對話框', () => {
    const f = mount();
    const find = (t: string) => [...el.querySelectorAll<HTMLButtonElement>('.rt-cfgbar button')].find((b) => b.textContent?.trim() === t)!;
    find('編輯').click();
    f.detectChanges();
    expect(vm.draft()?.mode).toBe('temp');
    expect(el.querySelector('.rt-dlg')).not.toBeNull();
    vm.closeConfig();
    find('＋ 新增').click();
    expect(vm.draft()?.mode).toBe('new');
  });

  it('「最短順序」重排、「清除」清空', () => {
    const f = mount();
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'F', 'G', 'K']) vm.toggle(ids(g(), c)[0]!);
    f.detectChanges();
    const link = (t: string) => [...el.querySelectorAll<HTMLButtonElement>('.rt-actions .rt-link-btn')].find((b) => b.textContent?.trim() === t)!;
    const shortest = link('最短順序');
    const clear = link('清除');
    shortest.click();
    expect(vm.seq()).toEqual(ids(g(), 'DGFK'));
    clear.click();
    expect(vm.seq()).toEqual([]);
  });

  it('桌機版也渲染同樣內容', () => {
    mount(true);
    expect(el.querySelector('.d-title')?.textContent).toContain('航線模擬');
    expect(el.querySelector('.rt-map')).not.toBeNull();
  });

  it('沒選航點時摘要列顯示破折號', () => {
    mount();
    expect([...el.querySelectorAll('.rt-stat .num')].map((n) => n.textContent?.trim())).toEqual(['—', '—', '—']);
  });

  it('分頁順序:配置 / 航線;切換時選取狀態保留', () => {
    const f = mount();
    vm.selectSea(2);
    vm.toggle(ids(g(), 'D')[0]!);
    f.detectChanges();
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('.rt-tabs .up-tab')];
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['配置', '航線']);
    expect(el.querySelector('.rt-view-map')).not.toBeNull();
    expect(el.querySelector('app-route-recommend')).toBeNull();
    tabs[0]!.click();
    f.detectChanges();
    expect(el.querySelector('app-route-editor')).not.toBeNull();
    tabs[1]!.click();
    f.detectChanges();
    expect(el.querySelector('.rt-map')).not.toBeNull();
    expect(vm.seq()).toEqual(ids(g(), 'D'));
  });

  describe('航線頁的「找路線」子頁(D-224)', () => {
    const cta = () => [...el.querySelectorAll<HTMLButtonElement>('.rt-plan-head button')].find((b) => b.textContent?.includes('找路線'))!;

    it('主頁標題列有琥珀色「找路線」按鈕,點了切成子頁,「‹ 航線」返回;選點不丟', () => {
      const f = mount();
      vm.selectSea(2);
      vm.toggle(ids(g(), 'D')[0]!);
      f.detectChanges();
      expect(cta().classList.contains('rt-cta')).toBe(true);
      cta().click();
      f.detectChanges();
      expect(vm.findOpen()).toBe(true);
      expect(el.querySelector('app-route-recommend')).not.toBeNull();
      expect(el.querySelector('.rt-view-map')).toBeNull();
      [...el.querySelectorAll<HTMLButtonElement>('app-route-recommend .rt-subhead button')].find((b) => b.textContent?.includes('航線'))!.click();
      f.detectChanges();
      expect(vm.findOpen()).toBe(false);
      expect(el.querySelector('.rt-view-map')).not.toBeNull();
      expect(vm.seq()).toEqual(ids(g(), 'D'));
    });

    it('換分頁再回來,子頁仍開著(狀態在 VM)', () => {
      const f = mount();
      vm.findOpen.set(true);
      f.detectChanges();
      vm.setTab('config');
      f.detectChanges();
      vm.setTab('route');
      f.detectChanges();
      expect(el.querySelector('app-route-recommend')).not.toBeNull();
    });

    it('已選清單是空的:提示下方有「或讓它幫你找路線」', () => {
      const f = mount();
      const hint = [...el.querySelectorAll<HTMLButtonElement>('.rt-empty button')].find((b) => b.textContent?.includes('幫你找路線'))!;
      hint.click();
      f.detectChanges();
      expect(vm.findOpen()).toBe(true);
    });

    it('選填晶片「用目前選的 N 個點當必選」:有選點才出現,按了設為必選並切到該海域', () => {
      const f = mount();
      const find = TestBed.inject(RouteFindVm);
      cta().click();
      f.detectChanges();
      expect(el.textContent).not.toContain('當必選');
      vm.setTab('route');
      vm.findOpen.set(false);
      vm.selectSea(2);
      const two = [ids(g(), 'D')[0]!, ids(g(), 'G')[0]!];
      for (const id of two) vm.toggle(id);
      f.detectChanges();
      cta().click();
      f.detectChanges();
      const chip = [...el.querySelectorAll<HTMLButtonElement>('app-route-find .rt-use-route button')][0]!;
      expect(chip.textContent).toContain('2 個點當必選');
      find.excluded.set(new Set([two[0]!]));
      chip.click();
      f.detectChanges();
      expect([...find.required()].sort()).toEqual([...two].sort());
      expect(find.excluded().size).toBe(0);
      expect(find.x.viewSea()).toBe(2);
      expect(find.mode()).toBe('filter');
    });
  });

  it('沒記錄過分頁時第一次進來是配置頁', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    vm = TestBed.inject(RouteVm);
    const f = TestBed.createComponent(RoutePage);
    f.detectChanges();
    expect(vm.tab()).toBe('config');
    expect((f.nativeElement as HTMLElement).querySelector('app-route-editor')).not.toBeNull();
  });

  it('頁尾有「資料來源與授權」說明(CC BY-NC-SA 3.0、不適用 MIT、非官方)', () => {
    mount();
    const about = el.querySelector('.rt-about')!;
    expect(about.querySelector('summary')?.textContent).toContain('資料來源與授權');
    const text = about.textContent!;
    expect(text).toContain('灰機 wiki');
    expect(text).toContain('Eclair Falcie@Hades');
    expect(text).toContain('CC BY-NC-SA 3.0');
    expect(text).toContain('不適用本專案的 MIT 授權');
    expect(text).toContain('非官方');
    expect(about.querySelector('a')?.getAttribute('rel')).toContain('noopener');
  });
  it('燈號可點開路線需求:沒選航點有說明,選了之後列出門檻', () => {
    const f = mount();
    const lights = () => el.querySelector<HTMLButtonElement>('button.rt-lights')!;
    expect(el.querySelector('.rt-needbox')).toBeNull();
    expect(lights().getAttribute('aria-expanded')).toBe('false');
    lights().click();
    f.detectChanges();
    expect(lights().getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.rt-needbox')?.textContent).toContain('選了航點之後');
    vm.selectSea(2);
    vm.setLevel(76);
    for (const c of ['D', 'G']) vm.toggle(ids(g(), c)[0]!);
    f.detectChanges();
    const rows = [...el.querySelectorAll('.rt-need-row')].map((r) => r.textContent!.replace(/\s+/g, ''));
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain('探索');
    expect(rows[0]).toContain(`中${vm.need().surveillanceMid}`);
    lights().click();
    f.detectChanges();
    expect(el.querySelector('.rt-needbox')).toBeNull();
  });

  it('已選航點預設收合,列上有三階摘要;點開才顯示打撈物,點 ✕ 只取消航點', () => {
    const f = mount();
    vm.selectSea(2);
    vm.setLevel(76);
    for (const c of ['D', 'G']) vm.toggle(ids(g(), c)[0]!);
    f.detectChanges();
    expect(el.querySelectorAll('.rt-picked li')).toHaveLength(2);
    expect(el.querySelector('.rt-stop-loot')).toBeNull();
    expect(el.querySelectorAll('.rt-picked li')[0]!.querySelectorAll('.rt-tier-sum i')).toHaveLength(3);
    const toggle = () => el.querySelectorAll<HTMLButtonElement>('.rt-stop-toggle')[0]!;
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    toggle().click();
    f.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('.rt-stop-loot')).toHaveLength(1);
    expect(el.querySelector('.rt-stop-loot')!.textContent).toContain('低階');
    toggle().click();
    f.detectChanges();
    expect(el.querySelector('.rt-stop-loot')).toBeNull();
    el.querySelectorAll<HTMLButtonElement>('.rt-x')[0]!.click();
    f.detectChanges();
    expect(vm.seq()).toHaveLength(1);
  });

  describe('手機浮動功能鈕(D-209)', () => {
    type Cb = (entries: { isIntersecting: boolean }[]) => void;
    let cb: Cb | null;
    const g0 = globalThis as unknown as { IntersectionObserver?: unknown };
    let original: unknown;

    beforeEach(() => {
      cb = null;
      original = g0.IntersectionObserver;
      g0.IntersectionObserver = class {
        constructor(fn: Cb) { cb = fn; }
        observe(): void {}
        disconnect(): void {}
      };
    });
    afterEach(() => { g0.IntersectionObserver = original; });

    const fab = () => el.querySelector<HTMLButtonElement>('.rt-fab');
    const items = () => [...el.querySelectorAll<HTMLButtonElement>('.rt-fab-item')];

    it('分頁列在畫面內不顯示;捲出去才出現', () => {
      const f = mount();
      expect(fab()).toBeNull();
      cb!([{ isIntersecting: false }]);
      f.detectChanges();
      expect(fab()).not.toBeNull();
      cb!([{ isIntersecting: true }]);
      f.detectChanges();
      expect(fab()).toBeNull();
    });

    it('桌機不顯示', () => {
      const f = mount(true);
      cb?.([{ isIntersecting: false }]);
      f.detectChanges();
      expect(fab()).toBeNull();
    });

    it('點開有兩個分頁加回到頂部,目前分頁打勾;選分頁會切換、回到頂部並收起', () => {
      const f = mount();
      cb!([{ isIntersecting: false }]);
      f.detectChanges();
      const body = el.querySelector<HTMLElement>('.rt-m-body')!;
      body.scrollTop = 400;
      fab()!.click();
      f.detectChanges();
      expect(fab()!.getAttribute('aria-expanded')).toBe('true');
      expect(items().map((b) => b.textContent?.trim())).toEqual(['配置', '航線', '回到頂部']);
      expect(items()[1]!.getAttribute('aria-checked')).toBe('true');
      items()[0]!.click();
      f.detectChanges();
      expect(vm.tab()).toBe('config');
      expect(body.scrollTop).toBe(0);
      expect(el.querySelector('.rt-fab-menu')).toBeNull();
    });

    it('回到頂部只捲動不換分頁;Esc 與點外面會收起', () => {
      const f = mount();
      cb!([{ isIntersecting: false }]);
      f.detectChanges();
      const body = el.querySelector<HTMLElement>('.rt-m-body')!;
      body.scrollTop = 300;
      fab()!.click();
      f.detectChanges();
      items()[2]!.click();
      f.detectChanges();
      expect(vm.tab()).toBe('route');
      expect(body.scrollTop).toBe(0);
      fab()!.click();
      f.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      f.detectChanges();
      expect(el.querySelector('.rt-fab-menu')).toBeNull();
      fab()!.click();
      f.detectChanges();
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      f.detectChanges();
      expect(el.querySelector('.rt-fab-menu')).toBeNull();
    });
  });

  it('返航時刻上下排版:日期一行、時間一行;沒選航點時是破折號', () => {
    const f = mount();
    expect(el.querySelectorAll('.rt-stat .num')[1]?.textContent?.trim()).toBe('—');
    vm.selectSea(2);
    vm.toggle(ids(g(), 'D')[0]!);
    f.detectChanges();
    expect(el.querySelector('.rt-ret-date')?.textContent).toMatch(/^\d{2}\/\d{2}$/);
    expect(el.querySelector('.rt-ret-time')?.textContent).toMatch(/^\d{2}:\d{2}$/);
  });
});
