import type { SubmarineDto } from '@eranaut/shared';

// 潛艇時間的顯示規則(沿用 demo 的 buildDisplay)。時間一律以台北時間(GMT+8)顯示(D-46:DB 存 UTC,轉換在前端)。

const TZ = 'Asia/Taipei';
const DAY_MS = 86_400_000;
const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface Parts {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
}

export function taipeiParts(ms: number): Parts {
  const p: Record<string, string> = {};
  for (const part of partsFormat.formatToParts(new Date(ms))) p[part.type] = part.value;
  return { y: Number(p['year']), mo: Number(p['month']), d: Number(p['day']), h: Number(p['hour']), mi: Number(p['minute']) };
}

export interface SubDisplay {
  /** 例:`2 時 14 分`;已完成為「可收艇」 */
  time: string;
  /** 去掉空白的短版,例:`2時14分` */
  shortTime: string;
  /** 完整預計返航,例:`09/28 18:56`;已完成為「－」 */
  eta: string;
  /** 當天只顯示時分、隔天加「明」、更遠顯示月/日 */
  shortEta: string;
  label: string;
  hint: string;
}

const CIRCLED = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
export function circled(position: number): string {
  return CIRCLED[position] || `#${position}`;
}

/** 潛艇是否可收:標記完成,或預計返航時間已到(前端倒數到 0 即視為可收,不必等重新抓資料) */
export function isReady(sub: Pick<SubmarineDto, 'status' | 'expected_return_at'>, now: number): boolean {
  if (sub.status === 'complete') return true;
  return sub.expected_return_at !== null && Date.parse(sub.expected_return_at) <= now;
}

export function formatRemaining(mins: number): string {
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d} 日 ${h} 時 ${pad2(m)} 分`;
  if (h > 0) return `${h} 時 ${pad2(m)} 分`;
  return `${m} 分`;
}

export function displayFor(ready: boolean, etaMs: number | null, now: number): SubDisplay {
  if (ready) return { time: '可收艇', shortTime: '可收艇', eta: '－', shortEta: '－', label: '探索完成', hint: '前往收艇' };
  if (etaMs === null) return { time: '－', shortTime: '－', eta: '－', shortEta: '－', label: '探索中', hint: '－' };

  // 無條件進位到分鐘:最後不滿一分鐘仍顯示「1 分」,倒數到 0 才變可收
  const mins = Math.max(1, Math.ceil((etaMs - now) / 60_000));
  const time = formatRemaining(mins);
  const at = taipeiParts(etaMs);
  const today = taipeiParts(now);
  const hhmm = `${pad2(at.h)}:${pad2(at.mi)}`;
  const md = `${pad2(at.mo)}/${pad2(at.d)}`;
  const dayDiff = Math.round((Date.UTC(at.y, at.mo - 1, at.d) - Date.UTC(today.y, today.mo - 1, today.d)) / DAY_MS);
  return {
    time,
    shortTime: time.replace(/ /g, ''),
    eta: `${md} ${hhmm}`,
    shortEta: dayDiff === 0 ? hhmm : dayDiff === 1 ? `明${hhmm}` : md,
    label: '探索中',
    hint: dayDiff === 0 ? `約 ${hhmm}` : dayDiff === 1 ? `明 ${hhmm}` : `${md} ${hhmm}`,
  };
}
