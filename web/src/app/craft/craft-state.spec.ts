import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { calculate } from './core/craft-calc';
import { copyLines, gradeInfo, gradeLabel, groupRows, missing, sanitizeSel, sanitizeStock, sanitizeView } from './craft-state';
import { CraftVm } from './craft-vm';

describe('craft-state', () => {
  it('等級標籤', () => {
    expect([0, 4, 5, 9].map(gradeLabel)).toEqual(['1', '5', '1改', '5改']);
  });

  it('讀取 localStorage 的內容會驗證:壞值丟掉、數量夾在 1~99', () => {
    const s = sanitizeSel({ hull: { gradeIndex: 3, qty: 500 }, stern: { gradeIndex: 12, qty: 2 }, bow: 'x', bridge: { gradeIndex: 1.5, qty: 1 } });
    expect(s.hull).toEqual({ gradeIndex: 3, qty: 99 });
    expect(s.stern.gradeIndex).toBeNull();
    expect(s.bow.gradeIndex).toBeNull();
    expect(s.bridge.gradeIndex).toBeNull();
    expect(sanitizeSel(null).hull.gradeIndex).toBeNull();
    expect(sanitizeView({ tab: 'nope', stockMode: 1, expandFrame: true })).toEqual({ expandFrame: true, stockMode: false, onlyMissing: false, slotsCollapsed: false, tab: 'finals' });
  });

  it('庫存只留已知品項與正整數', () => {
    expect(sanitizeStock({ 熊脂: 5, 不存在: 3, 星極油: -2, 暗栗木木材: '7', 靈銀塊: 1.9 })).toEqual({ 熊脂: 5, 暗栗木木材: 7, 靈銀塊: 1 });
    expect(sanitizeStock('x')).toEqual({});
  });

  it('分組依固定順序;複製清單在庫存模式只列還缺的缺少量', () => {
    const r = calculate([{ slot: 'hull', gradeIndex: 5, qty: 1 }]);
    const gs = groupRows(r.bases);
    expect(gs.length).toBeGreaterThan(1);
    const name = r.bases[0]!.name;
    const all = copyLines(r.bases, null);
    expect(all.length).toBe(r.bases.length);
    expect(all).toContain(`${name} ×${r.bases[0]!.need}`);
    const st = { [name]: r.bases[0]!.need };
    expect(missing(r.bases[0]!, st)).toBe(0);
    expect(copyLines(r.bases, st).length).toBe(r.bases.length - 1);
    expect(copyLines(r.bases, { [name]: 1 }).join('\n')).toContain(`${name} ×${Math.max(0, r.bases[0]!.need - 1)}`.replace(/ ×0$/, ''));
  });
});

describe('gradeInfo', () => {
  it('英文代號與配置功能一致,改級用後綴「+」', () => {
    expect(gradeInfo('hull', 0)).toEqual({ name: '鯊魚級', part: '船體', code: 'S' });
    expect(gradeInfo('hull', 5)).toEqual({ name: '鯊魚改級', part: '船體', code: 'S+' });
    expect(gradeInfo('bridge', 4)?.code).toBe('SY');
    expect(gradeInfo('stern', 9)).toEqual({ name: '希爾德拉改級', part: '船尾', code: 'SY+' });
    expect(gradeInfo('bow', 10)).toBeNull();
  });
});

