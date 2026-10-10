import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { RouteConfigDialog } from './route-config-dialog';
import { RoutePerfDialog } from './route-perf-dialog';
import { RouteVm } from './route-vm';

const g = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [], favorite: false,
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RoutePerfDialog', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RoutePerfDialog>>;

  async function mount(saved: RouteSubDto[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RoutePerfDialog);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }
  const caseC = () => {
    vm.selectSea(2);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
    for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
  };
  const btn = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('關著時不畫;開啟後顯示路線摘要與每一組的判定', async () => {
    await mount([dto(), dto({ id: 'w', name: '弱艇', level: 1, hull: 1, stern: 1, bow: 1, bridge: 1 })]);
    caseC();
    expect(el.querySelector('.rt-perf')).toBeNull();
    vm.perfOpen.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.rt-perf-route')?.textContent).toContain('4 個航點');
    const cards = el.querySelectorAll('.rt-card');
    expect(cards).toHaveLength(3); // 臨時配置 + 兩組
    expect(cards[1]!.textContent).toContain('可跑');
    expect(cards[2]!.textContent).toContain('跑不了');
  });

  it('沒選航點:提示尚未選航點,卡片不顯示「可跑」也沒有紅綠判定', async () => {
    await mount([dto()]);
    vm.perfOpen.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.rt-perf-route')?.textContent).toContain('尚未選航點');
    expect(el.querySelector('.rt-badge.ok')).toBeNull();
    expect(el.querySelector('.rt-badge.bad')).toBeNull();
    expect(el.querySelectorAll('.rt-chip5.g-full, .rt-chip5.g-none')).toHaveLength(0);
  });

  it('「改用這組」:換成那一組並關閉彈窗;放不下的航點會被移除並提示', async () => {
    await mount([dto({ id: 'w', name: '弱艇', level: 1, hull: 1, stern: 1, bow: 1, bridge: 1 })]);
    caseC();
    vm.perfOpen.set(true);
    fixture.detectChanges();
    const weak = el.querySelectorAll('.rt-card')[1]!;
    expect(weak.textContent).toMatch(/改用這組會移除 \d+ 個放不下的航點/);
    btn(weak, '改用這組').click();
    fixture.detectChanges();
    expect(vm.subId()).toBe('w');
    expect(vm.perfOpen()).toBe(false);
    expect(vm.seq().length).toBeLessThan(4);
    expect(el.querySelector('.rt-perf')).toBeNull();
  });

  it('背景點擊、✕、Esc 都能關閉', async () => {
    await mount();
    const open = () => {
      vm.perfOpen.set(true);
      fixture.detectChanges();
    };
    open();
    el.querySelector<HTMLButtonElement>('.modal-close')!.click();
    fixture.detectChanges();
    expect(vm.perfOpen()).toBe(false);
    open();
    const overlay = el.querySelector<HTMLElement>('.modal-overlay')!;
    overlay.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    overlay.click();
    expect(vm.perfOpen()).toBe(false);
    open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(vm.perfOpen()).toBe(false);
  });

  it('從彈窗編輯配置會疊上配置對話框;Esc 只關最上層', async () => {
    await mount([dto()]);
    const cfg = TestBed.createComponent(RouteConfigDialog);
    cfg.detectChanges();
    vm.perfOpen.set(true);
    fixture.detectChanges();
    btn(el.querySelectorAll('.rt-card')[1]!, '編輯配置').click();
    cfg.detectChanges();
    expect(vm.draft()?.mode).toBe('edit');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(vm.draft()).toBeNull();
    expect(vm.perfOpen()).toBe(true);
  });
});
