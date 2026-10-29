import type { ProgressDto, SubmarineDto } from '@eranaut/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { allowedCodes, calcRoute, clearCalcMemo, guideFor, matchByTime, modeFor, nextStart, suggest, suggestLevel, suggestTiers, unlockTarget, type Parts } from './dispatch';
import { lvUp } from './leveling-vm';
import { dispatchInfo, resolveRoute, selKey } from './dispatch-vm';
import { planRoute, statsFor } from './leveling-vm';

const NOW = Date.parse('2026-10-28T04:00:00Z');
const progress = (over: Partial<ProgressDto> = {}): ProgressDto => ({
  level: 40,
  exp_in_level: 120_000,
  source: 'manual',
  assist_on: true,
  assist_mode: 'level',
  max_hours: null,
  filter_id: null,
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
    expect(s).toMatchObject({ level: 42, exp: 23_216, fromLevel: 40, returned: false });
    expect(s.returnAt).toBe(Date.parse('2026-10-28T06:15:00Z'));
  });

  it('已返航(探索完成或時間已過)= 現在就能派', () => {
    expect(nextStart(sub({ status: 'complete', expected_return_at: null, progress: progress() }), NOW)).toMatchObject({ level: 40, returned: true, returnAt: null });
    expect(nextStart(sub({ expected_return_at: '2026-10-28T03:59:00Z', progress: progress() }), NOW)!.returned).toBe(true);
  });

  it('沒開航線輔助或沒填等級:沒有建議', () => {
    expect(nextStart(sub(), NOW)).toBeNull();
    expect(nextStart(sub({ progress: progress({ assist_on: false }) }), NOW)).toBeNull();
  });

  it('超過 85 級(D-298):照樣有出發狀態,沒有攻略可參考,改由系統推算', () => {
    expect(nextStart(sub({ progress: progress({ level: 90, exp_in_level: 0 }) }), NOW)!.level).toBe(90);
    const parts: Parts = [3, 1, 2, 3];
    expect(guideFor(null, 90, parts)).toBeUndefined();
    const s = suggest(null, 90, 0, parts)!;
    expect(s.source).toBe('calc');
    expect(s.plan.problem).toBeNull();
    expect(s.after).toBe(90);
  });

  it('面板切到某個模式時暫時以它為準;否則用各艇自己的設定', () => {
    const s = sub({ progress: progress({ assist_mode: 'combo' }) });
    expect(modeFor(s, 'pref')).toBe('combo');
    expect(modeFor(s, 'level')).toBe('level');
    expect(modeFor(sub({ progress: progress() }), 'pref')).toBe('level');
  });
});

