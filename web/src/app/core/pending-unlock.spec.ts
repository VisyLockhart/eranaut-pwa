import { describe, expect, it } from 'vitest';
import { SEAS } from '../route/core/data';
import { addPending, removePending, unlockPayload } from './pending-unlock';

const sea = SEAS[0]!;
const idOf = (code: string): number => sea.points.find((p) => p.code === code)!.id;

describe('待解鎖(D-311)', () => {
  const base = new Set([idOf('B'), idOf('E')]);

  it('點未發現的點:前面必經的點一起,不補兄弟點', () => {
    const next = addPending(base, [], idOf('O'));
    expect(next.at(-1)).toBe(idOf('O'));
    expect(next).toContain(idOf('J'));
    expect(next).toContain(idOf('N'));
    expect(next).not.toContain(idOf('B'));
  });

  it('已發現或已待解鎖的點不重複加入', () => {
    expect(addPending(base, [], idOf('E'))).toEqual([]);
    const once = addPending(base, [], idOf('N'));
    expect(addPending(base, once, idOf('N'))).toEqual(once);
    expect(addPending(base, once, idOf('O'))).toEqual([...once, idOf('O')]);
  });

  it('取消待解鎖:連同它後面的待解鎖點', () => {
    const all = addPending(base, [], idOf('O'));
    const { next, removed } = removePending(all, idOf('N'));
    expect(next).toEqual([idOf('J')]);
    expect(removed).toEqual([idOf('N'), idOf('O')]);
  });

  it('存檔內容只含有變動的海域,整海域一筆', () => {
    const pending = addPending(base, [], idOf('N'));
    const payload = unlockPayload(base, pending);
    expect(payload).toHaveLength(1);
    expect(payload[0]!.sea).toBe(sea.sea);
    expect(payload[0]!.points).toEqual(expect.arrayContaining([idOf('B'), idOf('E'), idOf('J'), idOf('N')]));
    expect(unlockPayload(base, [])).toEqual([]);
  });
});
