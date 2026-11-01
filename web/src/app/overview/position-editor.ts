import { CdkDrag, CdkDragHandle, CdkDropList, type CdkDragMove } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { circled } from '../core/format';
import { ManageVm } from '../core/manage-vm';
import { IconComponent } from '../ui/icon';

/** 拖曳中的來源:格子序號或未排入清單 */
interface DragFrom {
  id: string;
  slot: number | null;
}
type DropTarget = number | 'pool' | null;

/**
 * 潛水艇「位置編輯」(D-314):4 個固定格子(對應遊戲畫面由上到下的 ①~④)+ 未排入清單。
 * 兩種操作結果相同:點一下拿起、再點格子放下(手機主要用法),或抓 ⠿ 把手拖曳(CDK,滑鼠與觸控共用,
 * 跟「工坊管理」的拖曳排序同一套):拖到的格子會亮起虛線框並寫出放開後會發生什麼。格子旁 ✕ = 取消釘選。
 * 沒有未排入的潛艇就不顯示清單。
 *
 * CDK 這裡只負責「抓起來跟著手指 / 滑鼠走」:外層 drop list 不接收任何東西(不排序),
 * 放開時由我們依落點(`elementsFromPoint` 找 [data-slot] / [data-pool])套用 ManageVm 的互換邏輯。
 */
