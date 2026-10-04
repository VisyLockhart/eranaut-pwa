import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PULL_MAX, PULL_THRESHOLD, PullRefresh, pullDistance } from './pull-refresh';

@Component({
  imports: [PullRefresh],
  template: '<div id="box" appPullRefresh (pullChange)="pulls.push($event)" (refreshRequested)="refreshed = refreshed + 1"></div>',
})
class Host {
  pulls: number[] = [];
  refreshed = 0;
}

function touch(el: HTMLElement, type: string, y: number): Event {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [{ clientY: y }] });
  el.dispatchEvent(ev);
  return ev;
}

describe('pullDistance(D-166)', () => {
  it('有阻力、向上不算、有上限', () => {
    expect(pullDistance(-20)).toBe(0);
    expect(pullDistance(0)).toBe(0);
    expect(pullDistance(100)).toBe(50);
    expect(pullDistance(10_000)).toBe(PULL_MAX);
  });
});

describe('PullRefresh 指令(D-166)', () => {
  function setup(): { host: Host; box: HTMLElement } {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { host: fixture.componentInstance, box: fixture.nativeElement.querySelector('#box') as HTMLElement };
  }

  it('在最上面往下拉超過門檻,放手後要求重新整理並把指示區歸零', () => {
    const { host, box } = setup();
    touch(box, 'touchstart', 100);
    const move = touch(box, 'touchmove', 100 + PULL_THRESHOLD * 2 + 10);
    expect(move.defaultPrevented).toBe(true);
    touch(box, 'touchend', 0);
    expect(host.refreshed).toBe(1);
    expect(host.pulls.at(-1)).toBe(0);
    expect(Math.max(...host.pulls)).toBeGreaterThanOrEqual(PULL_THRESHOLD);
  });

  it('拉得不夠就放手:不重新整理', () => {
    const { host, box } = setup();
    touch(box, 'touchstart', 100);
    touch(box, 'touchmove', 130);
    touch(box, 'touchend', 0);
    expect(host.refreshed).toBe(0);
    expect(host.pulls.at(-1)).toBe(0);
  });

  it('清單不在最上面時不接手(照常捲動)', () => {
    const { host, box } = setup();
    Object.defineProperty(box, 'scrollTop', { value: 40, configurable: true });
    touch(box, 'touchstart', 100);
    const move = touch(box, 'touchmove', 300);
    touch(box, 'touchend', 0);
    expect(move.defaultPrevented).toBe(false);
    expect(host.pulls).toEqual([]);
    expect(host.refreshed).toBe(0);
  });

  it('往上滑不會觸發', () => {
    const { host, box } = setup();
    touch(box, 'touchstart', 300);
    const move = touch(box, 'touchmove', 200);
    touch(box, 'touchend', 0);
    expect(move.defaultPrevented).toBe(false);
    expect(host.refreshed).toBe(0);
  });
});
