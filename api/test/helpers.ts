import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { createPermissions, parseRoleRule } from '../src/auth/permissions.js';
import type { AppConfig } from '../src/config.js';
import { migrate, openDatabase, type Db } from '../src/db/index.js';
import type { DiscordClient, DiscordGuildMember } from '../src/discord/client.js';
import { buildPublicServer } from '../src/server.js';

export const ORIGIN = 'https://eranaut.example.com';
export const ROLE_A = '111111111111111111';
export const ROLE_B = '222222222222222222';
export const ROLE_C = '333333333333333333';
export const GUILD_ID = '999999999999999999';

export const config: AppConfig = {
  publicOrigin: ORIGIN,
  cookieSecure: true,
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
}

export interface TestApp {
  app: FastifyInstance;
  db: Db;
  discord: FakeDiscord;
  clock: { now: Date };
}

/** member 規則:(A 且 B) 或 C */
export function makeApp(): TestApp {
  const db = openDatabase(':memory:');
  migrate(db);
  const discord = new FakeDiscord();
  const clock = { now: new Date('2026-10-01T00:00:00Z') };
  const permissions = createPermissions({ member: parseRoleRule(`${ROLE_A}+${ROLE_B},${ROLE_C}`) });
  const app = buildPublicServer({ db, config, discord, permissions, now: () => clock.now }, { logger: false });
  return { app, db, discord, clock };
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
