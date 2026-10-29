import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CraftLink } from './craft-link';
import { Toast } from './toast';

describe('CraftLink(D-262)', () => {
  let nav: ReturnType<typeof vi.fn>;
  let link: CraftLink;
  beforeEach(() => {
    TestBed.resetTestingModule();
    nav = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { navigateByUrl: nav } }] });
    link = TestBed.inject(CraftLink);
  });

  it('send:記下配置、切到 /craft;take 只能取一次', () => {
    expect(link.send([3, 1, 10, 6], '主力艇')).toBe(true);
    expect(nav).toHaveBeenCalledWith('/craft');
    expect(link.take()).toEqual({ parts: [3, 1, 10, 6], name: '主力艇' });
    expect(link.take()).toBeNull();
  });

  it('配件不是四個 1~10 的整數就不送', () => {
    expect(link.send([1, 2, 3], 'x')).toBe(false);
    expect(link.send([0, 1, 1, 1], 'x')).toBe(false);
    expect(link.send([1, 1, 11, 1], 'x')).toBe(false);
    expect(link.send([1, 1, 1.5, 1], 'x')).toBe(false);
    expect(nav).not.toHaveBeenCalled();
    expect(link.take()).toBeNull();
  });

  it('back:切回 /gear,離開時的捲動位置交給航線頁還原一次', () => {
    link.send([1, 1, 1, 1], 'x');
    link.back();
    expect(nav).toHaveBeenLastCalledWith('/gear');
    expect(link.takeRestore()).not.toBeUndefined();
    expect(link.takeRestore()).toBeNull();
  });
});

describe('Toast 按鈕', () => {
  it('act:先執行再關掉;show 回傳 id,時間到自動關', () => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    const toast = TestBed.inject(Toast);
    const run = vi.fn();
    const id = toast.show('已帶入', { ms: 5000, actions: [{ label: '復原', run }] });
    const item = toast.items()[0]!;
    expect(item.id).toBe(id);
    toast.act(item, item.actions[0]!);
    expect(run).toHaveBeenCalledOnce();
    expect(toast.items()).toHaveLength(0);
    toast.show('a', { ms: 100 });
    vi.advanceTimersByTime(101);
    expect(toast.items()).toHaveLength(0);
    vi.useRealTimers();
  });
});
