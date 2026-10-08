import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../ui/icon';
import { SEAS } from './core/data';

/** 海域翻頁列(‹ 海域名稱 ›、小圓點切換):航點頁與探索的「去過哪些航點」共用(D-213) */
@Component({
  selector: 'app-route-sea-pager',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div class="rt-pager">
      <button type="button" class="pager-btn" [disabled]="pos() <= 0" (click)="go(-1)" aria-label="上一個海域"><app-icon name="chevronLeft" [size]="16" /></button>
      <div class="rt-sea">
        <div class="rt-sea-name">{{ name() }}</div>
        <div class="rt-dots" role="group" aria-label="切換海域">
          @for (s of seas; track s.sea) {
            <button type="button" class="rt-dot" [class.active]="s.sea === sea()" [attr.aria-label]="s.name" [attr.aria-current]="s.sea === sea() ? 'true' : null" (click)="seaChange.emit(s.sea)"></button>
          }
        </div>
      </div>
      <button type="button" class="pager-btn" [disabled]="pos() >= seas.length - 1" (click)="go(1)" aria-label="下一個海域"><app-icon name="chevronRight" [size]="16" /></button>
    </div>
  `,
})
export class RouteSeaPager {
  readonly sea = input.required<number>();
  readonly seaChange = output<number>();
  protected readonly seas = SEAS;
  protected readonly pos = computed(() => this.seas.findIndex((s) => s.sea === this.sea()));
  protected readonly name = computed(() => this.seas[this.pos()]?.name ?? '');

  protected go(delta: number): void {
    const next = this.seas[this.pos() + delta];
    if (next) this.seaChange.emit(next.sea);
  }
}
