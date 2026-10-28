import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal, untracked, viewChild, type TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ChartUpdateVm } from '../core/chart-update-vm';
import { chartDate, chartSummary } from '../core/charts';
import { seaIndex } from '../route/core/data';
import { DataStore } from '../core/data-store';
import { ImageTools, clipboardImage, isCaptureCancelled, isTextTarget, pasteShortcut } from '../core/image-input';
import { Layout } from '../core/layout';
import { OCR_MAX_BYTES } from '../core/update-vm';
import { RouteMap } from '../route/route-map';
import { IconComponent } from '../ui/icon';
import { SelectField, type SelectValue } from '../ui/select';
import { AddSeaDialog } from './add-sea-dialog';
import { ChartShot } from './chart-shot';

/**
 * 更新海圖(D-293):上傳「選擇航海圖」視窗的截圖(可多張、可貼上或擷取畫面)→ 伺服器辨識是哪張海圖、哪些點已發現 →
 * 在 App 的海圖上核對與修改(沿用航線頁「標記去過」的海圖元件)→ 儲存到這間工坊(跨裝置)。沒有截圖也可以直接點海圖修改。
 */
@Component({
  selector: 'app-chart-page',
  imports: [NgTemplateOutlet, IconComponent, SelectField, RouteMap, ChartShot, AddSeaDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart-page.html',
  host: { style: 'display: contents', '(document:paste)': 'onPaste($event)' },
})
export class ChartPage implements OnDestroy {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(ChartUpdateVm);
  protected readonly store = inject(DataStore);
  private readonly router = inject(Router);
  private readonly tools = inject(ImageTools);
  protected readonly captureSupported = this.tools.canCapture();
  protected readonly pasteKey = pasteShortcut();
  protected readonly dragging = signal(false);
  protected readonly pasted = signal(false);
  protected readonly capturing = signal(false);
  private pasteTimer: ReturnType<typeof setTimeout> | undefined;
  protected readonly addOpen = signal(false);
  protected readonly confirmRm = signal(false);
  private rmTimer: ReturnType<typeof setTimeout> | undefined;
  /** 第一個海域不能移除 */
  protected readonly canRemove = computed(() => this.vm.viewSea() !== 1);
  protected readonly wsOptions = computed(() => this.store.workshops().map((w) => ({ value: w.id, label: w.name })));
  /** 這間工坊上次更新海圖的日期與返航提示(D-294:從總覽搬過來) */
  protected readonly meta = computed(() => {
    const ws = this.vm.workshop();
    return ws ? chartSummary(ws, this.store.now()) : null;
  });
  protected readonly chartDate = (ms: number | null) => chartDate(ms);
  protected readonly seaIdx = computed(() => seaIndex(this.vm.viewSea()));
  protected readonly shot = computed(() => this.vm.shotOf(this.vm.viewSea()));
  /** 可以對照的截圖(有海圖位置才有) */
  protected readonly compare = computed(() => {
    const s = this.shot();
    return s && s.url ? s : null;
  });
  protected readonly mismatch = computed(() => {
    this.vm.draft();
    return this.vm.mismatch(this.vm.viewSea());
  });
  /** 這個海域截圖裡沒認出、因為後面的點已發現而補上的點;介於有無之間的點 */
  protected readonly filledCodes = computed(() => codes(this.seaIdx(), this.shot()?.result.filled ?? []));
  protected readonly uncertainCodes = computed(() => codes(this.seaIdx(), (this.shot()?.result.uncertain ?? []).filter((id) => !this.vm.draft().has(id))));
  private readonly wsHeader = viewChild<TemplateRef<unknown>>('wsHeader');

  constructor() {
    this.layout.pageTitle.set('更新海圖');
    this.vm.open(inject(ActivatedRoute).snapshot.queryParamMap.get('ws'));
    // 只有真的導到別的頁面才丟棄(換螢幕造成手機/桌機版切換時保留,同 D-163)
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (!e.url.startsWith('/charts')) this.vm.close();
      });
    // 手機版:工坊選擇放在標題列右側(同更新潛艇,D-291 ⑧)
    effect(() => {
      const tpl = this.wsHeader();
      const show = !this.layout.isDesktop() && this.store.workshops().length > 0 ? (tpl ?? null) : null;
      untracked(() => this.layout.headerTool.set(show));
    });
    effect(() => {
      this.store.workshops();
      untracked(() => this.vm.ensureSelection());
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.pasteTimer);
    clearTimeout(this.rmTimer);
    this.layout.headerTool.set(null);
  }

  protected onSelect(value: SelectValue): void {
    this.vm.selectWorkshop(String(value) || null);
  }

  /** 移除整張海圖:兩段式確認(同配件製作清空,3 秒內沒再按就取消) */
  protected requestRemove(): void {
    if (!this.confirmRm()) {
      this.confirmRm.set(true);
      clearTimeout(this.rmTimer);
      this.rmTimer = setTimeout(() => this.confirmRm.set(false), 3000);
      return;
    }
    clearTimeout(this.rmTimer);
    this.confirmRm.set(false);
    this.vm.removeSea(this.vm.viewSea());
  }

  protected setSea(sea: number): void {
    this.vm.viewSea.set(sea);
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (files.length) void this.vm.recognize(files);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = [...(event.dataTransfer?.files ?? [])];
    if (files.length) void this.vm.recognize(files);
  }

  /** Ctrl/⌘+V 貼上截圖(同更新潛艇,D-162) */
  protected onPaste(event: ClipboardEvent): void {
    if (!this.vm.workshop() || isTextTarget(event.target)) return;
    const file = clipboardImage(event.clipboardData);
    if (!file) return;
    event.preventDefault();
    this.pasted.set(true);
    clearTimeout(this.pasteTimer);
    this.pasteTimer = setTimeout(() => this.pasted.set(false), 700);
    void this.vm.recognize([file]);
  }

  protected async capture(): Promise<void> {
    if (this.capturing()) return;
    this.capturing.set(true);
    try {
      const file = await this.tools.capture(OCR_MAX_BYTES);
      await this.vm.recognize([file]);
    } catch (error) {
      if (!isCaptureCancelled(error)) this.vm.error.set('擷取畫面失敗,請改用截圖上傳或貼上截圖');
    } finally {
      this.capturing.set(false);
    }
  }

  protected async save(): Promise<void> {
    if (await this.vm.save()) await this.router.navigateByUrl('/');
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/');
  }
}

function codes(si: ReturnType<typeof seaIndex>, ids: readonly number[]): string {
  return ids.map((id) => si.byId.get(id)?.code ?? '').filter(Boolean).join('、');
}
