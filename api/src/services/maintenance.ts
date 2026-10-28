// 驗證 Eranarch 送來的維護事件(D-283)。標題與連結來自外部網站,所以連結只允許官網網址、標題限長。
// 路由只處理 HTTP,規則放這裡(D-131 ③)。

export const MAINTENANCE_HOST = 'www.ffxiv.com.tw';
const ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;
const MAX_TITLE = 200;
const MAX_URL = 500;
const MAX_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
const MIN_MS = Date.UTC(2020, 0, 1);
const MAX_MS = Date.UTC(2100, 0, 1);

export interface ValidMaintenanceEvent {
  event: 'scheduled' | 'finished';
  id: string;
  title: string;
  url: string;
  startMs: number;
  endMs: number;
}

export type MaintenanceEventResult = { ok: true; value: ValidMaintenanceEvent } | { ok: false; field: string };

export function validateMaintenanceEvent(body: unknown): MaintenanceEventResult {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const bad = (field: string): MaintenanceEventResult => ({ ok: false, field });

  if (b.event !== 'scheduled' && b.event !== 'finished') return bad('event');
  if (typeof b.id !== 'string' || !ID_PATTERN.test(b.id)) return bad('id');
  if (typeof b.title !== 'string') return bad('title');
  const title = b.title.replace(/\s+/g, ' ').trim();
  if (title === '' || title.length > MAX_TITLE) return bad('title');
  if (title.includes('官網')) return bad('title'); // 官網維護不影響遊戲,不是 APP 要提醒的事

  if (typeof b.url !== 'string' || b.url.length > MAX_URL) return bad('url');
  let url: URL;
  try {
    url = new URL(b.url);
  } catch {
    return bad('url');
  }
  if (url.protocol !== 'https:' || url.hostname !== MAINTENANCE_HOST || url.username !== '' || url.password !== '') return bad('url');

  const { startMs, endMs } = b;
  if (typeof startMs !== 'number' || !Number.isSafeInteger(startMs) || startMs < MIN_MS || startMs > MAX_MS) return bad('startMs');
  if (typeof endMs !== 'number' || !Number.isSafeInteger(endMs) || endMs <= startMs || endMs > MAX_MS || endMs - startMs > MAX_DURATION_MS) return bad('endMs');

  return { ok: true, value: { event: b.event, id: b.id, title, url: url.href, startMs, endMs } };
}
