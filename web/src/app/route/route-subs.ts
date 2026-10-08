import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { RouteSubDto } from '@eranaut/shared';
import { Toast } from '../core/toast';
import { buildStats, partLabel } from './core/build';
import { TABLES } from './core/data';
import { judgeBuild, type BuildJudgement, type Grade } from './core/need';
import { travelMinutes } from './core/route';
import type { Build } from './core/types';
import { RouteBind } from './route-bind';
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
  imports: [NgTemplateOutlet, RouteBind],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-subs.html',
})
export class RouteSubs {
  protected readonly vm = inject(RouteVm);
  private readonly toast = inject(Toast);

  readonly actions = input<'manage' | 'pick'>('manage');
  /** 使用了某一組(改用成功)之後通知外層,例如查看性能彈窗收起 */
  readonly used = output<string>();

  protected readonly confirmDel = signal<string | null>(null);

  protected readonly hasRoute = computed(() => this.vm.seq().length > 0);

  protected readonly cards = computed<Card[]>(() => {
    const has = this.hasRoute();
    const need = this.vm.need();
    const cost = this.vm.cost();
    const si = this.vm.seaIdx();
    const seq = this.vm.seq();
    const needLevel = seq.reduce((m, id) => Math.max(m, si.byId.get(id)?.rankReq ?? 0), 0);
    const make = (id: string | null, title: string, sub: string, b: Build, bound: boolean, active: boolean): Card => {
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
    for (const s of this.vm.saved()) out.push(make(s.id, s.name, '', subToBuild(s), s.bound_submarine_ids.length > 0, this.vm.subId() === s.id && !dirty));
    return out;
  });

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
