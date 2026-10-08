import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteSearch } from './route-search';
import { RouteSearchVm } from './route-search-vm';
import { RouteVm } from './route-vm';

const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RouteSearch', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let sv: RouteSearchVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteSearch>>;
  let edits = 0;

  async function mount(saved: RouteSubDto[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    sv = TestBed.inject(RouteSearchVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RouteSearch);
    edits = 0;
    fixture.componentInstance.edit.subscribe(() => edits++);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }
  const btn = (text: string, root: ParentNode = el) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('案例 B(125 級基準):探索 215、收集 300、恩惠 205、巡航 80、距離 116、重量 ≤ 80 → 共 6 組', async () => {
    await mount();
    vm.setLevel(125);
    sv.setMin('surveillance', 215);
    sv.setMin('retrieval', 300);
    sv.setMin('favor', 205);
    sv.setMin('speed', 80);
    sv.setMin('range', 116);
    sv.setWeightLimit(80);
    btn('搜尋').click();
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')?.textContent).toContain('共 6 組符合');
    expect(el.querySelectorAll('.rt-card')).toHaveLength(6);
  });

  it('沒有符合的條件:顯示沒有符合', async () => {
    await mount();
    sv.setMin('surveillance', 9999);
    btn('搜尋').click();
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')?.textContent).toContain('沒有符合');
    expect(el.querySelectorAll('.rt-card')).toHaveLength(0);
  });

  it('條件為空 → 全部組合,只列前 300 組,分頁「顯示更多」', async () => {
    await mount();
    vm.setLevel(125);
    sv.setWeightLimit(80);
    btn('搜尋').click();
    fixture.detectChanges();
    expect(el.querySelector('[role=status]')?.textContent).toMatch(/共 \d+ 組符合,只列前 300 組/);
    expect(el.querySelectorAll('.rt-card')).toHaveLength(30);
    btn('顯示更多(還有 270 組)').click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.rt-card')).toHaveLength(60);
  });

  it('輸入框:不合法的值整理成 0;重量上限留空 = 用該等級上限', async () => {
    await mount();
    const input = el.querySelector<HTMLInputElement>('input[aria-label="最低探索"]')!;
    input.value = '-5';
    input.dispatchEvent(new Event('change'));
    expect(sv.mins().surveillance).toBe(0);
    expect(input.value).toBe('0');
    const w = el.querySelector<HTMLInputElement>('input[aria-label="重量上限"]')!;
    w.value = '60';
    w.dispatchEvent(new Event('change'));
    expect(sv.weightLimit()).toBe(60);
    w.value = '';
    w.dispatchEvent(new Event('change'));
    expect(sv.weightLimit()).toBeNull();
  });

  it('用路線需求帶入:沒選航點時停用;選了之後帶入最高階門檻與耗用', async () => {
    await mount();
    expect(btn('用路線需求帶入').disabled).toBe(true);
    vm.selectSea(2);
    for (const c of ['A', 'B']) vm.toggle(ids(SEA_INDEXES[1]!, c)[0]!);
    fixture.detectChanges();
    btn('用路線需求帶入').click();
    const n = vm.need();
    expect(sv.mins()).toEqual({ surveillance: n.surveillanceHigh, retrieval: n.retrievalOptim, speed: 0, range: n.range, favor: n.favor });
  });

  it('帶入配置:套用零件、成為臨時配置、通知切到配置頁', async () => {
    await mount([dto()]);
    vm.useSub('a');
    vm.setLevel(125);
    sv.setWeightLimit(80);
    sv.setMin('surveillance', 215);
    btn('搜尋').click();
    fixture.detectChanges();
    const first = el.querySelector('.rt-card')!;
    const text = first.querySelector('.rt-card-title b')!.textContent!.trim();
    btn('帶入配置', first).click();
    expect(vm.subId()).toBeNull();
    expect(vm.level()).toBe(125);
    expect(vm.parts().length).toBe(4);
    expect(edits).toBe(1);
    expect(text.split(' ').length).toBe(4);
  });

  it('加入儲存:未滿時直接新增(名稱 Lv/零件),成功後出現在清單', async () => {
    await mount();
    vm.setLevel(125);
    sv.setWeightLimit(80);
    sv.setMin('surveillance', 215);
    btn('搜尋').click();
    fixture.detectChanges();
    btn('加入儲存', el.querySelector('.rt-card')!).click();
    const req = http.expectOne('/api/route-subs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.level).toBe(125);
    expect(req.request.body.name).toMatch(/^Lv125 /);
    req.flush(dto({ id: 'n', name: req.request.body.name, level: 125 }));
    await settle();
    expect(vm.saved().map((s) => s.id)).toEqual(['n']);
  });

  it('已滿 10 組:不送出,改去配置頁覆蓋', async () => {
    await mount(Array.from({ length: 10 }, (_, i) => dto({ id: `s${i}` })));
    sv.setWeightLimit(80);
    sv.setMin('surveillance', 215);
    btn('搜尋').click();
    fixture.detectChanges();
    btn('加入儲存', el.querySelector('.rt-card')!).click();
    http.expectNone('/api/route-subs');
    await settle();
    expect(edits).toBe(1);
  });

  it('排序「航行時間短優先」沒有路線時顯示說明', async () => {
    await mount();
    btn('航行時間短優先').click();
    fixture.detectChanges();
    expect(el.querySelector('.rt-dirty')?.textContent).toContain('巡航速度');
  });
});
