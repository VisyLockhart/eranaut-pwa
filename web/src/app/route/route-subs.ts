import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { RouteSubDto } from '@eranaut/shared';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { buildStats, partLabel } from './core/build';
import { TABLES } from './core/data';
import { judgeBuild, type BuildJudgement, type Grade } from './core/need';
import { travelMinutes } from './core/route';
import type { Build } from './core/types';
import { ListView, PAGE_SIZE_DESKTOP, PAGE_SIZE_MOBILE } from './list-view';
import { RouteBind } from './route-bind';
import { RouteListTools, RoutePager, RouteStar } from './route-list-ui';
import { formatTravel } from './route-format';
import { normalizeSeq, subToBuild } from './route-state';
import { RouteVm } from './route-vm';

interface Chip {
  label: string;
  value: number;
  grade: Grade | 'plain';
  gap: number;
}

interface Card {
  id: string | null;
  title: string;
  sub: string;
  parts: string;
  level: number;
  chips: Chip[];
  overweight: boolean;
  time: string;
  ok: boolean;
  bound: boolean;
  active: boolean;
  favorite: boolean;
  /** 能不能跑目前這條路線(距離與等級);沒選航點時為 null,不顯示 */
  fit: 'ok' | 'bad' | null;
  fitText: string;
  /** 改用這一組會被移除的航點數 */
  drops: number;
}

/**
 * 配置卡 / 比較表:逐項對目前路線判定達標與差距(RS-25)。
 * 每一組儲存配置,加上「臨時配置」(只有目前畫面上的配置不是任何一組儲存配置時才出現)。
 * - `actions="manage"`(配置頁):使用 / 編輯 / 刪除 / 綁定;`actions="pick"`(查看性能彈窗):只有「改用這組」與編輯。
 * 沒選航點時不判定顏色(一律中性),避免全部誤顯示成綠色。
 */
