import { describe, expect, it } from 'vitest';
import { applyOrder, moveItem } from './workshop-order';

const items = (...ids: string[]) => ids.map((id) => ({ id }));
const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe('applyOrder', () => {
  it('沒有存過順序 → 維持 API 順序', () => {
    expect(ids(applyOrder(items('a', 'b', 'c'), []))).toEqual(['a', 'b', 'c']);
  });
  it('套用存的順序', () => {
    expect(ids(applyOrder(items('a', 'b', 'c'), ['c', 'a', 'b']))).toEqual(['c', 'a', 'b']);
  });
  it('過濾已不存在的 id,新工坊附加到最後(依 API 順序)', () => {
    expect(ids(applyOrder(items('a', 'b', 'd', 'e'), ['c', 'b', 'a']))).toEqual(['b', 'a', 'd', 'e']);
  });
  it('順序裡重複的 id 只算一次', () => {
    expect(ids(applyOrder(items('a', 'b'), ['b', 'b', 'a']))).toEqual(['b', 'a']);
  });
});

describe('moveItem', () => {
  it('往前、往後移動', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('不變動與超出範圍都回傳原樣複本', () => {
    const src = ['a', 'b'];
    expect(moveItem(src, 1, 1)).toEqual(src);
    expect(moveItem(src, -1, 0)).toEqual(src);
    expect(moveItem(src, 0, 2)).toEqual(src);
    expect(moveItem(src, 0, 2)).not.toBe(src);
  });
});
