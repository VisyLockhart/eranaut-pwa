import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteSubs } from './route-subs';
import { RouteVm } from './route-vm';

const g = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RouteSubs', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteSubs>>;

  async function mount(saved: RouteSubDto[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RouteSubs);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
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
