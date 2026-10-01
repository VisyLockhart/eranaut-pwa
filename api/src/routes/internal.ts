import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { resolveProfile, type DiscordGuildMember } from '../discord/client.js';
import { getOverview } from '../repo/submarines.js';
import { clearSuspension, findUserByDiscordId } from '../repo/users.js';
import { isGuildAdministrator, type GuildCache } from '../services/guild-cache.js';
import { suspendUser } from '../services/suspension.js';
import type { AppDeps } from '../server.js';

// 內部埠路由(D-131、D-145 ③):只給 Eranarch,Bearer 共用密鑰驗證;不發佈、不經反向代理。
// 每個請求帶呼叫者的 Discord ID 與身份組(標頭 x-caller-id、x-caller-roles,身份組以逗號分隔、可為空),
// API 用共用的判斷再檢查一次權限群組(`member` 沿用 D-143 規則;`admin` 見 D-150)。
// 路由只處理 HTTP,業務規則在 services/。

const SNOWFLAKE = /^\d{17,20}$/;
export const AUTOCOMPLETE_LIMIT = 25;

function digest(v: string): Buffer {
  return createHash('sha256').update(v).digest();
}

/** 固定時間比對(D-131 ①):先雜湊成等長再比,避免長度與內容的時間差 */
export function bearerMatches(header: string | undefined, secret: string): boolean {
  if (!header?.startsWith('Bearer ')) return false;
  return timingSafeEqual(digest(header.slice(7)), digest(secret));
}

interface Caller {
  discordId: string;
  roles: string[];
}

function parseCaller(req: FastifyRequest): Caller | null {
  const id = req.headers['x-caller-id'];
  const rolesHeader = req.headers['x-caller-roles'];
  if (typeof id !== 'string' || !SNOWFLAKE.test(id)) return null;
  if (rolesHeader !== undefined && typeof rolesHeader !== 'string') return null;
  const roles = (rolesHeader ?? '').split(',').map((r) => r.trim()).filter(Boolean);
  if (!roles.every((r) => SNOWFLAKE.test(r))) return null;
  return { discordId: id, roles };
}

function displayName(m: DiscordGuildMember, guildId: string): string {
  return resolveProfile(m, guildId).displayName;
}

function matchesQuery(query: string, ...names: (string | null)[]): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || names.some((n) => n !== null && n.toLowerCase().includes(q));
}

