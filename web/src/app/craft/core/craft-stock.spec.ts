import { describe, expect, it } from 'vitest';
import { calculate, type CalcResult, type Stock } from './craft-calc';
import { finalsProgress } from './craft-stock';
import type { CraftData, GradeRecipe, SlotRecipes } from './types';

// 小型資料集 A:交納素材 F = 半成品 S ×3 + 素材 B ×1;半成品 S(一次做 2 個)= 素材 A ×2。
// 配件(船體 1 級)= F ×2 + 素材 B ×1。
const grade = (recipe: Record<string, number>): GradeRecipe => ({ grade: 1, modified: false, recipe });
const slot = (label: string, g0: GradeRecipe): SlotRecipes => ({ label, grades: [g0, ...Array.from({ length: 9 }, () => grade({}))] });
const mk = (hull: Record<string, number>): CraftData => ({
  base: { A: { group: '其他' }, B: { group: '其他' } },
  crafts: { S: { group: '其他', recipe: { A: 2 }, yield: 2 }, F: { group: '其他', recipe: { S: 3, B: 1 } } },
  slots: { hull: slot('船體', grade(hull)), stern: slot('船尾', grade({})), bow: slot('船首', grade({})), bridge: slot('船首', grade({})) },
});
const MINI = mk({ F: 2, B: 1 });
const sel = [{ slot: 'hull' as const, gradeIndex: 0, qty: 1 }];
const obj = (rows: CalcResult['finals']) => Object.fromEntries(rows.map((x) => [x.name, x.need]));
const run = (stock: Stock, data = MINI) => {
  const r = calculate(sel, {}, data, stock);
  return { r, f: obj(r.finals), d: obj(r.directs), b: obj(r.bases) };
};

describe('配件製作庫存連動(三層,D-258)', () => {
  it('沒有庫存:三層都是完整需求', () => {
    const { f, d, b } = run({});
    expect(f).toEqual({ F: 2, B: 1 });
    expect(d).toEqual({ S: 6, B: 2 });
    expect(b).toEqual({ A: 6, B: 3 });
  });

  it('交納素材達標:直接素材與基礎素材一起歸零(基礎素材只剩配件直接要的)', () => {
    const { f, d, b } = run({ F: 2 });
    expect(f).toEqual({ F: 2, B: 1 }); // 交納素材的需求不會被扣
    expect(d).toEqual({ S: 0, B: 0 });
    expect(b).toEqual({ A: 0, B: 1 });
  });

  it('交納素材做了一部分:下層只剩還沒做的份量(依產量取整)', () => {
    // 還缺 1 個 F → S 3(做 2 次)→ A 4;B = 配件直接 1 + F 用 1
    const { d, b } = run({ F: 1 });
    expect(d).toEqual({ S: 3, B: 1 });
    expect(b).toEqual({ A: 4, B: 2 });
  });

  it('直接素材裡的半成品有庫存:基礎素材相應扣除;上層不受影響', () => {
    // S 已有 2,需要 6,還缺 4 → 做 2 次 → A 4
    const { f, d, b } = run({ 'd:S': 2 });
    expect(f).toEqual({ F: 2, B: 1 });
    expect(d).toEqual({ S: 6, B: 2 });
    expect(b).toEqual({ A: 4, B: 3 });
    expect(run({ 'd:S': 6 }).b).toEqual({ A: 0, B: 3 });
  });

  it('直接素材裡本來就是素材的列:庫存與基礎素材共用同一個 key', () => {
    const { r } = run({ B: 2 });
    const dB = r.directs.find((x) => x.name === 'B')!;
    const bB = r.bases.find((x) => x.name === 'B')!;
    expect(dB.key).toBe('B');
    expect(bB.key).toBe('B');
    expect(dB.need).toBe(2);
    expect(bB.need).toBe(3);
  });

  it('庫存清掉:下層需求自動回來;列不會消失', () => {
    expect(run({ F: 2 }).r.directs).toHaveLength(2);
    expect(run({ F: 2 }).d).not.toEqual(run({}).d);
    expect(run({}).d).toEqual({ S: 6, B: 2 });
  });

  it('列的 key:交納素材與素材用名稱,直接素材的可製作品加 d:', () => {
    const { r } = run({});
    expect(r.finals.map((x) => x.key)).toEqual(['F', 'B']);
    expect(r.directs.map((x) => x.key)).toEqual(['d:S', 'B']);
    expect(r.bases.map((x) => x.key).sort()).toEqual(['A', 'B']);
  });

  it('同時是交納素材又被其他交納素材使用的品項:兩處各記各的庫存', () => {
    // 配件 = S ×2 + F ×1;F 要 S ×3 → S 在交納素材要 2,在直接素材要 3
    const data = mk({ S: 2, F: 1 });
    const none = run({}, data);
    expect(none.f).toEqual({ S: 2, F: 1 });
    expect(none.d).toEqual({ A: 2, S: 3, B: 1 });
    // 交納的 S 備齊:不必再為它做,但 F 用的 S 還是要:A 只剩做 F 那 3 個 S 用的
    const done = run({ S: 2 }, data);
    expect(done.d['A']).toBe(0);
    expect(done.d['S']).toBe(3);
    expect(done.b['A']).toBe(4);
    // 直接素材那列的 S 備齊:F 用的不必再做
    const direct = run({ 'd:S': 3 }, data);
    expect(direct.d['A']).toBe(2);
    expect(direct.b['A']).toBe(2);
  });

  it('備料進度只看交納素材:全部達標 = 100%,素材與半成品庫存不算', () => {
    const r0 = calculate(sel, {}, MINI, {});
    expect(finalsProgress(r0, {})).toBe(0);
    expect(finalsProgress(r0, { A: 99, 'd:S': 99 })).toBe(0);
    expect(finalsProgress(r0, { F: 2, B: 1 })).toBe(1);
    expect(finalsProgress(r0, { F: 1 })).toBeCloseTo(1 / 3);
    expect(finalsProgress(calculate([], {}, MINI, {}), {})).toBe(0);
  });

  it('真實資料:鯊魚級船尾,白鋼錠備齊要交的 54 個,做鉚釘用的 54 個還是要做', () => {
    const s = [{ slot: 'stern' as const, gradeIndex: 0, qty: 1 }];
    const gross = calculate(s);
    expect(gross.finals.find((x) => x.name === '白鋼錠')!.need).toBe(54);
    expect(gross.directs.find((x) => x.name === '白鋼錠')!.need).toBe(54);
    const ash = (r: CalcResult) => r.bases.find((x) => x.name === '炸彈的灰')!.need;
    expect(ash(gross)).toBe(108);
    expect(ash(calculate(s, {}, undefined, { 白鋼錠: 54 }))).toBe(54);
    expect(ash(calculate(s, {}, undefined, { 白鋼錠: 54, 'd:白鋼錠': 54 }))).toBe(0);
  });

  it('真實資料:全部交納素材備齊 → 直接素材與基礎素材全部 0', () => {
    const s = [{ slot: 'hull' as const, gradeIndex: 5, qty: 1 }];
    const g = calculate(s);
    const stock: Record<string, number> = {};
    for (const f of g.finals) stock[f.key] = f.need;
    const r = calculate(s, {}, undefined, stock);
    expect(finalsProgress(r, stock)).toBe(1);
    expect(r.directs.every((x) => x.need === 0)).toBe(true);
    expect(r.bases.every((x) => x.need === 0)).toBe(true);
  });
});
