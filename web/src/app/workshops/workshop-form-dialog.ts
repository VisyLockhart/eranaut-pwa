import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, output, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DISTRICTS, LIMITS, SERVERS, type ValidationErrorBody, type WorkshopInput } from '@eranaut/shared';
import { DataStore } from '../core/data-store';
import { WorkshopsVm } from '../core/workshops-vm';
import {
  DEFAULT_LEAD,
  allowedLeadChoices,
  fieldErrorText,
  latestRemainingMs,
  leadLabel,
  maxChars,
  positiveInteger,
  requiredTrimmed,
  toFormValue,
  toInput,
} from '../core/workshop-form';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectOption } from '../ui/select';

type ControlName = 'name' | 'server' | 'captain' | 'district' | 'ward' | 'detail' | 'leadMinutes';
/** 表單欄位 → API 欄位(伺服器端驗證失敗時把錯誤放回對應欄位) */
const API_FIELD: Record<ControlName, keyof WorkshopInput> = {
  name: 'name',
  server: 'server',
  captain: 'captain',
  district: 'address_district',
  ward: 'address_ward',
  detail: 'address_detail',
  leadMinutes: 'notify_lead_minutes',
};
const REQUIRED_TEXT: Partial<Record<ControlName, string>> = { name: '請輸入工坊名稱', server: '請選擇遊戲伺服器' };

