import { describe, expect, it } from 'vitest';
import { calculate, type CalcResult, type RowKind } from './core/craft-calc';
import { relatedIds, rowId } from './craft-state';

/** 四個部位都選 1 級:艦橋直接要玄鋼塊 21,玄鋼錠(配方含玄鋼塊 ×2)又讓直接素材出現另一列玄鋼塊(D-265) */
const R: CalcResult = calculate(['hull', 'stern', 'bow', 'bridge'].map((slot) => ({ slot: slot as 'hull', gradeIndex: 0, qty: 1 })));
const rel = (name: string, kind: RowKind) => relatedIds(R, { name, kind });
const has = (s: Set<string>, kind: RowKind, name: string) => s.has(rowId({ kind, name }));

describe('追蹤的關聯列依層級比對(D-265)', () => {
  it('前提:玄鋼塊同時是交納素材與直接素材的不同兩列', () => {
    expect(R.finals.some((r) => r.name === '玄鋼塊')).toBe(true);
    expect(R.directs.some((r) => r.name === '玄鋼塊' && r.crafts > 0)).toBe(true);
  });

  it('點交納素材的玄鋼錠:成分在直接素材(及同名原料的基礎素材),交納素材欄的玄鋼塊不被列入', () => {
    const s = rel('玄鋼錠', 'final');
    expect(has(s, 'direct', '玄鋼塊')).toBe(true);
    expect(has(s, 'direct', '焦炭')).toBe(true);
    expect(has(s, 'base', '焦炭')).toBe(true);
    expect(has(s, 'final', '玄鋼塊')).toBe(false);
    expect([...s].some((id) => id.startsWith('final:'))).toBe(false);
  });

  it('點直接素材的玄鋼塊:成分只在基礎素材、用到它的是交納素材的玄鋼錠;直接素材欄不被列入', () => {
    const s = rel('玄鋼塊', 'direct');
    expect(has(s, 'base', '玄鐵礦')).toBe(true);
    expect(has(s, 'final', '玄鋼錠')).toBe(true);
    // 交納素材的玄鋼塊(艦橋直接要的)與玄鋼錠無關;直接素材欄的火之水晶是它的另一個來源(交納素材的玄鋼塊的成分)
    expect(has(s, 'final', '玄鋼塊')).toBe(false);
    expect(has(s, 'direct', '火之水晶')).toBe(false);
    expect([...s].some((id) => id.startsWith('direct:'))).toBe(false);
  });

  it('點交納素材的玄鋼塊:只有它自己的成分,不會連到玄鋼錠', () => {
    const s = rel('玄鋼塊', 'final');
    expect(has(s, 'direct', '玄鐵礦')).toBe(true);
    expect(has(s, 'direct', '火之水晶')).toBe(true);
    expect(has(s, 'final', '玄鋼錠')).toBe(false);
    expect(has(s, 'direct', '玄鋼塊')).toBe(false);
  });

  it('點基礎素材:同名原料的直接素材列、用到它的直接素材與交納素材', () => {
    const s = rel('玄鐵礦', 'base');
    expect(has(s, 'direct', '玄鋼塊')).toBe(true);
    expect(has(s, 'direct', '玄鐵礦')).toBe(true);
    expect(has(s, 'final', '玄鋼塊')).toBe(true);
    expect([...s].some((id) => id.startsWith('base:'))).toBe(false);
  });

  it('沒有追蹤、或找不到那一列:空集合', () => {
    expect(relatedIds(R, null).size).toBe(0);
    expect(rel('不存在', 'final').size).toBe(0);
  });
});
