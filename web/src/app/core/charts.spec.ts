import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { ChartOcrResultDto, SubmarineDto, WorkshopChartDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEVELING_ROUTES, recommendedRoute } from '@eranaut/shared';
import { SEA_INDEXES } from '../route/core/data';
import { findRoutes, type FindQuery } from '../route/core/find';
import { buildStats } from '../route/core/build';
import { TABLES } from '../route/core/data';
import { ids, sea, SEA } from '../route/core/test-helpers';
import { Auth } from './auth';
import { ChartUpdateVm } from './chart-update-vm';
import { UNLOCK_GRAPH, changedSeas, chartLabel, chartSummary, foundOf } from './charts';
import { DataStore } from './data-store';
import { clearCalcMemo, foundCodes, stepToward, suggest } from './dispatch';
import { ImageTools } from './image-input';

// 海圖探索(D-293):工坊的已發現航點、更新海圖頁的狀態、航線找路線與練級建議套用海圖。

const drowned = sea(SEA.drowned);
const grey = sea(SEA.grey);
const set = (si: typeof drowned, codes: string) => new Set(ids(si, codes));
/** 兩個字母的代號(AA~AD)不能用 ids()(會被拆成單字母) */
const idOf = (si: typeof drowned, code: string) => si.sea.points.find((p) => p.code === code)!.id;

const sub = (over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: 's1',
  workshop_id: 'w1',
  position: 1,
  name: 'A',
  status: 'exploring',
  expected_return_at: '2026-10-29T00:00:00Z',
  last_synced_at: '2026-10-25T00:00:00Z',
  ...over,
});
const ws = (charts: WorkshopChartDto[] = [], subs: SubmarineDto[] = [sub()]): WorkshopWithSubmarines => ({
  id: 'w1',
  name: '貝殼工坊',
  server: '迦樓羅',
  captain: null,
  address_district: null,
  address_ward: null,
  address_detail: null,
  notify_batched: false,
  notify_lead_minutes: 0,
  created_at: '2026-10-01T00:00:00Z',
  submarines: subs,
  charts,
});
const chart = (s: number, points: number[], updated = '2026-10-26T00:00:00Z'): WorkshopChartDto => ({ sea: s, points, updated_at: updated });

describe('工坊的已發現航點', () => {
  it('沒有紀錄 = null(不是什麼都沒發現);有紀錄時補上前面的點(跨海域)', () => {
    expect(foundOf(ws())).toBeNull();
    // 只記了灰海 A → 溺沒海一路到 AD 都算已發現
    const f = foundOf(ws([chart(2, ids(grey, 'A'))]))!;
    expect(f.has(ids(grey, 'A')[0]!)).toBe(true);
    expect(f.has(idOf(drowned, 'AD'))).toBe(true);
    expect(f.has(idOf(drowned, 'AC'))).toBe(false);
  });

  it('changedSeas:只列有差異的海域,空陣列 = 刪除', () => {
    const base = set(drowned, 'ABC');
    expect(changedSeas(base, base)).toEqual([]);
    expect(changedSeas(base, set(drowned, 'ABCD'))).toEqual([{ sea: 1, points: ids(drowned, 'ABCD') }]);
    expect(changedSeas(base, new Set())).toEqual([{ sea: 1, points: [] }]);
  });

  it('摘要:各海域點數、更新時間、之後返航(或更新過潛艇)的艘數', () => {
    const now = Date.parse('2026-10-28T12:00:00Z');
    const w = ws([chart(1, ids(drowned, 'ABDE'))], [
      sub({ id: 'a', last_synced_at: '2026-10-27T00:00:00Z' }), // 海圖更新後更新過潛艇
      sub({ id: 'b', expected_return_at: '2026-10-28T10:00:00Z' }), // 之後返航
      sub({ id: 'c', expected_return_at: '2026-10-29T10:00:00Z' }), // 還在航行
    ]);
    const c = chartSummary(w, now);
    expect(c.seas).toEqual([{ sea: 1, name: '溺沒海', found: 4, total: 30 }]);
    expect(c.updatedAt).toBe(Date.parse('2026-10-26T00:00:00Z'));
    expect(c.returnedSince).toBe(2);
    expect(chartLabel(c)).toContain('溺沒海 4/30');
    expect(chartSummary(ws(), now)).toEqual({ seas: [], updatedAt: null, returnedSince: 0 });
  });
});

