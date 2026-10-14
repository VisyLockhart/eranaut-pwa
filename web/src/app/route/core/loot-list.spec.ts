import { describe, expect, it } from 'vitest';
import { SEA_INDEXES } from './data';
import { pointItems } from './find';
import { aggregateLoot } from './loot-list';
import type { SeaPoint } from './types';

const pt = (code: string, mid: number, high: number, drop: { low: number[]; mid: number[]; high: number[] }): SeaPoint =>
  ({ code, statReq: { surveillanceMid: mid, surveillanceHigh: high, retrievalNorm: 0, retrievalOptim: 0, favor: 0 }, drop }) as unknown as SeaPoint;

const summary = (secs: ReturnType<typeof aggregateLoot>) => secs.map((s) => `${s.locked ? '鎖' : ''}${s.key}:${s.items.map((i) => i.id).join(',')}`);

describe('aggregateLoot(看全部的清單)', () => {
  const A = pt('A', 100, 200, { low: [1], mid: [2], high: [3] });
  const B = pt('B', 150, 300, { low: [1, 4], mid: [5], high: [6] });

  it('全部解鎖:高 → 中 → 低,沒有未解鎖段', () => {
    const s = aggregateLoot([A, B], 400);
    expect(s.map((x) => x.key)).toEqual(['high', 'mid', 'low']);
    expect(s.some((x) => x.locked)).toBe(false);
  });

  it('未解鎖的接在最後(高 → 中),標出來源站與差值', () => {
    const s = aggregateLoot([A, B], 120);
    // A 中階(門檻 100)已解鎖;A 高階差 80、B 中階差 30、B 高階差 180 未解鎖
    expect(summary(s)).toEqual(['mid:2', 'low:1,4', '鎖high:3,6', '鎖mid:5']);
    const high = s.find((x) => x.locked && x.key === 'high')!;
    expect(high.items.find((i) => i.id === 3)).toMatchObject({ stops: ['A'], gap: 80 });
    expect(high.items.find((i) => i.id === 6)).toMatchObject({ stops: ['B'], gap: 180 });
    expect(s.find((x) => x.locked && x.key === 'mid')!.items[0]).toMatchObject({ stops: ['B'], gap: 30 });
  });

  it('同一物品只出現一次:有任何一站已解鎖就算已解鎖,放在已解鎖來源中最高的階,列出所有已解鎖來源', () => {
    const X = pt('X', 100, 200, { low: [7], mid: [], high: [] });
    const Y = pt('Y', 100, 200, { low: [], mid: [7], high: [] });
    const Z = pt('Z', 500, 600, { low: [], mid: [], high: [7] }); // 這站高階鎖住
    const s = aggregateLoot([X, Y, Z], 150);
    expect(summary(s)).toEqual(['mid:7']);
    expect(s[0]!.items[0]!.stops).toEqual(['X', 'Y']);
  });

  it('完全沒有已解鎖來源:進未解鎖,取最高階的來源與最小差值', () => {
    const Y = pt('Y', 300, 900, { low: [], mid: [8], high: [] });
    const Z = pt('Z', 500, 900, { low: [], mid: [8], high: [] });
    const s = aggregateLoot([Y, Z], 100);
    expect(summary(s)).toEqual(['鎖mid:8']);
    expect(s[0]!.items[0]).toMatchObject({ stops: ['Y', 'Z'], gap: 200 });
  });

  it('指定的物品排在已解鎖段的最前面;其餘依名稱排序', () => {
    const real = SEA_INDEXES[0]!.sea.points.find((x) => x.drop.low.length >= 3)!;
    const last = real.drop.low[real.drop.low.length - 1]!;
    const low = aggregateLoot([real], 0, new Set([last])).find((x) => x.key === 'low')!;
    expect(low.items[0]).toMatchObject({ id: last, wanted: true });
    expect(new Set(low.items.map((i) => i.id))).toEqual(new Set(real.drop.low));
    expect(low.items.slice(1).every((i) => !i.wanted)).toBe(true);
  });

  it('名稱用配件製作的排序:前兩字相同聚在一起、字少的先(沉船戒指 … 上等沉船戒指)', () => {
    const all = SEA_INDEXES.flatMap((si) => si.sea.points);
    const hit = all.find((x) => x.drop.high.length >= 2)!;
    const s = aggregateLoot([hit], 9999);
    const names = s.find((x) => x.key === 'high')!.items.map((i) => i.name);
    const sorted = [...names].sort((x, y) => new Intl.Collator('zh-Hant-u-co-stroke').compare(x.slice(0, 2), y.slice(0, 2)) || x.length - y.length);
    expect(names.map((n) => n.slice(0, 2))).toEqual(sorted.map((n) => n.slice(0, 2)));
  });

  it('已解鎖的種類數 = find.ts 的 pointItems 聯集(「可撈到 N 種」與清單一致),整張資料集各種探索值都成立', () => {
    for (const si of SEA_INDEXES) {
      const pts = si.sea.points;
      for (const surveillance of [0, 100, 150, 200, 250, 300, 400]) {
        for (let i = 0; i + 2 < pts.length; i += 3) {
          const route = pts.slice(i, i + 3);
          const expected = new Set(route.flatMap((p) => pointItems(p, surveillance)));
          const open = aggregateLoot(route, surveillance).filter((x) => !x.locked).flatMap((x) => x.items.map((e) => e.id));
          expect(open).toHaveLength(expected.size);
          expect(new Set(open)).toEqual(expected);
          // 未解鎖段的物品不得同時出現在已解鎖段
          const shut = aggregateLoot(route, surveillance).filter((x) => x.locked).flatMap((x) => x.items.map((e) => e.id));
          expect(shut.some((id) => expected.has(id))).toBe(false);
        }
      }
    }
  });
});
