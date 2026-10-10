import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { ListView, TOOLS_MIN, type Listable } from './list-view';

const make = (n: number, fav: (i: number) => boolean = () => false): Listable[] =>
  Array.from({ length: n }, (_, i) => ({ id: `i${i}`, name: `艇${i}`, favorite: fav(i) }));

describe('ListView(清單檢視,D-237)', () => {
  it('常用排在前面,其餘維持原順序', () => {
    const items = signal(make(5, (i) => i === 3 || i === 1));
    const v = new ListView(items);
    expect(v.ordered().map((i) => i.id)).toEqual(['i1', 'i3', 'i0', 'i2', 'i4']);
  });

  it('分頁:每頁筆數、總頁數、頁碼夾在有效範圍', () => {
    const items = signal(make(25));
    const size = signal(10);
    const v = new ListView(items, size);
    expect(v.pages()).toBe(3);
    expect(v.pageItems()).toHaveLength(10);
    v.setPage(3);
    expect(v.pageItems().map((i) => i.id)).toEqual(['i20', 'i21', 'i22', 'i23', 'i24']);
    v.setPage(99);
    expect(v.page()).toBe(3);
    v.setPage(0);
    expect(v.page()).toBe(1);
    // 手機每頁 6
    size.set(6);
    expect(v.pages()).toBe(5);
  });

  it('刪除後頁碼自動夾回最後一頁,不會停在空白頁', () => {
    const items = signal(make(21));
    const v = new ListView(items, () => 10);
    v.setPage(3);
    expect(v.pageItems()).toHaveLength(1);
    items.set(make(20));
    expect(v.page()).toBe(2);
    expect(v.pageItems()).toHaveLength(10);
  });

  it('不分頁(Infinity):一頁全部', () => {
    const v = new ListView(signal(make(30)));
    expect(v.pages()).toBe(1);
    expect(v.pageItems()).toHaveLength(30);
  });

  it('搜尋名稱(不分大小寫)與只看常用;換條件回第 1 頁', () => {
    const items = signal(make(30, (i) => i % 10 === 0).map((x, i) => ({ ...x, name: i < 15 ? `Alpha${i}` : `灰海${i}` })));
    const v = new ListView(items, () => 5);
    v.setPage(3);
    v.setQuery('alpha');
    expect(v.page()).toBe(1);
    expect(v.filtered()).toHaveLength(15);
    v.setQuery('');
    v.setFavOnly(true);
    expect(v.filtered().map((i) => i.id)).toEqual(['i0', 'i10', 'i20']);
    v.setQuery('灰海');
    expect(v.filtered().map((i) => i.id)).toEqual(['i20']);
    expect(v.filtering()).toBe(true);
    v.clearFilters();
    expect(v.filtered()).toHaveLength(30);
    expect(v.filtering()).toBe(false);
  });

  it('項目數 ≤ TOOLS_MIN:不顯示工具列,搜尋與篩選不生效(避免刪到剩幾組還卡著舊篩選)', () => {
    const items = signal(make(TOOLS_MIN + 1));
    const v = new ListView(items);
    expect(v.showTools()).toBe(true);
    v.setQuery('艇3');
    expect(v.filtered()).toHaveLength(1);
    items.set(make(TOOLS_MIN));
    expect(v.showTools()).toBe(false);
    expect(v.filtering()).toBe(false);
    expect(v.filtered()).toHaveLength(TOOLS_MIN);
  });

  it('goTo:翻到該項所在的頁;不在篩選結果裡就先清掉篩選;找不到回 false', () => {
    const v = new ListView(signal(make(25, (i) => i === 24)), () => 10);
    // 常用 i24 排第一 → 第 1 頁;i0 排第二 → 也在第 1 頁;i9 在第 1 頁(位置 10);i10 在第 2 頁
    expect(v.goTo('i24')).toBe(true);
    expect(v.page()).toBe(1);
    expect(v.goTo('i10')).toBe(true);
    expect(v.page()).toBe(2);
    v.setQuery('艇1'); // i1, i10~i19 符合
    expect(v.goTo('i2')).toBe(true); // 不符合 → 清掉篩選再找
    expect(v.query()).toBe('');
    expect(v.page()).toBe(1);
    expect(v.goTo('nope')).toBe(false);
  });
});