describe('找路線:選了工坊時只用已發現的點(D-293)', () => {
  const stats = buildStats(TABLES, { level: 130, parts: [10, 10, 10, 10] });
  const q = (over: Partial<FindQuery>): FindQuery => ({
    level: 130,
    stats,
    sea: 1,
    maxMinutes: null,
    sort: 'perMin',
    required: new Set(),
    excluded: new Set(),
    itemIds: [],
    match: 'all',
    explored: new Set(),
    graph: UNLOCK_GRAPH,
    ...over,
  });

  it('路線只含已發現的點', () => {
    const disc = set(drowned, 'ABCDEFGHIJK');
    const rs = findRoutes(SEA_INDEXES, q({ discovered: disc, limit: 20 }));
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) for (const id of r.order) expect(disc.has(id)).toBe(true);
  });

  it('可能解鎖:可去的點 = 已發現的點,新點 = 路線上的點後面還沒發現的點', () => {
    const disc = set(drowned, 'ABCDE');
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'opens', discovered: disc, limit: 5 }));
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) for (const id of r.opens) expect(disc.has(id)).toBe(false);
    // E 之後是 I、J,C 之後是 F,D 之後是 G
    const best = rs[0]!;
    expect(best.opens.length).toBeGreaterThanOrEqual(3);
  });
});

describe('練級建議:有海圖紀錄時先排除未發現的點(D-293)', () => {
  beforeAll(() => clearCalcMemo());
  const allIds = (si: typeof drowned) => si.sea.points.map((p) => p.id);

  it('攻略路線的點都已發現:和沒有海圖時一樣', () => {
    const all = foundCodes(new Set([...allIds(drowned), ...allIds(grey)]))!;
    for (const level of [10, 34, 52]) {
      const a = suggest('snap', level, 0, null, null, null);
      const b = suggest('snap', level, 0, null, null, all);
      expect(b?.plan.points).toEqual(a?.plan.points);
      expect(b?.avoided).toBeUndefined();
    }
  });

  it('攻略路線含未發現的點:改從已發現的點推算,並列出避開的點', () => {
    // 找一個攻略路線用到 K 以後的點的等級,只開到 A~J
    const r = LEVELING_ROUTES.find((x) => x.sea === 1 && x.points.some((c) => !'ABCDEFGHIJ'.includes(c)) && x.level >= 20)!;
    const found = foundCodes(set(drowned, 'ABCDEFGHIJ'))!;
    const s = suggest(r.school, r.level, 0, null, null, found)!;
    expect(s.avoided!.length).toBeGreaterThan(0);
    if (s.source === 'calc') for (const c of s.plan.points) expect('ABCDEFGHIJ'.split('')).toContain(c);
  });

  it('攻略換到還沒開放的灰海:留在溺沒海', () => {
    const g = recommendedRoute('snap', 55)!;
    expect(g.sea).toBe(2);
    const found = foundCodes(new Set(allIds(drowned)))!;
    const s = suggest('snap', 55, 0, null, null, found)!;
    expect(s.plan.sea).toBe(1);
    expect(s.avoided).toEqual(g.points);
  });

  it('解鎖點還沒發現:先去它路上第一個未發現點的上一個點', () => {
    // O 的路:B → E → J → N → O;只開到 J → 先去 J(回來 N 出現),再下一趟去 N
    const found = foundCodes(set(drowned, 'ABCDEFGHIJ'))!;
    expect(stepToward(found, 1, 'O')).toBe('J');
    const s = suggest('snap', 34, 0, null, { code: 'O', mark: '艇3', rank: 30 }, found)!;
    expect(s.prereq).toBe('J');
    expect(s.plan.points).toContain('J');
    expect(s.unlock).toBe('艇3');
  });
});

