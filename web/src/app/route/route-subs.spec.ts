import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteSubs } from './route-subs';
import { RouteVm } from './route-vm';

const g = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [], favorite: false,
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RouteSubs', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteSubs>>;

  async function mount(saved: RouteSubDto[] = [], expand = true, desktop = false) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    TestBed.inject(Layout).isDesktop.set(desktop);
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RouteSubs);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    if (expand) expandAll();
  }
  /** 手機卡片預設收合成一列(D-237);大部分案例要看燈號與按鈕,先全部展開 */
  function expandAll() {
    el.querySelectorAll<HTMLButtonElement>('.rt-card-quick .rt-link-btn').forEach((b) => b.click());
    fixture.detectChanges();
  }
  const caseC = () => {
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
    fixture.detectChanges();
  };
  const btn = (card: Element, text: string) => [...card.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('案例 C:儲存潛艇卡片判定距離 98 達標、時間 1日10小時25分', async () => {
    await mount([dto()]);
    caseC();
    const cards = el.querySelectorAll('.rt-card');
    expect(cards).toHaveLength(2); // 目前配置 + 一組儲存潛艇
    const range = [...cards[1]!.querySelectorAll('.rt-chip5')].find((c) => c.textContent?.includes('距離'))!;
    expect(range.textContent).toContain('98');
    expect(range.classList.contains('g-full')).toBe(true);
    expect(cards[1]!.textContent).toContain('1日10小時25分');
  });

  it('配置不足的儲存潛艇:恩惠未達,顯示「差 N」', async () => {
    await mount([dto({ id: 'w', name: '弱艇', level: 76, hull: 1, stern: 1, bow: 1, bridge: 1 })]);
    caseC();
    const card = el.querySelectorAll('.rt-card')[1]!;
    const favor = [...card.querySelectorAll('.rt-chip5')].find((c) => c.textContent?.includes('恩惠'))!;
    expect(favor.classList.contains('g-none')).toBe(true);
    expect(favor.textContent).toMatch(/差 \d+/);
    expect(card.classList.contains('ok')).toBe(false);
  });

  it('帶入:切換使用中的儲存潛艇', async () => {
    await mount([dto()]);
    caseC();
    const card = el.querySelectorAll('.rt-card')[1]!;
    btn(card, '使用').click();
    fixture.detectChanges();
    expect(vm.subId()).toBe('a');
    // 畫面上的配置就是這一組 → 臨時配置卡消失,只剩這一組(使用中)
    expect(el.querySelectorAll('.rt-card')).toHaveLength(1);
    expect(btn(el.querySelectorAll('.rt-card')[0]!, '使用中').disabled).toBe(true);
  });

  it('刪除要按兩次;確定後送出 DELETE 並從清單移除', async () => {
    await mount([dto()]);
    caseC();
    btn(el.querySelectorAll('.rt-card')[1]!, '刪除').click();
    fixture.detectChanges();
    http.expectNone('/api/route-subs/a');
    btn(el.querySelectorAll('.rt-card')[1]!, '確定刪除').click();
    http.expectOne('/api/route-subs/a').flush(null, { status: 204, statusText: 'No Content' });
    await settle();
    fixture.detectChanges();
    expect(vm.saved()).toEqual([]);
    expect(el.querySelectorAll('.rt-card')).toHaveLength(1);
  });

  it('沒選航點:全部中性,不顯示可跑 / 跑不了,航行時間為破折號', async () => {
    await mount([dto()]);
    expect(el.querySelectorAll('.rt-chip5.g-full, .rt-chip5.g-partial, .rt-chip5.g-none')).toHaveLength(0);
    expect(el.querySelector('.rt-badge.ok, .rt-badge.bad')).toBeNull();
    expect(el.querySelectorAll('.rt-card')[0]!.textContent).toContain('航行 —');
  });

  it('可不可以跑目前路線:等級不足或距離不足顯示「跑不了」與原因,並提示會移除幾個航點', async () => {
    await mount([dto(), dto({ id: 'low', name: '低階艇', level: 1, hull: 1, stern: 1, bow: 1, bridge: 1 })]);
    caseC();
    const cards = el.querySelectorAll('.rt-card');
    expect(cards[1]!.textContent).toContain('可跑');
    expect(cards[2]!.textContent).toContain('跑不了');
    expect(cards[2]!.textContent).toMatch(/等級不足|距離不足/);
    expect(cards[2]!.textContent).toMatch(/改用這組會移除 \d+ 個放不下的航點/);
  });

  it('臨時配置卡:不是任何一組儲存配置時才出現,有「編輯」與「儲存」', async () => {
    await mount([dto()]);
    const cards = el.querySelectorAll('.rt-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]!.textContent).toContain('臨時配置');
    btn(cards[0]!, '編輯').click();
    expect(vm.draft()?.mode).toBe('temp');
    vm.closeConfig();
    btn(cards[0]!, '儲存').click();
    expect(vm.draft()?.mode).toBe('new');
  });

  describe('常用、搜尋、分頁、收合(D-237)', () => {
    const many = (n: number, over: (i: number) => Partial<RouteSubDto> = () => ({})) => Array.from({ length: n }, (_, i) => dto({ id: `s${i}`, name: `艇${String(i).padStart(2, '0')}`, ...over(i) }));
    const names = () => [...el.querySelectorAll('.rt-cards .rt-card')].map((c) => c.querySelector('.rt-card-title b')?.textContent?.trim());
    const layout = () => TestBed.inject(Layout);

    it('手機卡片預設收合成一列:有「使用」與「展開」,沒有燈號與編輯;展開後才有', async () => {
      await mount([dto()], false);
      const card = el.querySelectorAll('.rt-card')[1]!;
      expect(card.querySelector('.rt-chips5')).toBeNull();
      expect(btn(card, '使用')).toBeDefined();
      expect(btn(card, '編輯')).toBeUndefined();
      btn(card, '展開').click();
      fixture.detectChanges();
      const open = el.querySelectorAll('.rt-card')[1]!;
      expect(open.querySelector('.rt-chips5')).not.toBeNull();
      expect(btn(open, '編輯')).toBeDefined();
      btn(open, '收合').click();
      fixture.detectChanges();
      expect(el.querySelectorAll('.rt-card')[1]!.querySelector('.rt-chips5')).toBeNull();
    });

    it('手機每頁 6 組、桌機每頁 10 組;臨時配置卡固定在最上面不佔頁數', async () => {
      await mount(many(20), false, false);
      expect(names().filter((n) => n !== '臨時配置')).toHaveLength(6);
      expect(el.querySelector('.rt-listpager .sel-label')?.textContent?.trim()).toBe('1 / 4');
      expect(el.querySelector('.rt-cards .rt-card')?.textContent).toContain('臨時配置');
      layout().isDesktop.set(true);
      fixture.detectChanges();
      expect(names().filter((n) => n !== '臨時配置')).toHaveLength(10);
      expect(el.querySelector('.rt-listpager .sel-label')?.textContent?.trim()).toBe('1 / 2');
    });

    it('換頁顯示該頁的項目', async () => {
      await mount(many(25), false, true);
      (el.querySelectorAll<HTMLButtonElement>('.rt-listpager .pager-btn')[1]!).click();
      fixture.detectChanges();
      expect(names().filter((n) => n !== '臨時配置')[0]).toBe('艇10');
    });

    it('星號:點了立即反映並送 PATCH;位置先不動,換頁後常用才排到最前面', async () => {
      await mount(many(12), false, true);
      const target = [...el.querySelectorAll('.rt-cards .rt-card')].find((c) => c.textContent?.includes('艇05'))!;
      target.querySelector<HTMLButtonElement>('.rt-star')!.click();
      fixture.detectChanges();
      await settle(); // PATCH 在 Promise 串裡依序送出
      const req = http.expectOne((r) => r.url === '/api/route-subs/s5' && r.method === 'PATCH');
      expect(req.request.body).toEqual({ favorite: true });
      req.flush(dto({ id: 's5', name: '艇05', favorite: true }));
      await settle();
      fixture.detectChanges();
      const list = () => names().filter((n) => n !== '臨時配置');
      expect(list()[5]).toBe('艇05'); // 沒有跳位置,下一個要點的星號還在原處
      expect(target.querySelector('.rt-star')!.getAttribute('aria-pressed')).toBe('true');
      expect(vm.saved().find((s) => s.id === 's5')!.favorite).toBe(true);
      const btns = el.querySelectorAll<HTMLButtonElement>('.rt-listpager .pager-btn');
      btns[1]!.click();
      fixture.detectChanges();
      el.querySelectorAll<HTMLButtonElement>('.rt-listpager .pager-btn')[0]!.click();
      fixture.detectChanges();
      expect(list()[0]).toBe('艇05');
    });

    it('超過 8 組才有搜尋與「★ 常用」;搜尋只留符合的,沒有符合顯示空狀態與清除', async () => {
      await mount(many(12, (i) => ({ favorite: i === 7 })), false, true);
      expect(el.querySelector('.rt-listtools')).not.toBeNull();
      const q = el.querySelector<HTMLInputElement>('.rt-lt-q')!;
      q.value = '艇03';
      q.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(names().filter((n) => n !== '臨時配置')).toEqual(['艇03']);
      q.value = '沒有這個';
      q.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(el.querySelector('.rt-lt-empty')?.textContent).toContain('沒有符合的配置');
      btn(el, '清除搜尋與篩選').click();
      fixture.detectChanges();
      expect(names().filter((n) => n !== '臨時配置')).toHaveLength(10);
      btn(el, '★ 常用 1').click();
      fixture.detectChanges();
      expect(names().filter((n) => n !== '臨時配置')).toEqual(['艇07']);
    });

    it('9 組以下不顯示工具列與分頁列', async () => {
      await mount(many(8), false, true);
      expect(el.querySelector('.rt-listtools')).toBeNull();
      expect(el.querySelector('.rt-listpager')).toBeNull();
    });

    it('使用中的配置在後面幾頁:開頁時自動翻到它那一頁', async () => {
      await mount(many(25), false, true);
      vm.useSub('s22');
      fixture.detectChanges();
      expect(names()).toContain('艇22');
      expect(el.querySelector('.rt-listpager .sel-label')?.textContent?.trim()).toBe('3 / 3');
    });

    it('actions="pick"(彈窗):不分頁,全部列出,但有搜尋', async () => {
      await mount(many(25), false);
      fixture.componentRef.setInput('actions', 'pick');
      fixture.detectChanges();
      expect(el.querySelector('.rt-listpager')).toBeNull();
      expect(el.querySelectorAll('.rt-cards .rt-card').length).toBeGreaterThanOrEqual(25);
      expect(el.querySelector('.rt-listtools')).not.toBeNull();
    });
  });

  it('actions="pick":只有「改用這組」與編輯,沒有刪除與綁定', async () => {
    await mount([dto()]);
    fixture.componentRef.setInput('actions', 'pick');
    fixture.detectChanges();
    const card = el.querySelectorAll('.rt-card')[1]!;
    expect(btn(card, '改用這組')).toBeDefined();
    expect(btn(card, '刪除')).toBeUndefined();
    expect(el.querySelector('app-route-bind')).toBeNull();
  });
});
