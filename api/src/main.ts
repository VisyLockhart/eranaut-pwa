import { buildInternalServer, buildPublicServer } from './server.js';
import { migrate, openDatabase } from './db/index.js';
import { loadPermissionsFromEnv } from './auth/permissions.js';
import { loadConfig } from './config.js';
import { createDiscordClient } from './discord/client.js';

const publicPort = Number(process.env.PUBLIC_PORT ?? 3000);
const internalPort = Number(process.env.INTERNAL_PORT ?? 3001);

// 身份組規則錯誤時在此丟錯,服務直接啟動失敗(D-143 ①)
const permissions = loadPermissionsFromEnv();
const config = loadConfig();

const db = openDatabase(process.env.DATABASE_PATH ?? './data/eranaut.db');
migrate(db);

const pub = buildPublicServer({ db, config, discord: createDiscordClient(config), permissions, now: () => new Date() });
const internal = buildInternalServer();

await pub.listen({ port: publicPort, host: '0.0.0.0' });
await internal.listen({ port: internalPort, host: '0.0.0.0' });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    await Promise.all([pub.close(), internal.close()]);
    db.close();
    process.exit(0);
  });
}
