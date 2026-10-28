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
  /** 配件維修提醒(D-288):趟數已用盡、需要維修的潛艇。沒有或空陣列 = 不加這一行 */
  repair?: RepairNote[];
}

export interface RepairNote {
  position: number;
  voyagesDone: number;
  limit: number;
  /** 預估魔導機械修理材(整艘四個零件);算不出來為 null */
  materials: number | null;
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
  const repair = repairLine(m);
  if (repair) lines.push(repair);
  return lines.join('\n');
}

/** 維修提醒那一行(D-288);預先提醒(lead)時說「返航後」,返航提醒說「出航前」 */
function repairLine(m: ReminderMessageInput): string | null {
  const list = m.repair ?? [];
  if (list.length === 0) return null;
  const when = m.lead ? '返航後' : '出航前';
  const known = list.filter((r) => r.materials !== null);
  const total = known.reduce((sum, r) => sum + r.materials!, 0);
  const materials = known.length > 0 ? `(修理材料約 ${total} 個)` : '';
  if (m.scope.kind === 'submarine' && list.length === 1) {
    const r = list[0]!;
    return `🔧 配件已用滿 ${r.voyagesDone}/${r.limit} 趟,${when}需先維修${materials}。`;
  }
  return `🔧 ${when}需先維修:${list.map((r) => `${circled(r.position)}(${r.voyagesDone}/${r.limit} 趟)`).join('、')}${materials}。`;
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
