import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** 頭像:Discord CDN 圖片網址(D-134);沒有圖片時用名稱第一個字的圓圈 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="avatar" [style.width.px]="size()" [style.height.px]="size()">
    @if (url()) {
      <img [src]="url()" alt="" referrerpolicy="no-referrer" />
    } @else {
      {{ initial() }}
    }
  </div>`,
})
export class AvatarComponent {
  readonly name = input('');
  readonly url = input<string | null>(null);
  readonly size = input(32);
  protected readonly initial = computed(() => (this.name().trim().charAt(0) || '?').toUpperCase());
}
