import fastifySchedule from '@fastify/schedule';
import type { FastifyInstance } from 'fastify';
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';
import { processDueDeliveries, type DeliveryDeps } from './deliveries.js';

/** 輪詢間隔:30 秒(D-128) */
export const POLL_INTERVAL_MS = 30_000;

/**
 * 在 API 進程內每 30 秒輪詢一次(D-128):`@fastify/schedule`,防重疊執行、隨 Fastify 關閉流程收尾。
 * 不用 Redis/外部佇列,也不用記憶體計時器:待發提醒在資料庫,重啟後直接接續。
 * 全系統只有兩個排程:這個與每日資格比對(CLAUDE.md §5)。
 */
export async function startReminderPoller(app: FastifyInstance, deps: DeliveryDeps, intervalMs: number = POLL_INTERVAL_MS): Promise<void> {
  await app.register(fastifySchedule);
  const task = new AsyncTask(
    'reminder-poll',
    async () => {
      await processDueDeliveries(deps);
    },
    (err) => deps.log.warn({ event: 'reminder_poll_error', error: String(err) }),
  );
  app.ready().then(() => {
    app.scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ milliseconds: intervalMs, runImmediately: true }, task, { preventOverrun: true, id: 'reminder-poll' }));
  });
}