/** 新增/編輯工坊 Modal(D-103、D-135、D-137):Reactive Forms,欄位分四組 + 預先提醒 */
@Component({
  selector: 'app-workshop-form',
  imports: [ReactiveFormsModule, CdkTrapFocus, IconComponent, SelectField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workshop-form-dialog.html',
  host: { '(document:keydown.escape)': 'close()' },
})
export class WorkshopFormDialog implements OnInit {
  /** null = 新增 */
  readonly workshopId = input<string | null>(null);
  readonly closed = output<void>();

  private readonly store = inject(DataStore);
  private readonly vm = inject(WorkshopsVm);
  private destroyed = false;

  protected readonly serverOptions: SelectOption[] = [{ value: '', label: '請選擇' }, ...SERVERS.map((s) => ({ value: s, label: s }))];
  protected readonly districtOptions: SelectOption[] = [{ value: '', label: '請選擇' }, ...DISTRICTS.map((d) => ({ value: d, label: d }))];
  protected readonly leadLabel = leadLabel;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [requiredTrimmed, maxChars(LIMITS.workshopName)] }),
    server: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    captain: new FormControl('', { nonNullable: true, validators: [maxChars(LIMITS.captain)] }),
    district: new FormControl('', { nonNullable: true }),
    ward: new FormControl<number | null>(null, { validators: [positiveInteger] }),
    detail: new FormControl('', { nonNullable: true, validators: [maxChars(LIMITS.addressDetail)] }),
    notifyBatched: new FormControl(false, { nonNullable: true }),
    leadEnabled: new FormControl(false, { nonNullable: true }),
    leadMinutes: new FormControl<number>(DEFAULT_LEAD, { nonNullable: true }),
  });

  // 填寫與送出狀態放在 WorkshopsVm(版面切換重建對話框時要保留,D-163)
  protected readonly submitted = this.vm.formSubmitted;
  protected readonly saving = this.vm.busy;
  protected readonly submitError = this.vm.submitError;
  protected readonly serverErrors = this.vm.serverErrors;
  protected downOnOverlay = false;

  // 模板事件處理式不能回傳 false(Angular 會 preventDefault,讓輸入框點不進去),所以用回傳 void 的方法
  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }

  protected readonly workshop = computed(() => {
    const id = this.workshopId();
    return id === null ? null : (this.store.workshops().find((w) => w.id === id) ?? null);
  });

  private readonly batched = toSignal(this.form.controls.notifyBatched.valueChanges, { initialValue: false });
  /** 預先提醒可選的選項:整批模式下不列出超過剩餘時間的選項(D-135 ②a);逐艘模式不過濾 */
  protected readonly leadChoices = computed(() => allowedLeadChoices(this.batched(), latestRemainingMs(this.workshop(), this.store.now())));
  protected readonly leadOptions = computed<SelectOption[]>(() => this.leadChoices().map((m) => ({ value: m, label: leadLabel(m) })));
  protected readonly leadBlocked = computed(() => this.leadChoices().length === 0);

  /** 結束對話框;若送出期間元件已因版面切換被銷毀(output 不能再 emit),改直接通知 service 關閉 */
  private finish(): void {
    if (this.destroyed) this.vm.closeDialog();
    else this.closed.emit();
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => (this.destroyed = true));
    this.form.valueChanges.subscribe(() => {
      this.vm.formDraft.set(this.form.getRawValue());
      if (Object.keys(this.serverErrors()).length > 0) this.serverErrors.set({});
    });

    // 選項因整批模式或剩餘時間改變時,目前選的分鐘若已不可選,改成可選的最接近值;完全沒有可選的就關閉開關
    effect(() => {
      const choices = this.leadChoices();
      untracked(() => {
        const { leadEnabled, leadMinutes } = this.form.controls;
        if (choices.length === 0) {
          leadEnabled.setValue(false);
          leadEnabled.disable({ emitEvent: false });
          return;
        }
        if (leadEnabled.disabled) leadEnabled.enable({ emitEvent: false });
        if (!(choices as readonly number[]).includes(leadMinutes.value)) {
          const fallback = [...choices].reverse().find((m) => m <= leadMinutes.value) ?? choices[0];
          leadMinutes.setValue(fallback);
        }
      });
    });

    // 正在編輯的工坊在別處被刪掉了 → 關閉
    effect(() => {
      if (this.workshopId() !== null && this.workshop() === null) untracked(() => this.closed.emit());
    });
  }

  ngOnInit(): void {
    // 對話框因版面切換被重建時,接回使用者填到一半的內容
    const draft = this.vm.formDraft();
    if (draft !== null) {
      this.form.reset(draft);
      this.form.markAsDirty();
    } else {
      this.form.reset(toFormValue(this.workshop()));
    }
  }

  protected get editing(): boolean {
    return this.workshopId() !== null;
  }

  protected onLeadToggle(enabled: boolean): void {
    // 開關打開時預設 5 分鐘(D-135 ③);5 分不可選時用最小的可選值
    if (enabled) this.form.controls.leadMinutes.setValue(this.leadChoices().includes(DEFAULT_LEAD) ? DEFAULT_LEAD : (this.leadChoices()[0] ?? DEFAULT_LEAD));
  }

  /** 該欄位目前要顯示的錯誤文字(沒有就 null)。送出過或欄位被碰過才顯示本機驗證,伺服器驗證回來的一律顯示 */
  protected errorOf(name: ControlName): string | null {
    const control = this.form.controls[name];
    if ((this.submitted() || control.touched) && control.errors) {
      const e = control.errors;
      if (e['required']) return REQUIRED_TEXT[name] ?? fieldErrorText('required');
      if (e['tooLong']) return `最多 ${(e['tooLong'] as { max: number }).max} 字`;
      if (e['invalidValue']) return '房區請填正整數';
    }
    const code = this.serverErrors()[API_FIELD[name]];
    return code ? fieldErrorText(code) : null;
  }

  protected close(): void {
    if (!this.saving()) this.closed.emit();
  }

  /** 點背景關閉;已經輸入過內容時不關閉,避免誤觸丟失資料(用 ✕ / 取消 / Esc 關閉) */
  protected overlayClick(event: MouseEvent): void {
    if (this.downOnOverlay && event.target === event.currentTarget && !this.form.dirty) this.close();
  }

  protected async submit(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.submitError.set(null);
    if (this.form.invalid) return;

    const input = toInput(this.form.getRawValue());
    this.saving.set(true);
    try {
      const id = this.workshopId();
      if (id === null) await this.store.createWorkshop(input);
      else await this.store.updateWorkshop(id, input);
      this.finish();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 400 && (error.error as ValidationErrorBody | null)?.error === 'validation_failed') {
        this.serverErrors.set((error.error as ValidationErrorBody).fields ?? {});
      } else if (error instanceof HttpErrorResponse && error.status === 404) {
        this.submitError.set('找不到這個工坊，可能已在其他裝置被刪除。');
      } else {
        // 401 由 interceptor 轉成 session 過期畫面;其他錯誤留在表單讓使用者重試
        this.submitError.set('儲存失敗，請稍後再試。');
      }
    } finally {
      this.saving.set(false);
    }
  }
}
