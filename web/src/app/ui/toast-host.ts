import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (t of toast.items(); track t.id) {
        <div class="toast" [class.warn]="t.tone === 'warn'">{{ t.text }}</div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toast = inject(Toast);
}
