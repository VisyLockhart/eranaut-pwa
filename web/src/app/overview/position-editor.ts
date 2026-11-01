import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { circled } from '../core/format';
import { ManageVm } from '../core/manage-vm';
import { IconComponent } from '../ui/icon';

/**
 * 潛水艇「位置編輯」(D-314):4 個固定格子(對應遊戲畫面由上到下的 ①~④)+ 未排入清單。
 * 兩種操作結果相同:點一下拿起、再點格子放下(手機主要用法),或拖曳。格子旁 ✕ = 取消釘選。
 * 沒有未排入的潛艇就不顯示清單。
 */
@Component({
  selector: 'app-position-editor',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (mg.layoutChanged() > 0) { <div class="mg-pe-top"><span class="mg-tag">{{ mg.layoutChanged() }} 處變動</span></div> }
    @if (held(); as h) {
      <div class="mg-hint on" role="status">已拿起「{{ info(h)?.name }}」— 點格子放下{{ mobile() ? '' : '（格子裡有潛艇會互換）' }}；再點一次取消。</div>
    } @else {
      <div class="mg-hint">{{ mobile() ? '點一下拿起，再點格子放下；或拖曳 ⠿ 把手。✕ 取消釘選。' : '拖曳潛艇到格子，或「點一下拿起、再點格子放下」。格子旁的 ✕ 取消釘選，該艇會移到「未排入」。' }}</div>
    }
    <div class="mg-slots" [class.one-col]="mobile()">
      @for (id of slots(); track $index; let i = $index) {
        <div class="mg-slot" [class.empty]="!id" [class.hold]="!!id && id === held()" [class.drop]="!!held() && id !== held()" [class.chg]="isMoved(id, i)" (dragover)="$event.preventDefault()" (drop)="$event.preventDefault(); mg.layoutTapSlot(i)">
          <button type="button" class="mg-slot-btn" [draggable]="!!id" [attr.aria-pressed]="!!id && id === held()" [attr.aria-label]="slotLabel(id, i)" (dragstart)="drag($event, id)" (click)="mg.layoutTapSlot(i)">
            <span class="mg-slot-no">{{ circled(i + 1) }}</span>
            @if (id && info(id); as s) {
              <span class="mg-slot-main"><b>{{ s.name }}</b>@if (s.level) { <span class="mg-lv">Lv {{ s.level }}</span> }@if (isMoved(id, i)) { <span class="mg-tag">原 {{ s.from }}</span> }</span>
            } @else {
              <span class="mg-slot-main muted">空位 ・ {{ held() ? '點此放入' : '拖入潛艇' }}</span>
            }
          </button>
          @if (id) {
            <button type="button" class="mg-slot-x" (click)="mg.layoutUnpin(i)" [attr.aria-label]="'取消釘選 ' + (info(id)?.name ?? '')"><app-icon name="close" [size]="14" /></button>
          }
        </div>
      }
    </div>
    @if (pool().length > 0) {
      <div class="mg-pool-head"><b>未排入（{{ pool().length }}）</b><small>不在 4 個格子裡，不提醒返航、不計入待收。拖進上面的格子即可排入。</small></div>
      <div class="mg-pool" (dragover)="$event.preventDefault()" (drop)="$event.preventDefault(); mg.layoutDropPool()">
        @for (id of pool(); track id) {
          <button type="button" class="mg-pitem" [class.hold]="id === held()" draggable="true" [attr.aria-pressed]="id === held()" (dragstart)="drag($event, id)" (click)="mg.layoutTapPool(id)">
            <span class="mg-dots" aria-hidden="true"><app-icon name="dragDots" [size]="16" /></span>
            <span class="mg-slot-main"><b>{{ info(id)?.name }}</b>@if (info(id)?.level; as lv) { <span class="mg-lv">Lv {{ lv }}</span> }</span>
            <span class="mg-tag">原 {{ info(id)?.from }}</span>
          </button>
        }
      </div>
    }
  `,
  host: { style: 'display: contents' },
})
export class PositionEditor {
  protected readonly mg = inject(ManageVm);
  readonly mobile = input(false);
  protected readonly circled = circled;
  protected readonly slots = computed(() => this.mg.layout()?.slots ?? []);
  protected readonly pool = computed(() => this.mg.layout()?.pool ?? []);
  protected readonly held = computed(() => this.mg.layout()?.held ?? null);

  protected info(id: string | null) {
    return id ? (this.mg.layoutSubs().get(id) ?? null) : null;
  }
  protected isMoved(id: string | null, i: number): boolean {
    const s = id ? this.info(id) : null;
    return !!s && s.from !== circled(i + 1);
  }
  protected slotLabel(id: string | null, i: number): string {
    const s = this.info(id);
    return s ? `格子 ${circled(i + 1)}：${s.name}` : `格子 ${circled(i + 1)}：空位`;
  }
  protected drag(event: DragEvent, id: string | null): void {
    if (!id) return event.preventDefault();
    event.dataTransfer?.setData('text/plain', id);
    this.mg.layoutHold(id);
  }
}