@Component({
  selector: 'app-route-subs',
  imports: [NgTemplateOutlet, RouteBind, RouteListTools, RoutePager, RouteStar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-subs.html',
})
export class RouteSubs {
  protected readonly vm = inject(RouteVm);
  private readonly toast = inject(Toast);
  private readonly layout = inject(Layout);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly actions = input<'manage' | 'pick'>('manage');
  /** 使用了某一組(改用成功)之後通知外層,例如查看性能彈窗收起 */
  readonly used = output<string>();

  protected readonly confirmDel = signal<string | null>(null);

  /**
   * 清單檢視(D-237):常用在前、名稱搜尋、只看常用、分頁(桌機每頁 10、手機 6)。
   * 「查看性能」彈窗(`pick`)是對話框,不分頁、用捲動,但同樣有搜尋與常用。
   */
  protected readonly list = new ListView<RouteSubDto>(
    () => this.vm.saved(),
    () => (this.actions() === 'pick' ? Infinity : this.layout.isDesktop() ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE),
  );
  /** 手機卡片預設收合成一列(D-237);點「展開」才顯示燈號與其他操作。臨時配置與彈窗裡的卡片一律展開 */
  protected readonly openIds = signal<ReadonlySet<string>>(new Set());
  /** 剛跳到的那一組(短暫標示) */
  protected readonly flashId = signal<string | null>(null);
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private seenSubId: string | null | undefined = undefined;

  constructor() {
    // 使用中的配置變了(開頁、儲存新的一組、別處改用):翻到它所在的頁。不是第一次顯示時再短暫標示
    effect(() => {
      const id = this.vm.subId();
      const n = this.vm.saved().length;
      untracked(() => {
        if (this.actions() !== 'manage' || id === null || n === 0 || id === this.seenSubId) return;
        const first = this.seenSubId === undefined;
        this.seenSubId = id;
        if (this.list.goTo(id) && !first) this.flash(id);
      });
    });
  }

  protected readonly hasRoute = computed(() => this.vm.seq().length > 0);

  protected readonly cards = computed<Card[]>(() => {
    const has = this.hasRoute();
    const need = this.vm.need();
    const cost = this.vm.cost();
    const si = this.vm.seaIdx();
    const seq = this.vm.seq();
    const needLevel = seq.reduce((m, id) => Math.max(m, si.byId.get(id)?.rankReq ?? 0), 0);
    const make = (id: string | null, title: string, sub: string, b: Build, bound: boolean, active: boolean, favorite = false): Card => {
      const stats = buildStats(TABLES, b);
      const j = judgeBuild(stats, need);
      let fit: Card['fit'] = null;
      let fitText = '';
      if (has) {
        const levelBad = b.level < needLevel;
        const rangeBad = stats.range < cost.range;
        fit = levelBad || rangeBad ? 'bad' : 'ok';
        fitText = !levelBad && !rangeBad ? '可跑這條路線' : [levelBad ? `等級不足(需 Lv${needLevel})` : '', rangeBad ? `距離不足(差 ${cost.range - stats.range})` : ''].filter(Boolean).join('、');
      }
      return {
        id,
        favorite,
        title,
        sub,
        parts: b.parts.map(partLabel).join(' '),
        level: b.level,
        chips: chips(j, has),
        overweight: stats.overweight,
        time: has ? formatTravel(travelMinutes(cost.distance, stats.speed)) : '—',
        ok: has && j.allPass,
        bound,
        active,
        fit,
        fitText,
        drops: has ? seq.length - normalizeSeq(si, seq, b.level, stats.range).length : 0,
      };
    };
    const dirty = this.vm.dirty();
    const sel = this.vm.selectedSub();
    const showTemp = this.vm.subId() === null || dirty;
    const out: Card[] = [];
    if (showTemp) {
      // 展示模式沒有儲存配置,畫面上的配置就是唯一的配置,不需要「臨時 / 尚未儲存」的說法
      const title = this.vm.canSave ? '臨時配置' : '目前配置';
      const sub = !this.vm.canSave ? '' : dirty && sel ? `與「${sel.name}」不同,尚未儲存` : '尚未儲存';
      out.push(make(null, title, sub, this.vm.build(), false, true));
    }
    for (const s of this.list.pageItems()) out.push(make(s.id, s.name, '', subToBuild(s), s.bound_submarine_ids.length > 0, this.vm.subId() === s.id && !dirty, s.favorite));
    return out;
  });

  protected isOpen(c: Card): boolean {
    return this.actions() === 'pick' || c.id === null || this.openIds().has(c.id);
  }

  protected toggleOpen(c: Card): void {
    if (c.id === null) return;
    const next = new Set(this.openIds());
    if (!next.delete(c.id)) next.add(c.id);
    this.openIds.set(next);
  }

  protected toggleFav(id: string): void {
    this.vm.toggleFavorite(id);
  }

  /** 換頁:回到清單最上面(手機的頁面很長,換頁後不會停在底部) */
  protected goPage(n: number): void {
    this.list.setPage(n);
    this.host.nativeElement.scrollIntoView?.({ block: 'start' });
  }

  private flash(id: string): void {
    this.flashId.set(id);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.flashId.set(null), 1800);
  }

  protected useSub(id: string, title: string): void {
    this.vm.useSub(id);
    this.toast.show(`已改用「${title}」`);
    this.used.emit(id);
  }

  protected editSub(id: string | null): void {
    if (id === null) this.vm.openConfig('temp');
    else this.vm.openConfig('edit', id);
  }

  protected saveTemp(): void {
    this.vm.openConfig('new');
  }

  protected askDelete(id: string): void {
    this.confirmDel.set(this.confirmDel() === id ? null : id);
  }

  protected async remove(id: string): Promise<void> {
    const sub: RouteSubDto | undefined = this.vm.saved().find((s) => s.id === id);
    try {
      await this.vm.remove(id);
      this.confirmDel.set(null);
      this.toast.show(`已刪除「${sub?.name ?? ''}」`);
    } catch (e) {
      this.toast.show(e instanceof HttpErrorResponse ? '刪除失敗,稍後再試' : '刪除失敗', { tone: 'warn' });
    }
  }
}

function chips(j: BuildJudgement, has: boolean): Chip[] {
  const g = (grade: Grade): Grade | 'plain' => (has ? grade : 'plain');
  const gap = (n: number): number => (has ? n : 0);
  return [
    { label: '探索', value: j.surveillance.have, grade: g(j.surveillance.grade), gap: gap(j.surveillance.gapToTop) },
    { label: '收集', value: j.retrieval.have, grade: g(j.retrieval.grade), gap: gap(j.retrieval.gapToTop) },
    { label: '巡航', value: j.speed, grade: 'plain', gap: 0 },
    { label: '距離', value: j.range.have, grade: g(j.range.grade), gap: gap(j.range.gapToTop) },
    { label: '恩惠', value: j.favor.have, grade: g(j.favor.grade), gap: gap(j.favor.gapToTop) },
  ];
}
