import { describe, expect, it } from 'vitest';
import { ITEMS, SEAS, SEA_INDEXES, TABLES, seaIndex } from './data';

describe('資料集(P1 產生)', () => {
  it('6 個海域、航點數 30 / 20 / 20 / 20 / 20 / 13', () => {
    expect(SEAS.map((s) => s.points.length)).toEqual([30, 20, 20, 20, 20, 13]);
    expect(SEAS.map((s) => s.name)).toEqual(['溺沒海', '灰海', '翠浪海', '賽蓮海', '紫礁海', '南蒼茫洋']);
  });

  it('所有航點等級門檻 ≤ 130,座標在 1024 方形內', () => {
    for (const s of SEAS) for (const p of s.points) {
      expect(p.rankReq).toBeLessThanOrEqual(130);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1024);
      expect(p.y).toBeLessThanOrEqual(1024);
    }
  });

  it('矩陣:出發點在最前面、對稱、對角為 0', () => {
    for (const s of SEAS) {
      const { ids, range, distance } = s.matrix;
      expect(ids[0]).toBe(s.home.id);
      expect(ids).toHaveLength(s.points.length + 1);
      for (let i = 0; i < ids.length; i++) {
        expect(range[i]![i]).toBe(0);
        expect(distance[i]![i]).toBe(0);
        for (let j = 0; j < ids.length; j++) {
          expect(range[i]![j]).toBe(range[j]![i]);
          expect(distance[i]![j]).toBe(distance[j]![i]);
        }
      }
    }
  });

  it('連線:兩端都在這張海域(含出發點);賽蓮海 20 條(案例 D)', () => {
    for (const s of SEAS) {
      const all = new Set(s.matrix.ids);
      for (const [a, b] of s.links) {
        expect(all.has(a)).toBe(true);
        expect(all.has(b)).toBe(true);
      }
    }
    expect(SEAS[3]!.links).toHaveLength(20);
  });

  it('掉落物 id 都有繁中名稱', () => {
    for (const s of SEAS) for (const p of s.points) for (const id of [...p.drop.low, ...p.drop.mid, ...p.drop.high]) {
      expect(ITEMS[String(id)]?.name, `${s.name}${p.code} 物品 ${id}`).toBeTruthy();
    }
  });

  it('零件:4 類 × 10 種;等級 1~130 連續', () => {
    for (const k of ['hull', 'stern', 'bow', 'bridge'] as const) expect(TABLES.parts.parts[k].grades).toHaveLength(10);
    expect(TABLES.ranks.map((r) => r.rank)).toEqual(Array.from({ length: 130 }, (_, i) => i + 1));
  });

  it('seaIndex 取海域、不存在丟錯', () => {
    expect(seaIndex(4).sea.name).toBe('賽蓮海');
    expect(SEA_INDEXES).toHaveLength(6);
    expect(() => seaIndex(99)).toThrow();
  });

  it('南蒼茫洋:13 點(A~M,最高 130 級),連線把全部航點串起來', () => {
    const sea = SEAS[5]!;
    expect(sea.points).toHaveLength(13);
    expect(Math.max(...sea.points.map((p) => p.rankReq))).toBe(130);
    const reach = new Set<number>([sea.home.id]);
    for (let i = 0; i < sea.points.length; i++) for (const [a, b] of sea.links) if (reach.has(a)) reach.add(b);
    expect(reach.size).toBe(sea.points.length + 1);
  });
});
