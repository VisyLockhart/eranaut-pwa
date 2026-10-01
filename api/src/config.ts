// 啟動設定。缺少必要變數或格式錯誤時丟錯,服務啟動失敗(與 D-143 ① 同精神)。

export interface AppConfig {
  /** 公開來源,例如 https://eranaut.example.com(不含路徑)。同網域部署,Origin 檢查與 OAuth 回呼都用它(D-142 ①④) */
  publicOrigin: string;
  /** session / state cookie 的 Secure 旗標;正式環境 true,本機 http 開發設 COOKIE_SECURE=false(D-142 ②) */
  cookieSecure: boolean;
  /** 頻道 @ 提醒要發到的頻道 ID(D-72、D-129);未設定時頻道提醒會標記失敗 */
  reminderChannelId: string | null;
  discord: {
    clientId: string;
    clientSecret: string;
    /** 與 Eranarch 同一個 bot token,用來查公會成員(D-34、D-134) */
    botToken: string;
    guildId: string;
  };
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const v = env[key]?.trim();
  if (!v) throw new ConfigError(`缺少必要的環境變數 ${key}`);
  return v;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  let origin: string;
  try {
    origin = new URL(required(env, 'PUBLIC_ORIGIN')).origin;
  } catch (e) {
    if (e instanceof ConfigError) throw e;
    throw new ConfigError('PUBLIC_ORIGIN 不是有效的網址(例:https://eranaut.example.com)');
  }
  const channelId = env.REMINDER_CHANNEL_ID?.trim() || null;
  if (channelId !== null && !/^\d{17,20}$/.test(channelId)) {
    throw new ConfigError('REMINDER_CHANNEL_ID 格式錯誤(應為 17~20 位數字的頻道 ID)');
  }
  return {
    publicOrigin: origin,
    reminderChannelId: channelId,
    cookieSecure: env.COOKIE_SECURE?.trim().toLowerCase() !== 'false',
    discord: {
      clientId: required(env, 'DISCORD_CLIENT_ID'),
      clientSecret: required(env, 'DISCORD_CLIENT_SECRET'),
      botToken: required(env, 'DISCORD_BOT_TOKEN'),
      guildId: required(env, 'DISCORD_GUILD_ID'),
    },
  };
}

export function redirectUri(config: AppConfig): string {
  return `${config.publicOrigin}/api/auth/callback`;
}