export function registerInternalRoutes(app: FastifyInstance, deps: AppDeps, guild: GuildCache): void {
  const { db, config, permissions, discord } = deps;

  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/healthz') return;
    if (!bearerMatches(req.headers.authorization, config.internalSecret)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
  });
  app.addHook('onSend', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  /** 取得呼叫者並檢查權限群組;不通過時已送出回應並回 null */
  async function authorize(req: FastifyRequest, reply: FastifyReply, group: 'member' | 'admin'): Promise<Caller | null> {
    const caller = parseCaller(req);
    if (!caller) {
      void reply.code(400).send({ error: 'invalid_caller' });
      return null;
    }
    let ok: boolean;
    try {
      ok = group === 'member' ? permissions.can('member', caller.roles) : await isGuildAdministrator(guild, caller.discordId, caller.roles);
    } catch (e) {
      req.log.warn({ event: 'internal_authorize', error: String((e as Error).message) });
      void reply.code(502).send({ error: 'discord_unavailable' });
      return null;
    }
    if (!ok) {
      void reply.code(403).send({ error: 'forbidden' });
      return null;
    }
    return caller;
  }

  const unavailable = (reply: FastifyReply, req: FastifyRequest, e: unknown) => {
    req.log.warn({ event: 'internal_discord_error', error: String((e as Error).message) });
    return reply.code(502).send({ error: 'discord_unavailable' });
  };

  // suspend 的 autocomplete:只列目前符合使用資格的成員,最多 25 筆(D-132 ⑤、D-145 ②)
  app.get<{ Querystring: { query?: string } }>('/admin/eligible-members', async (req, reply) => {
    if (!(await authorize(req, reply, 'admin'))) return;
    let members: DiscordGuildMember[];
    try {
      members = await guild.members();
    } catch (e) {
      return unavailable(reply, req, e);
    }
    const query = req.query.query ?? '';
    const list = members
      .filter((m) => !m.user.bot && permissions.can('member', m.roles))
      .map((m) => ({ id: m.user.id, name: displayName(m, config.discord.guildId), username: m.user.username }))
      .filter((m) => matchesQuery(query, m.name, m.username))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, AUTOCOMPLETE_LIMIT)
      .map(({ id, name }) => ({ id, name }));
    return { members: list };
  });

  // unsuspend 的 autocomplete:資料庫中全部停用者(含自動停用);已離開伺服器者 name 為 null
  app.get<{ Querystring: { query?: string } }>('/admin/suspended-users', async (req, reply) => {
    if (!(await authorize(req, reply, 'admin'))) return;
    let members: DiscordGuildMember[];
    try {
      members = await guild.members();
    } catch (e) {
      return unavailable(reply, req, e);
    }
    const byId = new Map(members.map((m) => [m.user.id, m]));
    const rows = db.prepare('SELECT discord_user_id, suspended_auto FROM users WHERE suspended_at IS NOT NULL').all() as {
      discord_user_id: string;
      suspended_auto: number | null;
    }[];
    const query = req.query.query ?? '';
    const users = rows
      .map((r) => {
        const m = byId.get(r.discord_user_id);
        return {
          id: r.discord_user_id,
          name: m ? displayName(m, config.discord.guildId) : null,
          username: m?.user.username ?? null,
          left_guild: !m,
          suspended_auto: r.suspended_auto === 1,
        };
      })
      .filter((u) => matchesQuery(query, u.name, u.username, u.id))
      .sort((a, b) => Number(a.left_guild) - Number(b.left_guild) || (a.name ?? a.id).localeCompare(b.name ?? b.id)) // 已離開伺服器者排在後面
      .slice(0, AUTOCOMPLETE_LIMIT)
      .map(({ id, name, left_guild, suspended_auto }) => ({ id, name, left_guild, suspended_auto }));
    return { users };
  });

  function targetOf(req: FastifyRequest, reply: FastifyReply): string | null {
    const body = req.body as { target_discord_id?: unknown } | null;
    const id = body && typeof body === 'object' ? body.target_discord_id : undefined;
    if (typeof id !== 'string' || !SNOWFLAKE.test(id)) {
      void reply.code(400).send({ error: 'validation_failed', fields: { target_discord_id: 'invalid_value' } });
      return null;
    }
    return id;
  }

  // 手動停權(D-131 ⑤):目標從未登入過 → 404「查無此使用者」;已停用 → 已是該狀態
  app.post('/admin/suspend', async (req, reply) => {
    const caller = await authorize(req, reply, 'admin');
    if (!caller) return;
    const target = targetOf(req, reply);
    if (!target) return;
    const user = findUserByDiscordId(db, target);
    if (!user) return reply.code(404).send({ error: 'not_found' });
    if (user.suspended_at !== null) return { result: 'already_suspended' };
    db.transaction(() => suspendUser(db, user.id, { kind: 'manual', byDiscordId: caller.discordId }, deps.now()))();
    req.log.info({ event: 'admin_suspend', actor: caller.discordId, target });
    return { result: 'suspended' };
  });

  // 解除停權:立即向 Discord 重查資格,符合 → 恢復;不符 → 轉為「因失去資格而停用」(D-131 ⑤、D-132 ⑥)
  app.post('/admin/unsuspend', async (req, reply) => {
    const caller = await authorize(req, reply, 'admin');
    if (!caller) return;
    const target = targetOf(req, reply);
    if (!target) return;
    const user = findUserByDiscordId(db, target);
    if (!user) return reply.code(404).send({ error: 'not_found' });
    if (user.suspended_at === null) return { result: 'not_suspended' };
    let member: DiscordGuildMember | null;
    try {
      member = await discord.getGuildMember(target);
    } catch (e) {
      return unavailable(reply, req, e); // 查不到就不改任何狀態
    }
    const eligible = member !== null && permissions.can('member', member.roles);
    if (eligible) {
      clearSuspension(db, user.id);
    } else {
      db.prepare('UPDATE users SET suspended_at = ?, suspended_auto = 1, suspended_by = NULL WHERE id = ?').run(deps.now().toISOString(), user.id);
    }
    const result = eligible ? 'unsuspended' : 'now_auto_suspended';
    req.log.info({ event: 'admin_unsuspend', actor: caller.discordId, target, result });
    return { result };
  });

  // 呼叫者本人的工坊與潛艇(D-71)。無記錄或已停用一律 404「無資料」,不透露停用狀態(D-143 ④ c)
  app.get('/me/submarines', async (req, reply) => {
    const caller = await authorize(req, reply, 'member');
    if (!caller) return;
    const user = findUserByDiscordId(db, caller.discordId);
    if (!user || user.suspended_at !== null) return reply.code(404).send({ error: 'no_data' });
    return getOverview(db, user.id);
  });
}
