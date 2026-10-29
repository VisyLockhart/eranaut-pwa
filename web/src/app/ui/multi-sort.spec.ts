import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { MultiSort, type SortField } from './multi-sort';

const FIELDS: SortField[] = [
  { id: 'a', label: '甲' },
  { id: 'b', label: '乙' },
  { id: 'c', label: '丙' },
];

@Component({
  imports: [MultiSort],
  template: `<app-multi-sort [fields]="fields" [on]="on()" [ordered]="ordered()" (toggled)="hit($event)" />`,
})
class Host {
  fields = FIELDS;
  on = signal<string[]>(['c', 'a']);
  ordered = signal(false);
  hit(id: string): void {
    this.on.update((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }
}

describe('MultiSort 順位數字', () => {
  const mount = () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return f;
  };
  const badges = (f: ReturnType<typeof mount>) => [...(f.nativeElement as HTMLElement).querySelectorAll('button')].map((b) => b.querySelector('.ov-sort-n')?.textContent ?? '');

  it('預設照 fields 的固定順序編號', () => {
    expect(badges(mount())).toEqual(['1', '', '2']);
  });

  it('ordered:照點選的先後編號,可取消到全空', () => {
    const f = mount();
    f.componentInstance.ordered.set(true);
    f.detectChanges();
    expect(badges(f)).toEqual(['2', '', '1']);
    const btns = (f.nativeElement as HTMLElement).querySelectorAll('button');
    btns[2]!.click();
    btns[0]!.click();
    f.detectChanges();
    expect(badges(f)).toEqual(['', '', '']);
  });
});
