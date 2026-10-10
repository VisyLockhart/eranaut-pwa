import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LIMITS, type RouteSubDto } from '@eranaut/shared';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { IconComponent } from '../ui/icon';
import { ListView } from './list-view';
import { RouteListTools, RouteStar } from './route-list-ui';
import { PART_GRADE_COUNT, buildStats, partLabel, rankRow } from './core/build';
import { TABLES } from './core/data';
import { judgeBuild } from './core/need';
import { PART_KEYS, type PartKey } from './core/types';
import { RouteVm } from './route-vm';

/** 等級滑桿最小值(繁中服最低可用等級) */
export const SLIDER_MIN_LEVEL = 51;

interface StatRow {
  key: string;
  label: string;
  level: number | null;
  parts: number;
  total: number;
  need: string;
  grade: 'full' | 'partial' | 'none' | 'plain';
}

const GRADES = [1, 2, 3, 4, 5] as const;

/**
 * 配置編輯對話框(共用:配置頁、航點頁、反查頁、搜尋頁都從 `RouteVm.openConfig` 開啟)。
 *
 * 編輯的是草稿(`RouteVm.draft`),不會動到畫面上的配置與已選航點,所以取消不會丟航點;
 * 草稿放在 root 的 RouteVm,換版面重建元件時不會丟(D-163)。
 * 底部:「只套用」(不存伺服器)、「儲存」(新增或覆蓋;已滿 30 組時改成選一組覆蓋)。統計表即時跟著草稿變,
 * 並對照目前選的航點顯示路線需求與顏色。
 */
