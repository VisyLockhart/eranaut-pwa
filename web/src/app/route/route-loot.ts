import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ITEMS } from './core/data';
import { lootTiers } from './core/need';
import type { SeaPoint } from './core/types';

interface Tier {
  key: 'low' | 'mid' | 'high';
  label: string;
  locked: boolean;
  gap: number;
  names: string[];
}

const itemName = (id: number): string => ITEMS[String(id)]?.name ?? `物品 ${id}`;

/**
 * 單一航點的打撈物(RS-14):列出低 / 中 / 高三階物品;探索值不足的階層變暗、標「鎖定」與「差 N」。
 * 航點頁的已選清單點開某個航點時顯示。純展示:探索值與航點由外面傳入。
 */
@Component({
  selector: 'app-route-loot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './route-loot.html',
})
export class RouteLoot {
  readonly point = input.required<SeaPoint>();
  /** 目前配置的探索值 */
  readonly surveillance = input.required<number>();

  protected readonly tiers = computed<Tier[]>(() => {
    const t = lootTiers(this.point(), this.surveillance());
    const tier = (key: Tier['key'], label: string): Tier => ({ key, label, locked: t[key].locked, gap: t[key].gap, names: t[key].ids.map(itemName) });
    return [tier('low', '低階'), tier('mid', '中階'), tier('high', '高階')];
  });
}
