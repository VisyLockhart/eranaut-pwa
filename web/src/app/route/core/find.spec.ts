import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { SEA_INDEXES, TABLES } from './data';
import { checkRequired, findRoutes, opensFor, pointItems, searchSeas, type FindQuery } from './find';
import { MAX_STOPS, permutations, routeCost, travelMinutes } from './route';
import { codes, ids } from './test-helpers';
import { buildUnlockGraph, isAvailable } from './unlock';

const g = buildUnlockGraph(SEA_INDEXES);
const drowned = SEA_INDEXES[0]!;
const grey = SEA_INDEXES[1]!;
const stats130 = buildStats(TABLES, { level: 130, parts: [10, 10, 10, 10] });
// 練級案例用的配置(同 recommend.spec):Lv50、部件 8、6、7、7
const stats50 = buildStats(TABLES, { level: 50, parts: [8, 6, 7, 7] });

const q = (over: Partial<FindQuery> = {}): FindQuery => ({
  level: 130,
  stats: stats130,
  sea: 'all',
  maxMinutes: null,
  sort: 'perMin',
  required: new Set(),
  excluded: new Set(),
  itemIds: [],
  match: 'all',
  explored: new Set(),
  graph: g,
  ...over,
});

describe('排序與基本案例', () => {
  it('對照 FFXIVTC:灰海 A → B 為 881,980 經驗、20小時35分、約 714 經驗/分(Lv50、部件 8 6 7 7)', () => {
    const r = findRoutes(SEA_INDEXES, q({ level: 50, stats: stats50, sea: grey.sea.sea, limit: 500 })).find((x) => codes(grey, [...x.order].sort((a, b) => a - b)) === 'AB');
    expect(r).toBeDefined();
    expect(r!.exp).toBe(881_980);
    expect(r!.minutes).toBe(20 * 60 + 35);
    expect(Math.floor(r!.perMin)).toBe(714);
    expect(r!.cost.fuel).toBe(12);
    expect(r!.cost.range).toBe(38);
  });

  it('每分鐘經驗:由好到壞,每條都不超過距離上限、等級與 5 站', () => {
    const rs = findRoutes(SEA_INDEXES, q({ level: 60 }));
    expect(rs.length).toBeGreaterThan(0);
    for (let i = 1; i < rs.length; i++) expect(rs[i - 1]!.perMin).toBeGreaterThanOrEqual(rs[i]!.perMin);
    for (const r of rs) {
      const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
      expect(r.order.length).toBeLessThanOrEqual(MAX_STOPS);
      expect(r.cost.range).toBeLessThanOrEqual(stats130.range);
      for (const id of r.order) expect(si.byId.get(id)!.rankReq).toBeLessThanOrEqual(60);
    }
  });

  it('最多物品:由多到少,一樣多時航行時間短的在前;items 是這條路線拿得到的不同物品', () => {
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'variety', level: 70 }));
    for (let i = 1; i < rs.length; i++) {
      expect(rs[i - 1]!.items.length).toBeGreaterThanOrEqual(rs[i]!.items.length);
      if (rs[i - 1]!.items.length === rs[i]!.items.length) expect(rs[i - 1]!.minutes).toBeLessThanOrEqual(rs[i]!.minutes);
    }
    const r = rs[0]!;
    const si = SEA_INDEXES.find((s) => s.sea.sea === r.sea)!;
    const want = new Set(r.order.flatMap((id) => pointItems(si.byId.get(id)!, stats130.surveillance)));
    expect(new Set(r.items)).toEqual(want);
  });

  it('可能解鎖:什麼都沒去過時只有溺沒海的 A、B 可去,A + B 一起去回來解鎖 C、D、E', () => {
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'opens' }));
    const ab = new Set(ids(drowned, 'AB'));
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) for (const id of r.order) expect(ab.has(id)).toBe(true);
    expect(rs[0]!.order.slice().sort()).toEqual(ids(drowned, 'AB').slice().sort());
    expect(rs[0]!.opens).toEqual(expect.arrayContaining(ids(drowned, 'CDE')));
    expect(rs[0]!.opens).toHaveLength(3);
  });

  it('可能解鎖:依新航點數由多到少,一樣多時航行時間短的在前', () => {
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'opens', explored: new Set(ids(drowned, 'AB')) }));
    for (let i = 1; i < rs.length; i++) {
      expect(rs[i - 1]!.opens.length).toBeGreaterThanOrEqual(rs[i]!.opens.length);
      if (rs[i - 1]!.opens.length === rs[i]!.opens.length) expect(rs[i - 1]!.minutes).toBeLessThanOrEqual(rs[i]!.minutes);
    }
  });

  it('可能解鎖:跨海域,溺沒海最後一點去過之後灰海 A 可以去', () => {
    const last = drowned.sea.points.find((x) => x.code === 'AD')!.id;
    const closed = new Set<number>();
    for (let x: number | undefined = last; x !== undefined; x = g.parent.get(x)) closed.add(x);
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'opens', explored: closed, sea: grey.sea.sea }));
    expect(rs.length).toBeGreaterThan(0);
    expect(rs.every((r) => r.order.every((id) => id === ids(grey, 'A')[0]))).toBe(true);
  });

  it('掉落:每條路線都拿得到指定物品', () => {
    for (const si of SEA_INDEXES) {
      const counts = new Map<number, number>();
      for (const p of si.sea.points) for (const id of pointItems(p, stats130.surveillance)) counts.set(id, (counts.get(id) ?? 0) + 1);
      const item = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
      const got = findRoutes(SEA_INDEXES, q({ sea: si.sea.sea, itemIds: [item] }));
      expect(got.length).toBeGreaterThan(0);
      for (const r of got) {
        expect(r.got).toEqual([item]);
        expect(r.items).toContain(item);
      }
    }
  });

  it('時間上限與只找指定海域', () => {
    for (const r of findRoutes(SEA_INDEXES, q({ level: 60, maxMinutes: 12 * 60 }))) expect(r.minutes).toBeLessThanOrEqual(12 * 60);
    for (const r of findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea }))) expect(r.sea).toBe(grey.sea.sea);
  });
});

