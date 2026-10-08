import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { Toast } from '../core/toast';
import { partLabel } from './core/build';
import type { SearchHit } from './core/search';
import { travelMinutes } from './core/route';
import { formatTravel } from './route-format';
import { MIN_KEYS, RouteSearchVm, type MinKey } from './route-search-vm';
import { RouteVm } from './route-vm';

const PAGE = 30;

interface Hit {
  key: string;
  parts: string;
  weight: number;
  stats: { label: string; value: number }[];
  time: string | null;
  raw: SearchHit;
}

/**
 * 配置搜尋(M4):設定最低性能與重量上限,在 10⁴ 種零件組合中找出符合者(最多 300 筆)。
 * 結果可「帶入」畫面(切到配置頁)或「加入儲存」(RS-25;已滿 10 組時改去配置頁選一組覆蓋)。
 */
@Component({
  selector: 'app-route-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-search.html',
})
export class RouteSearch {
  protected readonly vm = inject(RouteVm);
  protected readonly s = inject(RouteSearchVm);
  private readonly toast = inject(Toast);
  readonly edit = output<void>();

  protected readonly minKeys = MIN_KEYS;
  protected readonly shown = signal(PAGE);
  protected readonly busyKey = signal<string | null>(null);
  protected readonly hasRoute = computed(() => this.vm.seq().length > 0);

  protected readonly hits = computed<Hit[]>(() => {
    const r = this.s.result();
    if (!r) return [];
    const distance = this.vm.cost().distance;
    return r.hits.map((h) => ({
      key: h.build.parts.join('-'),
      parts: h.build.parts.map(partLabel).join(' '),
      weight: h.stats.weight,
      stats: [
        { label: '探索', value: h.stats.surveillance },
        { label: '收集', value: h.stats.retrieval },
        { label: '巡航', value: h.stats.speed },
        { label: '距離', value: h.stats.range },
        { label: '恩惠', value: h.stats.favor },
      ],
      time: distance > 0 ? formatTravel(travelMinutes(distance, h.stats.speed)) : null,
      raw: h,
    }));
  });
  protected readonly visible = computed(() => this.hits().slice(0, this.shown()));

  protected num(ev: Event): number {
    return Number((ev.target as HTMLInputElement).value);
  }
  protected onMin(key: MinKey, ev: Event): void {
    this.s.setMin(key, this.num(ev));
    (ev.target as HTMLInputElement).value = String(this.s.mins()[key]);
  }
  protected onWeight(ev: Event): void {
    const el = ev.target as HTMLInputElement;
    this.s.setWeightLimit(el.value.trim() === '' ? null : Number(el.value));
    el.value = this.s.weightLimit() === null ? '' : String(this.s.weightLimit());
  }

  protected search(): void {
    this.shown.set(PAGE);
    this.s.run();
  }

  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }

  protected apply(h: Hit): void {
    this.vm.applyParts(h.raw.build.parts as [number, number, number, number]);
    this.edit.emit();
  }

  protected async save(h: Hit): Promise<void> {
    this.vm.applyParts(h.raw.build.parts as [number, number, number, number]);
    if (this.vm.isFull()) {
      this.toast.show('已滿 10 組,請在配置頁選一組覆蓋', { tone: 'warn' });
      this.edit.emit();
      return;
    }
    this.busyKey.set(h.key);
    try {
      const sub = await this.vm.saveCurrent(`Lv${this.vm.level()} ${h.parts.split(' ').join('/')}`);
      this.toast.show(`已儲存「${sub.name}」`);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 409) {
        await this.vm.refresh();
        this.toast.show('已滿 10 組,請在配置頁選一組覆蓋', { tone: 'warn' });
        this.edit.emit();
      } else this.toast.show('儲存失敗,可能沒有網路,稍後再試', { tone: 'warn' });
    } finally {
      this.busyKey.set(null);
    }
  }
}
