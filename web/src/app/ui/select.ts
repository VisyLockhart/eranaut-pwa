import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, effect, forwardRef, inject, input, model, signal, untracked } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { UiScale } from '../core/ui-scale';
import { IconComponent } from './icon';

export type SelectValue = string | number;
export interface SelectOption {
  value: SelectValue;
  label: string;
  /** 群組標題:與前一項不同時,在這一項前面顯示一列標題(不可選取) */
  group?: string;
}

let nextId = 1;

/** 清單列:群組標題或選項(群組標題可收合時也算一個可操作的列) */
type Row =
  | { kind: 'group'; key: string; name: string; count: number; collapsed: boolean }
  | { kind: 'opt'; key: string; option: SelectOption };

/** 本次使用期間記住各下拉的群組收合狀態(以 `groupMemory` 為鍵);重新整理頁面就清掉,不存 localStorage */
const GROUP_MEMORY = new Map<string, Map<string, boolean>>();

/**
 * 自製下拉選單(取代瀏覽器內建的 <select>,後者的展開清單無法套用主題)。
 * 可搭配 `formControlName`,或用 `[value]` + `(valueChange)`。清單用 position: fixed 定位,
 * 不會被對話框的捲動區裁切;空間不足時往上展開。鍵盤:↑↓ Home End 移動、Enter/空白 選取、Esc 關閉、輸入文字跳到符合的項目。
 */
@Component({
  selector: 'app-select',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectField), multi: true }],
  host: { '(keydown)': 'onKey($event)', '(document:pointerdown)': 'onOutside($event)', '(window:resize)': 'close()' },
  template: `
    <button
      type="button"
      class="sel-trigger"
      [class.open]="open()"
      [class.lg]="size() === 'lg'"
      [class.compact]="size() === 'compact'"
      [class.error-select]="invalid()"
      [attr.id]="inputId() || null"
      role="combobox"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? listId : null"
      [attr.aria-label]="ariaLabel() || null"
      [disabled]="disabled()"
      (click)="toggle()"
      (blur)="onBlur()"
    >
      <span class="sel-label" [class.placeholder]="value() === ''">{{ selectedLabel() }}</span>
      <app-icon name="chevronDown" [size]="14" />
    </button>
    @if (open()) {
      <ul class="sel-panel" role="listbox" [id]="listId" [style.left.px]="pos().left" [style.top.px]="pos().top" [style.bottom.px]="pos().bottom" [style.min-width.px]="pos().width" [style.max-height.px]="pos().maxHeight">
        @for (r of rows(); track r.key; let i = $index) {
          @if (r.kind === 'group') {
            <li
              class="sel-group"
              [class.toggle]="collapsible()"
              [class.active]="collapsible() && i === active()"
              [attr.role]="collapsible() ? 'button' : 'presentation'"
              [attr.aria-expanded]="collapsible() ? !r.collapsed : null"
              [attr.data-i]="i"
              (pointerenter)="collapsible() && active.set(i)"
              (pointerdown)="$event.preventDefault()"
              (click)="collapsible() && toggleGroup(r.name)"
            >
              @if (collapsible()) { <app-icon [name]="r.collapsed ? 'chevronRight' : 'chevronDown'" [size]="14" /> }
              <span class="sel-gname">{{ r.name }}</span>
              @if (collapsible() && r.collapsed) { <span class="sel-gcount">{{ r.count }}</span> }
            </li>
          } @else {
            <li
              role="option"
              class="sel-opt"
              [class.active]="i === active()"
              [class.selected]="r.option.value === value()"
              [attr.aria-selected]="r.option.value === value()"
              [attr.data-i]="i"
              (pointerenter)="active.set(i)"
              (pointerdown)="$event.preventDefault()"
              (click)="$event.preventDefault(); choose(r.option)"
            >
              <span>{{ r.option.label }}</span>
              @if (r.option.value === value()) { <app-icon name="check" [size]="14" /> }
            </li>
          }
        }
      </ul>
    }
  `,
})
export class SelectField implements ControlValueAccessor {
  readonly options = input.required<readonly SelectOption[]>();
  readonly value = model<SelectValue>('');
  /** 給 <label for> 對應的按鈕 id */
  readonly inputId = input('');
  readonly ariaLabel = input('');
  readonly invalid = input(false);
  /** `lg` 對話框內的表單欄位;`compact` 設定列旁的小選單 */
  readonly size = input<'md' | 'lg' | 'compact'>('md');
  /** 群組標題可收合:第一組預設展開、其餘預設收合(目前選取的項目所在的組打開時會自動展開) */
  readonly collapsible = input(false);
  /** 記住收合狀態的鍵(同一次使用期間,不同畫面的同一個下拉共用);空字串就只在這次開啟內有效 */
  readonly groupMemory = input('');

