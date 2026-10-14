import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ITEMS } from './core/data';
import { lootTiers, orderedTiers, type TierKey } from './core/need';
import type { SeaPoint } from './core/types';

interface Tier {
  key: TierKey;
  label: string;
  locked: boolean;
  gap: number;
  names: string[];
}

const itemName = (id: number): string => ITEMS[String(id)]?.name ?? `物品 ${id}`;

/**
 * 單一航點的打撈物(RS-14、D-263):依 高 / 中 / 低 列出物品,探索值不足的階層排最後、變暗,標籤旁有鎖頭、右側標「差 N」。
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

  /** 高 → 中 → 低,未解鎖的排最後(D-263) */
  protected readonly tiers = computed<Tier[]>(() =>
    orderedTiers(lootTiers(this.point(), this.surveillance())).map((t) => ({ key: t.key, label: t.label, locked: t.locked, gap: t.gap, names: t.ids.map(itemName) })),
  );
}
