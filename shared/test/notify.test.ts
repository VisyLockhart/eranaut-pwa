import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyMethodsToPrefs, prefsToNotifyMethods, DEFAULT_NOTIFY_METHODS } from '../src/index.js';

test('預設只開 DM', () => {
  assert.deepEqual(notifyMethodsToPrefs(DEFAULT_NOTIFY_METHODS), { dm: true, channel: false });
});

test('0 = 全不選、3 = DM + 頻道', () => {
  assert.deepEqual(notifyMethodsToPrefs(0), { dm: false, channel: false });
  assert.deepEqual(notifyMethodsToPrefs(3), { dm: true, channel: true });
});

test('布林與位元可往返轉換,預留位元 4 不影響', () => {
  for (const dm of [true, false]) for (const channel of [true, false]) {
    assert.deepEqual(notifyMethodsToPrefs(prefsToNotifyMethods({ dm, channel })), { dm, channel });
  }
  assert.deepEqual(notifyMethodsToPrefs(4), { dm: false, channel: false });
});
