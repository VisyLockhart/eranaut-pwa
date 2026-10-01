import type { Db } from '../db/index.js';
import type { Permissions } from '../auth/permissions.js';
import { resolveProfile, type DiscordClient } from '../discord/client.js';
import { createSession } from '../repo/sessions.js';
import { clearSuspension, createUser, findUserByDiscordId } from '../repo/users.js';

/** 登入失敗分類碼(D-142 ③),只放分類、不放個資 */
export type LoginError = 'denied' | 'failed' | 'not_in_guild' | 'no_role';

export type LoginResult = { ok: true; token: string; expiresAt: Date } | { ok: false; error: LoginError };

export interface LoginDeps {
  db: Db;
  discord: DiscordClient;
  permissions: Permissions;
  guildId: string;
  now: () => Date;
  /** 失敗原因只進 log(給部署者排錯),不回給使用者;不放 token 或 code */
  log?: { warn(obj: object, msg?: string): void };
}

/**
 * OAuth 回呼後的登入流程(D-34、D-130、D-134、D-136、D-143):
 * 1. code 換 Discord id(token 用完即丟)
 * 2. 用 bot token 查公會成員:不在伺服器 → not_in_guild;沒有任何符合規則的身份組 → no_role
 * 3. 通過才建立使用者(首次)或恢復「因失去資格而自動停用」者;不符資格者不建立任何列
 * 4. 建立 session,名稱與頭像暫存於其中(不入 users)
 */
export async function completeLogin(deps: LoginDeps, code: string): Promise<LoginResult> {
  const { db, discord, permissions, guildId, now, log } = deps;

  let discordUserId: string;
  let member;
  try {
    discordUserId = await discord.exchangeCodeForUserId(code);
    member = await discord.getGuildMember(discordUserId);
  } catch (e) {
    log?.warn({ event: 'login_failed', error: 'failed', cause: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: 'failed' };
  }

  if (!member) {
    log?.warn({ event: 'login_failed', error: 'not_in_guild', guildId });
    return { ok: false, error: 'not_in_guild' };
  }
  if (!permissions.can('member', member.roles)) {
    // 身份組 ID 不是機密;列出來方便對照 ELIGIBLE_ROLE_RULE
    log?.warn({ event: 'login_failed', error: 'no_role', memberRoleIds: member.roles });
    return { ok: false, error: 'no_role' };
  }

  let user = findUserByDiscordId(db, discordUserId);
  if (!user) {
    user = createUser(db, discordUserId, now());
  } else if (user.suspended_at !== null) {
    // 手動停權者即使仍符合資格也不得登入、每日比對也不會自動恢復(D-130 ④)。
    // 使用哪個失敗畫面 [待確認],暫用 no_role。
    if (user.suspended_auto === 0) return { ok: false, error: 'no_role' };
    // 自動停用者重新符合資格:登入當下即時恢復,資料原樣保留(D-130 ③)
    clearSuspension(db, user.id);
  }

  const profile = resolveProfile(member, guildId);
  const { token, expiresAt } = createSession(db, { userId: user.id, ...profile }, now());
  return { ok: true, token, expiresAt };
}
