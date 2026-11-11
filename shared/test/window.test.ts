import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DAYS, WEEKDAYS, WEEKEND, bitsToScope, countSlots, defaultWindowSlots, emptySlots, fillSlots, formatDays, formatRanges, formatWait, formatWhen,
  fullSlots, invertSlots, isAllowed, isValidSlots, nextAllowed, rangesFromSlots, scopeToBits, slotsForDay, slotsFromRanges, taipeiSlotOf, toggleSlot, todayRanges,
  type NotifyWindowGroup,
} from '../src/index.js';

/** 台北時間 → UTC 毫秒(2026-11-11 是週三) */
const tpe = (y: number, mo: number, d: number, h: number, mi = 0, s = 0): number => Date.UTC(y, mo - 1, d, h - 8, mi, s);
const g = (ranges: [number, number][], days = ALL_DAYS, enabled = true): NotifyWindowGroup => ({ enabled, days, slots: slotsFromRanges(ranges) });
const H = (h: number, m = 0): number => h * 60 + m;

test('遮罩與區間互轉:相連合併、24:00 收尾', () => {
  const s = slotsFromRanges([[H(12), H(13, 30)], [H(19), 1440]]);
  assert.equal(s.length, 96);
  assert.deepEqual(rangesFromSlots(s), [[H(12), H(13, 30)], [H(19), 1440]]);
  assert.equal(countSlots(s), 6 + 20);
  assert.equal(formatRanges(rangesFromSlots(s)), '12:00–13:30、19:00–24:00');
  assert.deepEqual(rangesFromSlots(emptySlots()), []);
  assert.deepEqual(rangesFromSlots(fullSlots()), [[0, 1440]]);
  // 相連的兩段合併
  assert.deepEqual(rangesFromSlots(slotsFromRanges([[0, 60], [60, 120]])), [[0, 120]]);
});

test('slotsFromRanges 對非 15 的倍數往內收、超出範圍夾回', () => {
  assert.deepEqual(rangesFromSlots(slotsFromRanges([[H(8, 5), H(9, 40)]])), [[H(8, 15), H(9, 30)]]);
  assert.deepEqual(rangesFromSlots(slotsFromRanges([[-30, 30], [1400, 1600]])), [[0, 30], [1410, 1440]]);
});

test('isValidSlots / toggle / fill / invert', () => {
  assert.equal(isValidSlots(emptySlots()), true);
  assert.equal(isValidSlots('0'.repeat(95)), false);
  assert.equal(isValidSlots('2'.repeat(96)), false);
  assert.equal(isValidSlots(null), false);
  let s = emptySlots();
  s = toggleSlot(s, 3);
  assert.equal(s[3], '1');
  s = toggleSlot(s, 3);
  assert.equal(s[3], '0');
  assert.equal(toggleSlot(s, 96), s);
  s = fillSlots(emptySlots(), 10, 5, true);
  assert.deepEqual(rangesFromSlots(s), [[75, 165]]);
  assert.equal(fillSlots(s, 5, 10, false), emptySlots());
  assert.equal(invertSlots(fullSlots()), emptySlots());
  assert.deepEqual(rangesFromSlots(defaultWindowSlots()), [[H(8), H(22)]]);
});

test('taipeiSlotOf:星期與格子(週三 = 2;跨日邊界)', () => {
  assert.deepEqual(taipeiSlotOf(tpe(2026, 11, 11, 0, 0)), { day: 2, slot: 0 });
  assert.deepEqual(taipeiSlotOf(tpe(2026, 11, 11, 23, 59, 59)), { day: 2, slot: 95 });
  assert.deepEqual(taipeiSlotOf(tpe(2026, 11, 12, 0, 0)), { day: 3, slot: 0 });
  assert.deepEqual(taipeiSlotOf(tpe(2026, 11, 15, 12, 20)), { day: 6, slot: 49 }); // 週日
  assert.deepEqual(taipeiSlotOf(tpe(2026, 11, 16, 8, 0)), { day: 0, slot: 32 }); // 週一
  // UTC 還是前一天,台北已是隔天
  assert.equal(taipeiSlotOf(Date.UTC(2026, 10, 10, 17, 0)).day, 2);
});

test('isAllowed:半開區間(13:29:59 允許、13:30:00 不允許)', () => {
  const groups = [g([[H(12), H(13, 30)]])];
  assert.equal(isAllowed(groups, tpe(2026, 11, 11, 12, 0)), true);
  assert.equal(isAllowed(groups, tpe(2026, 11, 11, 13, 29, 59)), true);
  assert.equal(isAllowed(groups, tpe(2026, 11, 11, 13, 30)), false);
  assert.equal(isAllowed(groups, tpe(2026, 11, 11, 11, 59, 59)), false);
});

test('nextAllowed:已允許回傳原值、否則下一格起點;秒數保留只在允許時', () => {
  const groups = [g([[H(12), H(13, 30)], [H(19), H(23, 30)]])];
  const inside = tpe(2026, 11, 11, 12, 20, 33);
  assert.equal(nextAllowed(groups, inside), inside);
  assert.equal(nextAllowed(groups, tpe(2026, 11, 11, 3, 12, 40)), tpe(2026, 11, 11, 12, 0));
  assert.equal(nextAllowed(groups, tpe(2026, 11, 11, 13, 40)), tpe(2026, 11, 11, 19, 0));
  // 11:59:59 → 12:00
  assert.equal(nextAllowed(groups, tpe(2026, 11, 11, 11, 59, 59)), tpe(2026, 11, 11, 12, 0));
  // 跨午夜到隔天
  assert.equal(nextAllowed(groups, tpe(2026, 11, 11, 23, 40)), tpe(2026, 11, 12, 12, 0));
});

