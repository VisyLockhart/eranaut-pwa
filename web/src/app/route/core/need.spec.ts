import { describe, expect, it } from 'vitest';
import { buildStats } from './build';
import { TABLES } from './data';
import { judgeBuild, lootTiers, routeNeed } from './need';
import { SEA, ids, sea } from './test-helpers';
import type { SeaPoint } from './types';

describe('路線需求與判定', () => {
  const s = sea(SEA.siren);

  it('逐站取各階門檻最大值,距離需求 = 總耗用', () => {
    const need = routeNeed(s, ids(s, 'RO'));
    const r = s.byId.get(ids(s, 'R')[0]!)!.statReq;
    const o = s.byId.get(ids(s, 'O')[0]!)!.statReq;
    expect(need.surveillanceHigh).toBe(Math.max(r.surveillanceHigh, o.surveillanceHigh));
    expect(need.retrievalOptim).toBe(Math.max(r.retrievalOptim, o.retrievalOptim));
    expect(need.favor).toBe(Math.max(r.favor, o.favor));
    expect(need.range).toBe(136);
  });

  it('空路線:門檻都是 0、耗用 0,任何配置都全綠', () => {
    const need = routeNeed(s, []);
    expect(need).toEqual({ surveillanceMid: 0, surveillanceHigh: 0, retrievalNorm: 0, retrievalOptim: 0, favor: 0, range: 0 });
    expect(judgeBuild(buildStats(TABLES, { level: 1, parts: [1, 1, 1, 1] }), need).allFull).toBe(true);
  });

  const need = { surveillanceMid: 226, surveillanceHigh: 241, retrievalNorm: 300, retrievalOptim: 320, favor: 200, range: 100 };
  const stats = (over: Partial<ReturnType<typeof buildStats>>) => ({ ...buildStats(TABLES, { level: 125, parts: [10, 10, 10, 10] }), ...over });

  it('綠 / 黃 / 紅與「差 N」(探索 230、高階 235 → 差 5)', () => {
    const j = judgeBuild(stats({ surveillance: 230 }), { ...need, surveillanceMid: 200, surveillanceHigh: 235 });
    expect(j.surveillance.grade).toBe('partial');
    expect(j.surveillance.gapToTop).toBe(5);
    expect(j.surveillance.gapToNext).toBe(5);
  });

  it('低於中階 → 紅;gapToNext 是到中階、gapToTop 是到高階', () => {
    const j = judgeBuild(stats({ surveillance: 200 }), need);
    expect(j.surveillance).toEqual({ have: 200, grade: 'none', gapToNext: 26, gapToTop: 41 });
  });

  it('恰等於門檻算達到', () => {
    const j = judgeBuild(stats({ surveillance: 241, retrieval: 320, favor: 200, range: 100 }), need);
    expect(j.surveillance.grade).toBe('full');
    expect(j.retrieval.grade).toBe('full');
    expect(j.favor.grade).toBe('full');
    expect(j.range.grade).toBe('full');
    expect(j.allFull).toBe(true);
  });

  it('收集:達 norm 未達 optim → 黃;單一門檻項(恩惠、距離)只有綠或紅', () => {
    const j = judgeBuild(stats({ surveillance: 300, retrieval: 310, favor: 199, range: 99 }), need);
    expect(j.retrieval.grade).toBe('partial');
    expect(j.retrieval.gapToTop).toBe(10);
    expect(j.favor).toEqual({ have: 199, grade: 'none', gapToNext: 1, gapToTop: 1 });
    expect(j.range.grade).toBe('none');
    expect(j.allFull).toBe(false);
    expect(j.allPass).toBe(false);
  });

  it('allPass:四項都至少達最低階', () => {
    const j = judgeBuild(stats({ surveillance: 230, retrieval: 310, favor: 200, range: 100 }), need);
    expect(j.allPass).toBe(true);
    expect(j.allFull).toBe(false);
  });
});

describe('打撈物階層', () => {
  const p = {
    statReq: { surveillanceMid: 205, surveillanceHigh: 235, retrievalNorm: 0, retrievalOptim: 0, favor: 0 },
    drop: { low: [1], mid: [2, 3], high: [4] },
  } as unknown as SeaPoint;

  it('低階無門檻;探索 230 → 中階解鎖、高階鎖住差 5', () => {
    const t = lootTiers(p, 230);
    expect(t.low).toEqual({ ids: [1], locked: false, gap: 0 });
    expect(t.mid).toEqual({ ids: [2, 3], locked: false, gap: 0 });
    expect(t.high).toEqual({ ids: [4], locked: true, gap: 5 });
  });

  it('探索不足中階 → 中、高都鎖', () => {
    const t = lootTiers(p, 100);
    expect(t.mid).toMatchObject({ locked: true, gap: 105 });
    expect(t.high).toMatchObject({ locked: true, gap: 135 });
  });

  it('剛好等於門檻就解鎖', () => {
    expect(lootTiers(p, 235).high.locked).toBe(false);
    expect(lootTiers(p, 205).mid.locked).toBe(false);
  });
});
