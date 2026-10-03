import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyNotifyPrefsUpdate, notifyMethodsToPrefs, prefsToNotifyMethods, DEFAULT_NOTIFY_METHODS } from '../src/index.js';

test('預設只開 DM', () => {
  assert.deepEqual(notifyMethodsToPrefs(DEFAULT_NOTIFY_METHODS), { dm: true, channel: false, push: false });
});

test('0 = 全不選、3 = DM + 頻道、4 = 只有推播、7 = 全開', () => {
  assert.deepEqual(notifyMethodsToPrefs(0), { dm: false, channel: false, push: false });
  assert.deepEqual(notifyMethodsToPrefs(3), { dm: true, channel: true, push: false });
  assert.deepEqual(notifyMethodsToPrefs(4), { dm: false, channel: false, push: true });
  assert.deepEqual(notifyMethodsToPrefs(7), { dm: true, channel: true, push: true });
});

test('布林與位元可往返轉換', () => {
  for (const dm of [true, false]) for (const channel of [true, false]) for (const push of [true, false]) {
    assert.deepEqual(notifyMethodsToPrefs(prefsToNotifyMethods({ dm, channel, push })), { dm, channel, push });
  }
});

test('更新 DM / 頻道時保留推播位元(D-165)', () => {
  assert.equal(applyNotifyPrefsUpdate(7, { dm: false, channel: false }), 4);
  assert.equal(applyNotifyPrefsUpdate(4, { dm: true, channel: false }), 5);
  assert.equal(applyNotifyPrefsUpdate(1, { dm: true, channel: true }), 3);
  assert.equal(applyNotifyPrefsUpdate(0, { dm: false, channel: false }), 0);
});
