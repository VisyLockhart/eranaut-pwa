import { Injectable } from '@angular/core';
import type { NotifyPrefs, WorkshopWithSubmarines } from '@eranaut/shared';
import { removeKey } from '../core/storage';
import { ORDER_KEY } from '../core/workshop-order';
import { seedWorkshops } from './demo-data';

const KEY = 'eranaut.demo';

interface DemoState {
  signedIn: boolean;
  workshops: WorkshopWithSubmarines[];
  prefs: NotifyPrefs;
}

function fresh(): DemoState {
  return { signedIn: true, workshops: seedWorkshops(Date.now()), prefs: { dm: true, channel: false, push: false } };
}

/** 展示資料的存放處:記憶體 + localStorage(重新整理後保留;無法使用 localStorage 時退回只在記憶體) */
@Injectable()
export class DemoStore {
  private state: DemoState = this.load();

  private load(): DemoState {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DemoState>;
        if (Array.isArray(parsed.workshops) && parsed.prefs && typeof parsed.signedIn === 'boolean') return parsed as DemoState;
      }
    } catch {
      // 讀不到就用全新的
    }
    return fresh();
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // 私密瀏覽等情況寫不進去:資料只留在這次載入
    }
  }

  get signedIn(): boolean {
    return this.state.signedIn;
  }
  setSignedIn(value: boolean): void {
    this.state.signedIn = value;
    this.save();
  }

  get workshops(): WorkshopWithSubmarines[] {
    return this.state.workshops;
  }
  commit(): void {
    this.save();
  }

  get prefs(): NotifyPrefs {
    return this.state.prefs;
  }

  /** 重設為全新的假資料(保留登入狀態) */
  reset(): void {
    const signedIn = this.state.signedIn;
    this.state = { ...fresh(), signedIn };
    this.save();
    // 前端自己的快取(總覽快照、工坊排序)也要清,否則重設後會先閃一下舊畫面
    removeKey('eranaut.snapshot');
    removeKey(ORDER_KEY);
  }
}
