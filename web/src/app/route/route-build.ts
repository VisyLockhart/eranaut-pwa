import { CdkTrapFocus } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Layout } from '../core/layout';
import { Toast } from '../core/toast';
import { IconComponent } from '../ui/icon';
import { partLabel } from './core/build';
import { SEA_INDEXES } from './core/data';
import type { BuildGoal, BuildHit } from './core/buildfind';
import { judgeBuild, routeNeed, type BuildJudgement } from './core/need';
import { formatTravel, offReason } from './route-format';
import { MIN_KEYS, RouteBuildVm, type MinKey } from './route-build-vm';
import { RouteMap } from './route-map';
import { RouteSeaPager } from './route-sea-pager';
import { sameBuild } from './route-state';
import { RouteVm } from './route-vm';

const PAGE = 20;

const GOALS: readonly { id: BuildGoal; label: string; title: string }[] = [
  { id: 'collect', label: '收集', title: '收集:同一個地點撈到最大量' },
  { id: 'favor', label: '恩惠', title: '恩惠:同一個地點有機會再撈一次' },
  { id: 'speed', label: '速度', title: '速度:最短時間收艇' },
  { id: 'custom', label: '自訂', title: '自訂:自己填最低性能' },
];

interface Light { label: string; grade: string; text: string }

interface HitCard {
  key: string;
  parts: string;
  weight: number;
  stats: { label: string; value: number }[];
  /** 沒選航點時為 null */
  lights: Light[] | null;
  time: string | null;
  shortfall: number;
  saved: boolean;
  raw: BuildHit;
}

/**
 * 找配置(D-223):配置頁內的子畫面,取代原本推薦頁的收集 / 恩惠 / 速度與「進階」。
 * 上面是目標切換與海圖選航點,旁邊(桌機)是條件,按「找配置」才計算;結果可帶入配置(回配置列表)或加入儲存(留在結果頁)。
 */