@Component({
  selector: 'app-position-editor',
  imports: [IconComponent, CdkDropList, CdkDrag, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mg-pe" cdkDropList [cdkDropListSortingDisabled]="true" [cdkDropListEnterPredicate]="never" (cdkDropListDropped)="dropped()" [class.dragging]="!!drag()">
      @if (mg.layoutChanged() > 0) { <div class="mg-pe-top"><span class="mg-tag">{{ mg.layoutChanged() }} 處變動</span></div> }
      @if (held(); as h) {
        <div class="mg-hint on" role="status">已拿起「{{ info(h)?.name }}」— 點格子放下{{ mobile() ? '' : '（格子裡有潛艇會互換）' }}；再點一次取消。</div>
      } @else {
        <div class="mg-hint">{{ mobile() ? '點一下拿起，再點格子放下；或拖曳 ⠿ 把手。✕ 取消釘選。' : '拖曳 ⠿ 把手到格子，或「點一下拿起、再點格子放下」。格子旁的 ✕ 取消釘選，該艇會移到「未排入」。' }}</div>
      }
      <div class="mg-slots" [class.one-col]="mobile()">
        @for (id of slots(); track $index; let i = $index) {
          <div class="mg-slot" [attr.data-slot]="i" [attr.data-hint]="slotHint(id)" [class.empty]="!id" [class.hold]="!!id && id === held() && !drag()" [class.drop]="!!held() && !drag() && id !== held()" [class.chg]="isMoved(id, i)" [class.drop-target]="target() === i">
            <button type="button" class="mg-slot-btn" cdkDrag [cdkDragDisabled]="!id" cdkDragPreviewClass="mg-drag-preview" (cdkDragStarted)="dragStart(id, i)" (cdkDragMoved)="dragMove($event)" [attr.aria-pressed]="!!id && id === held()" [attr.aria-label]="slotLabel(id, i)" (click)="tapSlot(i)">
              @if (id) { <span class="mg-dots" cdkDragHandle aria-label="拖曳排列" role="img"><app-icon name="dragDots" [size]="18" /></span> }
              <span class="mg-slot-no">{{ circled(i + 1) }}</span>
              @if (id && info(id); as s) {
                <span class="mg-slot-main"><b>{{ s.name }}</b>@if (s.level) { <span class="mg-lv">Lv {{ s.level }}</span> }@if (isMoved(id, i)) { <span class="mg-tag">{{ s.from ? '原 ' + s.from : '原未排入' }}</span> }</span>
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
      }
      @if (pool().length > 0) {
        <div class="mg-pool" data-pool="1" [attr.data-hint]="'放開即取消釘選'" [class.drop-target]="target() === 'pool'">
          @for (id of pool(); track id) {
            <button type="button" class="mg-pitem" cdkDrag cdkDragPreviewClass="mg-drag-preview" [class.hold]="id === held() && !drag()" [attr.aria-pressed]="id === held()" (cdkDragStarted)="dragStart(id, null)" (cdkDragMoved)="dragMove($event)" (click)="tapPool(id)">
              <span class="mg-dots" cdkDragHandle aria-label="拖曳排列" role="img"><app-icon name="dragDots" [size]="16" /></span>
              <span class="mg-slot-main"><b>{{ info(id)?.name }}</b>@if (info(id)?.level; as lv) { <span class="mg-lv">Lv {{ lv }}</span> }</span>
              @if (info(id)?.from; as f) { <span class="mg-tag">原 {{ f }}</span> }
            </button>
          }
        </div>
      }
    </div>
  `,
  host: { style: 'display: contents' },
})
export class PositionEditor {
  protected readonly mg = inject(ManageVm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly mobile = input(false);
  protected readonly circled = circled;
  protected readonly never = (): boolean => false;
  protected readonly slots = computed(() => this.mg.layout()?.slots ?? []);
  protected readonly pool = computed(() => this.mg.layout()?.pool ?? []);
  protected readonly held = computed(() => this.mg.layout()?.held ?? null);
  /** 正在拖的潛艇;放開時清掉 */
  protected readonly drag = signal<DragFrom | null>(null);
  /** 目前拖到的落點(格子序號 / 未排入清單 / 都不是) */
  protected readonly target = signal<DropTarget>(null);
  /** 拖曳結束後的短時間內忽略 click,避免放開時又觸發「拿起 / 放下」 */
  private justDragged = false;

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
  /** 拖到這格時,格子中央顯示的提示(同工坊管理的「放開即放在這裡」) */
  protected slotHint(id: string | null): string {
    return id ? '放開即與這格互換' : '放開即放入這格';
  }

  protected tapSlot(i: number): void {
    if (!this.justDragged) this.mg.layoutTapSlot(i);
  }
  protected tapPool(id: string): void {
    if (!this.justDragged) this.mg.layoutTapPool(id);
  }

  protected dragStart(id: string | null, slot: number | null): void {
    if (!id) return;
    this.drag.set({ id, slot });
    this.target.set(null);
    this.mg.layoutHold(id);
  }

  /** 依指標位置找出拖到哪個格子 / 清單;拖曳預覽與來源的佔位元素不算(來源格本身也不亮) */
  protected dragMove(e: CdkDragMove): void {
    const from = this.drag();
    if (!from) return;
    const x = e.pointerPosition.x - window.scrollX;
    const y = e.pointerPosition.y - window.scrollY;
    let hit: DropTarget = null;
    for (const el of document.elementsFromPoint(x, y)) {
      if (!this.host.nativeElement.contains(el)) continue;
      const slot = el.closest<HTMLElement>('[data-slot]');
      if (slot) {
        hit = Number(slot.dataset['slot']);
        break;
      }
      if (el.closest('[data-pool]')) {
        hit = 'pool';
        break;
      }
    }
    if (hit === from.slot || (hit === 'pool' && from.slot === null)) hit = null; // 原地不算落點
    if (hit !== this.target()) this.target.set(hit);
  }

  /** 放開:依最後亮著的落點套用(沒有落點 = 放下手上的,不動位置) */
  protected dropped(): void {
    const to = this.target();
    this.drag.set(null);
    this.target.set(null);
    this.justDragged = true;
    setTimeout(() => (this.justDragged = false), 120);
    if (typeof to === 'number') this.mg.layoutTapSlot(to);
    else if (to === 'pool') this.mg.layoutDropPool();
    else this.mg.layoutRelease();
  }
}
