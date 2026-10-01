import fastifySchedule from '@fastify/schedule';
import type { FastifyInstance } from 'fastify';
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import { runEligibilitySweep, type SweepDeps } from './eligibility-sweep.js';

/** 每 24 小時一次(D-130 ①);啟動時先跑一次,服務停機一陣子後重啟也能立刻補上 */
export const SWEEP_INTERVAL_MS = 24 * 60 * 60_000;

/** 全系統第二個、也是最後一個排程(CLAUDE.md §5)。需在 startReminderPoller 之後呼叫(已註冊過 @fastify/schedule) */
export function startEligibilitySweep(app: FastifyInstance, deps: SweepDeps, intervalMs: number = SWEEP_INTERVAL_MS): void {
  const task = new AsyncTask(
    'eligibility-sweep',
    async () => {
      await runEligibilitySweep(deps);
    },
    (err) => deps.log.warn({ event: 'eligibility_sweep_error', error: String(err) }),
  );
  app.ready().then(() => {
    app.scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ milliseconds: intervalMs, runImmediately: true }, task, { preventOverrun: true, id: 'eligibility-sweep' }));
  });
}