describe('CraftVm', () => {
  beforeEach(() => localStorage.clear());
  const make = () => {
    TestBed.resetTestingModule();
    return TestBed.inject(CraftVm);
  };

  it('選擇與設定寫進 localStorage,重建後還原', () => {
    const vm = make();
    vm.setGrade('bow', 6);
    vm.setQty('bow', 3);
    vm.patchView({ expandFrame: true, tab: 'bases' });
    vm.setStock('熊脂', 4);
    TestBed.tick();
    const vm2 = make();
    expect(vm2.sel().bow).toEqual({ gradeIndex: 6, qty: 3 });
    expect(vm2.view().expandFrame).toBe(true);
    expect(vm2.view().tab).toBe('bases');
    expect(vm2.stock()['熊脂']).toBe(4);
  });

  it('壞掉的 JSON 不會讓頁面壞掉', () => {
    localStorage.setItem('eranaut.craft.sel', '{bad');
    localStorage.setItem('eranaut.craft.view', '[1]');
    const vm = make();
    expect(vm.hasSelection()).toBe(false);
    expect(vm.view().tab).toBe('finals');
  });

  it('數量限制 1~99;清除單一與全部;骨架開關改變結果', () => {
    const vm = make();
    vm.setGrade('hull', 7);
    vm.setQty('hull', 0);
    expect(vm.sel().hull.qty).toBe(1);
    vm.stepQty('hull', 500);
    expect(vm.sel().hull.qty).toBe(99);
    vm.setQty('hull', 1);
    const off = vm.result().finals.some((r) => r.frame);
    vm.patchView({ expandFrame: true });
    expect(off).toBe(true);
    expect(vm.result().finals.some((r) => r.frame)).toBe(false);
    vm.clearSlot('hull');
    expect(vm.hasSelection()).toBe(false);
  });

  it('庫存進度與只看缺少', () => {
    const vm = make();
    vm.setGrade('hull', 5);
    vm.patchView({ stockMode: true });
    expect(vm.progress()).toBe(0);
    const row = vm.result().bases[0]!;
    vm.toggleDone(row);
    // 進度以成品計算:素材備齊不算進度
    expect(vm.progress()).toBe(0);
    const before = vm.visible().bases.length;
    vm.patchView({ onlyMissing: true });
    expect(vm.visible().bases.length).toBe(before - 1);
    vm.toggleDone(row);
    expect(vm.stock()[row.name]).toBeUndefined();
  });

  it('成品達標:進度 100%,半成品與素材一起達標(還缺為 0)', () => {
    const vm = make();
    vm.setGrade('hull', 5);
    vm.patchView({ stockMode: true });
    for (const f of vm.result().finals) vm.toggleDone(f);
    expect(vm.progress()).toBe(1);
    const st = vm.stock();
    for (const r of vm.eff().semis) expect(Math.max(0, r.need - (st[r.name] ?? 0))).toBe(0);
    // 素材只剩配件直接使用的量(其餘因成品已備齊而扣除)
    const gross = vm.result().bases.reduce((n, r) => n + r.need, 0);
    const left = vm.eff().bases.reduce((n, r) => n + r.need, 0);
    expect(left).toBeLessThan(gross);
    vm.patchView({ onlyMissing: true });
    expect(vm.visible().semis.length).toBe(0);
    // 取消成品庫存,下層需求回來
    vm.clearStock();
    expect(vm.progress()).toBe(0);
    expect(vm.eff().bases.reduce((n, r) => n + r.need, 0)).toBe(gross);
  });

  it('關閉記錄庫存:顯示總需求,不受庫存影響', () => {
    const vm = make();
    vm.setGrade('hull', 5);
    vm.patchView({ stockMode: true });
    for (const f of vm.result().finals) vm.toggleDone(f);
    vm.patchView({ stockMode: false });
    expect(vm.eff().semis.map((r) => r.need)).toEqual(vm.result().semis.map((r) => r.need));
  });

  it('收合分組與複製文字', () => {
    const vm = make();
    vm.setGrade('hull', 5);
    const g = vm.groups().bases[0]!.group;
    vm.toggleGroup('bases', g);
    expect(vm.isCollapsed('bases', g)).toBe(true);
    vm.toggleAllGroups(['finals', 'semis', 'bases']);
    expect(vm.allCollapsed(['finals', 'semis', 'bases'])).toBe(true);
    vm.toggleAllGroups(['finals', 'semis', 'bases']);
    expect(vm.allCollapsed(['finals', 'semis', 'bases'])).toBe(false);
    const t = vm.copyText(['finals', 'semis', 'bases']);
    expect(t).toContain('【成品】');
    expect(t).toContain('【素材】');
    expect(vm.copyText(['bases'])).not.toContain('【');
  });
});
