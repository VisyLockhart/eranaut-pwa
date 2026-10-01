import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, forwardRef, inject, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { IconComponent } from './icon';

export type SelectValue = string | number;
export interface SelectOption {
  value: SelectValue;
  label: string;
}

let nextId = 1;

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
        @for (o of options(); track o.value; let i = $index) {
          <li
            role="option"
            class="sel-opt"
            [class.active]="i === active()"
            [class.selected]="o.value === value()"
            [attr.aria-selected]="o.value === value()"
            [attr.data-i]="i"
            (pointerenter)="active.set(i)"
            (pointerdown)="$event.preventDefault()"
            (click)="choose(o)"
          >
            <span>{{ o.label }}</span>
            @if (o.value === value()) { <app-icon name="check" [size]="14" /> }
          </li>
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

  protected readonly open = signal(false);
  protected readonly active = signal(0);
  protected readonly disabled = signal(false);
  protected readonly pos = signal<{ left: number; top: number | null; bottom: number | null; width: number; maxHeight: number }>({ left: 0, top: 0, bottom: null, width: 0, maxHeight: 260 });
  protected readonly listId = `sel-list-${nextId++}`;
  protected readonly selectedLabel = computed(() => this.options().find((o) => o.value === this.value())?.label ?? this.options()[0]?.label ?? '');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private onChange: (value: SelectValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private typed = '';
  private typedAt = 0;

  constructor() {
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
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const wanted = Math.min(260, this.options().length * 38 + 8);
    const up = below < Math.min(wanted, 160) && above > below;
    const width = Math.max(rect.width, 120);
    this.pos.set({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: up ? null : rect.bottom + 4,
      bottom: up ? window.innerHeight - rect.top + 4 : null,
      width,
      maxHeight: Math.max(96, Math.min(260, up ? above - 4 : below - 4)),
    });
    this.active.set(Math.max(0, this.options().findIndex((o) => o.value === this.value())));
    this.open.set(true);
    afterNextRender(() => this.reveal(), { injector: this.injector });
  }

  /**
   * 讓目前反白的項目留在清單可視範圍內。只調整清單自己的捲動位置:
   * 用 scrollIntoView 會連帶捲動對話框或頁面,觸發外層的 scroll 事件而把清單收起來。
   */
  private reveal(): void {
    const panel = this.host.nativeElement.querySelector<HTMLElement>('.sel-panel');
    const item = panel?.querySelector<HTMLElement>(`[data-i="${this.active()}"]`);
    if (!panel || !item) return;
    if (item.offsetTop < panel.scrollTop) panel.scrollTop = Math.max(0, item.offsetTop - 4);
    else if (item.offsetTop + item.offsetHeight > panel.scrollTop + panel.clientHeight) panel.scrollTop = item.offsetTop + item.offsetHeight - panel.clientHeight + 4;
  }

  private move(index: number): void {
    const count = this.options().length;
    if (count === 0) return;
    this.active.set(Math.max(0, Math.min(count - 1, index)));
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
      else this.move(this.active() + (key === 'ArrowDown' ? 1 : -1));
      return;
    }
    if (key === 'Home' || key === 'End') {
      if (!this.open()) return;
      event.preventDefault();
      this.move(key === 'Home' ? 0 : this.options().length - 1);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      if (!this.open()) return; // 關著時交給按鈕本身的點擊行為(展開)
      event.preventDefault();
      const option = this.options()[this.active()];
      if (option) this.choose(option);
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      this.typed = now - this.typedAt > 700 ? key : this.typed + key;
      this.typedAt = now;
      const needle = this.typed.toLowerCase();
      const found = this.options().findIndex((o) => o.label.toLowerCase().startsWith(needle));
      if (found >= 0) {
        if (!this.open()) this.show();
        this.move(found);
      }
    }
  }
}
