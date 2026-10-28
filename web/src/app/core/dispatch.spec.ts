import type { ProgressDto, SubmarineDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { allowedCodes, calcRoute, clearCalcMemo, matchByTime, nextStart, schoolFor, startTier, suggest, unlockTarget, type Parts } from './dispatch';
import { lvUp } from './leveling-vm';
import { dispatchInfo, resolveRoute, selKey } from './dispatch-vm';
import { planRoute, statsFor } from './leveling-vm';

const NOW = Date.parse('2026-10-28T04:00:00Z');
const progress = (over: Partial<ProgressDto> = {}): ProgressDto => ({
  level: 40,
  exp_in_level: 120_000,
  source: 'manual',
  sim_on: true,
  school: 'snap',
  pending: null,
  last_route: null,
  effective_level: 40,
  effective_exp: 120_000,
  updated_at: '2026-10-26T00:00:00Z',
  ...over,
});
const sub = (over: Partial<SubmarineDto> = {}): SubmarineDto => ({
  id: 's1', workshop_id: 'w1', position: 1, name: 'A', status: 'exploring', expected_return_at: '2026-10-28T06:15:00Z', last_synced_at: '2026-10-26T00:00:00Z', ...over,
});

describe('派出建議:下一趟出發時的等級', () => {
  it('還在航行:加上待結算的路線經驗 = 返航後的等級', () => {
    const s = nextStart(sub({ progress: progress({ pending: { sea: 1, points: ['I', 'P', 'Q'], exp: 613_630 } }) }), NOW)!;
    expect(s).toMatchObject({ level: 42, exp: 23_216, fromLevel: 40, returned: false, over: false });
    expect(s.returnAt).toBe(Date.parse('2026-10-28T06:15:00Z'));
  });

  it('已返航(探索完成或時間已過)= 現在就能派', () => {
    expect(nextStart(sub({ status: 'complete', expected_return_at: null, progress: progress() }), NOW)).toMatchObject({ level: 40, returned: true, returnAt: null });
    expect(nextStart(sub({ expected_return_at: '2026-10-28T03:59:00Z', progress: progress() }), NOW)!.returned).toBe(true);
  });

  it('沒開練級輔助或沒填等級:沒有建議', () => {
    expect(nextStart(sub(), NOW)).toBeNull();
    expect(nextStart(sub({ progress: progress({ sim_on: false }) }), NOW)).toBeNull();
  });

  it('超過 85 級:標成 over', () => {
    expect(nextStart(sub({ progress: progress({ level: 86, exp_in_level: 0 }) }), NOW)!.over).toBe(true);
  });

  it('面板切到某個流派時暫時以它為準;沒偏好用掐點收', () => {
    const s = sub({ progress: progress({ school: 'day' }) });
    expect(schoolFor(s, 'pref')).toBe('day');
    expect(schoolFor(s, 'half')).toBe('half');
    expect(schoolFor(sub({ progress: progress({ school: null }) }), 'pref')).toBe('snap');
  });
});

describe('派出建議:攻略路線與資料集推算', () => {
  beforeEach(() => clearCalcMemo());

  it('走得了攻略路線就照攻略', () => {
    const s = suggest('snap', 42, 23_216, [3, 1, 1, 3])!;
    expect(s.source).toBe('guide');
    expect(s.plan.points).toEqual(['I', 'P', 'Q']);
    expect(s.after).toBe(43);
  });

  it('沒有綁定配置:用攻略的配置推算,並記下那組配置', () => {
    const s = suggest('day', 42, 0, null)!;
    expect(s.source).toBe('guide');
    expect(s.guideConfig).toEqual([1, 1, 2, 3]);
  });

  it('配置走不了攻略路線(距離不足):改由資料集推算,且推算結果走得了', () => {
    // 整日收 Lv40 攻略是 1123 的 U→S→P→Q;全鯊魚級(1111)距離不夠
    const parts: Parts = [1, 1, 1, 1];
    const guide = planRoute(1, ['U', 'S', 'P', 'Q'], parts, 40)!;
    expect(guide.problem).toBe('range');
    const s = suggest('day', 40, 0, parts)!;
    expect(s.source).toBe('calc');
    expect(s.plan.problem).toBeNull();
    expect(s.plan.range!).toBeLessThanOrEqual(statsFor(parts, 40).range);
    expect(s.plan.minutes!).toBeLessThanOrEqual(48 * 60);
    // 只用攻略出現過的點
    const allow = allowedCodes(1, 40);
    expect(s.plan.points.every((c) => allow.has(c))).toBe(true);
  });

  it('只用到這個等級為止攻略出現過的點', () => {
    const a = allowedCodes(1, 10);
    expect([...a].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(allowedCodes(2, 50).has('A')).toBe(true);
    expect(allowedCodes(2, 50).has('K')).toBe(false);
  });

  it('半日收先找 12 小時內,找不到才放寬到 36 小時;整日收 24 → 48', () => {
    const parts: Parts = [1, 1, 1, 1];
    const half = calcRoute(1, 20, parts, 'half')!;
    const hp = planRoute(1, half, parts, 20)!;
    expect(hp.minutes!).toBeLessThanOrEqual(36 * 60);
    expect(hp.problem).toBeNull();
    const day = calcRoute(1, 20, parts, 'day')!;
    const dp = planRoute(1, day, parts, 20)!;
    expect(dp.minutes!).toBeLessThanOrEqual(24 * 60);
    // 同時間限制下經驗最多:24h 內找到的不會比 12~36h 的半日收路線多出不合理的時間
    expect(dp.exp).toBeGreaterThan(0);
  });

  it('時間檔從攻略路線所屬的檔開始:攻略是兩天的路線就直接找 48 小時內的', () => {
    expect(startTier('day', 47 * 60)).toBe(1);
    expect(startTier('day', 20 * 60)).toBe(0);
    expect(startTier('day', null)).toBe(0);
    expect(startTier('day', 60 * 60)).toBe(1); // 超過最長的檔:用最長的
    expect(startTier('half', 33 * 60)).toBe(1);
    expect(startTier('snap', 50 * 60)).toBe(0);
    // 整日收 Lv42、3113:攻略 U→S→P→Q 是兩天路線,走不了時改推的也是 48 小時內、經驗較多的路線
    const s = suggest('day', 42, 0, [3, 1, 1, 3])!;
    expect(s.source).toBe('calc');
    expect(s.plan.minutes!).toBeGreaterThan(24 * 60);
    expect(s.plan.minutes!).toBeLessThanOrEqual(48 * 60);
    expect(s.plan.exp).toBeGreaterThan(338_330);
  });

  it('掐點收取每分鐘經驗最高', () => {
    const parts: Parts = [1, 1, 2, 3];
    const snap = planRoute(1, calcRoute(1, 44, parts, 'snap')!, parts, 44)!;
    const guide = planRoute(1, ['U', 'S', 'P', 'Q'], parts, 44)!; // 整日收的攻略路線
    expect(snap.exp / snap.minutes!).toBeGreaterThanOrEqual(guide.exp / guide.minutes! - 1e-9);
  });

  it('推算夠快(最壞情況:溺沒海快 50 級、強配置、掐點收)且結果會記住', () => {
    const parts: Parts = [4, 4, 4, 4];
    const t0 = performance.now();
    const a = calcRoute(1, 49, parts, 'snap');
    const t1 = performance.now();
    const b = calcRoute(1, 49, parts, 'snap');
    const t2 = performance.now();
    expect(a).not.toBeNull();
    expect(b).toBe(a);
    expect(t1 - t0).toBeLessThan(500);
    expect(t2 - t1).toBeLessThan(5);
  });
});

describe('派出建議:選項與預設', () => {
  beforeEach(() => clearCalcMemo());

  it('三個流派 + 跟上一趟一樣;同一條路線標出與誰相同', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, last_route: { sea: 1, points: ['I', 'P', 'Q'] } }) });
    const info = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW)!;
    expect(info.options.map((o) => o.key)).toEqual(['snap', 'half', 'day', 'last']);
    expect(info.options[0]!.pref).toBe(true);
    expect(info.options[1]!.sameAs).toBe('掐點收');
    expect(info.options[3]!.sameAs).toBe('掐點收');
    expect(info.current!.key).toBe('snap');
    expect(selKey(undefined, info)).toBe('snap');
  });

  it('面板檢視換流派 → 預設跟著換', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 42, exp_in_level: 0 }) }), null, 'day', NOW)!;
    expect(info.current!.key).toBe('day');
    expect(resolveRoute(info, undefined)!.route.points).toEqual(['U', 'S', 'P', 'Q']);
  });

  it('不記經驗 → 沒有路線;自己選點 → 依選的點推算', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 42, exp_in_level: 0 }) }), null, 'pref', NOW)!;
    expect(resolveRoute(info, { kind: 'none' })).toBeNull();
    const own = resolveRoute(info, { kind: 'own', route: { sea: 1, points: ['A', 'B'] } })!;
    expect(own.plan.exp).toBe(21_220);
    expect(own.label).toBe('自己選點');
  });

  it('跨過 50 級:提示下一趟起改走灰海', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 47, exp_in_level: 210_000 }) }), null, 'pref', NOW)!;
    expect(info.current!.after).toBe(50);
    expect(info.toGray).toBe(true);
  });
});

