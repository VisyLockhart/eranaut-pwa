import type { DiscordClient, DiscordGuildMember, GuildAdminInfo } from '../discord/client.js';

// 公會資料的短暫記憶體快取(D-145 ②:約 60 秒、不入庫、到期自然失效,不需清理排程)。
// 內部端點(autocomplete、管理員判斷)共用,以守住 Discord 3 秒互動限制並減少 Discord 呼叫。

export const GUILD_CACHE_TTL_MS = 60_000;

function cached<T>(load: () => Promise<T>, now: () => Date): () => Promise<T> {
  let value: { at: number; data: T } | null = null;
  return async () => {
    const t = now().getTime();
    if (value && t - value.at < GUILD_CACHE_TTL_MS) return value.data;
    const data = await load();
    value = { at: t, data };
    return data;
  };
}

export interface GuildCache {
  members(): Promise<DiscordGuildMember[]>;
  adminInfo(): Promise<GuildAdminInfo>;
}

export function createGuildCache(discord: DiscordClient, now: () => Date): GuildCache {
  return {
    members: cached(() => discord.listGuildMembers(), now),
    adminInfo: cached(() => discord.getGuildAdminInfo(), now),
  };
}

const ADMINISTRATOR = 0x8n;

/**
 * 管理員 = 伺服器擁有者,或身上任一身份組有 Administrator 權限(D-150,與 Eranarch 現行判斷一致:
 * `setDefaultMemberPermissions(Administrator)` + `memberPermissions.has(Administrator)`)。
 */
export async function isGuildAdministrator(cache: GuildCache, discordUserId: string, roleIds: readonly string[]): Promise<boolean> {
  const info = await cache.adminInfo();
  if (info.ownerId === discordUserId) return true;
  const owned = new Set(roleIds);
  return info.roles.some((r) => owned.has(r.id) && (BigInt(r.permissions) & ADMINISTRATOR) !== 0n);
}