/** 不剪枝的窮舉,當作對照:必選 / 排除 / 海域 / 時間 / 物品 */
function brute(query: FindQuery) {
  const out: { sea: number; order: number[]; minutes: number; exp: number; perMin: number }[] = [];
  const { seas } = searchSeas(SEA_INDEXES, query);
  for (const si of seas) {
    const req = si.sea.points.filter((p) => query.required.has(p.id));
    if (req.length > MAX_STOPS) continue;
    const pts = si.sea.points.filter((p) => !query.required.has(p.id) && p.rankReq <= query.level && !query.excluded.has(p.id));
    if (req.some((p) => p.rankReq > query.level || query.excluded.has(p.id))) continue;
    const rec = (start: number, cur: number[]): void => {
      if (cur.length > 0) {
        const items = new Set(cur.flatMap((id) => pointItems(si.byId.get(id)!, query.stats.surveillance)));
        const itemOk = query.itemIds.length === 0 || (query.match === 'all' ? query.itemIds.every((i) => items.has(i)) : query.itemIds.some((i) => items.has(i)));
        let best: { order: number[]; distance: number } | null = null;
        for (const perm of permutations(cur.length)) {
          const order = perm.map((j) => cur[j]!);
          const c = routeCost(si, order);
          if (c.range <= query.stats.range && (!best || c.distance < best.distance)) best = { order, distance: c.distance };
        }
        if (best && itemOk) {
          const minutes = travelMinutes(best.distance, query.stats.speed);
          const exp = cur.reduce((s, id) => s + si.byId.get(id)!.expReward, 0);
          if (query.maxMinutes === null || minutes <= query.maxMinutes) out.push({ sea: si.sea.sea, order: best.order, minutes, exp, perMin: exp / minutes });
        }
      }
      if (cur.length === MAX_STOPS) return;
      for (let i = start; i < pts.length; i++) rec(i + 1, [...cur, pts[i]!.id]);
    };
    rec(0, req.map((p) => p.id));
  }
  return out.sort((a, b) => b.perMin - a.perMin || a.minutes - b.minutes);
}

