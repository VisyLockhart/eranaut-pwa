import { describe, expect, it } from 'vitest';
import { calculate } from './craft-calc';
import type { SlotKey } from './types';

// 與 5p 工坊(https://5p.nbbjack.com/#/workshop)比對過的基礎素材總量(2026-10-11,單一配件 ×1、骨架不展開)。
// 40 種配件的基礎素材總量都已與 5p 一致;這裡留下曾經出錯的項目當回歸測試。
const CASES: [SlotKey, number, string, Record<string, number>][] = [
  ['stern', 1, '甲鱟級船尾', { 水之碎晶: 150 }],
  ['stern', 5, '鯊魚改級船尾', { 風之水晶: 396, 硬銀沙: 222, 硬銀礦: 120, 銀礦: 30 }],
  ['stern', 6, '甲鱟改級船尾', { 皇金礦: 12, 皇金沙: 30, 拉吉克硬化觸媒: 30, 青紫石英: 6 }],
  ['bow', 1, '甲鱟級船首', { 水之碎晶: 150, 玄鐵礦: 108, 焦炭: 162 }],
  ['bow', 2, '鬚鯨級船首', { 火之碎晶: 660, 鐵礦: 240, 靈銀沙: 90 }],
  ['bow', 3, '腔棘魚級船首', { 火之碎晶: 900, 玄鐵礦: 288, 鐵刀木: 27, 白鈦礦: 150 }],
  ['bow', 5, '鯊魚改級船首', { 風之水晶: 396, 硬銀礦: 120 }],
  ['bridge', 0, '鯊魚級艦橋', { 火之碎晶: 636, 鐵礦: 291, 炸彈的灰: 63 }],
];

describe('配件製作資料集與 5p 工坊一致', () => {
  for (const [slot, gradeIndex, label, expected] of CASES) {
    it(`${label} ×1 的基礎素材`, () => {
      const r = calculate([{ slot, gradeIndex, qty: 1 }]);
      const got = Object.fromEntries(r.bases.map((x) => [x.name, x.need]));
      for (const [name, need] of Object.entries(expected)) expect(got[name], name).toBe(need);
    });
  }

  it('玻璃板用水之碎晶,資料集不再有雷之碎晶', () => {
    const r = calculate([{ slot: 'stern', gradeIndex: 1, qty: 1 }]);
    expect(r.bases.some((x) => x.name === '雷之碎晶')).toBe(false);
  });

  it('皇金錠一次產出 3 個:18 個只需做 6 次', () => {
    const r = calculate([{ slot: 'stern', gradeIndex: 6, qty: 1 }]);
    const row = r.finals.find((x) => x.name === '皇金錠');
    expect(row?.need).toBe(18);
    expect(row?.crafts).toBe(6);
  });
});
