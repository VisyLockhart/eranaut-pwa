import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { RouteEditor } from './route-editor';
import { RouteVm } from './route-vm';

const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const settle = () => new Promise((r) => setTimeout(r));

describe('RouteEditor(配置頁)', () => {
  let el: HTMLElement;
  let vm: RouteVm;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<RouteEditor>>;

  async function mount(saved: RouteSubDto[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    TestBed.inject(Auth).status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    vm.start();
    http.expectOne('/api/route-subs').flush(saved);
    await settle();
    fixture = TestBed.createComponent(RouteEditor);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }
  const btn = (root: ParentNode, text: string) => [...root.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => localStorage.clear());
  afterEach(() => vm.stop());

  it('只有一個清單:沒有內嵌的編輯器、統計表、儲存區、等級輸入或晶片列', async () => {
    await mount([dto()]);
    expect(el.querySelector('.rt-parts')).toBeNull();
    expect(el.querySelector('.rt-stats')).toBeNull();
    expect(el.querySelector('.rt-level-input')).toBeNull();
    expect(el.querySelector('.rt-chips')).toBeNull();
    expect(el.querySelector('app-route-save')).toBeNull();
    expect(el.textContent).toContain('已儲存 1 / 10 組');
  });

  it('沒有儲存配置時顯示空狀態與臨時配置', async () => {
    await mount();
    expect(el.textContent).toContain('還沒有儲存的配置');
    expect(el.querySelectorAll('.rt-card')).toHaveLength(1);
    expect(el.querySelector('.rt-card')?.textContent).toContain('臨時配置');
  });

  it('「＋ 新增配置」開啟新增對話框', async () => {
    await mount();
    btn(el, '＋ 新增配置').click();
    expect(vm.draft()?.mode).toBe('new');
  });

  it('每一組:使用、編輯、刪除;臨時配置只在不是任何一組時出現', async () => {
    await mount([dto()]);
    expect(el.querySelectorAll('.rt-card')).toHaveLength(2); // 預設 Lv130 不是主力艇 → 有臨時配置
    vm.useSub('a');
    fixture.detectChanges();
    const cards = el.querySelectorAll('.rt-card');
    expect(cards).toHaveLength(1);
    expect(btn(cards[0]!, '使用中').disabled).toBe(true);
    btn(cards[0]!, '編輯').click();
    expect(vm.draft()).toMatchObject({ mode: 'edit', id: 'a' });
  });

  it('讀取清單失敗時提示先顯示上次資料', async () => {
    await mount();
    vm.loadError.set(true);
    fixture.detectChanges();
    expect(el.textContent).toContain('先顯示上次的資料');
  });
});