@Component({
  selector: 'app-route-build',
  imports: [NgTemplateOutlet, CdkTrapFocus, IconComponent, RouteMap, RouteSeaPager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-build.html',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
})
export class RouteBuild {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(RouteVm);
  protected readonly b = inject(RouteBuildVm);
  private readonly toast = inject(Toast);

  protected readonly goals = GOALS;
  protected readonly minKeys = MIN_KEYS;
  protected readonly shown = signal(PAGE);
  protected readonly hint = signal('');
  protected readonly busyKey = signal<string | null>(null);
  protected downOnOverlay = false;

  protected readonly picked = computed(() => {
    const si = this.b.seaIdx();
    return this.b.ids().map((id) => `${si.byId.get(id)!.code} ${si.byId.get(id)!.name}`);
  });
  protected readonly title = computed(() => GOALS.find((g) => g.id === this.b.goal())!.title);
  protected readonly goalName = computed(() => {
    switch (this.b.goal()) {
      case 'collect': return '收集達到最高階';
      case 'favor': return '恩惠達標';
      default: return '航行時間最短';
    }
  });
  /** 預設目標算出來的最低性能(只列有要求的項目) */
  protected readonly needRows = computed(() => {
    const m = this.b.shownMins();
    if (!m || this.b.goal() === 'custom') return null;
    const rows = MIN_KEYS.filter((k) => m[k.key] > 0).map((k) => ({ label: k.label, value: m[k.key] }));
    return rows.length > 0 ? rows : null;
  });
  /** 目前配置離這個目標差多少(沒選航點時不顯示) */
  protected readonly baseline = computed(() => {
    const n = this.b.need();
    return n ? this.lights(judgeBuild(this.vm.stats(), n)) : null;
  });

  protected readonly cards = computed<HitCard[]>(() => (this.b.result()?.hits ?? []).map((h) => this.card(h)));
  protected readonly visible = computed(() => this.cards().slice(0, this.shown()));
  protected readonly nearest = computed<HitCard[]>(() => (this.b.result()?.nearest ?? []).map((h) => this.card(h)));
  protected readonly searchedName = computed(() => {
    const q = this.b.searched();
    if (!q) return '';
    if (q.ids.length === 0) return '不指定航點';
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    return `${si.sea.name} ${q.ids.map((id) => si.byId.get(id)!.code).join('›')}`;
  });

  private lights(j: BuildJudgement): Light[] {
    const l = (label: string, g: { grade: string; have: number; gapToTop: number }): Light => ({ label, grade: g.grade, text: `${label} ${g.have}${g.gapToTop > 0 ? `(差 ${g.gapToTop})` : ''}` });
    return [l('探索', j.surveillance), l('收集', j.retrieval), l('距離', j.range), l('恩惠', j.favor)];
  }

  private card(h: BuildHit): HitCard {
    const q = this.b.searched()!;
    const si = SEA_INDEXES.find((s) => s.sea.sea === q.sea)!;
    return {
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
      lights: h.order.length > 0 ? this.lights(judgeBuild(h.stats, routeNeed(si, h.order))) : null,
      time: h.minutes === null ? null : formatTravel(h.minutes),
      shortfall: h.shortfall,
      saved: this.vm.saved().some((s) => sameBuild({ level: s.level, parts: [s.hull, s.stern, s.bow, s.bridge] }, h.build)),
      raw: h,
    };
  }

  protected pick(id: number): void {
    const si = this.b.seaIdx();
    const p = si.byId.get(id)!;
    const was = this.b.states().get(id);
    if (!this.b.toggle(id)) {
      this.hint.set(`${p.code} ${p.name}:${offReason(was ?? 'ok', p.rankReq)}`);
      return;
    }
    this.hint.set('');
  }
  protected setSea(sea: number): void {
    this.hint.set('');
    this.b.setSea(sea);
  }
  protected clearPicked(): void {
    this.hint.set('');
    this.b.clearPicked();
  }

  protected num(ev: Event): number {
    return Number((ev.target as HTMLInputElement).value);
  }
  protected onMin(key: MinKey, ev: Event): void {
    this.b.setMin(key, this.num(ev));
    (ev.target as HTMLInputElement).value = String(this.b.mins()[key]);
  }
  protected onWeight(ev: Event): void {
    const el = ev.target as HTMLInputElement;
    this.b.setWeightLimit(el.value.trim() === '' ? null : Number(el.value));
    el.value = this.b.weightLimit() === null ? '' : String(this.b.weightLimit());
  }

  protected search(): void {
    this.shown.set(PAGE);
    this.b.run();
    setTimeout(() => document.getElementById('rt-build-results')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 80);
  }
  protected more(): void {
    this.shown.update((n) => n + PAGE);
  }
  protected back(): void {
    this.b.open.set(false);
  }

  /** 帶入配置:套用成臨時配置,回配置列表 */
  protected apply(c: HitCard): void {
    this.vm.applyParts(c.raw.build.parts as [number, number, number, number]);
    this.b.open.set(false);
    this.vm.setTab('config');
    this.toast.show('已帶入成臨時配置');
  }

  /** 加入儲存:存完留在結果頁(已滿 10 組時回配置頁選一組覆蓋) */
  protected async save(c: HitCard): Promise<void> {
    const parts = c.raw.build.parts as [number, number, number, number];
    const overwrite = (): void => {
      this.toast.show('已滿 10 組,請在配置頁選一組覆蓋', { tone: 'warn' });
      this.b.open.set(false);
      this.vm.setTab('config');
    };
    this.vm.applyParts(parts);
    if (this.vm.isFull()) return overwrite();
    this.busyKey.set(c.key);
    try {
      const sub = await this.vm.saveCurrent(`Lv${this.vm.level()} ${c.parts.split(' ').join('/')}`);
      this.toast.show(`已儲存「${sub.name}」`);
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 409) {
        await this.vm.refresh();
        overwrite();
      } else this.toast.show('儲存失敗,可能沒有網路,稍後再試', { tone: 'warn' });
    } finally {
      this.busyKey.set(null);
    }
  }

  protected closeHelp(): void {
    this.b.help.set(false);
  }
  protected overlayDown(event: Event): void {
    this.downOnOverlay = event.target === event.currentTarget;
  }
  protected overlayClick(event: Event): void {
    if (this.downOnOverlay && event.target === event.currentTarget) this.closeHelp();
    this.downOnOverlay = false;
  }
  protected onEscape(event: Event): void {
    if (event.defaultPrevented || !this.b.help()) return;
    this.closeHelp();
    event.preventDefault();
  }
}