test('nextAllowed:跨午夜的組(23:00–07:00 以兩段表示)', () => {
  const groups = [g([[0, H(7)], [H(23), 1440]])];
  assert.equal(nextAllowed(groups, tpe(2026, 11, 11, 23, 30)), tpe(2026, 11, 11, 23, 30));
  assert.equal(nextAllowed(groups, tpe(2026, 11, 12, 6, 59)), tpe(2026, 11, 12, 6, 59));
  assert.equal(nextAllowed(groups, tpe(2026, 11, 12, 7, 0)), tpe(2026, 11, 12, 23, 0));
});

test('適用星期:平日與假日各一組,取聯集', () => {
  const groups = [g([[H(19), H(23)]], WEEKDAYS), g([[H(9), 1440]], WEEKEND)];
  // 週五 20:00 允許;週六 08:00 不允許,下一個是週六 09:00
  assert.equal(isAllowed(groups, tpe(2026, 11, 13, 20, 0)), true);
  assert.equal(isAllowed(groups, tpe(2026, 11, 14, 8, 0)), false);
  assert.equal(nextAllowed(groups, tpe(2026, 11, 14, 8, 0)), tpe(2026, 11, 14, 9, 0));
  // 週日 23:59:59 仍在假日組內;週一 08:00 → 週一 19:00
  assert.equal(nextAllowed(groups, tpe(2026, 11, 15, 23, 59, 59)), tpe(2026, 11, 15, 23, 59, 59));
  assert.equal(nextAllowed(groups, tpe(2026, 11, 16, 8, 0)), tpe(2026, 11, 16, 19, 0));
  // 週六 12:00 不屬於平日組
  assert.equal(isAllowed([g([[H(12), H(13)]], WEEKDAYS)], tpe(2026, 11, 14, 12, 30)), false);
});

test('停用的組不算;沒有啟用中的組 → null', () => {
  const off = [g([[0, 1440]], ALL_DAYS, false)];
  assert.equal(isAllowed(off, tpe(2026, 11, 11, 12)), false);
  assert.equal(nextAllowed(off, tpe(2026, 11, 11, 12)), null);
  assert.equal(nextAllowed([], tpe(2026, 11, 11, 12)), null);
});

test('nextAllowed:只有某一天的組,八天內一定找得到;超出視野回 null', () => {
  const onlyMonday = [g([[H(9), H(10)]], 0b0000001)];
  // 週二 → 下個週一 09:00(6 天後)
  assert.equal(nextAllowed(onlyMonday, tpe(2026, 11, 10, 12, 0)), tpe(2026, 11, 16, 9, 0));
  assert.equal(nextAllowed(onlyMonday, tpe(2026, 11, 10, 12, 0), 3), null);
});

test('slotsForDay / todayRanges:啟用中且適用該日的組取聯集', () => {
  const groups = [g([[H(12), H(13, 30)]], WEEKDAYS), g([[H(19), H(23, 30)]], ALL_DAYS), g([[H(1), H(2)]], ALL_DAYS, false)];
  assert.deepEqual(todayRanges(groups, tpe(2026, 11, 11, 10, 10)), [[H(12), H(13, 30)], [H(19), H(23, 30)]]);
  assert.deepEqual(todayRanges(groups, tpe(2026, 11, 14, 10, 10)), [[H(19), H(23, 30)]]);
  assert.equal(countSlots(slotsForDay(groups, 0)), 6 + 18);
});

test('套用範圍與位元互轉', () => {
  assert.equal(scopeToBits({ dm: true, channel: false, push: true }), 5);
  assert.deepEqual(bitsToScope(7), { dm: true, channel: true, push: true });
  assert.deepEqual(bitsToScope(0), { dm: false, channel: false, push: false });
});

test('顯示:適用星期、何時、等待多久', () => {
  assert.equal(formatDays(ALL_DAYS), '每天');
  assert.equal(formatDays(WEEKDAYS), '平日');
  assert.equal(formatDays(WEEKEND), '假日');
  assert.equal(formatDays(0b0000101), '週一、週三');
  const now = tpe(2026, 11, 11, 10, 10);
  assert.equal(formatWhen(tpe(2026, 11, 11, 12, 0), now), '今天 12:00');
  assert.equal(formatWhen(tpe(2026, 11, 12, 12, 0), now), '明天 12:00');
  assert.equal(formatWhen(tpe(2026, 11, 13, 9, 0), now), '後天 09:00');
  assert.equal(formatWhen(tpe(2026, 11, 14, 9, 0), now), '週六 09:00');
  assert.equal(formatWait(tpe(2026, 11, 11, 12, 0), now), '約 1 小時 50 分後');
  assert.equal(formatWait(tpe(2026, 11, 12, 12, 0), now), '約 1 天 1 小時後');
  assert.equal(formatWait(now, now), '現在');
});