describe('ChartUpdateVm(更新海圖頁)', () => {
  let vm: ChartUpdateVm;
  let store: DataStore;
  let http: HttpTestingController;
  const png = () => new File(['x'], 'map.png', { type: 'image/png' });
  const result = (over: Partial<ChartOcrResultDto> = {}): ChartOcrResultDto => ({
    sea: 2,
    points: ids(grey, 'ABC'),
    filled: [],
    uncertain: [],
    screen_count: 3,
    map_box: { left: 0, top: 0, size: 100, width: 100, height: 100 },
    ...over,
  });

  beforeEach(() => {
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ImageTools, useValue: { shrink: async () => null } }] });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(Auth).status.set('authenticated');
    store = TestBed.inject(DataStore);
    store.fetched.set([ws([chart(1, ids(drowned, 'ABCDEFGHIJKP'))])]);
    vm = TestBed.inject(ChartUpdateVm);
    vm.open('w1');
  });
  afterEach(() => vm.close());

  const upload = async (r: ChartOcrResultDto) => {
    const p = vm.recognize([png()]);
    await Promise.resolve();
    http.expectOne('/api/charts/ocr').flush(r);
    await p;
  };

  it('手動加入海圖:標起點 A 變成 1/n,可以再移除整張(D-294)', () => {
    const target = vm.addable().find((t) => t.sea === 6)!;
    expect(target).toBeTruthy();
    vm.addSea(6);
    const tab = vm.tabs().find((t) => t.sea === 6)!;
    expect(tab.locked).toBe(false);
    expect(tab.draft).toBe(1);
    expect(vm.viewSea()).toBe(6);
    expect(vm.addable().some((t) => t.sea === 6)).toBe(false);
    vm.removeSea(6);
    expect(vm.tabs().find((t) => t.sea === 6)!.locked).toBe(true);
    expect(vm.viewSea()).not.toBe(6);
  });

  it('開啟時帶入工坊的紀錄,停在最後一個有紀錄的海域', () => {
    expect(vm.draft().size).toBe(12);
    expect(vm.viewSea()).toBe(1);
    expect(vm.dirty()).toBe(false);
  });

  it('辨識結果:只取代那個海域,補上前面的點;切到該海域;差異列出', async () => {
    await upload(result());
    expect(vm.viewSea()).toBe(2);
    expect(vm.draft().has(idOf(drowned, 'AD'))).toBe(true); // 灰海 A 的上一個點
    expect(vm.changeList().map((c) => [c.name, c.add, c.rem])).toEqual([
      ['溺沒海', 9, 0],
      ['灰海', 3, 0],
    ]);
    expect(vm.mismatch(2)).toBeNull();
  });

  it('畫面「已發現 N」對不上時提示;使用者改到一致後消失', async () => {
    await upload(result({ screen_count: 4 }));
    expect(vm.mismatch(2)).toEqual({ screen: 4, draft: 3 });
    vm.toggle(ids(grey, 'D')[0]!);
    expect(vm.mismatch(2)).toBeNull();
    vm.undoLast();
    expect(vm.mismatch(2)).toEqual({ screen: 4, draft: 3 });
  });

  it('點海圖:取消一個點連同後面的點;儲存只送有變動的海域', async () => {
    vm.toggle(ids(drowned, 'I')[0]!); // I → K → P 一起取消
    expect(vm.removed().size).toBe(3);
    const saving = vm.save();
    const req = http.expectOne('/api/workshops/w1/charts');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ seas: [{ sea: 1, points: ids(drowned, 'ABCDEFGHJ') }] });
    req.flush([chart(1, ids(drowned, 'ABCDEFGHJ'), '2026-10-28T00:00:00Z')]);
    expect(await saving).toBe(true);
    expect(vm.dirty()).toBe(false);
    expect(store.workshops()[0]!.charts![0]!.points).toEqual(ids(drowned, 'ABCDEFGHJ'));
  });

  it('沒有海圖位置(例如展示版的示範結果):不提供對照截圖', async () => {
    await upload(result({ map_box: { left: 0, top: 0, size: 0, width: 0, height: 0 } }));
    expect(vm.shotOf(2)!.url).toBe('');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    await upload(result());
    expect(vm.shotOf(2)!.url).toBe('blob:x');
  });

  it('認不出來:顯示提示,草稿不變', async () => {
    const p = vm.recognize([png()]);
    await Promise.resolve();
    http.expectOne('/api/charts/ocr').flush({ error: 'unrecognized' }, { status: 422, statusText: 'x' });
    await p;
    expect(vm.error()).toContain('選擇航海圖');
    expect(vm.dirty()).toBe(false);
  });
});