describe('派出建議:攻略路線與資料集推算', () => {
  beforeEach(() => clearCalcMemo());

  it('不限:走得了「掐點收」攻略就照攻略', () => {
    const s = suggest(null, 42, 23_216, [3, 1, 1, 3])!;
    expect(s.source).toBe('guide');
    expect(s.plan.points).toEqual(['I', 'P', 'Q']);
    expect(s.after).toBe(43);
    expect(s.maxHours).toBeNull();
  });

  it('有上限:三個流派的攻略裡,配置跑得動、時間在上限內、經驗最多的一條', () => {
    const parts: Parts = [1, 1, 2, 3];
    const g = guideFor(36, 30, parts)!;
    const plan = planRoute(g.sea, g.points, parts, 30)!;
    expect(plan.problem).toBeNull();
    expect(plan.minutes!).toBeLessThanOrEqual(36 * 60);
    // 36 小時內只有掐點與半日兩條放得下,挑經驗多的一條
    expect(plan.exp).toBeGreaterThan(0);
  });

  it('配置走不了攻略路線(距離不足):改由資料集推算,且推算結果走得了、在時間上限內', () => {
    const parts: Parts = [1, 1, 1, 1];
    const guide = planRoute(1, ['G', 'I', 'K', 'L'], parts, 24)!;
    expect(guide.problem).toBe('range');
    const s = suggest(null, 24, 0, parts)!;
    expect(s.source).toBe('calc');
    expect(s.plan.problem).toBeNull();
    expect(s.plan.range!).toBeLessThanOrEqual(statsFor(parts, 24).range);
    const allow = allowedCodes(1, 24);
    expect(s.plan.points.every((c) => allow.has(c))).toBe(true);
  });

  it('只用到這個等級為止攻略出現過的點', () => {
    const a = allowedCodes(1, 10);
    expect([...a].sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(allowedCodes(2, 50).has('A')).toBe(true);
    expect(allowedCodes(2, 50).has('K')).toBe(false);
  });

  it('有上限時找到的路線不超過上限,上限越長經驗不會越少', () => {
    const parts: Parts = [1, 1, 1, 1];
    const a = planRoute(1, calcRoute(1, 20, parts, 24)!, parts, 20)!;
    const b = planRoute(1, calcRoute(1, 20, parts, 48)!, parts, 20)!;
    expect(a.minutes!).toBeLessThanOrEqual(24 * 60);
    expect(b.minutes!).toBeLessThanOrEqual(48 * 60);
    expect(b.exp).toBeGreaterThanOrEqual(a.exp);
  });

  it('不限取每分鐘經驗最高', () => {
    const parts: Parts = [1, 1, 2, 3];
    const free = planRoute(1, calcRoute(1, 44, parts, null)!, parts, 44)!;
    const guide = planRoute(1, ['U', 'S', 'P', 'Q'], parts, 44)!;
    expect(free.exp / free.minutes!).toBeGreaterThanOrEqual(guide.exp / guide.minutes! - 1e-9);
  });

  it('上限內沒有路線:依序放寬到更長的上限,並標出放寬到幾小時', () => {
    // 資料集的航行時間至少 12 小時;Lv1 配置 1111 的 12 小時內很可能找不到
    const s = suggestLevel(12, 1, 0, [1, 1, 1, 1])!;
    expect(s).not.toBeNull();
    if (s.relaxedTo !== null) {
      expect(s.relaxedTo).toBeGreaterThan(12);
      expect(s.plan.minutes!).toBeLessThanOrEqual(s.relaxedTo * 60);
    } else expect(s.plan.minutes!).toBeLessThanOrEqual(12 * 60);
    expect(suggestLevel(null, 42, 0, [3, 1, 1, 3])!.relaxedTo).toBeNull();
  });

  it('各最長航行時間並排:每一檔都在自己的上限內', () => {
    const list = suggestTiers(42, 0, [3, 1, 1, 3]);
    expect(list.length).toBeGreaterThan(1);
    for (const s of list) if (s.maxHours !== null) expect(s.plan.minutes!).toBeLessThanOrEqual(s.maxHours * 60);
  });

  it('推算夠快(最壞情況:溺沒海快 50 級、強配置、不限)且結果會記住', () => {
    const parts: Parts = [4, 4, 4, 4];
    const t0 = performance.now();
    const a = calcRoute(1, 49, parts, null);
    const t1 = performance.now();
    const b = calcRoute(1, 49, parts, null);
    const t2 = performance.now();
    expect(a).not.toBeNull();
    expect(b).toBe(a);
    expect(t1 - t0).toBeLessThan(500);
    expect(t2 - t1).toBeLessThan(5);
  });
});

describe('派出建議:選項與預設', () => {
  beforeEach(() => clearCalcMemo());

  it('航線輔助推薦 + 跟上一趟一樣;同一條路線標出與誰相同', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, last_route: { sea: 1, points: ['I', 'P', 'Q'] } }) });
    const info = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW)!;
    expect(info.options.map((o) => o.key)).toEqual(['assist', 'last']);
    expect(info.options[0]!.label).toBe('練級・不限');
    expect(info.options[1]!.sameAs).toBe('練級・不限');
    expect(info.current!.key).toBe('assist');
    expect(selKey(undefined, info)).toBe('assist');
    expect(info.lock).toBeNull();
  });

  it('沒有配置:鎖住(不給建議),不會記路線', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 42, exp_in_level: 0 }) }), null, 'pref', NOW)!;
    expect(info.lock).toBe('build');
    expect(info.options).toEqual([]);
    expect(info.current).toBeNull();
    expect(resolveRoute(info, undefined)).toBeNull();
  });

  it('練級的最長航行時間跟著各艇設定走', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, max_hours: 48 }) });
    const info = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW)!;
    expect(info.maxHours).toBe(48);
    expect(info.current!.label).toBe('練級・48h');
    expect(info.current!.plan.minutes!).toBeLessThanOrEqual(48 * 60);
  });

  it('條件組合:清單還沒載入 → 先顯示練級推薦並標示載入中;沒選條件或被刪除 → 標示 missing', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, assist_mode: 'combo', filter_id: 'f1' }) });
    const loading = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW, { filters: { saved: [], loaded: false } })!;
    expect(loading.combo!.state).toBe('loading');
    expect(loading.current!.fallback).toBeTruthy();
    const missing = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW, { filters: { saved: [], loaded: true } })!;
    expect(missing.combo!.state).toBe('missing');
    expect(missing.current!.label).toBe('練級・不限');
  });

  it('條件組合:取第 1 名;找不到時說明原因並改用練級推薦', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, assist_mode: 'combo', filter_id: 'f1' }) });
    const spec = { v: 2 as const, sea: 'all' as const, max_hours: null as number | null, sort: ['perMin' as const], required: [], excluded: [], item_ids: [], match: 'all' as const };
    const f = (over: Partial<typeof spec> = {}) => ({ id: 'f1', name: '快速', spec: { ...spec, ...over }, favorite: false, created_at: '', updated_at: '' });
    const ok = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW, { filters: { saved: [f()], loaded: true } })!;
    expect(ok.combo).toEqual({ name: '快速', state: 'ok' });
    expect(ok.current!.label).toBe('條件組合・快速');
    expect(ok.current!.plan.problem).toBeNull();
    // 12 小時內剛好是下限,配置 3113 在 Lv42 的路線都超過 → 沒有結果
    const none = dispatchInfo(s, [3, 1, 1, 3], 'pref', NOW, { filters: { saved: [f({ max_hours: 6 })], loaded: true } })!;
    expect(none.combo!.state).toBe('none');
    expect(none.combo!.reason).toBeTruthy();
    expect(none.current!.label).toBe('練級・不限');
    expect(none.current!.fallback).toBe(none.combo!.reason);
  });

  it('面板檢視換模式 → 預設跟著換(各艇設定不變)', () => {
    const s = sub({ progress: progress({ level: 42, exp_in_level: 0, assist_mode: 'combo', filter_id: null }) });
    const info = dispatchInfo(s, [3, 1, 1, 3], 'level', NOW)!;
    expect(info.mode).toBe('level');
    expect(info.combo).toBeNull();
    expect(info.current!.label).toBe('練級・不限');
  });

  it('不記經驗 → 沒有路線;自己選點 → 依選的點推算', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 42, exp_in_level: 0 }) }), [3, 1, 1, 3], 'pref', NOW)!;
    expect(resolveRoute(info, { kind: 'none' })).toBeNull();
    const own = resolveRoute(info, { kind: 'own', route: { sea: 1, points: ['A', 'B'] } })!;
    expect(own.plan.exp).toBe(21_220);
    expect(own.label).toBe('自己選點');
  });

  it('跨過 50 級:提示下一趟起改走灰海', () => {
    const info = dispatchInfo(sub({ progress: progress({ level: 47, exp_in_level: 210_000 }) }), [4, 1, 2, 3], 'pref', NOW)!;
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

  it('攻略沒有解鎖點:推算含 O 的路線,並標出解鎖', () => {
    const s = suggest(null, 42, 0, [3, 1, 1, 3], O)!;
    expect(s.plan.points).toContain('O');
    expect(s.plan.problem).toBeNull();
    expect(s.unlock).toBe('艇3');
    expect(s.source).toBe('calc');
  });

  it('攻略剛好包含解鎖點:直接用攻略', () => {
    // 48 小時內的攻略(整日收 Lv30)是 1123 的 I→P→O→N
    const s = suggest(48, 30, 0, [1, 1, 2, 3], O)!;
    expect(s.source).toBe('guide');
    expect(s.plan.points).toEqual(['I', 'P', 'O', 'N']);
    expect(s.unlock).toBe('艇3');
  });

  it('等級還不夠去解鎖點:照一般建議', () => {
    const s = suggest(null, 25, 0, [1, 1, 2, 2], O)!;
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
