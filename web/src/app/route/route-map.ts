import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SeaIndex, Selectability } from './core/route';
import { exploreState, type ExploreState, type UnlockGraph } from './core/unlock';
import type { SeaPoint } from './core/types';

/**
 * 圈圈與觸控判定半徑(座標系 1024 方形,手機地圖約 354px 寬 = 0.346 倍)。
 * 資料中最近的兩個航點中心只差 90,所以判定半徑最大 45(兩圈剛好相切不重疊);圈圈半徑 37 ≈ 手機 26px 直徑。
 */
export const HIT_R = 45;
export const DOT_R = 37;

interface Dot {
  p: SeaPoint;
  state: Selectability;
  order: number;
  /** 「去過哪些航點」模式才有:去過 / 現在可以去 / 還沒解鎖 */
  visit: ExploreState | null;
}

/**
 * 海域地圖(ROUTE-SIM.md §9 Main / M7):抽象海圖背景加真實座標、全部連線(RS-09、RS-11,沒選到的也畫)、
 * 出發點、已選順序徽章。反灰的點仍可點(由頁面顯示原因)。純展示元件,狀態都由外面傳入。
 */
@Component({
  selector: 'app-route-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-map.html',
})
export class RouteMap {
  readonly sea = input.required<SeaIndex>();
  readonly seq = input<readonly number[]>([]);
  readonly states = input<ReadonlyMap<number, Selectability>>(new Map());
  /**
   * 「去過哪些航點」模式(D-213):傳入去過的點與解鎖樹就切換成這個模式——
   * 去過的點打勾、現在可以去的點正常、還沒解鎖的點變暗,連線只有「兩端都去過」才亮起;不畫選取路線與順序徽章。
   */
  readonly explored = input<ReadonlySet<number> | null>(null);
  readonly graph = input<UnlockGraph | null>(null);
  readonly pick = output<number>();

  protected readonly hitR = HIT_R;
  protected readonly dotR = DOT_R;
  protected readonly home = computed(() => this.sea().sea.home);

  private readonly coords = computed(() => {
    const { home, points } = this.sea().sea;
    const m = new Map<number, { x: number; y: number }>([[home.id, home]]);
    for (const p of points) m.set(p.id, p);
    return m;
  });

  /** 全部連線,包含沒被選到的(RS-09) */
  protected readonly links = computed(() => {
    const c = this.coords();
    const out: { key: string; x1: number; y1: number; x2: number; y2: number; lit: boolean }[] = [];
    for (const [a, b] of this.sea().sea.links) {
      const pa = c.get(a);
      const pb = c.get(b);
      if (pa && pb) out.push({ key: `${a}-${b}`, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y, lit: this.isLit(a, b) });
    }
    return out;
  });

  /** 已選路線:出發點 → 依序各點 */
  protected readonly path = computed(() => {
    const seq = this.seq();
    if (seq.length === 0) return '';
    const c = this.coords();
    const pts = [this.sea().sea.home.id, ...seq].map((id) => c.get(id)).filter((p) => p !== undefined);
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  });

  protected readonly dots = computed<Dot[]>(() => {
    const seq = this.seq();
    const states = this.states();
    const ex = this.explored();
    const g = this.graph();
    const dots = this.sea().sea.points.map((p) => ({
      p,
      state: states.get(p.id) ?? 'ok',
      order: seq.indexOf(p.id) + 1,
      visit: ex && g ? exploreState(g, ex, p.id) : null,
    }));
    // 已選的畫在最上面,徽章不被別的點蓋住
    return dots.sort((a, b) => Number(a.order > 0) - Number(b.order > 0));
  });

  private isLit(a: number, b: number): boolean {
    const ex = this.explored();
    if (!ex) return false;
    // 出發點到根的連線:根去過就亮
    const home = this.sea().sea.home.id;
    return (a === home || ex.has(a)) && ex.has(b);
  }

  protected label(d: Dot): string {
    const base = `${d.p.code} ${d.p.name}`;
    if (d.visit) {
      switch (d.visit) {
        case 'done': return `${base},去過了,點一下取消(後面的點也會一起取消)`;
        case 'open': return `${base},還沒去過,前面的點已去過所以有機會解鎖(不一定),點一下標記為去過`;
        case 'locked': return `${base},尚未解鎖,點一下會一起標記前面的航點為去過`;
      }
    }
    switch (d.state) {
      case 'selected': return `${base},已選第 ${d.order} 個,點一下取消`;
      case 'ok': return `${base},點一下加入路線`;
      case 'full': return `${base},已選滿 5 個航點`;
      case 'rank': return `${base},潛艇等級不足(需要 ${d.p.rankReq} 級)`;
      case 'range': return `${base},超過潛艇的航行距離上限`;
    }
  }

  protected activate(d: Dot): void {
    this.pick.emit(d.p.id);
  }
}
