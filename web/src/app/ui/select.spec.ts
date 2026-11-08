import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectField, type SelectFooter, type SelectOption } from './select';

const OPTIONS: SelectOption[] = [
  { value: '', label: '請選擇' },
  { value: 'a', label: '伊弗利特' },
  { value: 'b', label: '利維坦' },
  { value: 'c', label: '迦樓羅' },
];

@Component({
  imports: [SelectField, ReactiveFormsModule],
  template: `
    <button id="outside" type="button">外面</button>
    <label for="s1">伺服器</label>
    <app-select inputId="s1" [options]="groupOptions() ?? options" [footer]="footer()" [formControl]="control" [invalid]="invalid()" [collapsible]="collapsible()" [groupMemory]="memory()" />
    <div id="esc" (keydown.escape)="escaped = true"><app-select inputId="s2" [options]="options" [(value)]="plain" /></div>
    <label id="wrap"><span>包在 label 裡</span><app-select inputId="s3" [options]="options" [(value)]="wrapped" /></label>
  `,
})
class Host {
  options = OPTIONS;
  groupOptions = signal<SelectOption[] | null>(null);
  collapsible = signal(false);
  footer = signal<SelectFooter | null>(null);
  memory = signal('');
  control = new FormControl<string | number>('');
  invalid = signal(false);
  plain: string | number = 'b';
  wrapped: string | number = 'a';
  escaped = false;
}

