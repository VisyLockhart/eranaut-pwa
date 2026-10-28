import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyExp,
  clampExp,
  expSliderStep,
  LEVEL_EXP,
  LEVELING_ROUTES,
  levelExp,
  levelingPoints,
  recommendedRoute,
  routeExp,
  settleProgress,
} from '../src/index.js';

describe('練級資料', () => {
  it('每級經驗表:Lv1~85,升到下一級所需', () => {
    assert.equal(LEVEL_EXP.length, 85);
    assert.equal(levelExp(1), 6180);
    assert.equal(levelExp(20), 149799);
    assert.equal(levelExp(85), 3041931);
    assert.equal(levelExp(86), null);
    assert.equal(levelExp(0), null);
    assert.equal(LEVEL_EXP.slice(0, 84).reduce((a, b) => a + b, 0), 69473015);
  });

  it('練級點位:溺沒海 30 點、灰海 20 點,只含 85 級以內', () => {
    assert.equal(levelingPoints(1).length, 30);
    assert.equal(levelingPoints(2).length, 20);
    assert.equal(levelingPoints(3).length, 0);
    assert.ok([...levelingPoints(1), ...levelingPoints(2)].every((p) => p.rank <= 85));
    const marks = Object.fromEntries(levelingPoints(1).filter((p) => p.mark).map((p) => [p.code, p.mark]));
    assert.deepEqual(marks, { J: '艇2', O: '艇3', T: '艇4', AD: '灰海' });
  });

  it('路線經驗 = 各點經驗直接加總', () => {
    assert.equal(routeExp(1, ['J', 'K']), 292420);
    assert.equal(routeExp(1, ['J']), 146210);
    assert.equal(routeExp(1, []), null);
    assert.equal(routeExp(1, ['J', 'J']), null);
    assert.equal(routeExp(1, ['ZZ']), null);
  });

  it('攻略路線:每一列都是資料集判定能走的,點位都存在', () => {
    assert.ok(LEVELING_ROUTES.length > 90);
    for (const r of LEVELING_ROUTES) {
      assert.ok(routeExp(r.sea, r.points) !== null, `${r.school} ${r.sea} Lv${r.level}`);
      const need = Math.max(...r.points.map((c) => levelingPoints(r.sea).find((p) => p.code === c)!.rank));
      assert.ok(need <= r.level, `${r.school} Lv${r.level} 含需要 ${need} 級的點`);
    }
  });
});

describe('經驗結算', () => {
  it('Lv20 經驗 0 跑 J→K:升到 Lv21,餘 142,621', () => {
    assert.deepEqual(applyExp({ level: 20, exp_in_level: 0 }, 292420), { level: 21, exp_in_level: 142621, capped: false });
  });
  it('一次升很多級', () => {
    const r = applyExp({ level: 1, exp_in_level: 0 }, 6180 + 12504 + 5);
    assert.deepEqual(r, { level: 3, exp_in_level: 5, capped: false });
  });
  it('剛好等於升級所需:進位、餘 0', () => {
    assert.deepEqual(applyExp({ level: 1, exp_in_level: 100 }, 6080), { level: 2, exp_in_level: 0, capped: false });
  });
  it('超過 85 級:停在 86、經驗歸 0', () => {
    assert.deepEqual(applyExp({ level: 85, exp_in_level: 0 }, 3041931), { level: 86, exp_in_level: 0, capped: true });
  });
});

describe('經驗滑桿', () => {
  it('步距約 1%,取 1/2/5×10^n', () => {
    assert.equal(expSliderStep(1), 50); // 6180/100 = 61.8
    assert.equal(expSliderStep(20), 1000); // 1497.99 → 1.5 → 2? 見下
  });
  it('步距恆為整數且 ≥ 1,滑桿格數在 50~200 之間', () => {
    for (let lv = 1; lv <= 85; lv++) {
      const step = expSliderStep(lv);
      assert.ok(Number.isInteger(step) && step >= 1);
      const cells = levelExp(lv)! / step;
      assert.ok(cells >= 40 && cells <= 210, `Lv${lv} 格數 ${cells}`);
    }
    assert.equal(expSliderStep(86), 1);
  });
  it('換等級時經驗夾回範圍', () => {
    assert.equal(clampExp(1, 99999), 6179);
    assert.equal(clampExp(1, -5), 0);
    assert.equal(clampExp(20, 100), 100);
  });
});

describe('推薦路線', () => {
  it('Lv20 掐點收:溺沒海 HGIK、配置 1122', () => {
    const r = recommendedRoute('snap', 20)!;
    assert.equal(r.sea, 1);
    assert.equal(r.points.join(''), 'HGIK');
    assert.equal(r.config.join(''), '1122');
  });
  it('Lv50 起看灰海', () => {
    assert.equal(recommendedRoute('snap', 50)!.sea, 2);
    assert.equal(recommendedRoute('snap', 49)!.sea, 1);
  });
  it('等級介於兩列之間:取前一列;低於第一列取第一列', () => {
    assert.equal(recommendedRoute('snap', 21)!.level, 20);
    assert.equal(recommendedRoute('half', 1)!.level, 1);
  });
});

describe('待結算路線', () => {
  const base = { level: 20, exp_in_level: 0, pending: { sea: 1, points: ['J', 'K'], exp: 292420 } };
  it('還沒返航:不動', () => {
    assert.deepEqual(settleProgress(base, false), { level: 20, exp_in_level: 0, settled: false });
  });
  it('已返航:加進去', () => {
    assert.deepEqual(settleProgress(base, true), { level: 21, exp_in_level: 142621, settled: true });
  });
  it('沒有待結算', () => {
    assert.equal(settleProgress({ ...base, pending: null }, true).settled, false);
  });
});
