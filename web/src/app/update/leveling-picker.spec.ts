import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SEAS } from '../route/core/data';
import { LevelingPicker, type PickerResult } from './leveling-picker';

const sea = SEAS[0]!;
const id = (code: string): number => sea.points.find((p) => p.code === code)!.id;

async function make(found: ReadonlySet<number> | null) {
  const f = TestBed.createComponent(LevelingPicker);
  f.componentRef.setInput('level', 1);
  f.componentRef.setInput('found', found);
  await f.whenStable();
  const out: PickerResult[] = [];
  f.componentInstance.confirmed.subscribe((r) => out.push(r));
  const el = f.nativeElement as HTMLElement;
  const tile = (code: string) => [...el.querySelectorAll<HTMLButtonElement>('.lv-pt')].find((b) => b.querySelector('b')!.textContent === code)!;
  const click = async (e: HTMLElement) => {
    e.click();
    await f.whenStable();
  };
  return { f, el, out, tile, click };
}

describe('LevelingPicker 快速解鎖(D-311)', () => {
  const found = new Set([id('B'), id('E')]);

  it('沒有海圖紀錄:不上鎖,顯示提示', async () => {
    const { el } = await make(null);
    expect(el.querySelector('.lv-pt.locked')).toBeNull();
    expect(el.textContent).toContain('更新海圖');
  });

  it('未發現的點虛線加鎖、仍可點;點了變待解鎖並連帶前面必經的點', async () => {
    const { el, tile, click } = await make(found);
    expect(tile('O').classList.contains('locked')).toBe(true);
    expect(tile('O').disabled).toBe(false);
    await click(tile('O'));
    expect(tile('O').classList.contains('pending')).toBe(true);
    expect(tile('J').classList.contains('pending')).toBe(true);
    expect(tile('N').classList.contains('pending')).toBe(true);
    expect(el.querySelector('.lv-pend')?.textContent).toContain('待解鎖 3 點');
  });

  it('只解鎖:主按鈕變「確認解鎖 N 點」,確認送出不含路線', async () => {
    const { el, out, tile, click } = await make(found);
    await click(tile('N'));
    const primary = el.querySelector<HTMLButtonElement>('.btn-primary-modal')!;
    expect(primary.textContent).toContain('確認解鎖 2 點');
    await click(primary);
    expect(out).toEqual([{ route: null, unlock: [id('J'), id('N')] }]);
  });

  it('chip 的 × 取消該點與後面的待解鎖;全部還原清空', async () => {
    const { el, tile, click } = await make(found);
    await click(tile('O'));
    await click(el.querySelectorAll<HTMLButtonElement>('.lv-chip')[1]!);
    expect(el.querySelectorAll('.lv-chip').length).toBe(1);
    await click(el.querySelector<HTMLButtonElement>('.lv-pend .lv-link')!);
    expect(el.querySelector('.lv-pend')).toBeNull();
    expect(tile('O').classList.contains('locked')).toBe(true);
  });

  it('有待解鎖時返回先確認是否放棄', async () => {
    const { f, el, tile, click } = await make(found);
    let backs = 0;
    f.componentInstance.back.subscribe(() => backs++);
    await click(tile('J'));
    await click(el.querySelector<HTMLButtonElement>('.modal-actions .btn-secondary')!);
    expect(backs).toBe(0);
    expect(el.querySelector('.lv-discard')?.textContent).toContain('放棄 1 個');
    await click(el.querySelectorAll<HTMLButtonElement>('.lv-discard .btn-secondary')[1]!);
    expect(backs).toBe(1);
  });
});
