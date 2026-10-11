import { describe, expect, it } from 'vitest';
import { calculate, frameName, groupRank, type CalcRow, type Selection } from './craft-calc';
import { CRAFT_DATA } from './data';

const totals = (rows: CalcRow[]) => Object.fromEntries(rows.map((r) => [r.name, r.need]));
const hull5m: Selection = { slot: 'hull', gradeIndex: 9, qty: 1 };
const set = (gradeIndex: number, qty = 1): Selection[] => (['hull', 'stern', 'bow', 'bridge'] as const).map((slot) => ({ slot, gradeIndex, qty }));
const EMPTY = { finals: [], directs: [], bases: [] };

// 5p 工坊對「希爾德拉改級船體 ×1(骨架不展開)」顯示的基礎素材(2026-10-11,簡轉繁),38 項
const P5_BASE: Record<string, number> = {
  火之水晶: 234, 冰之水晶: 54, 風之水晶: 414, 土之水晶: 54, 水之水晶: 220, 火之晶簇: 72, 冰之晶簇: 12, 風之晶簇: 24, 土之晶簇: 54, 雷之晶簇: 2, 水之晶簇: 4,
  秘銀礦: 30, 鈷鐵礦: 18, 星砂礫: 4, 矽岩: 15, 焦炭: 162, 樹汁塊: 135, 惡精靈的翅膀: 24, 鐵刀木: 18, 藍鐵礦: 27, 靈銀沙: 150, 硬銀沙: 72, 靈銀礦: 36,
  暗栗木原木: 150, 熊脂: 2, 長頸駝的唾液: 60, 德拉瓦尼亞天然水: 18, 阿巴拉提亞天然水: 40, 星極花: 4, 雙足飛龍的翼膜: 36, 曉光靈砂: 6, 阿巴拉提亞槲寄生: 40,
  閃鋅礦: 18, 荒神靈銀: 36, 光銀礦: 54, 薔薇輝石原石: 45, 柳杉原木: 27, 純鈦礦: 27,
};

