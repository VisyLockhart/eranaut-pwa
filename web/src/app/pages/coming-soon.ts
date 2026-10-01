import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Layout } from '../core/layout';

/** 尚未實作的頁面(後續階段會取代) */
@Component({
  selector: 'app-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="up-empty" style="margin: 20px 18px">這個頁面還在建置中。</div>`,
  host: { style: 'display: contents' },
})
export class ComingSoon {
  readonly title = input('');
  constructor() {
    inject(Layout).pageTitle.set('建置中');
  }
}
