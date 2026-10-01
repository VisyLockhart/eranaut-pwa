import type { AppConfig } from '../config.js';
import { redirectUri } from '../config.js';

// Discord 呼叫集中在這裡,並以介面注入,測試用假實作取代,不連真的 Discord。

export interface DiscordGuildMember {
  roles: string[];
  /** 伺服器暱稱 */
  nick: string | null;
  /** 公會頭像 hash */
  avatar: string | null;
  user: {
    id: string;
    username: string;
    global_name: string | null;
    /** 帳號頭像 hash */
    avatar: string | null;
  };
}

export interface DiscordClient {
  /** 用 OAuth code 換 token,再取 /users/@me 的 id。token 用完即丟,不保存(D-35) */
  exchangeCodeForUserId(code: string): Promise<string>;
  /** 用 bot token 查公會成員(身份組、暱稱、頭像)。不在伺服器回 null */
  getGuildMember(userId: string): Promise<DiscordGuildMember | null>;
}

export class DiscordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiscordError';
  }
}

export interface Profile {
  displayName: string;
  avatarUrl: string | null;
}

/** 名稱優先順序:伺服器暱稱 → global_name → username;頭像:公會頭像 → 帳號頭像 → null(D-134) */
export function resolveProfile(member: DiscordGuildMember, guildId: string): Profile {
  const displayName = member.nick || member.user.global_name || member.user.username;
  let avatarUrl: string | null = null;
  if (member.avatar) {
    avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${member.user.id}/avatars/${member.avatar}.png`;
  } else if (member.user.avatar) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`;
  }
  return { displayName, avatarUrl };
}

const API = 'https://discord.com/api/v10';

export function createDiscordClient(config: AppConfig, fetchImpl: typeof fetch = fetch): DiscordClient {
  const { clientId, clientSecret, botToken, guildId } = config.discord;
  return {
    async exchangeCodeForUserId(code) {
      const tokenRes = await fetchImpl(`${API}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri(config),
        }),
      });
      if (!tokenRes.ok) throw new DiscordError(`token 交換失敗:HTTP ${tokenRes.status}`);
      const token = (await tokenRes.json()) as { access_token?: string };
      if (!token.access_token) throw new DiscordError('token 回應沒有 access_token');

      const meRes = await fetchImpl(`${API}/users/@me`, { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!meRes.ok) throw new DiscordError(`取得使用者失敗:HTTP ${meRes.status}`);
      const me = (await meRes.json()) as { id?: string };
      if (!me.id) throw new DiscordError('/users/@me 回應沒有 id');
      return me.id;
    },

    async getGuildMember(userId) {
      const res = await fetchImpl(`${API}/guilds/${guildId}/members/${userId}`, { headers: { Authorization: `Bot ${botToken}` } });
      if (res.status === 404) return null;
      if (!res.ok) throw new DiscordError(`查詢公會成員失敗:HTTP ${res.status}`);
      return (await res.json()) as DiscordGuildMember;
    },
  };
}