describe('配件製作計算(V1~V7)', () => {
  it('V1:希爾德拉改級船體 ×1,基礎素材 38 項與 5p 工坊完全一致', () => {
    const r = calculate([hull5m]);
    expect(totals(r.bases)).toEqual(P5_BASE);
  });

  it('V1:產量只算到需要的次數(祝聖水需要 60、做 20 次;星極油需要 6、做 2 次產出 8)', () => {
    const r = calculate([hull5m]);
    const find = (rows: CalcRow[], n: string) => rows.find((x) => x.name === n)!;
    expect(find(r.directs, '祝聖水')).toMatchObject({ need: 60, crafts: 20, made: 60 });
    expect(find(r.directs, '星極油')).toMatchObject({ need: 6, crafts: 2, made: 8 });
  });

  it('V2:忘了產量會得到的數字不會出現(水之水晶 220,不是 420;天然水 40,不是 120)', () => {
    const b = totals(calculate([hull5m]).bases);
    expect(b['水之水晶']).toBe(220);
    expect(b['阿巴拉提亞天然水']).toBe(40);
    expect(b['阿巴拉提亞槲寄生']).toBe(40);
  });

  it('V3:分三層 = 交納素材 11(含骨架)、直接素材 32、基礎素材 38(與 5p 工坊三欄筆數相同)', () => {
    const r = calculate([hull5m]);
    expect(r.finals).toHaveLength(11);
    expect(r.finals.filter((x) => x.frame).map((x) => x.name)).toEqual(['希爾德拉級船體骨架']);
    expect(r.directs).toHaveLength(32);
    expect(r.bases).toHaveLength(38);
    // 直接素材 = 半成品 + 直接用到的素材(含碎晶);交納素材本身要做的半成品都在裡面
    for (const n of ['暗栗木木材', '星極油', '祝聖水', '靈銀塊', '鐵刀木木材']) expect(r.directs.map((x) => x.name), n).toContain(n);
  });

  it('直接素材的碎晶只算做交納素材本身用的,做半成品用的在基礎素材(5p:水之碎晶 直接 150、基礎 240)', () => {
    const r = calculate([{ slot: 'hull', gradeIndex: 7, qty: 1 }]);
    expect(r.directs.find((x) => x.name === '水之碎晶')!.need).toBeLessThan(r.bases.find((x) => x.name === '水之碎晶')!.need);
  });

  it('每一層內品項不重複;kind 對應該層', () => {
    const r = calculate(set(9));
    for (const rows of [r.finals, r.directs, r.bases]) {
      const names = rows.map((x) => x.name);
      expect(new Set(names).size).toBe(names.length);
    }
    for (const x of r.finals) expect(x.kind).toBe('final');
    for (const x of r.directs) expect(x.kind).toBe('direct');
    for (const x of r.bases) expect(x.kind).toBe('base');
    expect(r.bases.every((x) => !(x.name in CRAFT_DATA.crafts))).toBe(true);
  });

  it('同時是交納素材與直接素材的品項:鯊魚級船尾的白鋼錠,交納 54、直接素材 54,基礎素材的爆彈怪的灰 108(5p 同)', () => {
    const r = calculate([{ slot: 'stern', gradeIndex: 0, qty: 1 }]);
    expect(r.finals.find((x) => x.name === '白鋼錠')!.need).toBe(54);
    expect(r.directs.find((x) => x.name === '白鋼錠')!.need).toBe(54);
    expect(r.bases.find((x) => x.name === '炸彈的灰')!.need).toBe(108);
    expect(r.finals.find((x) => x.name === '白鋼錠')!.key).toBe('白鋼錠');
    expect(r.directs.find((x) => x.name === '白鋼錠')!.key).toBe('d:白鋼錠');
  });

  it('V4:4 個部位一起算:品項種類與逐件加總相同,每項數量不大於逐件加總(共用取整)', () => {
    for (const idx of [9, 0, 5]) {
      const sels = set(idx);
      const comb = totals(calculate(sels).bases);
      const sum: Record<string, number> = {};
      for (const s of sels) for (const [k, v] of Object.entries(totals(calculate([s]).bases))) sum[k] = (sum[k] ?? 0) + v;
      expect(Object.keys(comb).sort(), `等級 ${idx}`).toEqual(Object.keys(sum).sort());
      for (const k of Object.keys(sum)) expect(comb[k]!, `${idx} ${k}`).toBeLessThanOrEqual(sum[k]!);
    }
  });

  it('V4:5改整套的熊脂合併後 5、逐件加總 6(星極油合併後少做一次);祝聖水系列不受影響', () => {
    const sels = set(9);
    const comb = totals(calculate(sels).bases);
    const sum: Record<string, number> = {};
    for (const s of sels) for (const [k, v] of Object.entries(totals(calculate([s]).bases))) sum[k] = (sum[k] ?? 0) + v;
    expect(comb['熊脂']).toBe(5);
    expect(sum['熊脂']).toBe(6);
    expect(comb['阿巴拉提亞天然水']).toBe(sum['阿巴拉提亞天然水']);
  });

  it('V4:合併後取整只會讓總量不大於逐件加總(星極油兩件合算少做一次)', () => {
    // 希爾德拉改級:船體需要星極油 6(做 2 次),艦橋需要 6(做 2 次)——合併 12 → 做 3 次
    const sels: Selection[] = [hull5m, { slot: 'bridge', gradeIndex: 9, qty: 1 }];
    const comb = calculate(sels).directs.find((x) => x.name === '星極油')!;
    const a = calculate([sels[0]!]).directs.find((x) => x.name === '星極油')?.crafts ?? 0;
    const b = calculate([sels[1]!]).directs.find((x) => x.name === '星極油')?.crafts ?? 0;
    expect(comb.crafts).toBeLessThanOrEqual(a + b);
  });

  it('V5:數量 ×2,線性的品項是 2 倍,取整的品項不超過 2 倍', () => {
    const one = totals(calculate([hull5m]).bases);
    const two = totals(calculate([{ ...hull5m, qty: 2 }]).bases);
    expect(two['柳杉原木']).toBe(54);
    expect(two['暗栗木原木']).toBe(300);
    for (const k of Object.keys(one)) expect(two[k]!, k).toBeLessThanOrEqual(one[k]! * 2);
    // 星極油需要 12 → 做 3 次 → 星極花 6(不是逐倍的 8)
    expect(two['星極花']).toBe(6);
  });

  it('V7:展開骨架 = 骨架列消失,原版配件的配方併入交納素材', () => {
    const r = calculate([hull5m], { expandFrame: true });
    expect(r.finals.some((x) => x.frame)).toBe(false);
    const nm = r.finals.find((x) => x.name === '暗栗木木材')!;
    expect(nm.need).toBeGreaterThanOrEqual(30); // 原版希爾德拉級船體要 30
    // 與「改5 + 原版5 各一件、骨架不展開」的素材總量相同
    const hull5: Selection = { slot: 'hull', gradeIndex: 4, qty: 1 };
    expect(totals(r.bases)).toEqual(totals(calculate([hull5m, hull5]).bases));
  });

  it('展開骨架:原版配件沒有骨架,開關不影響結果', () => {
    const a = calculate(set(0));
    const b = calculate(set(0), { expandFrame: true });
    expect(b).toEqual(a);
  });

  it('骨架的數量跟著配件數量;名稱用航線資料的等級名稱', () => {
    const r = calculate([{ slot: 'bow', gradeIndex: 6, qty: 3 }]);
    const f = r.finals.find((x) => x.frame)!;
    expect(f.name).toBe('甲鱟級船首骨架');
    expect(f.need).toBe(3);
    expect(frameName('hull', 5)).toBe('希爾德拉級船體骨架');
  });

  it('沒有選、數量 < 1 或配件不存在 → 空結果;小數數量捨去', () => {
    expect(calculate([])).toEqual(EMPTY);
    expect(calculate([{ ...hull5m, qty: 0 }])).toEqual(EMPTY);
    expect(calculate([{ ...hull5m, qty: -1 }])).toEqual(EMPTY);
    expect(calculate([{ slot: 'hull', gradeIndex: 99, qty: 1 }])).toEqual(EMPTY);
    expect(totals(calculate([{ ...hull5m, qty: 1.9 }]).bases)).toEqual(totals(calculate([hull5m]).bases));
  });

  it('列的關聯資訊:成分用量、被誰使用、屬於哪個部位', () => {
    const r = calculate([hull5m]);
    const wood = r.finals.find((x) => x.name === '柳杉木材')!;
    expect(wood.inputs).toEqual({ 柳杉原木: 27, 樹汁塊: 81, 風之水晶: 54, 冰之水晶: 54 });
    expect(wood.slots).toEqual(['hull']);
    const sap = r.bases.find((x) => x.name === '樹汁塊')!;
    expect(sap.usedBy.sort()).toEqual(['柳杉木材', '鐵刀木木材'].sort());
    expect(r.directs.find((x) => x.name === '祝聖水')!.usedBy).toEqual(['祝聖栗木木材']);
  });

  it('輸出的素材都有分組;分組順序已定義', () => {
    const r = calculate(set(9, 2), { expandFrame: true });
    for (const x of [...r.finals, ...r.directs, ...r.bases]) expect(groupRank(x.group), `${x.name} ${x.group}`).toBeLessThan(11);
  });

  it('資料驅動:換一份資料也能算(最小例子,含取整)', () => {
    const data = {
      base: { 原料: { group: '礦石' } },
      crafts: { 半成品: { group: '金屬', recipe: { 原料: 2 }, yield: 3 }, 成品: { group: '金屬', recipe: { 半成品: 2 } } },
      slots: {
        hull: { label: '船體', grades: [{ grade: 1, modified: false, recipe: { 成品: 2 } }] },
        stern: { label: '船尾', grades: [] }, bow: { label: '船首', grades: [] }, bridge: { label: '船橋', grades: [] },
      },
    } as unknown as typeof CRAFT_DATA;
    const r = calculate([{ slot: 'hull', gradeIndex: 0, qty: 1 }], {}, data);
    // 交納素材 成品 ×2 → 直接素材 半成品需要 4 → 做 2 次(產 6)→ 基礎素材 原料 4
    expect(r.finals.map((x) => [x.name, x.need])).toEqual([['成品', 2]]);
    expect(r.directs[0]).toMatchObject({ name: '半成品', need: 4, crafts: 2, made: 6 });
    expect(totals(r.bases)).toEqual({ 原料: 4 });
  });

  it('資料驅動:更深的製作鏈也會一路算到基礎素材(直接素材只列一層)', () => {
    const data = {
      base: { 原料: { group: '礦石' } },
      crafts: {
        胚: { group: '金屬', recipe: { 原料: 3 } },
        半成品: { group: '金屬', recipe: { 胚: 2 }, yield: 2 },
        成品: { group: '金屬', recipe: { 半成品: 3 } },
      },
      slots: {
        hull: { label: '船體', grades: [{ grade: 1, modified: false, recipe: { 成品: 1 } }] },
        stern: { label: '船尾', grades: [] }, bow: { label: '船首', grades: [] }, bridge: { label: '船橋', grades: [] },
      },
    } as unknown as typeof CRAFT_DATA;
    const r = calculate([{ slot: 'hull', gradeIndex: 0, qty: 1 }], {}, data);
    // 成品 1 → 半成品 3(做 2 次)→ 胚 4 → 原料 12
    expect(r.directs.map((x) => [x.name, x.need])).toEqual([['半成品', 3]]);
    expect(totals(r.bases)).toEqual({ 原料: 12 });
  });
});
