import { describe, expect, it } from 'vitest';
import sourcesJson from '../data/sources.json';
import { CRAFT_DATA } from './data';
import { MAX_LINES, currencyNeeded, hasSource, sourceTags, sourceTip } from './craft-source';

const keys = (name: string, need = 1) => sourceTags(name, need).map((t) => t.key);

describe('素材取得管道(D-333)', () => {
  it('通貨數 = 總需求 ÷ 比值,四捨五入,至少 1 個;比值 1(留白)就是 1:1', () => {
    expect(currencyNeeded(10, 4)).toBe(3); // 2.5 → 3
    expect(currencyNeeded(9, 4)).toBe(2);
    expect(currencyNeeded(1, 10)).toBe(1); // 0.1 → 至少 1
    expect(currencyNeeded(7, 1)).toBe(7);
    expect(currencyNeeded(5, 0)).toBe(5);
  });

  it('資料集每個素材都在配件資料集裡,比值是正整數', () => {
    const known = new Set([...Object.keys(CRAFT_DATA.base), ...Object.keys(CRAFT_DATA.crafts)]);
    const items = (sourcesJson as unknown as { items: Record<string, { t: string; ratio?: number }[]> }).items;
    for (const [name, srcs] of Object.entries(items)) {
      expect(known.has(name), name).toBe(true);
      for (const s of srcs) if (s.ratio !== undefined) expect(Number.isInteger(s.ratio) && s.ratio >= 1, `${name} ${s.t}`).toBe(true);
    }
  });

  it('同時符合多個管道就全部列出,順序固定:商人 → 部族 → 軍票 → 紫票 → 詩學 → 空賊 → 薰衣草 / 風茄', () => {
    expect(keys('白鈦塊')).toEqual(['merchant', 'steel', 'lavender']);
    expect(keys('荒神靈銀')).toEqual(['poetics', 'brass']);
    expect(keys('拉吉克硬化觸媒')).toEqual(['purple', 'brass']);
    expect(keys('飛龍革')).toEqual(['merchant', 'brass']);
  });

  it('商人購買:價格與處數;沒有資料的素材不標', () => {
    const [t] = sourceTags('岩鹽', 3);
    expect(t!.key).toBe('merchant');
    expect(t!.icon).toBe('srcCoin');
    expect(t!.text).toBe('商人 3 Gil · 8 處');
    expect(t!.locked).toBe(false);
    expect(hasSource('火之水晶')).toBe(false);
    expect(sourceTags('火之水晶', 5)).toEqual([]);
    expect(sourceTags('不存在的素材', 1)).toEqual([]);
  });

  it('友好部族購買:只有部族商人、都要完成任務 → 標「需解鎖」並寫出前置任務', () => {
    const [t] = sourceTags('硬銀沙', 1);
    expect(t!.key).toBe('tribe');
    expect(t!.locked).toBe(true);
    expect(t!.text).toBe('部族 807 Gil 需解鎖');
    expect(t!.lines[0]!.sub).toContain('需完成任務');
  });

  it('商人有的要完成任務、有的不用:算商人,不鎖,詳情把不用任務的排前面', () => {
    const [t] = sourceTags('德拉瓦尼亞槲寄生', 1);
    expect(t!.key).toBe('merchant');
    expect(t!.locked).toBe(false);
    expect(t!.lines[0]!.sub).not.toContain('需完成任務');
    expect(t!.lines[1]!.sub).toContain('需完成任務');
  });

  it('伊修加德的珠寶店也要完成任務,但不是部族:算商人並標需解鎖', () => {
    const [t] = sourceTags('水淙石', 1);
    expect(t!.key).toBe('merchant');
    expect(t!.locked).toBe(true);
  });

  it('軍票:三國各一筆合併成一個標籤,詳情列軍階與補給官座標', () => {
    const [t] = sourceTags('斑銅礦', 1);
    expect(t!.key).toBe('script');
    expect(t!.text).toBe('軍票 ×200');
    expect(t!.lines).toHaveLength(3);
    expect(t!.lines[0]!.sub).toContain('軍階');
    expect(t!.lines[0]!.sub).toMatch(/X:[\d.]+ Y:[\d.]+/);
  });

  it('詩學:兌換地點有地圖與座標', () => {
    const t = sourceTags('荒神靈銀', 1).find((x) => x.key === 'poetics')!;
    expect(t.text).toBe('詩學 ×5');
    expect(t.lines[0]!.head).toContain('亞拉戈詩學神典石');
    expect(t.lines[0]!.sub).toMatch(/X:5\.7 Y:5\.2/);
  });

  it('紫票:要完成任務的一組與一般一組合併成一個標籤,詳情最多列 MAX_LINES 行,其餘折疊', () => {
    const [t] = sourceTags('碳纖維', 1);
    expect(t!.key).toBe('purple');
    expect(t!.lines.length).toBe(MAX_LINES);
    expect(t!.more).toBeGreaterThan(0);
  });

  it('空賊 / 薰衣草 / 風茄:依比值與總需求換算通貨數', () => {
    const brass = sourceTags('荒神靈銀', 14).find((x) => x.key === 'brass')!;
    expect(brass.text).toBe('空賊黃銅 1:4 · 約 4 個'); // 14 ÷ 4 = 3.5 → 4
    expect(brass.lines[0]!.sub).toContain('需求 14');
    const hide = sourceTags('飛龍革', 3).find((x) => x.key === 'brass')!;
    expect(hide.text).toBe('空賊黃銅 1:10 · 約 1 個'); // 0.3 → 至少 1
    const one = sourceTags('堅鋼塊', 5).find((x) => x.key === 'lavender')!;
    expect(one.text).toBe('薰衣草 ×5'); // 比值 1 = 1:1
    expect(sourceTags('銀礦', 16).find((x) => x.key === 'nightshade')!.text).toBe('風茄 1:8 · 約 2 個');
  });

  it('其他貨幣(栎木幣等)只整理不顯示', () => {
    const hidden = (sourcesJson as unknown as { hidden: Record<string, { cur: string }[]> }).hidden;
    expect(Object.keys(hidden).length).toBeGreaterThan(0);
    expect(hidden['白鎢礦']!.map((h) => h.cur)).toContain('櫟木幣');
    const shown = sourceTags('白鎢礦', 1).map((t) => t.text + t.lines.map((l) => l.head + (l.sub ?? '')).join(''));
    expect(shown.join('')).not.toContain('櫟木幣');
    expect(keys('白鎢礦')).toEqual(['script']);
  });

  it('列表提示:一行一種來源', () => {
    expect(sourceTip(sourceTags('荒神靈銀', 4))).toBe('詩學 ×5\n空賊黃銅 1:4 · 約 1 個');
  });
});
