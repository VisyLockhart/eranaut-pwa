import { taipeiParts } from '../core/format';
import { splitMinutes } from './core/route';

/** 航行時間顯示,例:`1日10小時25分`;無法計算(速度 0)為「—」 */
export function formatTravel(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—';
  const { days, hours, minutes: m } = splitMinutes(minutes);
  return `${days > 0 ? `${days}日` : ''}${hours}小時${m}分`;
}

/** 返航時刻(台北時間,僅供參考的推算值),例:`10/09 14:30` */
export function formatReturn(nowMs: number, minutes: number): string {
  if (!Number.isFinite(minutes)) return '—';
  const t = taipeiParts(nowMs + minutes * 60_000);
  const p2 = (n: number): string => String(n).padStart(2, '0');
  return `${p2(t.mo)}/${p2(t.d)} ${p2(t.h)}:${p2(t.mi)}`;
}

/** 返航時刻拆成日期與時間兩行(摘要格上下排版用);無法計算為 null */
export function formatReturnParts(nowMs: number, minutes: number): { date: string; time: string } | null {
  const full = formatReturn(nowMs, minutes);
  if (full === '—') return null;
  const [date = '', time = ''] = full.split(' ');
  return { date, time };
}

import type { Selectability } from './core/route';

/** 不能選的原因(點到反灰的航點時顯示) */
export function offReason(state: Selectability, rankReq: number): string {
  switch (state) {
    case 'full': return '最多只能選 5 個航點';
    case 'rank': return `潛艇等級不足,這個航點需要 ${rankReq} 級`;
    case 'range': return '加進去會超過潛艇的航行距離上限';
    default: return '';
  }
}
