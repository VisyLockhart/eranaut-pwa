import { describe, expect, it } from 'vitest';
import partsJson from '../../route/data/parts.json';
import { CRAFT_DATA, SLOT_KEYS } from './data';

const { base, crafts, slots } = CRAFT_DATA;
const known = (n: string) => n in base || n in crafts;

describe('配件製作資料集(V6 完整性)', () => {
  it('4 個部位 × 10 種等級(1~5、1改~5改),順序與航線資料一致', () => {
    for (const k of SLOT_KEYS) {
      const g = slots[k].grades;
      expect(g, k).toHaveLength(10);
      g.forEach((e, i) => {
        expect(e.modified, `${k} ${i}`).toBe(i >= 5);
        expect(e.grade, `${k} ${i}`).toBe((i % 5) + 1);
      });
      expect(slots[k].label).toBe((partsJson as unknown as { parts: Record<string, { label: string }> }).parts[k]!.label);
    }
  });

  it('改版配件都有骨架(同級原版 ×1),原版沒有', () => {
    for (const k of SLOT_KEYS) for (const e of slots[k].grades) {
      if (e.modified) expect(e.frame, `${k} ${e.grade}改`).toEqual({ grade: e.grade, qty: 1 });
      else expect(e.frame).toBeUndefined();
    }
  });

  it('素材與可製作品名稱不重複', () => {
    for (const n of Object.keys(crafts)) expect(n in base, n).toBe(false);
  });

  it('所有配方成分都能解析到素材或可製作品,數量為 ≥1 整數', () => {
    const check = (where: string, r: Readonly<Record<string, number>>) => {
      expect(Object.keys(r).length, where).toBeGreaterThan(0);
      for (const [n, q] of Object.entries(r)) {
        expect(known(n), `${where} 的 ${n}`).toBe(true);
        expect(Number.isInteger(q) && q >= 1, `${where} 的 ${n} 數量 ${q}`).toBe(true);
      }
    };
    for (const [n, c] of Object.entries(crafts)) check(n, c.recipe);
    for (const k of SLOT_KEYS) for (const e of slots[k].grades) check(`${k} ${e.grade}${e.modified ? '改' : ''}`, e.recipe);
  });

  it('產量為 ≥2 整數;目前只有皇金錠、聖水、祝聖水(3)與星極油(4)', () => {
    for (const [n, c] of Object.entries(crafts)) {
      if (c.yield !== undefined) expect(Number.isInteger(c.yield) && c.yield >= 2, n).toBe(true);
    }
    expect(Object.entries(crafts).filter(([, c]) => c.yield).map(([n, c]) => [n, c.yield])).toEqual([['皇金錠', 3], ['聖水', 3], ['祝聖水', 3], ['星極油', 4]]);
  });

  it('配方沒有循環', () => {
    const state: Record<string, 1 | 2> = {};
    const dfs = (n: string, trail: string[]): void => {
      if (state[n] === 2 || !(n in crafts)) return;
      expect(state[n], `循環:${[...trail, n].join(' → ')}`).toBeUndefined();
      state[n] = 1;
      for (const c of Object.keys(crafts[n]!.recipe)) dfs(c, [...trail, n]);
      state[n] = 2;
    };
    for (const n of Object.keys(crafts)) dfs(n, []);
  });

  it('每個品項都被某個配件直接或間接用到(沒有多餘資料)', () => {
    const reach = new Set<string>();
    const visit = (n: string): void => {
      if (reach.has(n)) return;
      reach.add(n);
      for (const c of Object.keys(crafts[n]?.recipe ?? {})) visit(c);
    };
    for (const k of SLOT_KEYS) for (const e of slots[k].grades) for (const n of Object.keys(e.recipe)) visit(n);
    for (const n of [...Object.keys(base), ...Object.keys(crafts)]) expect(reach.has(n), n).toBe(true);
  });

  it('遊戲內校正:翼膠的長頸駝的唾液 2;星極油可製作(產出 4),不在素材', () => {
    expect(crafts['翼膠']!.recipe).toEqual({ 雙足飛龍的翼膜: 3, 惡精靈的翅膀: 2, 長頸駝的唾液: 2, 水之水晶: 4 });
    expect(crafts['星極油']!.recipe).toEqual({ 星極花: 2, 星砂礫: 2, 熊脂: 1, 水之晶簇: 2, 雷之晶簇: 1 });
    expect('星極油' in base).toBe(false);
  });

  it('資料量:素材 107、可製作品 84', () => {
    expect(Object.keys(base)).toHaveLength(107);
    expect(Object.keys(crafts)).toHaveLength(84);
  });
});
