import { ChangeDetectionStrategy, Component, ElementRef, inject, input, output } from '@angular/core';
import type { SubmarineStatus } from '@eranaut/shared';
import { circled } from '../core/format';
import type { SubRow, TimeField } from '../core/submarine-form';

/** 更新表單的一列(D-118):名稱 + 狀態切換 + 日/時/分,整坊更新與快速修改共用。純展示,狀態由父層管理 */
@Component({
  selector: 'app-sub-row-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="uf-row" [class.ready]="row().status === 'complete'" [class.has-err]="!!error()" [attr.data-row]="row().position">
      <div class="uf-top">
        <span class="uf-pos">{{ circled(row().position) }}</span>
        <input type="text" class="uf-name" maxlength="20" data-field="name" [value]="row().name" (input)="nameChange.emit(value($event))" aria-label="潛艇名稱" placeholder="潛艇名稱（選填）" />
        @if (removable()) {
          <button type="button" class="uf-rm" (click)="remove.emit()" aria-label="移除這一列">×</button>
        }
      </div>
      <div class="uf-seg" role="group" aria-label="狀態">
        <button type="button" [class.on]="row().status === 'exploring'" [attr.aria-pressed]="row().status === 'exploring'" (click)="statusChange.emit('exploring')">探索中</button>
        <button type="button" [class.on]="row().status === 'complete'" [class.amber]="row().status === 'complete'" [attr.aria-pressed]="row().status === 'complete'" (click)="statusChange.emit('complete')">探索完成</button>
      </div>
      @if (row().status === 'exploring') {
        <div class="uf-time">
          @for (f of fields; track f.key) {
            <label class="uf-num">
              <input
                type="text"
                inputmode="numeric"
                maxlength="2"
                placeholder="0"
                [attr.data-field]="f.key"
                [value]="row()[f.key]"
                (input)="onTime(f.key, $event)"
                (focus)="timeFocus.emit()"
                (blur)="onBlur($event)"
                [attr.aria-label]="f.unit"
              /><span>{{ f.unit }}</span>
            </label>
          }
        </div>
      }
      <div class="uf-eta mono">{{ eta() }}</div>
      @if (error(); as message) { <div class="uf-err" role="alert">{{ message }}</div> }
    </div>
  `,
})
export class SubRowEditor {
  readonly row = input.required<SubRow>();
  readonly error = input<string | null>(null);
  readonly eta = input('');
  readonly removable = input(false);

  readonly nameChange = output<string>();
  readonly statusChange = output<SubmarineStatus>();
  readonly timeChange = output<{ field: TimeField; value: string }>();
  /** 進入時間欄位:暫停補正(D-124) */
  readonly timeFocus = output<void>();
  /** 離開這一列的時間欄位:以目前的值重新起算(焦點只是移到同一列的其他時間欄位時不發出) */
  readonly timeLeave = output<void>();
  readonly remove = output<void>();

  protected readonly circled = circled;
  protected readonly fields: { key: TimeField; unit: string }[] = [
    { key: 'd', unit: '日' },
    { key: 'h', unit: '時' },
    { key: 'm', unit: '分' },
  ];
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  /** 只留數字(貼上或輸入法造成的非數字直接清掉) */
  protected onTime(field: TimeField, event: Event): void {
    const el = event.target as HTMLInputElement;
    const clean = el.value.replace(/\D/g, '');
    if (clean !== el.value) el.value = clean;
    this.timeChange.emit({ field, value: clean });
  }

  protected onBlur(event: FocusEvent): void {
    const next = event.relatedTarget as HTMLElement | null;
    const sameRowTime = next !== null && this.host.nativeElement.contains(next) && next.dataset['field'] !== undefined && next.dataset['field'] !== 'name';
    if (!sameRowTime) this.timeLeave.emit();
  }
}
