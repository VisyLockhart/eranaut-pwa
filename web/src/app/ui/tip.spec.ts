import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tip } from './tip';

@Component({
  imports: [Tip],
  template: `<button class="a" [tip]="text()"></button><button class="b" tip="固定" aria-label="自訂">x</button>`,
})
class Host {
  readonly text = signal<string | null>('加入常用');
}

describe('Tip', () => {
  const bubble = () => document.querySelector('.tip-bubble');
  const setup = async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    return f;
  };

  it('滑鼠停留顯示自製提示、離開後隱藏,並補上無障礙名稱', async () => {
    const f = await setup();
    const a = f.nativeElement.querySelector('.a') as HTMLElement;
    expect(a.getAttribute('aria-label')).toBe('加入常用');
    expect(a.getAttribute('title')).toBeNull();
    a.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    expect(bubble()?.textContent).toBe('加入常用');
    expect(bubble()?.classList.contains('show')).toBe(true);
    expect(a.getAttribute('aria-describedby')).toBe('tip-bubble');
    a.dispatchEvent(new PointerEvent('pointerleave'));
    expect(bubble()?.classList.contains('show')).toBe(false);
  });

  it('觸控不顯示;空值不顯示;已有 aria-label 不覆蓋', async () => {
    const f = await setup();
    const a = f.nativeElement.querySelector('.a') as HTMLElement;
    a.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    expect(bubble()?.classList.contains('show') ?? false).toBe(false);
    f.componentInstance.text.set(null);
    await f.whenStable();
    a.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    expect(bubble()?.classList.contains('show') ?? false).toBe(false);
    expect((f.nativeElement.querySelector('.b') as HTMLElement).getAttribute('aria-label')).toBe('自訂');
  });
});