describe('派出建議:剩餘時間比對', () => {
  it('剛派出:剩餘時間比航行時間少 0~45 分鐘才算吻合,取最接近的', () => {
    const plans = [{ minutes: 1000 }, { minutes: 1500 }, { minutes: null }];
    expect(matchByTime(plans, 990)).toBe(0);
    expect(matchByTime(plans, 1003)).toBe(0); // 推算比遊戲短幾分鐘
    expect(matchByTime(plans, 1480)).toBe(1);
    expect(matchByTime(plans, 900)).toBe(-1);
    expect(matchByTime(plans, null)).toBe(-1);
  });
});

describe('派出建議:解鎖潛艇欄位優先(D-291 第二次調整)', () => {
  beforeEach(() => clearCalcMemo());
  let n = 0;
  const withProg = (o: Partial<ProgressDto> = {}) => {
    n += 1;
    return { id: `s${n}`, position: n, progress: progress(o) };
  };
  const ws = (...list: ReturnType<typeof withProg>[]) => {
    n = 0;
    return list;
  };

  it('工坊有幾艘 = 已解鎖幾個欄位:2 艘 → 解鎖第 3 艘的 O;1 艘 → J;3 艘 → T;滿 4 艘不用', () => {
    let subs = ws(withProg(), withProg());
    expect(unlockTarget(subs, subs[0]!)).toEqual({ code: 'O', mark: '艇3', rank: 30 });
    subs = ws(withProg());
    expect(unlockTarget(subs, subs[0]!)!.code).toBe('J');
    subs = ws(withProg(), withProg(), withProg());
    expect(unlockTarget(subs, subs[0]!)!.code).toBe('T');
    subs = ws(withProg(), withProg(), withProg(), withProg());
    expect(unlockTarget(subs, subs[0]!)).toBeNull();
  });

  it('解鎖建議只給位置最前面的潛艇-1(主力探索艇),其他艇照一般建議', () => {
    const subs = ws(withProg(), withProg());
    expect(unlockTarget(subs, subs[1]!)).toBeNull();
    // 位置 1 不在時,由位置最前面的那艘負責
    const two = [{ ...subs[1]!, position: 2 }, { id: 'x', position: 3, progress: progress() }];
    expect(unlockTarget(two, two[0]!)).not.toBeNull();
    expect(unlockTarget(two, two[1]!)).toBeNull();
  });

  it('已經有艇正在跑(或上一趟跑過)解鎖點:不再要求', () => {
    let subs = ws(withProg({ pending: { sea: 1, points: ['I', 'P', 'O', 'N'], exp: 1 } }), withProg());
    expect(unlockTarget(subs, subs[0]!)).toBeNull();
    subs = ws(withProg({ last_route: { sea: 1, points: ['O'] } }), withProg());
    expect(unlockTarget(subs, subs[0]!)).toBeNull();
    subs = ws(withProg({ last_route: { sea: 2, points: ['O'] } }), withProg());
    expect(unlockTarget(subs, subs[0]!)).not.toBeNull(); // 灰海的 O 不算
  });

  const O = { code: 'O', mark: '艇3', rank: 30 };

  it('偏好攻略沒有解鎖點:推算含 O 的路線,並標出解鎖', () => {
    const s = suggest('snap', 42, 0, [3, 1, 1, 3], O)!;
    expect(s.plan.points).toContain('O');
    expect(s.plan.problem).toBeNull();
    expect(s.unlock).toBe('艇3');
    expect(s.source).toBe('calc');
  });

  it('偏好攻略剛好包含解鎖點:直接用攻略', () => {
    // 整日收 Lv30 攻略是 1123 的 I→P→O→N
    const s = suggest('day', 30, 0, null, O)!;
    expect(s.source).toBe('guide');
    expect(s.plan.points).toEqual(['I', 'P', 'O', 'N']);
    expect(s.unlock).toBe('艇3');
  });

  it('等級還不夠去解鎖點:照一般建議', () => {
    const s = suggest('snap', 25, 0, [1, 1, 2, 2], O)!;
    expect(s.plan.points).not.toContain('O');
    expect(s.unlock).toBeNull();
  });
});

describe('抵達等級的顯示', () => {
  it('有升級才顯示「→ Lv」', () => {
    expect(lvUp(41, 41)).toBe('');
    expect(lvUp(41, 43)).toBe('→ Lv 43');
  });
});
