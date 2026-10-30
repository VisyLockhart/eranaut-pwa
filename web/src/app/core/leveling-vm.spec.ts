import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LEVELING_SCHOOLS, recommendedRoute, type ProgressDto, type SubmarineDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  changeExp,
  changeLevel,
  defaultDraft,
  middleExp,
  minutesText,
  planRoute,
  progressRequest,
  progressView,
  type QuickProgressDraft,
} from './leveling-vm';

const progress = (over: Partial<ProgressDto> = {}): ProgressDto => ({
  level: 20,
  exp_in_level: 52_000,
  source: 'manual',
  assist_on: true,
  assist_mode: 'level',
  max_hours: null,
  filter_id: null,
  pending: null,
  last_route: null,
  effective_level: 20,
  effective_exp: 52_000,
  updated_at: '2026-10-26T00:00:00Z',
  ...over,
});
const sub = (over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: 's1', workshop_id: 'w1', position: 1, name: 'A', status: 'exploring', expected_return_at: '2026-10-27T00:00:00Z', last_synced_at: '2026-10-26T00:00:00Z', ...over,
});

describe('練級輔助:快速修改的草稿', () => {
  const on: QuickProgressDraft = { enabled: true, level: 20, exp: 52_000, mode: 'level', maxHours: null, filterId: null, edited: false };

  it('沒碰 = 不帶 progress', () => {
    expect(progressRequest(null, false)).toBeUndefined();
    expect(progressRequest(null, true)).toBeUndefined();
  });

  it('關閉:有紀錄只關掉練級輔助(等級保留);沒有紀錄什麼都不送', () => {
    expect(progressRequest({ ...on, enabled: false }, true)).toEqual({ assist_on: false });
    expect(progressRequest({ ...on, enabled: false }, false)).toBeUndefined();
    // 關掉之前改過的等級照樣記下
    expect(progressRequest({ ...on, enabled: false, edited: true, level: 30, exp: 5 }, true)).toEqual({ assist_on: false, level: 30, exp_in_level: 5 });
  });

  it('開啟且沒動過數字:不送等級和經驗(不蓋掉伺服器已記的待結算路線)', () => {
    const base = { assist_on: true, assist_mode: 'level', max_hours: null, filter_id: null };
    expect(progressRequest(on, true)).toEqual(base);
    expect(progressRequest({ ...on, maxHours: 12 }, true)).toEqual({ ...base, max_hours: 12 });
    expect(progressRequest({ ...on, mode: 'combo', filterId: 'f1' }, true)).toEqual({ ...base, assist_mode: 'combo', filter_id: 'f1' });
  });

  it('動過數字、或這艘還沒有紀錄:送等級和經驗', () => {
    expect(progressRequest({ ...on, edited: true }, true)).toEqual({ assist_on: true, assist_mode: 'level', max_hours: null, filter_id: null, level: 20, exp_in_level: 52_000 });
    expect(progressRequest({ ...on, level: 1, exp: 3000 }, false)).toEqual({ assist_on: true, assist_mode: 'level', max_hours: null, filter_id: null, level: 1, exp_in_level: 3000 });
  });

  it('預設值:沒有紀錄從 1 級、經驗取中間;有紀錄沿用(含超過經驗上限時夾回)', () => {
    const d = defaultDraft(null);
    expect(d).toMatchObject({ enabled: false, level: 1, edited: false });
    expect(d.exp).toBe(middleExp(1));
    expect(defaultDraft(sub({ progress: progress({ assist_mode: 'combo', max_hours: 24, filter_id: 'f1' }) }))).toMatchObject({ level: 20, exp: 52_000, mode: 'combo', maxHours: 24, filterId: 'f1' });
  });

  it('換等級:等級限制 1~130,經驗夾回新等級的範圍;沒動過的經驗改回中間', () => {
    expect(changeLevel(on, 200).level).toBe(130);
    expect(changeLevel(on, 0).level).toBe(1);
    const lowered = changeLevel({ ...on, exp: 140_000, edited: true }, 1);
    expect(lowered.exp).toBeLessThan(6180);
    expect(changeLevel(on, 30).exp).toBe(middleExp(30));
  });

  it('改經驗:夾在 0 ~ 升級所需 - 1', () => {
    expect(changeExp(on, -5).exp).toBe(0);
    expect(changeExp(on, 10_000_000).exp).toBe(149_799 - 1);
    expect(changeExp(on, 74_900.4).exp).toBe(74_900);
  });
});

describe('總覽的等級顯示', () => {
  it('沒填等級回 null(畫面不顯示任何東西)', () => {
    expect(progressView(sub())).toBeNull();
  });

  it('有等級:徽章、經驗條百分比、返航後的推算', () => {
    const v = progressView(sub({ progress: progress({ pending: { sea: 1, points: ['J', 'K'], exp: 292_420 } }) }));
    expect(v).toMatchObject({ level: 20, exp: 52_000, need: 149_799, pct: 35, fromOcr: false, sim: true });
    expect(v?.pending).toEqual({ gain: 292_420, toLevel: 22 });
  });

  it('已返航結算過:顯示新等級,不再顯示返航後的推算', () => {
    const v = progressView(sub({ progress: progress({ pending: { sea: 1, points: ['J'], exp: 146_210 }, effective_level: 21, effective_exp: 48_000 }) }));
    expect(v?.level).toBe(21);
    expect(v?.pending).toBeNull();
  });

  it('超過 85 級:沒有經驗條(沒有每級經驗資料),航線輔助照樣開', () => {
    const v = progressView(sub({ progress: progress({ level: 87, effective_level: 87, effective_exp: 0, source: 'ocr' }) }));
    expect(v).toMatchObject({ level: 87, exp: null, need: null, pct: null, fromOcr: true, sim: true });
  });
});

describe('路線推算(以資料集)', () => {
  it('溺沒海 J→K、配置 2222、Lv 20:距離 69 / 115、返航 1日14時20分、經驗 +292,420', () => {
    const plan = planRoute(1, ['J', 'K'], [2, 2, 2, 2], 20)!;
    expect(plan).toMatchObject({ exp: 292_420, range: 69, rangeCap: 115, problem: null });
    expect(minutesText(plan.minutes!)).toBe('1日14時20分');
  });

  it('等級不夠、距離不夠會標出原因;點位不存在回 null', () => {
    expect(planRoute(1, ['T'], [2, 2, 2, 2], 20)?.problem).toBe('rank');
    expect(planRoute(1, ['A', 'B', 'C', 'D', 'E'], [1, 1, 1, 1], 20)?.problem).toBe('range');
    expect(planRoute(1, ['ZZ'], [2, 2, 2, 2], 20)).toBeNull();
    expect(planRoute(1, ['A', 'A'], [2, 2, 2, 2], 20)).toBeNull();
  });

  it('沒有配置:只算經驗', () => {
    expect(planRoute(1, ['A'], null, 1)).toMatchObject({ exp: 10_610, minutes: null, range: null });
  });

  it('每個等級、每個流派的推薦路線都能推算', () => {
    for (const level of [1, 10, 20, 44, 49, 50, 63, 85]) {
      for (const school of LEVELING_SCHOOLS) {
        const r = recommendedRoute(school, level)!;
        expect(planRoute(r.sea, r.points, null, level)!.exp).toBeGreaterThan(0);
      }
    }
  });
});
