import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { createPermissions, parseRoleRule } from '../src/auth/permissions.js';
import type { AppConfig } from '../src/config.js';
import { migrate, openDatabase, type Db } from '../src/db/index.js';
import type { DiscordClient, DiscordGuildMember } from '../src/discord/client.js';
import type { OcrService } from '../src/ocr/service.js';
import { PushSendError, type PushNotification, type PushSender, type PushTarget } from '../src/push/sender.js';
import { buildInternalServer, buildPublicServer } from '../src/server.js';

export const ORIGIN = 'https://eranaut.example.com';
export const ROLE_A = '111111111111111111';
export const ROLE_B = '222222222222222222';
export const ROLE_C = '333333333333333333';
export const GUILD_ID = '999999999999999999';

export const config: AppConfig = {
  publicOrigin: ORIGIN,
  cookieSecure: true,
  reminderChannelId: '888888888888888888',
  internalSecret: 'test-internal-secret-0123456789abcdef',
  push: null,
  guildName: '貝殼公會',
  discord: { clientId: 'client-id', clientSecret: 'client-secret', botToken: 'bot-token', guildId: GUILD_ID },
};

export function member(over: Partial<DiscordGuildMember> & { id?: string } = {}): DiscordGuildMember {
  const id = over.id ?? '555555555555555555';
  return {
    roles: [ROLE_A, ROLE_B],
    nick: null,
    avatar: null,
    user: { id, username: 'winter', global_name: null, avatar: null },
    ...over,
  };
}

/** 假 Discord:code → Discord id → 成員資料,不連網路 */
export class FakeDiscord implements DiscordClient {
  codes = new Map<string, string>();
  members = new Map<string, DiscordGuildMember | null>();
  failExchange = false;
  failMember = false;

  grant(code: string, m: DiscordGuildMember | null, discordId = m?.user.id ?? '555555555555555555') {
    this.codes.set(code, discordId);
    this.members.set(discordId, m);
  }
  async exchangeCodeForUserId(code: string) {
    if (this.failExchange) throw new Error('exchange failed');
    const id = this.codes.get(code);
    if (!id) throw new Error('bad code');
    return id;
  }
  async getGuildMember(userId: string) {
    if (this.failMember) throw new Error('member lookup failed');
    return this.members.get(userId) ?? null;
  }
  failList = false;
  guildInfo: { ownerId: string; roles: { id: string; permissions: string }[] } = {
    ownerId: '100000000000000001',
    roles: [{ id: '444444444444444444', permissions: '8' }],
  };
  failGuildInfo = false;
  async getGuildAdminInfo() {
    if (this.failGuildInfo) throw new Error('guild info failed');
    return this.guildInfo;
  }
  async listGuildMembers() {
    if (this.failList) throw new Error('list failed');
    return [...this.members.values()].filter((m): m is DiscordGuildMember => m !== null);
  }
}

export interface TestApp {
  app: FastifyInstance;
  db: Db;
  discord: FakeDiscord;
  clock: { now: Date };
  internal: FastifyInstance;
}

/** member 規則:(A 且 B) 或 C */
/** 假推播:記錄送出的內容;`script` 依序消耗結果('ok' 或要丟的錯誤),沒有就成功 */
export class FakePush implements PushSender {
  sent: { target: PushTarget; n: PushNotification }[] = [];
  script: (Error | 'ok')[] = [];
  async send(target: PushTarget, n: PushNotification) {
    const next = this.script.shift() ?? 'ok';
    if (next !== 'ok') throw next;
    this.sent.push({ target, n });
  }
}
export const goneError = () => new PushSendError('訂閱已失效(HTTP 410)', 'permanent', true);

export const VAPID_PUBLIC = 'B'.repeat(87);

export function makeApp(opts: { ocr?: OcrService; push?: PushSender } = {}): TestApp {
  const db = openDatabase(':memory:');
  migrate(db);
  const discord = new FakeDiscord();
  const clock = { now: new Date('2026-10-01T00:00:00Z') };
  const permissions = createPermissions({ member: parseRoleRule(`${ROLE_A}+${ROLE_B},${ROLE_C}`) });
  const cfg = opts.push ? { ...config, push: { publicKey: VAPID_PUBLIC, privateKey: 'x'.repeat(43), subject: ORIGIN } } : config;
  const deps = { db, config: cfg, discord, permissions, ocr: opts.ocr, push: opts.push, now: () => clock.now };
  const app = buildPublicServer(deps, { logger: false });
  const internal = buildInternalServer(deps, { logger: false });
  return { app, db, discord, clock, internal };
}

export function addUser(db: Db, discordId: string, over: { suspended_at?: string; suspended_auto?: number; suspended_by?: string } = {}): string {
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, discord_user_id, suspended_at, suspended_auto, suspended_by, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    discordId,
    over.suspended_at ?? null,
    over.suspended_auto ?? null,
    over.suspended_by ?? null,
    '2026-09-01T00:00:00Z',
  );
  return id;
}

/** 執行完整登入(login → callback),回傳 callback 的回應 */
export async function loginWith(t: TestApp, code: string) {
  const login = await t.app.inject({ method: 'GET', url: '/api/auth/login' });
  const state = login.cookies.find((c) => c.name === 'eranaut_oauth_state')!.value;
  return t.app.inject({
    method: 'GET',
    url: `/api/auth/callback?code=${code}&state=${state}`,
    cookies: { eranaut_oauth_state: state },
  });
}

export function sessionCookie(res: { cookies: { name: string; value: string }[] }): string | undefined {
  return res.cookies.find((c) => c.name === 'eranaut_session')?.value;
}
