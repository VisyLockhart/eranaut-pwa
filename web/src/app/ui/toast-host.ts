import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (t of toast.items(); track t.id) {
        <div class="toast" [class.warn]="t.tone === 'warn'" [class.has-actions]="t.actions.length > 0" [class.leaving]="t.leaving">
          <span class="toast-text">{{ t.text }}</span>
          @for (a of t.actions; track a.label) {
            <button type="button" class="toast-act" (click)="toast.act(t, a)">{{ a.label }}</button>
          }
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toast = inject(Toast);
}