describe('篩選:必選 / 排除 / 物品', () => {
  it('必選:每條路線都包含必選點,結果與窮舉一致', () => {
    const query = q({ sea: grey.sea.sea, required: new Set(ids(grey, 'K')), limit: 30 });
    const got = findRoutes(SEA_INDEXES, query);
    expect(got.length).toBeGreaterThan(0);
    for (const r of got) expect(r.order).toContain(ids(grey, 'K')[0]);
    const want = brute(query).slice(0, 30);
    expect(got.map((r) => r.minutes)).toEqual(want.map((r) => r.minutes));
    expect(got.map((r) => r.exp)).toEqual(want.map((r) => r.exp));
  });

  it('排除:任何路線都不含排除點,結果與窮舉一致', () => {
    const excluded = new Set(ids(grey, 'ABD'));
    const query = q({ sea: grey.sea.sea, excluded, limit: 30 });
    const got = findRoutes(SEA_INDEXES, query);
    expect(got.length).toBeGreaterThan(0);
    for (const r of got) for (const id of r.order) expect(excluded.has(id)).toBe(false);
    const want = brute(query).slice(0, 30);
    expect(got.map((r) => r.exp)).toEqual(want.map((r) => r.exp));
  });

  it('必選 + 排除 + 時間上限 + 指定物品一起篩,結果與窮舉一致', () => {
    const si = grey;
    const item = [...new Set(si.sea.points.flatMap((p) => pointItems(p, stats130.surveillance)))][3]!;
    const query = q({ sea: si.sea.sea, required: new Set(ids(si, 'G')), excluded: new Set(ids(si, 'A')), maxMinutes: 48 * 60, itemIds: [item], match: 'any', limit: 30 });
    const got = findRoutes(SEA_INDEXES, query);
    const want = brute(query).slice(0, 30);
    expect(got.map((r) => r.exp)).toEqual(want.map((r) => r.exp));
    expect(got.map((r) => r.minutes)).toEqual(want.map((r) => r.minutes));
  });

  it('跨海域:各海域各自 AND、結果取聯集;沒有必選點的海域不會出現', () => {
    const a = ids(drowned, 'B')[0]!;
    const b = ids(grey, 'K')[0]!;
    const rs = findRoutes(SEA_INDEXES, q({ required: new Set([a, b]), limit: 5000 }));
    expect(new Set(rs.map((r) => r.sea))).toEqual(new Set([drowned.sea.sea, grey.sea.sea]));
    for (const r of rs) expect(r.order).toContain(r.sea === drowned.sea.sea ? a : b);
  });

  it('海域下拉指定單一海域:其他海域的必選點被忽略,並回報 ignored', () => {
    const a = ids(drowned, 'B')[0]!;
    const { seas, ignored } = searchSeas(SEA_INDEXES, { sea: grey.sea.sea, required: new Set([a]) });
    expect(seas.map((s) => s.sea.sea)).toEqual([grey.sea.sea]);
    expect(ignored).toEqual([a]);
    const rs = findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, required: new Set([a]) }));
    expect(rs.length).toBeGreaterThan(0);
    expect(rs.every((r) => r.sea === grey.sea.sea)).toBe(true);
  });

  it('必選超過 5 個、等級不足、被排除、距離不夠 → 沒有路線', () => {
    const six = new Set(ids(grey, 'ABCDEF'));
    expect(findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, required: six }))).toEqual([]);
    const k = ids(grey, 'K')[0]!;
    expect(findRoutes(SEA_INDEXES, q({ level: 1, sea: grey.sea.sea, required: new Set([k]) }))).toEqual([]);
    expect(findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, required: new Set([k]), excluded: new Set([k]) }))).toEqual([]);
    expect(findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, required: new Set([k]), stats: { ...stats130, range: 1 } }))).toEqual([]);
  });

  it('指定物品「全部都要」與「任一個」:got 反映拿得到的指定物品', () => {
    const items = [...new Set(grey.sea.points.flatMap((p) => pointItems(p, stats130.surveillance)))];
    const [x, y] = [items[0]!, items[items.length - 1]!];
    const all = findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, itemIds: [x, y], match: 'all' }));
    for (const r of all) expect(r.got).toEqual([x, y]);
    const any = findRoutes(SEA_INDEXES, q({ sea: grey.sea.sea, itemIds: [x, y], match: 'any' }));
    for (const r of any) expect(r.got.length).toBeGreaterThan(0);
    expect(any.length).toBeGreaterThanOrEqual(all.length);
  });
});

