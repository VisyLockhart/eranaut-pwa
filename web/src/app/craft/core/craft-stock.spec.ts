import { describe, expect, it } from 'vitest';
import { calculate, type CalcResult } from './craft-calc';
import { applyStock, finalsProgress, netNeeds } from './craft-stock';
import { CRAFT_DATA } from './data';
import type { CraftData, GradeRecipe, SlotRecipes } from './types';

// 小型資料集:成品 F = 半成品 S ×3 + 素材 B ×1;半成品 S(一次做 2 個)= 素材 A ×2。
// 配件(船體 1 級)= 成品 F ×2 + 素材 B ×1。
const grade = (recipe: Record<string, number>): GradeRecipe => ({ grade: 1, modified: false, recipe });
const slot = (label: string, g0: GradeRecipe): SlotRecipes => ({ label, grades: [g0, ...Array.from({ length: 9 }, () => grade({}))] });
const MINI: CraftData = {
  base: { A: { group: '其他' }, B: { group: '其他' } },
  crafts: { S: { group: '其他', recipe: { A: 2 }, yield: 2 }, F: { group: '其他', recipe: { S: 3, B: 1 } } },
  slots: { hull: slot('船體', grade({ F: 2, B: 1 })), stern: slot('船尾', grade({})), bow: slot('船首', grade({})), bridge: slot('船首', grade({})) },
};
const sel = [{ slot: 'hull' as const, gradeIndex: 0, qty: 1 }];
const run = (stock: Record<string, number>) => {
  const r = calculate(sel, {}, MINI);
  const net = netNeeds(r, stock, MINI);
  return { r, net, obj: Object.fromEntries(net) };
};

describe('配件製作庫存連動(淨需求)', () => {
  it('沒有庫存:淨需求等於總需求', () => {
    const { r, obj } = run({});
    expect(obj).toEqual({ F: 2, S: 6, A: 6, B: 3 });
    expect(Object.fromEntries([...r.finals, ...r.semis, ...r.bases].map((x) => [x.name, x.need]))).toEqual(obj);
  });

  it('成品達標:對應的半成品與素材一起歸零(只剩配件直接要的素材)', () => {
    expect(run({ F: 2 }).obj).toEqual({ F: 2, S: 0, A: 0, B: 1 });
  });

  it('成品做了一部分:下層只剩還沒做的那幾個(半成品依產量取整)', () => {
    // 還缺 1 個 F → 需要 S 3 個(做 2 次)→ A 4;B = 配件直接 1 + F 1 個用 1
    expect(run({ F: 1 }).obj).toEqual({ F: 2, S: 3, A: 4, B: 2 });
  });

  it('半成品有庫存:素材相應扣除;成品不受影響', () => {
    // S 已有 2,F 還缺 2 → 需要 S 6,還缺 4 → 做 2 次 → A 4
    expect(run({ S: 2 }).obj).toEqual({ F: 2, S: 6, A: 4, B: 3 });
  });

  it('半成品全部足夠:素材只剩直接用到的', () => {
    expect(run({ S: 6 }).obj).toEqual({ F: 2, S: 6, A: 0, B: 3 });
  });

  it('庫存清掉:下層需求自動回來', () => {
    expect(run({ F: 2 }).obj).not.toEqual(run({}).obj);
    expect(run({}).obj).toEqual({ F: 2, S: 6, A: 6, B: 3 });
  });

  it('applyStock 只換 need,其餘欄位不變', () => {
    const r = calculate(sel, {}, MINI);
    const e = applyStock(r, { F: 2 }, MINI);
    expect(e.semis[0]!.need).toBe(0);
    expect(e.semis[0]!.name).toBe(r.semis[0]!.name);
    expect(e.semis[0]!.crafts).toBe(r.semis[0]!.crafts);
  });

  it('進度以成品計算:成品達標 = 100%,與半成品、素材無關', () => {
    const r = calculate(sel, {}, MINI);
    expect(finalsProgress(r, {})).toBe(0);
    expect(finalsProgress(r, { F: 1 })).toBe(0.5);
    expect(finalsProgress(r, { F: 2 })).toBe(1);
    expect(finalsProgress(r, { F: 5 })).toBe(1);
    // 半成品與素材都備齊、成品沒做 → 仍是 0%
    expect(finalsProgress(r, { S: 6, A: 6, B: 3 })).toBe(0);
  });
});

describe('真實資料:成品全部達標,半成品與素材需求歸零', () => {
  const sels = [
    { slot: 'hull' as const, gradeIndex: 9, qty: 1 },
    { slot: 'stern' as const, gradeIndex: 8, qty: 2 },
    { slot: 'bow' as const, gradeIndex: 3, qty: 1 },
    { slot: 'bridge' as const, gradeIndex: 9, qty: 1 },
  ];
  const result: CalcResult = calculate(sels);
  const all = [...result.finals, ...result.semis, ...result.bases];

  it('沒有庫存:淨需求等於總需求', () => {
    const net = netNeeds(result, {});
    for (const r of all) expect(net.get(r.name)).toBe(r.need);
  });

  it('把每個成品都備齊:半成品全 0;素材只剩配件直接使用的量', () => {
    const stock = Object.fromEntries(result.finals.map((r) => [r.name, r.need]));
    const e = applyStock(result, stock);
    for (const r of e.semis) expect(r.need).toBe(0);
    for (const r of e.bases) {
      const gross = result.bases.find((x) => x.name === r.name)!;
      const viaCrafts = gross.usedBy.reduce((n, p) => n + (all.find((x) => x.name === p)?.inputs[r.name] ?? 0), 0);
      expect(r.need).toBe(Math.max(0, gross.need - viaCrafts));
    }
    expect(finalsProgress(result, stock)).toBe(1);
  });

  it('淨需求不會比總需求大', () => {
    const stock = { [result.semis[0]!.name]: 5, [result.bases[0]!.name]: 9999 };
    const net = netNeeds(result, stock);
    for (const r of all) expect(net.get(r.name)!).toBeLessThanOrEqual(r.need);
  });

  it('資料集有載入', () => {
    expect(Object.keys(CRAFT_DATA.crafts).length).toBeGreaterThan(50);
  });
});
