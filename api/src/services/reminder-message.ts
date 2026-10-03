// 提醒文案(D-147)。繁體中文,四種情境:逐艘/整批 × 返航/預先提醒。
// 時間用 Discord 官方的 `<t:unix:style>`:絕對時間 `t`、相對時間 `R`,依收訊者的時區與語言顯示。

export interface ReminderMessageInput {
  /** 逐艘(潛艇資料)或整批(艘數) */
  scope: { kind: 'submarine'; position: number; name: string | null } | { kind: 'batch'; count: number };
  workshopName: string;
  server: string;
  captain: string | null;
  /** 預先提醒(工坊 `notify_lead_minutes` > 0)。為 true 時顯示預計返航時間 */
  lead: boolean;
  /** 預先提醒顯示用:逐艘 = 該艇返航時間,整批 = 最晚返航時間 */
  returnAt: Date | null;
  /** 頻道版:第一行最前面加 `<@id>`;DM 為 null */
  mentionDiscordUserId: string | null;
}

const CIRCLED = ['①', '②', '③', '④'];
export const circled = (position: number): string => CIRCLED[position - 1] ?? String(position);

export function buildReminderMessage(m: ReminderMessageInput): string {
  const place = `${m.workshopName}(${m.captain ? `${m.server}・${m.captain}` : m.server})`;

  let title: string;
  let detail: string;
  if (m.scope.kind === 'submarine') {
    title = m.lead ? '⏳ 潛水艇即將返航' : '⚓ 潛水艇已返航';
    const sub = m.scope.name ? `${circled(m.scope.position)}「${m.scope.name}」` : circled(m.scope.position);
    detail = `${sub}・${place}`;
  } else {
    title = m.lead ? '⏳ 工坊的潛水艇即將全部返航' : '⚓ 工坊的潛水艇已全部返航';
    detail = `${place}・共 ${m.scope.count} 艘`;
  }

  const lines = [m.mentionDiscordUserId ? `<@${m.mentionDiscordUserId}> ${title}` : title, detail];
  if (m.lead && m.returnAt) {
    const unix = Math.floor(m.returnAt.getTime() / 1000);
    lines.push(`預計 <t:${unix}:t> 返航(<t:${unix}:R>)`);
  }
  return lines.join('\n');
}

const TAIPEI_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export interface PushMessageInput extends Omit<ReminderMessageInput, 'mentionDiscordUserId'> {
  /** 發送當下,用來算「約 N 分鐘後」 */
  now: Date;
  /** 同一艘或同一間工坊的新通知取代舊的 */
  tag: string;
}

/**
 * 瀏覽器推播文案(D-165):標題與內容用和 DM / 頻道相同的措辭,但不能用 Discord 的 `<t:…>` 時間戳(推播只能是純文字),
 * 預先提醒的返航時間改在伺服器算好:台北時間的時刻加「約 N 分鐘後」(相對時間不受時區影響)。
 * DM / 頻道的文案(`buildReminderMessage`)完全不變。
 */
export function buildPushMessage(m: PushMessageInput): { title: string; body: string; tag: string } {
  const [title, ...rest] = buildReminderMessage({ ...m, mentionDiscordUserId: null, returnAt: null }).split('\n');
  const lines = rest;
  if (m.lead && m.returnAt) {
    const minutes = Math.max(1, Math.ceil((m.returnAt.getTime() - m.now.getTime()) / 60_000));
    lines.push(`預計台北時間 ${TAIPEI_TIME.format(m.returnAt)} 返航(約 ${minutes} 分鐘後)`);
  }
  return { title: title!, body: lines.join('\n'), tag: m.tag };
}
