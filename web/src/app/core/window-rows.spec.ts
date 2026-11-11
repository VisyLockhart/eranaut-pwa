import { describe, expect, it } from 'vitest';
import { endOptions, newRow, startOptions, withEnd, withStart, type WindowRow } from './window-rows';

const H = (h: number, m = 0): number => h * 60 + m;

describe('window-rows(清單模式的列)', () => {
  it('newRow:第一個空格起一小時;緊貼前一段也是獨立一列;空檔不足取到空檔結束;全滿回 null', () => {
    expect(newRow([])).toEqual([0, 60]);
    expect(newRow([[0, H(22)]])).toEqual([H(22), H(23)]);
    expect(newRow([[0, H(22)], [H(22, 30), 1440]])).toEqual([H(22), H(22, 30)]);
    expect(newRow([[0, 1440]])).toBeNull();
  });

  it('startOptions:排除其他列佔用的時間,自己的時間保留', () => {
    const rows: WindowRow[] = [[H(8), H(10)], [H(12), H(13)]];
    const opts = startOptions(rows, 0);
    expect(opts).toContain(H(8));
    expect(opts).toContain(H(9, 45));
    expect(opts).toContain(H(10));
    expect(opts).not.toContain(H(12));
    expect(opts).not.toContain(H(12, 45));
    expect(opts).toContain(H(13));
    expect(opts).toHaveLength(96 - 4);
  });

  it('endOptions:開始之後,到下一個被其他列佔用的開頭為止;沒有阻擋就到 24:00', () => {
    const rows: WindowRow[] = [[H(8), H(9)], [H(12), H(13)]];
    const o0 = endOptions(rows, 0);
    expect(o0[0]).toBe(H(8, 15));
    expect(o0.at(-1)).toBe(H(12));
    const o1 = endOptions(rows, 1);
    expect(o1.at(-1)).toBe(1440);
    expect(endOptions([[H(20), H(21)]], 0).at(-1)).toBe(1440);
  });

  it('withStart:結束跨進別列就縮到空檔邊界、盡量保留長度;往後移時保留長度', () => {
    const rows: WindowRow[] = [[H(8), H(10)], [H(12), H(13)]];
    expect(withStart(rows, 0, H(9))).toEqual([[H(9), H(10)], [H(12), H(13)]]);
    expect(withStart(rows, 0, H(11))).toEqual([[H(11), H(12)], [H(12), H(13)]]); // 原長 2 小時,被擋在 12:00
    expect(withStart(rows, 0, H(11, 45))[0]).toEqual([H(11, 45), H(12)]);
    expect(withStart([[H(8), H(9)]], 0, H(10))).toEqual([[H(10), H(11)]]);
  });

  it('withEnd:不早於開始、不跨進別列', () => {
    const rows: WindowRow[] = [[H(8), H(9)], [H(12), H(13)]];
    expect(withEnd(rows, 0, H(11))[0]).toEqual([H(8), H(11)]);
    expect(withEnd(rows, 0, H(15))[0]).toEqual([H(8), H(12)]);
    expect(withEnd(rows, 0, H(7))[0]).toEqual([H(8), H(8, 15)]);
  });
});
