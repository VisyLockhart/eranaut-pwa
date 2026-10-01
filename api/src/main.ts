import { buildInternalServer, buildPublicServer } from './server.js';
import { migrate, openDatabase } from './db/index.js';
import { loadPermissionsFromEnv } from './auth/permissions.js';
import { loadConfig } from './config.js';
import { createDiscordClient } from './discord/client.js';
import { createReminderSender } from './discord/sender.js';
import { startEligibilitySweep } from './services/eligibility-scheduler.js';
import { startReminderPoller } from './services/reminder-poller.js';

const publicPort = Number(process.env.PUBLIC_PORT ?? 3000);
const internalPort = Number(process.env.INTERNAL_PORT ?? 3001);

// 身份組規則錯誤時在此丟錯,服務直接啟動失敗(D-143 ①)
const permissions = loadPermissionsFromEnv();
const config = loadConfig();

const db = openDatabase(process.env.DATABASE_PATH ?? './data/eranaut.db');
migrate(db);

const discord = createDiscordClient(config);
const pub = buildPublicServer({ db, config, discord, permissions, now: () => new Date() });
const internal = buildInternalServer();

// 提醒輪詢(D-128):隨公開埠的 Fastify 啟停
await startReminderPoller(pub, {
  db,
  sender: createReminderSender(config),
  reminderChannelId: config.reminderChannelId,
  now: () => new Date(),
  log: pub.log,
});

// 每日資格比對(D-130):第二個排程,同一個 @fastify/schedule
startEligibilitySweep(pub, { db, discord, permissions, now: () => new Date(), log: pub.log });

await pub.listen({ port: publicPort, host: '0.0.0.0' });
await internal.listen({ port: internalPort, host: '0.0.0.0' });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await Promise.all([pub.close(), internal.close()]);
    db.close();
    process.exit(0);
  });
}
