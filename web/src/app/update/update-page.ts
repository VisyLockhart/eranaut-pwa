import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { DataStore } from '../core/data-store';
import { ImageTools, clipboardImage, isCaptureCancelled, isTextTarget, pasteShortcut } from '../core/image-input';
import { Layout } from '../core/layout';
import { wsMeta } from '../core/overview-vm';
import { flagText } from '../core/submarine-form';
import { OCR_MAX_BYTES, UpdateVm } from '../core/update-vm';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectValue } from '../ui/select';
import { SubRowEditor } from './sub-row-editor';

/** 更新潛艇(D-117):選工坊 → 截圖辨識或手動輸入 → 整個工坊一次更新;D-124 每分鐘自動補正 */
@Component({
  selector: 'app-update-page',
  imports: [NgTemplateOutlet, RouterLink, IconComponent, SelectField, SubRowEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './update-page.html',
  host: { style: 'display: contents', '(document:paste)': 'onPaste($event)' },
})
export class UpdatePage implements OnDestroy {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(UpdateVm);
  protected readonly store = inject(DataStore);
  private readonly router = inject(Router);
  protected readonly wsMeta = wsMeta;
  protected readonly flagText = flagText;
  protected readonly dragging = signal(false);
  /** 剛貼上圖片時讓上傳區閃一下,表示有收到(D-162) */
  protected readonly pasted = signal(false);
  protected readonly capturing = signal(false);
  protected readonly pasteKey = pasteShortcut();
  private readonly tools = inject(ImageTools);
  protected readonly captureSupported = this.tools.canCapture();
  private pasteTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly wsOptions = computed(() => this.store.workshops().map((w) => ({ value: w.id, label: w.name })));

  constructor() {
    this.layout.pageTitle.set('更新潛水艇');
    this.vm.open();
    // 只有真的導到別的頁面才丟棄表單。換螢幕(DPI 不同)等造成寬度跨過 768px 時,外殼會在手機/桌機版之間切換、
    // 頁面元件被銷毀重建,這時表單與辨識結果要留著(狀態在 UpdateVm,不在元件裡)
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (!e.url.startsWith('/update')) this.vm.close();
      });
    // 資料晚到(直接開此頁、尚無快照)或選的工坊被刪掉時,補選一間
    effect(() => {
      this.store.workshops();
      this.vm.workshopId();
      untracked(() => this.vm.ensureSelection());
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.pasteTimer);
  }

  protected onSelect(value: SelectValue): void {
    this.vm.selectWorkshop(String(value) || null);
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // 同一張圖可以再選一次
    if (file) void this.vm.recognize(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.vm.recognize(file);
  }

  /**
   * Ctrl/⌘+V 貼上截圖(D-162):整頁監聽,不需要輸入框。只在「截圖辨識」分頁、等待上傳時處理;
   * 游標在文字輸入框內、或剪貼簿裡沒有圖片(貼的是文字)就不攔截。
   */
  protected onPaste(event: ClipboardEvent): void {
    if (this.vm.mode() !== 'ocr' || this.vm.ocrPhase() !== 'idle' || !this.vm.workshop()) return;
    if (isTextTarget(event.target)) return;
    const file = clipboardImage(event.clipboardData);
    if (!file) return;
    event.preventDefault();
    this.pasted.set(true);
    clearTimeout(this.pasteTimer);
    this.pasteTimer = setTimeout(() => this.pasted.set(false), 700);
    void this.vm.recognize(file);
  }

  /** 「擷取畫面」按鈕(D-162):請瀏覽器讓使用者選視窗或螢幕,取一幀直接辨識 */
  protected async capture(): Promise<void> {
    if (this.capturing() || this.vm.ocrPhase() !== 'idle') return;
    this.capturing.set(true);
    try {
      const file = await this.tools.capture(OCR_MAX_BYTES);
      await this.vm.recognize(file);
    } catch (error) {
      if (!isCaptureCancelled(error)) this.vm.reportOcrError('擷取畫面失敗，請改用截圖上傳或貼上截圖');
    } finally {
      this.capturing.set(false);
    }
  }

  protected async submit(): Promise<void> {
    const outcome = await this.vm.submit();
    if (outcome === 'ok' || outcome === 'gone') await this.router.navigateByUrl('/');
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/');
  }
}
