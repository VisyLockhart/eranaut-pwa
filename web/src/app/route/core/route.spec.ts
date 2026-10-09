import { describe, expect, it } from 'vitest';
import { MAX_STOPS, canAdd, returnAt, routeCost, selectability, shortestOrder, splitMinutes, travelMinutes } from './route';
import { buildStats } from './build';
import { TABLES } from './data';
import { SEA, codes, ids, sea } from './test-helpers';

describe('路線耗用與航行時間', () => {
  it('案例 A:賽蓮海 R→O,總耗用 136、總距離 241974', () => {
    const c = routeCost(sea(SEA.siren), ids(sea(SEA.siren), 'RO'));
    expect(c.range).toBe(136);
    expect(c.distance).toBe(241974);
  });

  it('案例 A:速度 100 → 2日4小時19分;速度 190 → 1日9小時13分', () => {
    const { distance } = routeCost(sea(SEA.siren), ids(sea(SEA.siren), 'RO'));
    expect(travelMinutes(distance, 100)).toBe(3139);
    expect(splitMinutes(3139)).toEqual({ days: 2, hours: 4, minutes: 19 });
    expect(splitMinutes(travelMinutes(distance, 190))).toEqual({ days: 1, hours: 9, minutes: 13 });
  });

  it('速度 0 或負數 → Infinity;空路線耗用為 0', () => {
    expect(travelMinutes(1000, 0)).toBe(Infinity);
    expect(routeCost(sea(SEA.grey), [])).toEqual({ distance: 0, range: 0, fuel: 0, stops: 0 });
  });

  it('不在這張海域的航點會丟錯', () => {
    expect(() => routeCost(sea(SEA.grey), [sea(SEA.siren).sea.points[0]!.id])).toThrow();
  });

  it('順序有關:D→G→F→K 耗用 87,K→D→F→G 耗用 115', () => {
    const g = sea(SEA.grey);
    expect(routeCost(g, ids(g, 'DGFK')).range).toBe(87);
    expect(routeCost(g, ids(g, 'KDFG')).range).toBe(115);
  });

  it('splitMinutes / returnAt', () => {
    expect(splitMinutes(2065)).toEqual({ days: 1, hours: 10, minutes: 25 });
    expect(splitMinutes(-5)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(returnAt(1_000, 2)).toBe(121_000);
  });
});

describe('燃料(RS-22)', () => {
  it('案例 E:溺沒海 O + J = 9', () => {
    const d = sea(SEA.drowned);
    expect(routeCost(d, ids(d, 'OJ')).fuel).toBe(9);
  });

  it('與順序無關', () => {
    const d = sea(SEA.drowned);
    expect(routeCost(d, ids(d, 'JO')).fuel).toBe(9);
  });

  it('其他海域每點 6', () => {
    for (const i of [SEA.grey, SEA.jade, SEA.siren, SEA.violet, SEA.south]) {
      const s = sea(i);
      expect(s.sea.points.every((p) => p.tankReq === 6)).toBe(true);
    }
  });

  it('與配件、等級無關:只看航點', () => {
    const g = sea(SEA.grey);
    const before = routeCost(g, ids(g, 'DGFK')).fuel;
    buildStats(TABLES, { level: 100, parts: [10, 10, 10, 10] }); // 換配置不影響路線燃料
    expect(routeCost(g, ids(g, 'DGFK')).fuel).toBe(before);
    expect(before).toBe(24);
  });
});

describe('選取即時判斷(案例 C:灰海、3123、76 級)', () => {
  const g = sea(SEA.grey);
  const stats = buildStats(TABLES, { level: 76, parts: [3, 1, 2, 3] });

  it('配置 3123 在 76 級:距離 98、速度 155', () => {
    expect(stats.range).toBe(98);
    expect(stats.speed).toBe(155);
  });

  it('D→G→F→K 耗用 87 ≤ 98,航行時間 1日10小時25分', () => {
    const c = routeCost(g, ids(g, 'DGFK'));
    expect(splitMinutes(travelMinutes(c.distance, stats.speed))).toEqual({ days: 1, hours: 10, minutes: 25 });
  });

  it('再追加任何其他航點:接在最後最少 112,最佳插入重排最少 103,皆 > 98', () => {
    const seq = ids(g, 'DGFK');
    let tail = Infinity;
    let best = Infinity;
    for (const p of g.sea.points) {
      if (seq.includes(p.id)) continue;
      tail = Math.min(tail, routeCost(g, [...seq, p.id]).range);
      best = Math.min(best, shortestOrder(g, [...seq, p.id]).cost.range);
    }
    expect(tail).toBe(112);
    expect(best).toBe(103);
  });

  it('其餘全部反灰,只剩 D、G、F、K 已選', () => {
    const sel = selectability(g, ids(g, 'DGFK'), 76, stats.range);
    const selected = [...sel].filter(([, v]) => v === 'selected').map(([id]) => g.byId.get(id)!.code).sort();
    expect(selected).toEqual(['D', 'F', 'G', 'K']);
    expect([...sel.values()].filter((v) => v === 'ok')).toHaveLength(0);
    expect([...sel.values()].filter((v) => v === 'range')).toHaveLength(g.sea.points.length - 4);
  });

  it('灰海各航點等級門檻 50~70,76 級全部符合', () => {
    const reqs = g.sea.points.map((p) => p.rankReq);
    expect(Math.min(...reqs)).toBe(50);
    expect(Math.max(...reqs)).toBe(70);
  });

  it('取消選取後恢復:只選 D 時,有許多點可以再選;空序列時等級夠、耗用夠的都可選', () => {
    const one = selectability(g, ids(g, 'D'), 76, stats.range);
    expect([...one.values()].filter((v) => v === 'ok').length).toBeGreaterThan(3);
    expect(canAdd(g, ids(g, 'D'), ids(g, 'G')[0]!, 76, stats.range)).toBe(true);
  });

  it('等級不足 → rank;已滿 5 個 → full(優先於 range)', () => {
    const low = selectability(g, [], 1, 999);
    expect([...low.values()].every((v) => v === 'rank')).toBe(true);
    const five = selectability(g, ids(g, 'ABCDE'), 100, 999);
    expect(MAX_STOPS).toBe(5);
    expect([...five].filter(([, v]) => v === 'full')).toHaveLength(g.sea.points.length - 5);
  });

  it('連線與燃料不參與判斷:沒有連線的兩點也能一起選', () => {
    const linked = new Set(g.sea.links.map(([a, b]) => `${a}-${b}`));
    const pts = g.sea.points;
    const pair = pts.flatMap((a) => pts.map((b) => [a, b] as const)).find(([a, b]) => a.id !== b.id && !linked.has(`${a.id}-${b.id}`) && !linked.has(`${b.id}-${a.id}`))!;
    expect(canAdd(g, [pair[0].id], pair[1].id, 125, 9999)).toBe(true);
  });

  it('案例 D:翠浪海同樣的 DGFK 最短順序也要 167,遠超 98,不能選', () => {
    const j = sea(SEA.jade);
    expect(shortestOrder(j, ids(j, 'DGFK')).cost.range).toBe(167);
    expect(codes(j, shortestOrder(j, ids(j, 'DGFK')).order)).toBe('GKFD');
    expect(routeCost(j, ids(j, 'DGFK')).range).toBeGreaterThan(98);
  });
});

describe('最短順序', () => {
  const g = sea(SEA.grey);

  it('K,D,F,G → D,G,F,K(耗用 87)', () => {
    const o = shortestOrder(g, ids(g, 'KDFG'));
    expect(codes(g, o.order)).toBe('DGFK');
    expect(o.cost.range).toBe(87);
  });

  it('單點與空集合', () => {
    expect(shortestOrder(g, []).order).toEqual([]);
    expect(shortestOrder(g, ids(g, 'D')).order).toEqual(ids(g, 'D'));
  });

  it('超過 5 個航點會丟錯', () => {
    expect(() => shortestOrder(g, ids(g, 'ABCDEF'))).toThrow();
  });

  it('等於暴力列舉的最小耗用(各海域抽樣)', () => {
    const rec = (si: ReturnType<typeof sea>, cur: number[], rest: number[], out: { v: number }) => {
      if (!rest.length) {
        out.v = Math.min(out.v, routeCost(si, cur).range);
        return;
      }
      rest.forEach((x, i) => rec(si, [...cur, x], rest.filter((_, j) => j !== i), out));
    };
    for (let i = 0; i < 6; i++) {
      const si = sea(i);
      const all = si.sea.points.map((p) => p.id);
      for (let k = 2; k <= 5; k++) {
        const set = all.slice(i, i + k);
        const out = { v: Infinity };
        rec(si, [], set, out);
        expect(shortestOrder(si, set).cost.range).toBe(out.v);
      }
    }
  });
});
