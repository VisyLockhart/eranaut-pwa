import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { WorkshopPager } from './workshop-pager';

describe('WorkshopPager', () => {
  it('前後鈕循環翻頁,送出新的序號', () => {
    const f = TestBed.createComponent(WorkshopPager);
    f.componentRef.setInput('options', [{ value: 0, label: '全部' }, { value: 1, label: 'A' }, { value: 2, label: 'B' }]);
    f.componentRef.setInput('index', 0);
    f.detectChanges();
    const got: number[] = [];
    f.componentInstance.indexChange.subscribe((n) => got.push(n));
    const [prev, next] = [...(f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.pager-btn')];
    prev!.click();
    next!.click();
    expect(got).toEqual([2, 1]);
  });
});
