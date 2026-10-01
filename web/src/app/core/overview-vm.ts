import { Injectable, computed, inject, signal } from '@angular/core';
import type { WorkshopDto, WorkshopWithSubmarines } from '@eranaut/shared';
import { DataStore } from './data-store';
import { circled, displayFor, isReady, type SubDisplay } from './format';

/** 總覽上的一艘潛艇(已算好顯示用的字串與排序鍵) */
export interface OverviewItem {
  id: string;
  workshop: WorkshopWithSubmarines;
  position: number;
  name: string;
  ready: boolean;
  etaMs: number | null;
  display: SubDisplay;
}

/** 「伺服器 · 代表角色」(有設定的才顯示,D-99) */
export function wsMeta(w: Pick<WorkshopDto, 'server' | 'captain'>): string {
  const parts: string[] = [];
  if (w.server) parts.push(w.server);
  if (w.captain) parts.push(w.captain);
  return parts.length ? ' · ' + parts.join(' · ') : '';
}

/** 地址一行字:住宅區 · N 區 · 細節(D-53:只在 hover 提示泡泡顯示,不在總覽主畫面) */
export function addressLine(w: Pick<WorkshopDto, 'address_district' | 'address_ward' | 'address_detail'>): string {
  const parts: string[] = [];
  if (w.address_district) parts.push(w.address_district);
  if (w.address_ward !== null) parts.push(`${w.address_ward} 區`);
  let line = parts.join(' · ');
  if (w.address_detail) line += (line ? ' · ' : '') + w.address_detail;
  return line || '尚未設定地址';
}

/**
 * 總覽的畫面狀態與衍生資料:工坊切換(含「全部」)、依返航時間排序(D-121)、統計。
 * 手機與桌機兩種版面共用,所以放在 service,切換版面時不會丟失目前選的工坊。
 */
@Injectable({ providedIn: 'root' })
export class OverviewVm {
  private readonly store = inject(DataStore);

  private readonly requestedIndex = signal(0);

  readonly pagerLabels = computed(() => ['全部', ...this.store.workshops().map((w) => w.name)]);
  /** 0 = 全部;工坊被刪除導致超出範圍時退回「全部」 */
  readonly index = computed(() => (this.requestedIndex() <= this.store.workshops().length ? this.requestedIndex() : 0));
  readonly currentWorkshop = computed(() => (this.index() === 0 ? null : (this.store.workshops()[this.index() - 1] ?? null)));

  /** 全部潛艇,待收艇排最前,其餘依預計返航時間由近到遠;同時間維持工坊與位置順序(穩定排序) */
  readonly sortedAll = computed<OverviewItem[]>(() => {
    const now = this.store.now();
    const items: OverviewItem[] = [];
    for (const w of this.store.workshops()) {
      for (const s of w.submarines) {
        const ready = isReady(s, now);
        const etaMs = s.expected_return_at === null ? null : Date.parse(s.expected_return_at);
        items.push({
          id: s.id,
          workshop: w,
          position: s.position,
          name: s.name ?? `潛水艇 ${circled(s.position)}`,
          ready,
          etaMs,
          display: displayFor(ready, etaMs, now),
        });
      }
    }
    const key = (i: OverviewItem): number => (i.ready ? 0 : (i.etaMs ?? Number.MAX_SAFE_INTEGER));
    return items.map((item, i) => ({ item, i })).sort((a, b) => key(a.item) - key(b.item) || a.i - b.i).map((x) => x.item);
  });

  readonly items = computed(() => {
    const cur = this.currentWorkshop();
    return cur === null ? this.sortedAll() : this.sortedAll().filter((i) => i.workshop.id === cur.id);
  });

  readonly stats = computed(() => ({
    workshops: this.store.workshops().length,
    submarines: this.store.submarineCount(),
    ready: this.store.readyCount(),
  }));

  /** 「最快返航」:排序後第一筆(D-121) */
  readonly fastest = computed(() => this.sortedAll()[0] ?? null);

  prev(): void {
    const n = this.pagerLabels().length;
    this.requestedIndex.set((this.index() - 1 + n) % n);
  }
  next(): void {
    this.requestedIndex.set((this.index() + 1) % this.pagerLabels().length);
  }
}