  protected readonly open = signal(false);
  protected readonly active = signal(0);
  protected readonly disabled = signal(false);
  protected readonly pos = signal<{ left: number; top: number | null; bottom: number | null; width: number; maxHeight: number }>({ left: 0, top: 0, bottom: null, width: 0, maxHeight: 260 });
  protected readonly groupState = signal<ReadonlyMap<string, boolean>>(new Map());
  protected readonly rows = computed<Row[]>(() => {
    const opts = this.options();
    const state = this.groupState();
    const collapsible = this.collapsible();
    const first = opts.find((o) => o.group)?.group;
    const counts = new Map<string, number>();
    for (const o of opts) if (o.group) counts.set(o.group, (counts.get(o.group) ?? 0) + 1);
    const out: Row[] = [];
    let prev: string | undefined;
    for (const o of opts) {
      const g = o.group;
      const collapsed = collapsible && !!g && (state.get(g) ?? g !== first);
      if (g && g !== prev) out.push({ kind: 'group', key: `g:${g}`, name: g, count: counts.get(g)!, collapsed });
      prev = g;
      if (!collapsed) out.push({ kind: 'opt', key: `o:${o.value}`, option: o });
    }
    return out;
  });
  protected readonly listId = `sel-list-${nextId++}`;
  protected readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? this.options()[0]?.label ?? '');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly scale = inject(UiScale);
  private onChange: (value: SelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private typed = '';
  private typedAt = 0;

  constructor() {
    // 介面大小改變(D-164)時清單位置作廢:直接收起
    effect(() => {
      this.scale.factor();
      untracked(() => this.close());
    });
    const stop = (event: Event): void => {
      if (this.open() && !(event.target instanceof Node && this.host.nativeElement.contains(event.target))) this.close();
    };
    // 頁面或對話框捲動時,固定定位的清單會和按鈕錯開:直接收起(清單自己捲動不算)
    document.addEventListener('scroll', stop, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('scroll', stop, true));
  }

  writeValue(value: SelectValue | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (value: SelectValue) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.close();
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.show();
  }

  protected close(): void {
    if (this.open()) this.open.set(false);
  }

  protected onBlur(): void {
    this.close();
    this.onTouched();
  }

  protected onOutside(event: Event): void {
    if (this.open() && !(event.target instanceof Node && this.host.nativeElement.contains(event.target))) this.close();
  }

  private show(): void {
    const trigger = this.host.nativeElement.querySelector('button')!;
    // 介面大小放大時(D-164),固定定位的座標單位是 zoom 後的 CSS 像素,用 UiScale 換算
    const rect = this.scale.localRect(trigger);
    const viewport = this.scale.localViewport();
    const below = viewport.height - rect.bottom - 8;
    const above = rect.top - 8;
    if (this.collapsible()) this.prepareGroups();
    const wanted = Math.min(260, this.rows().length * 38 + 8);
    const up = below < Math.min(wanted, 160) && above > below;
    const width = Math.max(rect.width, 120);
    this.pos.set({
      left: Math.max(8, Math.min(rect.left, viewport.width - width - 8)),
      top: up ? null : rect.bottom + 4,
      bottom: up ? viewport.height - rect.top + 4 : null,
      width,
      maxHeight: Math.max(96, Math.min(260, up ? above - 4 : below - 4)),
    });
    const rows = this.rows();
    const at = rows.findIndex((r) => r.kind === 'opt' && r.option.value === this.value());
    this.active.set(at >= 0 ? at : Math.max(0, rows.findIndex((r) => this.navigable(r))));
    this.open.set(true);
    afterNextRender(() => this.reveal(), { injector: this.injector });
  }

  /** 打開前:取回記住的收合狀態,並把目前選取項目所在的組展開 */
  private prepareGroups(): void {
    const key = this.groupMemory();
    if (key && GROUP_MEMORY.has(key)) this.groupState.set(new Map(GROUP_MEMORY.get(key)));
    const g = this.options().find((o) => o.value === this.value())?.group;
    if (g && this.rows().some((r) => r.kind === 'group' && r.name === g && r.collapsed)) this.setGroup(g, false);
  }

  private setGroup(name: string, collapsed: boolean): void {
    const next = new Map(this.groupState());
    next.set(name, collapsed);
    this.groupState.set(next);
    const key = this.groupMemory();
    if (key) GROUP_MEMORY.set(key, next);
  }

  protected toggleGroup(name: string): void {
    if (!this.collapsible()) return;
    const row = this.rows().find((r) => r.kind === 'group' && r.name === name);
    if (!row || row.kind !== 'group') return;
    this.setGroup(name, !row.collapsed);
    if (row.collapsed) afterNextRender(() => this.showGroupTop(name), { injector: this.injector });
    // 標題列位置不變(它前面的列沒有增減),反白留在標題上,面板不關閉、不改選取
    this.active.set(this.rows().findIndex((r) => r.key === `g:${name}`));
  }

  /** 展開後把標題捲到清單頂端,剛展開的項目才看得到(不然要自己再往下捲) */
  private showGroupTop(name: string): void {
    const panel = this.host.nativeElement.querySelector<HTMLElement>('.sel-panel');
    const i = this.rows().findIndex((r) => r.key === `g:${name}`);
    const header = panel?.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (!panel || !header) return;
    const delta = header.getBoundingClientRect().top - panel.getBoundingClientRect().top - 4;
    if (delta > 0) panel.scrollTop += delta;
  }

  private navigable(row: Row | undefined): boolean {
    return row !== undefined && (row.kind === 'opt' || this.collapsible());
  }

  /**
   * 讓目前反白的項目留在清單可視範圍內。只調整清單自己的捲動位置:
   * 用 scrollIntoView 會連帶捲動對話框或頁面,觸發外層的 scroll 事件而把清單收起來。
   */
  private reveal(): void {
    const panel = this.host.nativeElement.querySelector<HTMLElement>('.sel-panel');
    const item = panel?.querySelector<HTMLElement>(`[data-i="${this.active()}"]`);
    if (!panel || !item) return;
    // 可收合時群組標題固定在清單頂端(約 40px),反白項目不要被它蓋住
    const top = this.collapsible() ? 40 : 4;
    if (item.offsetTop - top < panel.scrollTop) panel.scrollTop = Math.max(0, item.offsetTop - top);
    else if (item.offsetTop + item.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = item.offsetTop + item.offsetHeight - panel.clientHeight + 4;
  }

  private move(index: number, dir: 1 | -1 = 1): void {
    const rows = this.rows();
    if (rows.length === 0) return;
    let i = Math.max(0, Math.min(rows.length - 1, index));
    while (i >= 0 && i < rows.length && !this.navigable(rows[i])) i += dir; // 不可操作的群組標題直接跳過
    if (i < 0 || i >= rows.length) return;
    this.active.set(i);
    afterNextRender(() => this.reveal(), { injector: this.injector });
  }

  protected choose(option: SelectOption): void {
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const key = event.key;
    if (key === 'Escape') {
      if (this.open()) {
        event.stopPropagation(); // 只收起清單,不要連對話框一起關掉
        this.close();
      }
      return;
    }
    if (key === 'Tab') {
      this.close();
      return;
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) this.show();
      else this.move(this.active() + (key === 'ArrowDown' ? 1 : -1), key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (key === 'Home' || key === 'End') {
      if (!this.open()) return;
      event.preventDefault();
      this.move(key === 'Home' ? 0 : this.rows().length - 1, key === 'Home' ? 1 : -1);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (!this.open()) return; // 關著時交給按鈕本身的點擊行為(展開)
      event.preventDefault();
      const row = this.rows()[this.active()];
      if (row?.kind === 'opt') this.choose(row.option);
      else if (row?.kind === 'group') this.toggleGroup(row.name);
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      this.typed = now - this.typedAt > 700 ? key : this.typed + key;
      this.typedAt = now;
      const needle = this.typed.toLowerCase();
      const found = this.rows().findIndex((r) => r.kind === 'opt' && r.option.label.toLowerCase().startsWith(needle));
      if (found >= 0) {
        if (!this.open()) this.show();
        this.move(found);
      }
    }
  }
}
