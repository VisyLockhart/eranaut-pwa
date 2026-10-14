import { describe, expect, it } from 'vitest';
import { CRAFT_DATA } from './data';
import { frameName } from './craft-calc';
import { buildTree, hasTree, parseCrystal } from './craft-tree';

describe('配方樹(D-264)', () => {
  it('蒼天石:晶類與成分分開、數量是做一次的用量', () => {
    const t = buildTree('蒼天石')!;
    expect(t.crystals.map((c) => [c.name, c.qty])).toEqual(
      expect.arrayContaining([['風之晶簇', 1], ['火之晶簇', 1]]),
    );
    const m = Object.fromEntries(t.items.map((i) => [i.name, i.qty]));
    expect(m['蒼天石原石']).toBe(3);
    expect(m['沉積岩磨刀石']).toBe(9);
  });

  it('基礎素材沒有配方樹', () => {
    expect(buildTree('蒼天石原石')).toBeNull();
    expect(hasTree('蒼天石原石')).toBe(false);
    expect(hasTree('蒼天石')).toBe(true);
  });

  it('所有可製作品都建得出樹,且晶類不會混進成分', () => {
    for (const name of Object.keys(CRAFT_DATA.crafts)) {
      const t = buildTree(name);
      expect(t, name).not.toBeNull();
      const walk = (n: NonNullable<typeof t>) => {
        for (const i of n.items) {
          expect(parseCrystal(i.name), i.name).toBeNull();
          if (i.child) walk(i.child);
        }
      };
      walk(t!);
    }
  });

  it('未展開的骨架也有樹', () => {
    const name = frameName('hull', 5);
    expect(hasTree(name)).toBe(true);
    expect(buildTree(name)!.items.length + buildTree(name)!.crystals.length).toBeGreaterThan(0);
  });

  it('晶類名稱:16 種都解析得出來', () => {
    for (const e of ['火', '冰', '風', '土', '雷', '水'])
      for (const t of ['碎晶', '水晶', '晶簇']) expect(parseCrystal(`${e}之${t}`)).toEqual({ element: e, tier: t });
    expect(parseCrystal('白鋼錠')).toBeNull();
  });

  it('一次做多個的品項帶出 yield', () => {
    const multi = Object.entries(CRAFT_DATA.crafts).find(([, c]) => (c.yield ?? 1) > 1)!;
    expect(buildTree(multi[0])!.yield).toBe(multi[1].yield);
  });
});
