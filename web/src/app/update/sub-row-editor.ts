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
        <input type="text" class="uf-name" [class.flagged]="flagName()" maxlength="20" data-field="name" [value]="row().name" (input)="nameChange.emit(value($event))" aria-label="潛艇名稱" placeholder="潛艇名稱（選填）" />
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
            <label class="uf-num" [class.flagged]="flagTime()">
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
      @if (row().ocrLevel !== undefined) {
        <label class="uf-lv" [class.flagged]="flagLevel()">
          <span>辨識到的等級</span>
          <span class="uf-lv-in">Lv <input type="text" inputmode="numeric" maxlength="3" placeholder="不採用" [value]="row().ocrLevel ?? ''" (input)="onLevel($event)" data-field="level" aria-label="辨識到的等級" /></span>
          <small>等級以辨識為準；清空就不更新等級</small>
        </label>
      }
      <div class="uf-eta mono">{{ eta() }}</div>
      <!-- 練級輔助的「這次派出」(D-291)由父層放進來 -->
      <ng-content />
      @if (flagText(); as text) { <div class="uf-flag-msg" role="status">{{ text }}</div> }
      @if (error(); as message) { <div class="uf-err" role="alert">{{ message }}</div> }
    </div>
  `,
})
export class SubRowEditor {
  readonly row = input.required<SubRow>();
  readonly error = input<string | null>(null);
  readonly eta = input('');
  readonly removable = input(false);
  /** 截圖辨識標出的「請核對」欄位(D-119);使用者修改後由父層拿掉 */
  readonly flagName = input(false);
  readonly flagTime = input(false);
  readonly flagText = input<string | null>(null);
  readonly flagLevel = input(false);

  readonly nameChange = output<string>();
  readonly statusChange = output<SubmarineStatus>();
  readonly timeChange = output<{ field: TimeField; value: string }>();
  /** 進入時間欄位:暫停補正(D-124) */
  readonly timeFocus = output<void>();
  /** 離開這一列的時間欄位:以目前的值重新起算(焦點只是移到同一列的其他時間欄位時不發出) */
  readonly timeLeave = output<void>();
  readonly remove = output<void>();
  /** 修正辨識到的等級(D-289);清空 = null */
  readonly levelChange = output<number | null>();

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

  protected onLevel(event: Event): void {
    const el = event.target as HTMLInputElement;
    const clean = el.value.replace(/\D/g, '');
    if (clean !== el.value) el.value = clean;
    const n = parseInt(clean, 10);
    this.levelChange.emit(Number.isFinite(n) && n >= 1 && n <= 130 ? n : null);
  }

  protected onBlur(event: FocusEvent): void {
    const next = event.relatedTarget as HTMLElement | null;
    const sameRowTime = next !== null && this.host.nativeElement.contains(next) && ['d', 'h', 'm'].includes(next.dataset['field'] ?? '');
    if (!sameRowTime) this.timeLeave.emit();
  }
}