describe('排序:可能解鎖數只列可去的點', () => {
  it('選探索排序時,路線上的點都是「可去的點」;必選點不是可去的點 → 空', () => {
    const explored = new Set(ids(drowned, 'AB'));
    const rs = findRoutes(SEA_INDEXES, q({ sort: 'opens', explored }));
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) for (const id of r.order) expect(isAvailable(g, explored, id)).toBe(true);
    const far = ids(drowned, 'Z')[0]!;
    expect(findRoutes(SEA_INDEXES, q({ sort: 'opens', explored, required: new Set([far]) }))).toEqual([]);
    // 換成每分鐘經驗排序,同一個必選點就不受限制
    expect(findRoutes(SEA_INDEXES, q({ sort: 'perMin', explored, required: new Set([far]) })).length).toBeGreaterThan(0);
  });

  it('非探索排序:opens 不含已去過的點與路線內的點', () => {
    const explored = new Set(ids(drowned, 'ABCDE'));
    for (const r of findRoutes(SEA_INDEXES, q({ explored, sea: drowned.sea.sea }))) {
      for (const id of r.opens) {
        expect(explored.has(id)).toBe(false);
        expect(r.order.includes(id)).toBe(false);
      }
    }
    expect(opensFor(g, new Set(), ids(drowned, 'AB'))).toEqual(expect.arrayContaining(ids(drowned, 'CDE')));
  });
});

describe('checkRequired:按「找路線」前的即時提示', () => {
  it('沒有必選點 → ok;超過 5 點、等級不足、耗用超過上限分別回報', () => {
    expect(checkRequired(grey, new Set(), 130, 98).ok).toBe(true);
    expect(checkRequired(grey, new Set(ids(grey, 'ABCDEF')), 130, 999).tooMany).toBe(true);
    expect(checkRequired(grey, new Set(ids(grey, 'K')), 1, 999).rankLocked).toEqual(ids(grey, 'K'));
    const c = checkRequired(grey, new Set(ids(grey, 'DGFK')), 76, 98);
    expect(c.range).toBe(87); // 案例 C:D → G → F → K 耗用 87
    expect(c.ok).toBe(true);
    expect(checkRequired(grey, new Set(ids(grey, 'DGFK')), 76, 80).ok).toBe(false);
  });
});

describe('極端輸入與效能', () => {
  it('速度 0、距離 0、limit 0 都回空陣列', () => {
    expect(findRoutes(SEA_INDEXES, q({ stats: { ...stats130, speed: 0 } }))).toEqual([]);
    expect(findRoutes(SEA_INDEXES, q({ stats: { ...stats130, range: 0 } }))).toEqual([]);
    expect(findRoutes(SEA_INDEXES, q({ limit: 0 }))).toEqual([]);
  });

  it('三種排序各自在全部海域跑完不超過 5 秒(開發機實測約 1 秒內)', () => {
    for (const sort of ['perMin', 'opens', 'variety'] as const) {
      const t = performance.now();
      findRoutes(SEA_INDEXES, q({ sort, explored: new Set(ids(drowned, 'AB')) }));
      expect(performance.now() - t).toBeLessThan(5000);
    }
  });
});
