import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  nextVoyagesDone,
  repairMaterialsForSig,
  upkeepLimitFor,
  upkeepOptionsFor,
  upkeepPartsLabel,
  upkeepPartsSig,
  upkeepPhase,
} from '../src/upkeep.js';

const p3124 = { hull: 3, stern: 1, bow: 2, bridge: 4 };

test('3124 在溺沒海 O→J 最多 6 趟(船尾鯊魚級最先壞),其餘零件 7 趟', () => {
  assert.equal(upkeepLimitFor(p3124, '1:OJ'), 6);
  assert.equal(upkeepLimitFor({ hull: 2, stern: 2, bow: 3, bridge: 4 }, '1:OJ'), 7);
  assert.equal(upkeepLimitFor({ hull: 6, stern: 10, bow: 7, bridge: 8 }, '1:OJ'), 7);
});

test('資料集沒有的路線或零件回 null,選項列表為空', () => {
  assert.equal(upkeepLimitFor(p3124, '9:ZZ'), null);
  assert.equal(upkeepLimitFor({ ...p3124, hull: 11 }, '1:OJ'), null);
  assert.deepEqual(upkeepOptionsFor(p3124).map((o) => [o.route.key, o.limit]), [['1:OJ', 6]]);
});

test('零件簽名與顯示代碼', () => {
  assert.equal(upkeepPartsSig(p3124), '3,1,2,4');
  assert.equal(upkeepPartsLabel('3,1,2,4'), '3124');
  assert.equal(upkeepPartsLabel('3,1,2,10'), '3,1,2,10');
});

test('修理材料:原版 1~5 級 = 1~5,改造一律 6;3124 = 10', () => {
  assert.equal(repairMaterialsForSig('3,1,2,4'), 10);
  assert.equal(repairMaterialsForSig('6,7,8,10'), 24);
  assert.equal(repairMaterialsForSig('3,1,2'), null);
  assert.equal(repairMaterialsForSig('3,1,2,x'), null);
});

test('維修階段', () => {
  assert.equal(upkeepPhase(5, 6, true), 'ok');
  assert.equal(upkeepPhase(6, 6, false), 'repair_after_return');
  assert.equal(upkeepPhase(6, 6, true), 'repair_now');
});

const now = new Date('2026-10-26T10:00:00Z');
const returned = { status: 'complete' as const, expected_return_at: null };
const exploringFuture = { status: 'exploring' as const, expected_return_at: '2026-10-26T12:00:00Z' };
const exploringPast = { status: 'exploring' as const, expected_return_at: '2026-10-26T09:00:00Z' };

test('計次:上一筆已返航才 +1', () => {
  assert.deepEqual(nextVoyagesDone(2, 6, returned, { status: 'exploring' }, now), { voyages_done: 3, repaired: false });
  assert.deepEqual(nextVoyagesDone(2, 6, exploringPast, { status: 'exploring' }, now), { voyages_done: 3, repaired: false });
});

test('計次:探索還沒回來就重送不算,送出探索完成也不算', () => {
  assert.deepEqual(nextVoyagesDone(2, 6, exploringFuture, { status: 'exploring' }, now), { voyages_done: 2, repaired: false });
  assert.deepEqual(nextVoyagesDone(2, 6, exploringFuture, { status: 'complete' }, now), { voyages_done: 2, repaired: false });
  assert.deepEqual(nextVoyagesDone(2, 6, returned, { status: 'complete' }, now), { voyages_done: 2, repaired: false });
});

test('計次:已用盡、返航後再出航視為已維修,重設為第 1 趟', () => {
  assert.deepEqual(nextVoyagesDone(6, 6, returned, { status: 'exploring' }, now), { voyages_done: 1, repaired: true });
  assert.deepEqual(nextVoyagesDone(6, 6, exploringFuture, { status: 'exploring' }, now), { voyages_done: 6, repaired: false });
});