@Component({
  selector: 'app-route-config-dialog',
  imports: [CdkTrapFocus, IconComponent, RouteListTools, RouteStar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-config-dialog.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RouteConfigDialog {
  protected readonly vm = inject(RouteVm);
  protected readonly layout = inject(Layout);
  private readonly toast = inject(Toast);

  protected readonly partKeys = PART_KEYS;
  protected readonly grades = GRADES;
  protected readonly label = partLabel;
  protected readonly gradeCount = PART_GRADE_COUNT;
  protected readonly nameMax = LIMITS.routeSubName;
  protected readonly max = LIMITS.maxRouteSubsPerUser;
  protected readonly maxLevel = LIMITS.maxRouteSubLevel;
  /** 等級滑桿的範圍(繁中服 51~130);輸入框仍接受 1~130,所以舊資料低於 51 時滑桿停在最左端、數字照實顯示 */
  protected readonly sliderMin = SLIDER_MIN_LEVEL;
  /** 正在拖動滑桿:顯示浮動數值泡泡(手指會擋住輸入框旁的數字) */
  protected readonly sliding = signal(false);

  /** 'edit' = 編輯畫面;'pick' = 已滿 30 組,選一組覆蓋 */
  protected readonly step = signal<'edit' | 'pick'>('edit');
  /** 已滿時選一組覆蓋的清單:不分頁(用捲動),有搜尋與「只看常用」(D-237) */
  protected readonly pickList = new ListView<RouteSubDto>(() => this.vm.saved());
  protected readonly confirmId = signal<string | null>(null);
  protected readonly error = signal('');
  protected downOnOverlay = false;

  protected readonly stats = computed(() => {
    const b = this.vm.draftBuild();
    return b ? buildStats(TABLES, b) : null;
  });
  protected readonly nameLength = computed(() => [...(this.vm.draft()?.name ?? '').trim()].length);
  protected readonly nameValid = computed(() => this.nameLength() >= 1 && this.nameLength() <= this.nameMax);
  protected readonly busy = computed(() => this.vm.pending() > 0);
  protected readonly title = computed(() => {
    const mode = this.vm.draft()?.mode;
    if (!this.vm.canSave) return '編輯配置';
    return mode === 'edit' ? '編輯配置' : mode === 'temp' ? '編輯臨時配置' : '新增配置';
  });
  /** 「儲存」按鈕文字:編輯儲存潛艇 = 覆蓋這一組;其餘 = 儲存為新配置 */
  protected readonly saveText = computed(() => (this.vm.draft()?.mode === 'edit' ? '儲存' : '儲存為新配置'));
  protected readonly summary = computed(() => {
    const s = this.stats();
    return s ? `探索 ${s.surveillance} · 收集 ${s.retrieval} · 巡航 ${s.speed} · 距離 ${s.range} · 恩惠 ${s.favor}` : '';
  });

  protected readonly rows = computed<StatRow[]>(() => {
    const b = this.vm.draftBuild();
    if (!b) return [];
    const s = buildStats(TABLES, b);
    const r = rankRow(TABLES, b.level);
    const n = this.vm.need();
    const j = judgeBuild(s, n);
    const has = this.vm.seq().length > 0;
    const range = (low: number, top: number): string => (has ? (low === top ? `${top}` : `${low} / ${top}`) : '—');
    return [
      { key: 'sv', label: '探索', level: r.surveillance, parts: s.surveillance - r.surveillance, total: s.surveillance, need: range(n.surveillanceMid, n.surveillanceHigh), grade: has ? j.surveillance.grade : 'plain' },
      { key: 'rt', label: '收集', level: r.retrieval, parts: s.retrieval - r.retrieval, total: s.retrieval, need: range(n.retrievalNorm, n.retrievalOptim), grade: has ? j.retrieval.grade : 'plain' },
      { key: 'sp', label: '巡航', level: r.speed, parts: s.speed - r.speed, total: s.speed, need: '—', grade: 'plain' },
      { key: 'rg', label: '距離', level: r.range, parts: s.range - r.range, total: s.range, need: has ? `${n.range}` : '—', grade: has ? j.range.grade : 'plain' },
      { key: 'fv', label: '恩惠', level: r.favor, parts: s.favor - r.favor, total: s.favor, need: has ? `${n.favor}` : '—', grade: has ? j.favor.grade : 'plain' },
    ];
  });

  protected partInfo(key: PartKey, grade: number) {
    return TABLES.parts.parts[key].grades[grade - 1]!;
  }
  protected partName(key: PartKey): string {
    return TABLES.parts.parts[key].label;
  }

  protected setPart(index: number, idx: number): void {
    this.vm.setDraftPart(index as 0 | 1 | 2 | 3, idx);
  }

  protected onLevel(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.vm.setDraftLevel(Number(input.value));
    input.value = String(this.vm.draft()?.level ?? '');
  }

  /** 滑桿拖動:每格即時更新草稿與統計表(只改本機草稿,不送 API) */
  protected onSlider(ev: Event): void {
    this.vm.setDraftLevel(Number((ev.target as HTMLInputElement).value));
  }

  /** 手機的 − / ＋ 按鈕:一次一級,夾在 1~130 */
  protected stepLevel(delta: number): void {
    const d = this.vm.draft();
    if (d) this.vm.setDraftLevel(Math.min(this.maxLevel, Math.max(1, d.level + delta)));
  }

  /** 把手所在位置(0~100),泡泡跟著走;低於滑桿最小值時貼左端 */
  protected sliderPct(level: number): number {
    return Math.min(100, Math.max(0, ((level - this.sliderMin) / (this.maxLevel - this.sliderMin)) * 100));
  }

  protected onName(ev: Event): void {
    this.vm.setDraftName((ev.target as HTMLInputElement).value);
  }

  // 模板事件處理式不能回傳 false(Angular 會 preventDefault,讓輸入框點不進去),所以用回傳 void 的方法
  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }

  /** 點背景:只有沒改過內容時才關閉(避免誤觸丟掉編輯) */
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget && !this.vm.draftDirty()) this.close();
    this.downOnOverlay = false;
  }

  protected onEscape(event: Event): void {
    if (!this.vm.draft()) return;
    event.preventDefault();
    if (this.step() === 'pick') this.back();
    else this.close();
  }

  protected close(): void {
    this.vm.closeConfig();
  }

  protected back(): void {
    this.step.set('edit');
    this.confirmId.set(null);
    this.error.set('');
  }

  /** 只套用:成為畫面上的配置,不寫入伺服器 */
  protected apply(): void {
    this.vm.applyDraft();
  }

  protected async save(): Promise<void> {
    const d = this.vm.draft();
    if (!d || !this.nameValid() || this.busy()) return;
    this.error.set('');
    if (d.mode !== 'edit' && this.vm.isFull()) {
      this.pickList.clearFilters();
      this.step.set('pick');
      return;
    }
    try {
      const sub = await this.vm.saveDraft();
      this.toast.show(d.mode === 'edit' ? `已儲存「${sub.name}」` : `已加入「${sub.name}」`);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 409) {
        // 別的裝置剛好存滿了:重抓清單,改成選一組覆蓋
        await this.vm.refresh();
        this.pickList.clearFilters();
      this.step.set('pick');
        this.error.set(`已經有 ${this.max} 組了,請選一組覆蓋`);
      } else this.fail(e);
    }
  }

  protected ask(id: string): void {
    this.confirmId.set(this.confirmId() === id ? null : id);
  }

  protected async overwrite(id: string): Promise<void> {
    if (this.busy()) return;
    this.error.set('');
    try {
      const sub = await this.vm.saveDraft(id);
      this.toast.show(`已覆蓋「${sub.name}」`);
    } catch (e) {
      this.fail(e);
    }
  }

  private fail(e: unknown): void {
    if (e instanceof HttpErrorResponse && e.status === 400) this.error.set('名稱或配置不合法,請檢查後再試');
    else if (e instanceof HttpErrorResponse && e.status === 404) {
      void this.vm.refresh();
      this.error.set('這一組已在別的裝置被刪除');
    } else this.error.set('儲存失敗,可能沒有網路,稍後再試');
  }
}