describe('SelectField', () => {
  let el: HTMLElement;
  let host: Host;
  let fixture: ReturnType<typeof TestBed.createComponent<Host>>;

  beforeEach(() => {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  const trigger = (id = 's1'): HTMLButtonElement => el.querySelector<HTMLButtonElement>(`#${id}`)!;
  const labels = (): string[] => [...el.querySelectorAll('.sel-opt')].map((o) => o.textContent!.trim());
  const key = (target: Element, k: string): KeyboardEvent => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    fixture.detectChanges();
    return e;
  };

  it('顯示目前選項的文字;空值顯示第一項並用提示色', () => {
    expect(trigger().textContent).toContain('請選擇');
    expect(el.querySelector('.sel-label')!.classList.contains('placeholder')).toBe(true);
    expect(trigger('s2').textContent).toContain('利維坦');
  });

  it('選項帶 group:與前一項不同時多一列群組標題(不是選項、不能被選取)', () => {
    host.options = [
      { value: '', label: '請選擇' },
      { value: 'a', label: '伊弗利特', group: '★ 常用' },
      { value: 'b', label: '利維坦', group: '全部' },
      { value: 'c', label: '迦樓羅', group: '全部' },
    ];
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    expect([...el.querySelectorAll('.sel-group')].map((g) => g.textContent!.trim())).toEqual(['★ 常用', '全部']);
    expect(labels()).toEqual(['請選擇', '伊弗利特', '利維坦', '迦樓羅']);
    el.querySelector<HTMLElement>('.sel-group')!.click();
    fixture.detectChanges();
    expect(host.control.value).toBe(''); // 點標題沒有任何作用
    el.querySelectorAll<HTMLElement>('.sel-opt')[3].click();
    fixture.detectChanges();
    expect(host.control.value).toBe('c');
  });

  describe('可收合的群組', () => {
    const grouped = (mem: string) => {
      host.groupOptions.set([
        { value: 'a', label: '伊弗利特', group: '常用' },
        { value: 'b', label: '利維坦', group: '其它' },
        { value: 'c', label: '迦樓羅', group: '其它' },
        { value: 'd', label: '奧丁', group: '其它' },
      ]);
      host.collapsible.set(true);
      host.memory.set(mem);
      host.control.setValue('');
      fixture.detectChanges();
    };
    const rowsText = () => [...el.querySelectorAll('.sel-panel > li')].map((li) => li.textContent!.trim());

    it('第一組預設展開、其餘預設收合並顯示項目數;點標題展開收合,面板不關閉、不改選取', () => {
      grouped('t1');
      trigger().click();
      fixture.detectChanges();
      expect(rowsText()).toEqual(['常用', '伊弗利特', '其它3']);
      const header = () => el.querySelectorAll<HTMLElement>('.sel-group')[1]!;
      expect(header().getAttribute('aria-expanded')).toBe('false');
      header().click();
      fixture.detectChanges();
      expect(rowsText()).toEqual(['常用', '伊弗利特', '其它', '利維坦', '迦樓羅', '奧丁']);
      expect(header().getAttribute('aria-expanded')).toBe('true');
      expect(el.querySelector('.sel-panel')).not.toBeNull();
      expect(host.control.value).toBe('');
      el.querySelectorAll<HTMLElement>('.sel-group')[0]!.click();
      fixture.detectChanges();
      expect(rowsText()).toEqual(['常用1', '其它', '利維坦', '迦樓羅', '奧丁']);
    });

    it('同一次使用期間記住收合狀態(同鍵的下拉共用),重開面板不回到預設', () => {
      grouped('t2');
      trigger().click();
      fixture.detectChanges();
      el.querySelectorAll<HTMLElement>('.sel-group')[1]!.click();
      fixture.detectChanges();
      trigger().click(); // 關
      fixture.detectChanges();
      trigger().click(); // 再開
      fixture.detectChanges();
      expect(rowsText()).toContain('利維坦');
    });

    it('目前選取的項目在收合的組裡:打開時自動展開那一組', () => {
      grouped('t3');
      host.control.setValue('c');
      fixture.detectChanges();
      trigger().click();
      fixture.detectChanges();
      expect(rowsText()).toEqual(['常用', '伊弗利特', '其它', '利維坦', '迦樓羅', '奧丁']);
    });

    it('鍵盤:方向鍵會停在群組標題上,Enter 展開收合;收合的項目不會被走到', () => {
      grouped('t4');
      trigger().click();
      fixture.detectChanges();
      const key = (k: string) => {
        trigger().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
        fixture.detectChanges();
      };
      const activeText = () => el.querySelector('.sel-panel .active')?.textContent?.trim();
      expect(activeText()).toBe('常用'); // 沒有選取時從第一個可操作的列開始
      key('ArrowDown');
      expect(activeText()).toBe('伊弗利特');
      key('ArrowDown');
      expect(activeText()).toBe('其它3');
      key('Enter');
      expect(rowsText()).toContain('利維坦');
      key('ArrowDown');
      expect(activeText()).toBe('利維坦');
      key('End');
      expect(activeText()).toBe('奧丁');
      key('Enter');
      expect(host.control.value).toBe('d');
    });
  });

  it('點開列出全部選項,點選後寫回表單控制項並收起', () => {
    trigger().click();
    fixture.detectChanges();
    expect(labels()).toEqual(['請選擇', '伊弗利特', '利維坦', '迦樓羅']);
    el.querySelectorAll<HTMLElement>('.sel-opt')[3].click();
    fixture.detectChanges();
    expect(host.control.value).toBe('c');
    expect(el.querySelector('.sel-panel')).toBeNull();
    expect(trigger().textContent).toContain('迦樓羅');
  });

  it('包在 <label> 裡時,點選項後清單要收起(label 不能把點擊轉給按鈕而重新展開)', () => {
    trigger('s3').click();
    fixture.detectChanges();
    el.querySelector<HTMLElement>('#wrap .sel-opt:nth-child(3)')!.click();
    fixture.detectChanges();
    expect(host.wrapped).toBe('b');
    expect(el.querySelector('.sel-panel')).toBeNull();
  });

  it('表單控制項由外部設值:按鈕文字跟著變', () => {
    host.control.setValue('b');
    fixture.detectChanges();
    expect(trigger().textContent).toContain('利維坦');
  });

  it('雙向綁定 [(value)] 也可用', () => {
    trigger('s2').click();
    fixture.detectChanges();
    el.querySelectorAll<HTMLElement>('.sel-opt')[1].click();
    fixture.detectChanges();
    expect(host.plain).toBe('a');
  });

  it('目前選項有勾勾與 aria-selected;<label for> 指到按鈕', () => {
    host.control.setValue('a');
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    const selected = el.querySelector('.sel-opt.selected')!;
    expect(selected.textContent).toContain('伊弗利特');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(el.querySelector('label')!.getAttribute('for')).toBe('s1');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('鍵盤:↓ 開啟、↓↑ 移動、Enter 選取', () => {
    key(trigger(), 'ArrowDown');
    expect(el.querySelector('.sel-panel')).not.toBeNull();
    key(trigger(), 'ArrowDown');
    key(trigger(), 'ArrowDown');
    expect(el.querySelector('.sel-opt.active')!.textContent).toContain('利維坦');
    key(trigger(), 'ArrowUp');
    key(trigger(), 'End');
    expect(el.querySelector('.sel-opt.active')!.textContent).toContain('迦樓羅');
    key(trigger(), 'Home');
    expect(el.querySelector('.sel-opt.active')!.textContent).toContain('請選擇');
    key(trigger(), 'ArrowDown');
    key(trigger(), 'Enter');
    expect(host.control.value).toBe('a');
    expect(el.querySelector('.sel-panel')).toBeNull();
  });

  it('輸入文字跳到符合的項目', () => {
    key(trigger(), '迦');
    expect(el.querySelector('.sel-panel')).not.toBeNull();
    expect(el.querySelector('.sel-opt.active')!.textContent).toContain('迦樓羅');
  });

  it('Esc 只收起清單,不再往外傳(不會連對話框一起關閉);沒開時照常往外傳', () => {
    trigger('s2').click();
    fixture.detectChanges();
    key(trigger('s2'), 'Escape');
    expect(el.querySelector('.sel-panel')).toBeNull();
    expect(host.escaped).toBe(false);
    key(trigger('s2'), 'Escape');
    expect(host.escaped).toBe(true);
  });

  it('底部固定列(D-331):顯示文字與進度格、不是選項、點它不會選取或收起;沒給就不畫', () => {
    trigger().click();
    fixture.detectChanges();
    expect(el.querySelector('.sel-foot')).toBeNull();
    trigger().click(); // 收起
    fixture.detectChanges();
    host.footer.set({ text: '已用 3 / 10 組', used: 3, max: 10 });
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    const foot = el.querySelector<HTMLElement>('.sel-foot')!;
    expect(foot.textContent).toContain('已用 3 / 10 組');
    expect(foot.getAttribute('role')).toBe('presentation');
    expect(foot.getAttribute('data-tone')).toBeNull();
    expect(foot.querySelectorAll('.sel-pips > i')).toHaveLength(10);
    expect(foot.querySelectorAll('.sel-pips > i.on')).toHaveLength(3);
    expect(labels()).toEqual(['請選擇', '伊弗利特', '利維坦', '迦樓羅']); // 頁尾不算選項
    foot.click();
    fixture.detectChanges();
    expect(el.querySelector('.sel-panel')).not.toBeNull();
    expect(host.control.value).toBe('');
  });

  it('底部固定列:tone 帶到 data-tone;沒有 max 就沒有進度格;↑↓ 導覽不會停在頁尾', () => {
    host.footer.set({ text: '已滿 10 / 10 組 · 只能覆蓋', used: 10, max: 10, tone: 'danger' });
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    expect(el.querySelector('.sel-foot')!.getAttribute('data-tone')).toBe('danger');
    expect(el.querySelectorAll('.sel-pips > i.on')).toHaveLength(10);
    key(trigger(), 'End');
    expect(el.querySelector('.sel-opt.active')!.textContent!.trim()).toBe('迦樓羅');
    trigger().click();
    fixture.detectChanges();
    host.footer.set({ text: '說明' });
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    expect(el.querySelector('.sel-pips')).toBeNull();
  });

  it('點外面收起;失焦時標記為 touched', () => {
    trigger().click();
    fixture.detectChanges();
    document.getElementById('outside')!.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('.sel-panel')).toBeNull();
    expect(host.control.touched).toBe(false);
    trigger().dispatchEvent(new Event('blur'));
    expect(host.control.touched).toBe(true);
  });

  it('invalid 時加上錯誤框;停用時不能開', () => {
    host.invalid.set(true);
    fixture.detectChanges();
    expect(trigger().classList.contains('error-select')).toBe(true);
    host.control.disable();
    fixture.detectChanges();
    trigger().click();
    fixture.detectChanges();
    expect(el.querySelector('.sel-panel')).toBeNull();
  });
});
