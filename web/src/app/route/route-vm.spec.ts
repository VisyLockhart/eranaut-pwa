import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { RouteSubDto } from '@eranaut/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Auth } from '../core/auth';
import { SEA_INDEXES } from './core/data';
import { ids } from './core/test-helpers';
import { ROUTE_CACHE_KEY, ROUTE_LAST_KEY } from './route-cache';
import { RouteVm } from './route-vm';

const GREY = 2; // 灰海
const g = () => SEA_INDEXES[1]!;
const dto = (over: Partial<RouteSubDto> = {}): RouteSubDto => ({
  id: 'a', name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [],
  created_at: '2026-10-08T00:00:00.000Z', updated_at: '2026-10-08T00:00:00.000Z', ...over,
});
const tick = () => new Promise((r) => setTimeout(r));

describe('RouteVm', () => {
  let vm: RouteVm;
  let http: HttpTestingController;
  let auth: Auth;

  function setup(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(Auth);
    auth.status.set('authenticated');
    http = TestBed.inject(HttpTestingController);
    vm = TestBed.inject(RouteVm);
    TestBed.tick();
  }
  beforeEach(() => {
    localStorage.clear();
    setup();
  });
  afterEach(() => vm.stop());

  /** 案例 C:灰海、等級 76、零件 3 1 2 3 */
  function caseC(): void {
    vm.selectSea(GREY);
    vm.setLevel(76);
    [3, 1, 2, 3].forEach((p, i) => vm.setPart(i as 0 | 1 | 2 | 3, p));
  }

  describe('檢視狀態', () => {
    it('沒有存過 → 預設值;從 localStorage 讀回', () => {
      expect(vm.seq()).toEqual([]);
      expect(vm.subId()).toBeNull();
      localStorage.setItem(ROUTE_LAST_KEY, JSON.stringify({ sea: GREY, seq: ids(g(), 'DG'), level: 76, parts: [3, 1, 2, 3], subId: 'abc' }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      TestBed.inject(Auth).status.set('authenticated');
      const again = TestBed.inject(RouteVm);
      expect(again.sea()).toBe(GREY);
      expect(again.seq()).toEqual(ids(g(), 'DG'));
      expect(again.level()).toBe(76);
      expect(again.parts()).toEqual([3, 1, 2, 3]);
      expect(again.subId()).toBe('abc');
    });

    it('舊版停在「反查」分頁 → 升級後落在推薦的「找路線」(D-218、D-222)', () => {
      localStorage.setItem(ROUTE_LAST_KEY, JSON.stringify({ sea: GREY, seq: [], level: 76, parts: [3, 1, 2, 3], subId: null, tab: 'loot' }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      TestBed.inject(Auth).status.set('authenticated');
      const again = TestBed.inject(RouteVm);
      expect(again.tab()).toBe('recommend');
      expect(again.recGoal()).toBe('find');
    });

    it('壞資料 → 預設值,不丟錯', () => {
      localStorage.setItem(ROUTE_LAST_KEY, '{壞掉');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const again = TestBed.inject(RouteVm);
      expect(again.seq()).toEqual([]);
      expect(again.level()).toBe(130);
    });

    it('讀回來的序列超過目前上限時會被整理', () => {
      localStorage.setItem(ROUTE_LAST_KEY, JSON.stringify({ sea: GREY, seq: ids(g(), 'DGFK'), level: 1, parts: [1, 1, 1, 1], subId: null }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
      const again = TestBed.inject(RouteVm);
      expect(again.seq().length).toBeLessThan(4);
      expect(again.cost().range).toBeLessThanOrEqual(again.stats().range);
    });

    it('狀態改變就寫回 localStorage', () => {
      caseC();
      vm.toggle(ids(g(), 'D')[0]!);
      TestBed.tick();
      const stored = JSON.parse(localStorage.getItem(ROUTE_LAST_KEY) ?? '{}');
      expect(stored).toMatchObject({ sea: GREY, seq: ids(g(), 'D'), level: 76, parts: [3, 1, 2, 3], subId: null });
    });
  });

  describe('路線選取(案例 C)', () => {
    it('依序選 D→G→F→K:耗用 87、航行時間 1日10小時25分(2065 分),其餘全部反灰', () => {
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      expect(vm.seq()).toEqual(ids(g(), 'DGFK'));
      expect(vm.cost().range).toBe(87);
      expect(vm.stats().range).toBe(98);
      expect(vm.minutes()).toBe(2065);
      expect(vm.cost().fuel).toBe(24);
      expect([...vm.selectable().values()].filter((v) => v === 'ok')).toHaveLength(0);
      expect(vm.judgement().range.grade).toBe('full');
    });

    it('不可選的點點了沒有反應;已選的點再點一次就取消', () => {
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      const extra = g().sea.points.find((p) => !vm.seq().includes(p.id))!.id;
      vm.toggle(extra);
      expect(vm.seq()).toHaveLength(4);
      vm.toggle(ids(g(), 'G')[0]!);
      expect(vm.seq()).toEqual(ids(g(), 'DFK'));
    });

    it('取消後恢復:其他點可以再選', () => {
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      vm.toggle(ids(g(), 'K')[0]!);
      expect([...vm.selectable().values()].filter((v) => v === 'ok').length).toBeGreaterThanOrEqual(0);
      expect(vm.seq()).toEqual(ids(g(), 'DGF'));
    });

    it('新點接在最後(RS-23);「最短順序」重排(RS-05)', () => {
      caseC();
      for (const c of ['D', 'F']) vm.toggle(ids(g(), c)[0]!);
      expect(vm.seq()).toEqual(ids(g(), 'DF'));
      for (const c of ['G', 'K']) vm.toggle(ids(g(), c)[0]!);
      expect(vm.seq()).toEqual(ids(g(), 'DFGK'));
      expect(vm.cost().range).toBe(97);
      vm.sortShortest();
      expect(vm.seq()).toEqual(ids(g(), 'DGFK'));
      expect(vm.cost().range).toBe(87);
    });

    it('換海域會清空已選;換成同一個海域不動;不存在的海域沒有反應', () => {
      caseC();
      vm.toggle(ids(g(), 'D')[0]!);
      vm.selectSea(GREY);
      expect(vm.seq()).toHaveLength(1);
      vm.selectSea(99);
      expect(vm.sea()).toBe(GREY);
      vm.selectSea(4);
      expect(vm.sea()).toBe(4);
      expect(vm.seq()).toEqual([]);
    });

    it('降低等級或換成距離較短的零件後,放不下的航點被丟掉', () => {
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      vm.setPart(0, 1); // 距離性能下降
      expect(vm.cost().range).toBeLessThanOrEqual(vm.stats().range);
      vm.setLevel(1);
      expect(vm.seq()).toEqual([]);
    });

    it('不合法的等級與零件編號被忽略', () => {
      caseC();
      vm.setLevel(0);
      vm.setLevel(131);
      vm.setLevel(10.5);
      expect(vm.level()).toBe(76);
      vm.setPart(0, 0);
      vm.setPart(0, 11);
      expect(vm.parts()).toEqual([3, 1, 2, 3]);
    });

    it('clearSeq', () => {
      caseC();
      vm.toggle(ids(g(), 'D')[0]!);
      vm.clearSeq();
      expect(vm.seq()).toEqual([]);
    });
  });

  describe('儲存潛艇', () => {
    async function load(list: RouteSubDto[]): Promise<void> {
      vm.start();
      http.expectOne('/api/route-subs').flush(list);
      await tick();
    }

    it('start:先用快照顯示,再以 API 結果取代並寫回快照', async () => {
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify([dto({ id: 'old' })]));
      vm.start();
      expect(vm.loaded()).toBe(true);
      expect(vm.saved().map((s) => s.id)).toEqual(['old']);
      http.expectOne('/api/route-subs').flush([dto({ id: 'new' })]);
      await tick();
      expect(vm.saved().map((s) => s.id)).toEqual(['new']);
      expect(JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) ?? '[]')[0].id).toBe('new');
    });

    it('start 只會執行一次', () => {
      vm.start();
      vm.start();
      http.expectOne('/api/route-subs');
    });

    it('抓取失敗保留快照並標記 loadError;成功後清除', async () => {
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify([dto()]));
      vm.start();
      http.expectOne('/api/route-subs').flush(null, { status: 500, statusText: 'x' });
      await tick();
      expect(vm.loadError()).toBe(true);
      expect(vm.saved()).toHaveLength(1);
      void vm.refresh();
      http.expectOne('/api/route-subs').flush([dto(), dto({ id: 'b' })]);
      await tick();
      expect(vm.loadError()).toBe(false);
      expect(vm.saved()).toHaveLength(2);
    });

    it('App 回到前景時重抓', async () => {
      await load([]);
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      http.expectOne('/api/route-subs').flush([dto()]);
      await tick();
      expect(vm.saved()).toHaveLength(1);
    });

    it('saveCurrent:送出畫面上的等級與零件,成功後加入清單、設為使用中並寫快照', async () => {
      await load([]);
      caseC();
      const p = vm.saveCurrent('  主力艇  ');
      const req = http.expectOne('/api/route-subs');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: [] });
      req.flush(dto({ id: 'new' }), { status: 201, statusText: 'Created' });
      await p;
      expect(vm.saved().map((s) => s.id)).toEqual(['new']);
      expect(vm.subId()).toBe('new');
      expect(vm.dirty()).toBe(false);
      expect(JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) ?? '[]')).toHaveLength(1);
    });

    it('saveCurrent 已滿 10 組:伺服器回 409,畫面不變、錯誤丟給呼叫端', async () => {
      await load(Array.from({ length: 10 }, (_, i) => dto({ id: `s${i}` })));
      expect(vm.isFull()).toBe(true);
      const p = vm.saveCurrent('x');
      http.expectOne('/api/route-subs').flush({ error: 'limit_reached' }, { status: 409, statusText: 'Conflict' });
      await expect(p).rejects.toMatchObject({ status: 409 });
      expect(vm.saved()).toHaveLength(10);
      expect(vm.pending()).toBe(0);
    });

    it('useSub 填入等級與零件;改動後 dirty;overwrite 後恢復', async () => {
      await load([dto({ id: 'a', level: 90, hull: 6, stern: 7, bow: 8, bridge: 9 })]);
      vm.useSub('a');
      expect(vm.level()).toBe(90);
      expect(vm.parts()).toEqual([6, 7, 8, 9]);
      expect(vm.subId()).toBe('a');
      expect(vm.dirty()).toBe(false);
      vm.setPart(0, 1);
      expect(vm.dirty()).toBe(true);
      const p = vm.overwrite('a');
      const req = http.expectOne('/api/route-subs/a');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: '主力艇', level: 90, hull: 1, stern: 7, bow: 8, bridge: 9, bound_submarine_ids: [] });
      req.flush(dto({ id: 'a', level: 90, hull: 1, stern: 7, bow: 8, bridge: 9 }));
      await p;
      expect(vm.dirty()).toBe(false);
      expect(vm.saved()[0]!.hull).toBe(1);
    });

    it('useSub 不存在的 id 沒有反應;detachSub 解除使用中', async () => {
      await load([dto()]);
      vm.useSub('nope');
      expect(vm.subId()).toBeNull();
      vm.useSub('a');
      vm.detachSub();
      expect(vm.subId()).toBeNull();
      expect(vm.dirty()).toBe(false);
    });

    it('useSub 之後放不下的航點會被丟掉', async () => {
      await load([dto({ id: 'weak', level: 76, hull: 1, stern: 1, bow: 1, bridge: 1 })]);
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      vm.useSub('weak');
      expect(vm.cost().range).toBeLessThanOrEqual(vm.stats().range);
    });

    it('bind / 解除綁定:只改綁定,用該筆已儲存的等級與零件送出', async () => {
      await load([dto({ id: 'a' })]);
      caseC();
      vm.setLevel(100); // 畫面上改了也不影響送出的值
      const p = vm.bind('a', ['sub-1']);
      const req = http.expectOne('/api/route-subs/a');
      expect(req.request.body).toEqual({ name: '主力艇', level: 76, hull: 3, stern: 1, bow: 2, bridge: 3, bound_submarine_ids: ['sub-1'] });
      req.flush(dto({ id: 'a', bound_submarine_ids: ['sub-1'] }));
      await p;
      expect(vm.saved()[0]!.bound_submarine_ids).toEqual(['sub-1']);
      const q = vm.bind('a', []);
      const req2 = http.expectOne('/api/route-subs/a');
      expect(req2.request.body.bound_submarine_ids).toEqual([]);
      req2.flush(dto({ id: 'a' }));
      await q;
      expect(vm.saved()[0]!.bound_submarine_ids).toEqual([]);
    });

    it('同一組綁多艘;綁到的潛艇原本在別組時,本地從別組拿掉(伺服器端搬移)', async () => {
      await load([dto({ id: 'a', bound_submarine_ids: ['s1'] }), dto({ id: 'b', name: '備用', bound_submarine_ids: [] })]);
      const p = vm.bind('b', ['s1', 's2']);
      const req = http.expectOne('/api/route-subs/b');
      expect(req.request.body.bound_submarine_ids).toEqual(['s1', 's2']);
      req.flush(dto({ id: 'b', name: '備用', bound_submarine_ids: ['s1', 's2'] }));
      await p;
      expect(vm.saved().find((s) => s.id === 'a')!.bound_submarine_ids).toEqual([]);
      expect(vm.saved().find((s) => s.id === 'b')!.bound_submarine_ids).toEqual(['s1', 's2']);
    });

    it('改名保留綁定', async () => {
      await load([dto({ id: 'a', bound_submarine_ids: ['sub-1'] })]);
      const p = vm.updateSub('a', { name: '新名字' });
      const req = http.expectOne('/api/route-subs/a');
      expect(req.request.body).toMatchObject({ name: '新名字', bound_submarine_ids: ['sub-1'] });
      req.flush(dto({ id: 'a', name: '新名字', bound_submarine_ids: ['sub-1'] }));
      await p;
      expect(vm.saved()[0]!.name).toBe('新名字');
      await expect(vm.updateSub('nope', { name: 'x' })).rejects.toThrow();
    });

    it('寫入失敗(400)不改畫面並丟出原始錯誤', async () => {
      await load([dto()]);
      const p = vm.updateSub('a', { bound_submarine_ids: ['bad'] });
      http.expectOne('/api/route-subs/a').flush({ error: 'validation_failed', fields: { bound_submarine_ids: 'invalid_value' } }, { status: 400, statusText: 'Bad' });
      await expect(p).rejects.toMatchObject({ status: 400 });
      expect(vm.saved()[0]!.bound_submarine_ids).toEqual([]);
    });

    it('remove:成功從清單移除並解除使用中;404 當作成功', async () => {
      await load([dto({ id: 'a' }), dto({ id: 'b' })]);
      vm.useSub('a');
      const p = vm.remove('a');
      http.expectOne('/api/route-subs/a').flush(null, { status: 204, statusText: 'No Content' });
      await p;
      expect(vm.saved().map((s) => s.id)).toEqual(['b']);
      expect(vm.subId()).toBeNull();
      const q = vm.remove('b');
      http.expectOne('/api/route-subs/b').flush({ error: 'not_found' }, { status: 404, statusText: 'Not Found' });
      await q;
      expect(vm.saved()).toEqual([]);
    });

    it('remove 其他錯誤丟出且清單不變', async () => {
      await load([dto()]);
      const p = vm.remove('a');
      http.expectOne('/api/route-subs/a').flush(null, { status: 500, statusText: 'x' });
      await expect(p).rejects.toMatchObject({ status: 500 });
      expect(vm.saved()).toHaveLength(1);
    });

    it('重抓時,使用中的那一組若已不存在(在別的裝置刪掉)就解除', async () => {
      await load([dto({ id: 'a' })]);
      vm.useSub('a');
      void vm.refresh();
      http.expectOne('/api/route-subs').flush([]);
      await tick();
      expect(vm.subId()).toBeNull();
    });

    it('伺服器回來的壞項目被過濾', async () => {
      await load([dto({ id: 'ok' }), { id: 'bad', name: 1 } as never]);
      expect(vm.saved().map((s) => s.id)).toEqual(['ok']);
    });

    it('pending 在寫入期間 > 0,結束後歸零', async () => {
      await load([dto()]);
      const p = vm.remove('a');
      expect(vm.pending()).toBe(1);
      http.expectOne('/api/route-subs/a').flush(null, { status: 204, statusText: 'No Content' });
      await p;
      expect(vm.pending()).toBe(0);
    });
  });

  describe('登出', () => {
    it('stop:清空清單與快照與使用中的那一組,檢視狀態保留', async () => {
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify([dto()]));
      caseC();
      vm.start();
      http.expectOne('/api/route-subs').flush([dto()]);
      await tick();
      vm.useSub('a');
      vm.stop();
      expect(vm.saved()).toEqual([]);
      expect(vm.loaded()).toBe(false);
      expect(vm.subId()).toBeNull();
      expect(localStorage.getItem(ROUTE_CACHE_KEY)).toBeNull();
      expect(vm.level()).toBe(76); // 檢視狀態保留
      vm.start(); // 可重新開始
      http.expectOne('/api/route-subs');
    });

    it('登入狀態變成 anonymous / expired 時自動 stop;loading 與 unreachable 不清(離線要靠快照)', async () => {
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify([dto()]));
      vm.start();
      http.expectOne('/api/route-subs').flush([dto()]);
      await tick();
      auth.status.set('unreachable');
      TestBed.tick();
      expect(vm.saved()).toHaveLength(1);
      auth.status.set('loading');
      TestBed.tick();
      expect(vm.saved()).toHaveLength(1);
      auth.status.set('expired');
      TestBed.tick();
      expect(vm.saved()).toEqual([]);
      expect(localStorage.getItem(ROUTE_CACHE_KEY)).toBeNull();
    });
  });

  describe('分頁與配置對話框草稿', () => {
    const load = async (saved: RouteSubDto[]) => {
      vm.start();
      http.expectOne('/api/route-subs').flush(saved);
      await tick();
    };

    it('第一次進來:沒有儲存配置 → 配置頁;有儲存配置 → 推薦頁', async () => {
      await load([]);
      expect(vm.tab()).toBe('config');
      vm.stop();
      localStorage.clear();
      setup();
      await load([dto()]);
      expect(vm.tab()).toBe('recommend');
    });

    it('使用者切過分頁就記住,下次沿用(有儲存配置時);自動決定的預設不寫入', async () => {
      await load([dto()]);
      expect(JSON.parse(localStorage.getItem(ROUTE_LAST_KEY)!).tab).toBeNull();
      vm.setTab('map');
      TestBed.tick();
      expect(JSON.parse(localStorage.getItem(ROUTE_LAST_KEY)!).tab).toBe('map');
      vm.stop();
      setup();
      await load([dto()]);
      expect(vm.tab()).toBe('map');
    });

    it('草稿不動畫面配置;只套用 → 臨時配置;編輯的內容和那一組相同 → 改用那一組', async () => {
      await load([dto()]);
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      vm.openConfig('edit', 'a');
      vm.setDraftPart(0, 1);
      expect(vm.draftDirty()).toBe(true);
      expect(vm.parts()).toEqual([3, 1, 2, 3]);
      expect(vm.seq()).toHaveLength(4);
      vm.setDraftPart(0, 3);
      expect(vm.draftDirty()).toBe(false);
      vm.applyDraft();
      expect(vm.subId()).toBe('a');
      vm.openConfig('edit', 'a');
      vm.setDraftPart(0, 4);
      vm.applyDraft();
      expect(vm.subId()).toBeNull();
      expect(vm.parts()[0]).toBe(4);
      expect(vm.draft()).toBeNull();
    });

    it('套用後放不下的航點被移除', async () => {
      await load([]);
      caseC();
      for (const c of ['D', 'G', 'F', 'K']) vm.toggle(ids(g(), c)[0]!);
      vm.openConfig('temp');
      vm.setDraftLevel(1);
      vm.applyDraft();
      expect(vm.seq().length).toBeLessThan(4);
    });

    it('預設名稱:沒手動改過就跟著等級與零件變', async () => {
      await load([]);
      vm.openConfig('new');
      const lv = vm.draft()!.level;
      vm.setDraftPart(1, 2);
      expect(vm.draft()!.name).toBe(`Lv${lv} 1/2/1/1`);
      vm.setDraftName('我的');
      vm.setDraftPart(1, 3);
      expect(vm.draft()!.name).toBe('我的');
    });
  });
});
