import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** 管理模式的勾選框(純顯示,點擊交給整列):勾選 = ✓、部分選取 = ─。視覺 22px,垂直置中(D-314 實作注意) */
@Component({
  selector: 'app-mg-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mg-box" [class.on]="state() !== 'none'" aria-hidden="true">
      @if (state() === 'all') {
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 L9 17 L4 12" /></svg>
      } @else if (state() === 'some') {
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 12h12" /></svg>
      }
    </span>
  `,
  host: { style: 'display: inline-flex; align-items: center; justify-content: center' },
})
export class MgBox {
  readonly state = input<'none' | 'some' | 'all'>('none');
}

/** 「新登記」(D-315)與「未排入」(D-314)的小標籤;新登記帶動畫(精簡動態 / 減少動態時由樣式關閉) */
@Component({
  selector: 'app-sub-flags',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (registered()) { <span class="mg-new"><i aria-hidden="true"></i>新登記</span> }
    @if (!placed()) { <span class="mg-unplaced">未排入</span> }
  `,
  host: { class: 'mg-flags' },
})
export class SubFlags {
  readonly registered = input(false);
  readonly placed = input(true);
}
