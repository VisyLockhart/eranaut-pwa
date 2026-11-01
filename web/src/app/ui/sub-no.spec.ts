import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { defaultSubName } from '../core/format';
import { SubNo } from './sub-no';

function render(position: number): HTMLElement {
  TestBed.resetTestingModule();
  const f = TestBed.createComponent(SubNo);
  f.componentRef.setInput('position', position);
  f.detectChanges();
  return f.nativeElement as HTMLElement;
}

describe('SubNo(D-323)', () => {
  it('位置 1~4 顯示圓圈數字,沒有禁止圖示', () => {
    for (const [p, c] of [[1, '①'], [2, '②'], [3, '③'], [4, '④']] as const) {
      const el = render(p);
      expect(el.textContent?.trim()).toBe(c);
      expect(el.querySelector('.no-ban')).toBeNull();
    }
  });
  it('位置 5 以後不給編號,改顯示禁止圖示與說明', () => {
    for (const p of [5, 6, 20]) {
      const el = render(p);
      expect(el.textContent?.trim()).toBe('');
      const ban = el.querySelector('.no-ban');
      expect(ban).not.toBeNull();
      expect(ban?.getAttribute('aria-label')).toBe('未列入編號');
      expect(el.querySelector('app-icon svg')).not.toBeNull();
    }
  });
  it('預設名稱:1~4 帶編號,未排入不帶', () => {
    expect(defaultSubName(3)).toBe('潛水艇 ③');
    expect(defaultSubName(3, true)).toBe('潛水艇 3');
    expect(defaultSubName(5)).toBe('潛水艇');
    expect(defaultSubName(5, true)).toBe('潛水艇');
  });
});
