import { describe, expect, it } from 'vitest';
import { changedCount, dropOnPool, initLayout, tapPool, tapSlot, toInput, unpin } from './position-layout';

const subs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `s${i + 1}`, position: i + 1 }));

describe('initLayout', () => {
  it('1~4 進格子、其餘依位置進未排入', () => {
    const s = initLayout([...subs(6)].reverse());
    expect(s.slots).toEqual(['s1', 's2', 's3', 's4']);
    expect(s.pool).toEqual(['s5', 's6']);
    expect(s.held).toBeNull();
  });
  it('位置有缺口:空格保留 null', () => {
    expect(initLayout([{ id: 'a', position: 1 }, { id: 'b', position: 3 }]).slots).toEqual(['a', null, 'b', null]);
  });
});

describe('點選放置', () => {
  it('拿起再放進另一格 = 互換', () => {
    let s = tapSlot(initLayout(subs(4)), 0);
    expect(s.held).toBe('s1');
    s = tapSlot(s, 2);
    expect(s.slots).toEqual(['s3', 's2', 's1', 's4']);
    expect(s.held).toBeNull();
  });
  it('再點自己 = 取消拿起', () => {
    const s = tapSlot(tapSlot(initLayout(subs(4)), 1), 1);
    expect(s.held).toBeNull();
    expect(s.slots).toEqual(['s1', 's2', 's3', 's4']);
  });
  it('空格:點了沒反應;格子的艇放進空格 = 搬過去', () => {
    const base = unpin(initLayout(subs(4)), 1);
    expect(tapSlot(base, 1)).toBe(base);
    const s = tapSlot(tapSlot(base, 3), 1);
    expect(s.slots).toEqual(['s1', 's4', 's3', null]);
  });
  it('未排入拖進有艇的格子 = 替換,被換下的回到清單尾端', () => {
    const s = tapSlot(tapPool(initLayout(subs(6)), 's6'), 0);
    expect(s.slots).toEqual(['s6', 's2', 's3', 's4']);
    expect(s.pool).toEqual(['s5', 's1']);
  });
  it('未排入放進空格:清單裡少了它(剛取消釘選的留著)', () => {
    const s = tapSlot(tapPool(unpin(initLayout(subs(5)), 0), 's5'), 0);
    expect(s.slots).toEqual(['s5', 's2', 's3', 's4']);
    expect(s.pool).toEqual(['s1']);
  });
});

describe('取消釘選與放回', () => {
  it('✕ 把艇移到清單、格子變空位', () => {
    const s = unpin(initLayout(subs(4)), 2);
    expect(s.slots).toEqual(['s1', 's2', null, 's4']);
    expect(s.pool).toEqual(['s3']);
  });
  it('拿著格子的艇放到清單區 = 取消釘選;拿著清單的艇則只是放下', () => {
    const a = dropOnPool(tapSlot(initLayout(subs(4)), 3));
    expect(a.pool).toEqual(['s4']);
    expect(a.slots[3]).toBeNull();
    const b = dropOnPool(tapPool(initLayout(subs(5)), 's5'));
    expect(b.pool).toEqual(['s5']);
    expect(b.held).toBeNull();
  });
});

describe('changedCount / toInput', () => {
  it('互換兩艘 = 2 處變動;還原後 0', () => {
    const base = initLayout(subs(4));
    const s = tapSlot(tapSlot(base, 0), 1);
    expect(changedCount(s, base)).toBe(2);
    expect(changedCount(base, base)).toBe(0);
  });
  it('取消釘選 1 艘 = 1 處;輸出格式', () => {
    const base = initLayout(subs(4));
    const s = unpin(base, 3);
    expect(changedCount(s, base)).toBe(1);
    expect(toInput(s)).toEqual({ slots: ['s1', 's2', 's3', null], unplaced: ['s4'] });
  });
});
