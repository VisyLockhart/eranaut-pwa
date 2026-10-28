import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CHART_BOX_MARGIN, type ChartOcrResultDto } from '@eranaut/shared';
import { SEAS } from '../route/core/data';

/** 遊戲的圖釘中心比資料座標略偏左上(資料單位) */
const PIN_DX = -8;
const PIN_DY = -8;
const BOX = 1024 + 2 * CHART_BOX_MARGIN;

/**
 * 「對照截圖」(D-293):只顯示截圖中的海圖那一塊(伺服器回傳的 map_box),並在目前標為已發現的點上畫圈與代號,
 * 方便和 App 的海圖逐點對照。圖片只是本機的 object URL,不上傳保存。
 */
@Component({
  selector: 'app-chart-shot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch-shot" role="img" [attr.aria-label]="label()">
      <img [src]="url()" alt="" [style.width.%]="geo().w" [style.margin-left.%]="geo().l" [style.margin-top.%]="geo().t" />
      @for (m of marks(); track m.code) {
        <span class="ch-ring" [style.left.%]="m.x" [style.top.%]="m.y"><b>{{ m.code }}</b></span>
      }
    </div>
  `,
})
export class ChartShot {
  readonly result = input.required<ChartOcrResultDto>();
  readonly url = input.required<string>();
  /** 目前標為已發現的點(含使用者修改) */
  readonly found = input.required<ReadonlySet<number>>();

  protected readonly geo = computed(() => {
    const b = this.result().map_box;
    return { w: (b.width / b.size) * 100, l: (-b.left / b.size) * 100, t: (-b.top / b.size) * 100 };
  });

  protected readonly marks = computed(() => {
    const sea = SEAS.find((s) => s.sea === this.result().sea);
    const found = this.found();
    return (sea?.points ?? [])
      .filter((p) => found.has(p.id))
      .map((p) => ({ code: p.code, x: ((p.x + PIN_DX + CHART_BOX_MARGIN) / BOX) * 100, y: ((p.y + PIN_DY + CHART_BOX_MARGIN) / BOX) * 100 }));
  });

  protected readonly label = computed(() => {
    const sea = SEAS.find((s) => s.sea === this.result().sea);
    return `${sea?.name ?? ''}的截圖,圈出目前標為已發現的 ${this.marks().length} 個點`;
  });
}
