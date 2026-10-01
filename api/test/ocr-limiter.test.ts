import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BusyError, createLimiter } from '../src/ocr/limiter.js';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

test('同時執行數不超過上限,其餘排隊並依序執行', async () => {
  const limiter = createLimiter(2, 10);
  let active = 0;
  let peak = 0;
  const gates = Array.from({ length: 5 }, deferred);
  const order: number[] = [];
  const jobs = gates.map((g, i) =>
    limiter.run(async () => {
      active++;
      peak = Math.max(peak, active);
      order.push(i);
      await g.promise;
      active--;
      return i;
    }),
  );
  await new Promise((r) => setImmediate(r));
  assert.equal(active, 2);
  assert.equal(limiter.pending, 5);
  for (const g of gates) {
    g.resolve();
    await new Promise((r) => setImmediate(r));
  }
  assert.deepEqual(await Promise.all(jobs), [0, 1, 2, 3, 4]);
  assert.equal(peak, 2);
  assert.deepEqual(order, [0, 1, 2, 3, 4]);
  assert.equal(limiter.pending, 0);
});

test('排隊滿了直接丟 BusyError,已在排隊的不受影響', async () => {
  const limiter = createLimiter(1, 1);
  const g = deferred();
  const first = limiter.run(() => g.promise);
  const second = limiter.run(async () => 'second');
  await assert.rejects(limiter.run(async () => 'third'), BusyError);
  g.resolve();
  await first;
  assert.equal(await second, 'second');
});

test('任務丟錯也會釋放名額', async () => {
  const limiter = createLimiter(1, 1);
  await assert.rejects(limiter.run(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(await limiter.run(async () => 'ok'), 'ok');
  assert.equal(limiter.pending, 0);
});

test('名額空出時直接交給排隊者,新請求不能插隊', async () => {
  const limiter = createLimiter(1, 5);
  const g = deferred();
  const log: string[] = [];
  const a = limiter.run(async () => { await g.promise; log.push('a'); });
  const b = limiter.run(async () => { log.push('b'); });
  g.resolve();
  // a 結束的同一個微任務週期內送進來的新請求 c,必須排在 b 後面
  await a;
  const c = limiter.run(async () => { log.push('c'); });
  await Promise.all([b, c]);
  assert.deepEqual(log, ['a', 'b', 'c']);
});
