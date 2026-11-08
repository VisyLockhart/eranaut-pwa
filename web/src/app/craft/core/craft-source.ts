import sourcesJson from '../data/sources.json';

/**
 * 素材的其他取得管道(D-333):商人 / 友好部族購買、軍票 / 巧手紫票 / 詩學兌換、空賊黃銅 / 白鋼、薰衣草 / 風茄。
 * 資料是灰機 wiki 的事實整理(tools/craft-data/sources.mjs;CC BY-NC-SA 3.0,見 ../data/NOTICE.md),
 * 不適用 MIT。其他貨幣(栎木幣等)已整理在 `hidden`,畫面不顯示。
 */

export type SrcKey = 'merchant' | 'tribe' | 'script' | 'purple' | 'poetics' | 'brass' | 'steel' | 'lavender' | 'nightshade';
export type SrcIcon = 'srcCoin' | 'srcSwap';

/** 詳情的一行:主文字 + 副文字(地點座標、條件) */
export interface SrcLine {
  head: string;
  sub?: string;
}
export interface SrcTag {
  key: SrcKey;
  /** 錢幣 = 用 Gil 買;交換 = 用物品換 */
  icon: SrcIcon;
  /** 需要完成任務才能買(畫鎖與虛線框,文字也寫「需解鎖」,不只靠顏色) */
  locked: boolean;
  /** 標籤文字,例如「商人 3 Gil · 9 處」「薰衣草 1:4 · 約 3 個」 */
  text: string;
  /** 詳情標題,例如「商人購買」 */
  title: string;
  lines: SrcLine[];
  /** 詳情最多列出的行數之外,還有幾行沒列 */
  more: number;
}

interface Place {
  npc: string;
  area: string;
  x: number;
  y: number;
}
interface Vendor extends Place {
  title?: string;
  req?: string;
}
type Src =
  | { t: 'shop'; price: number; tribe: boolean; v: Vendor[] }
  | { t: 'script'; get: number; cost: number; nat: { cur: string; rank: string; npc: string; area: string; x: number; y: number }[] }
  | { t: 'purple'; get: number; cost: number; req?: string; at: Place[] }
  | { t: 'poetics'; get: number; cost: number; req?: string; at: Place[] }
  | { t: 'brass'; ratio: number }
  | { t: 'steel'; ratio: number }
  | { t: 'lavender'; ratio: number }
  | { t: 'nightshade'; ratio: number };

const ITEMS = (sourcesJson as unknown as { items: Record<string, Src[]> }).items;

/** 顯示順序固定:商人 → 部族 → 軍票 → 紫票 → 詩學 → 空賊黃銅 / 白鋼 → 薰衣草 / 風茄 */
const ORDER: readonly SrcKey[] = ['merchant', 'tribe', 'script', 'purple', 'poetics', 'brass', 'steel', 'lavender', 'nightshade'];
/** 詳情每個來源最多列出幾行(其餘折成「另有 N 處」) */
export const MAX_LINES = 4;

const RATIO_NAME = {
  brass: { label: '空賊黃銅', cur: '空賊黃銅通貨' },
  steel: { label: '空賊白鋼', cur: '空賊白鋼通貨' },
  lavender: { label: '薰衣草', cur: '阿爾基克薰衣草' },
  nightshade: { label: '風茄', cur: '虛無界風茄' },
} as const;

const at = (p: { area: string; x: number; y: number }): string => `${p.area} X:${p.x} Y:${p.y}`;
const gil = (n: number): string => n.toLocaleString('en-US');
const cut = (lines: SrcLine[]): { lines: SrcLine[]; more: number } => ({ lines: lines.slice(0, MAX_LINES), more: Math.max(0, lines.length - MAX_LINES) });

/**
 * 需要的通貨數:總需求 ÷ 比值(1 個通貨換幾個素材),四捨五入,至少 1 個。
 * 比值 1(留白)= 1:1。
 */
export function currencyNeeded(need: number, ratio: number): number {
  const r = ratio > 0 ? ratio : 1;
  return Math.max(1, Math.round(need / r));
}

export function hasSource(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(ITEMS, name);
}

const cache = new Map<string, SrcTag[]>();

/** 這個素材的所有取得管道(同時符合多個就全部列出);need = 該列目前的需求數量,用來換算比值類的通貨數 */
export function sourceTags(name: string, need: number): SrcTag[] {
  const key = `${name}|${need}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const tags = build(name, need);
  cache.set(key, tags);
  return tags;
}

function build(name: string, need: number): SrcTag[] {
  if (!hasSource(name)) return [];
  const out: SrcTag[] = [];
  const groups = new Map<'purple' | 'poetics', { cost: number; rows: SrcLine[] }>();
  for (const s of ITEMS[name]!) {
    if (s.t === 'shop') {
      const free = s.v.filter((v) => !v.req);
      const locked = free.length === 0;
      const rows: SrcLine[] = [...free, ...s.v.filter((v) => v.req)].map((v) => ({
        head: v.title ? `${v.npc}(${v.title})` : v.npc,
        sub: `${at(v)}${v.req ? ` · 需完成任務:${v.req}` : ''}`,
      }));
      const n = s.v.length;
      out.push({
        key: s.tribe ? 'tribe' : 'merchant',
        icon: 'srcCoin',
        locked,
        text: `${s.tribe ? '部族' : '商人'} ${gil(s.price)} Gil${!s.tribe && n > 1 ? ` · ${n} 處` : ''}${locked ? ' 需解鎖' : ''}`,
        title: s.tribe ? '友好部族購買' : '商人購買',
        ...cut(rows.map((r, i) => (i === 0 ? { ...r, head: `${gil(s.price)} Gil · ${r.head}` } : r))),
      });
    } else if (s.t === 'script') {
      out.push({
        key: 'script',
        icon: 'srcSwap',
        locked: false,
        text: `軍票 ×${s.cost}`,
        title: '軍票兌換',
        ...cut(s.nat.map((n) => ({ head: `${n.cur} ×${s.cost}`, sub: `${n.npc} · ${at(n)} · 軍階 ${n.rank}` }))),
      });
    } else if (s.t === 'purple' || s.t === 'poetics') {
      const head = s.t === 'purple' ? `巧手紫票 ×${s.cost}` : `亞拉戈詩學神典石 ×${s.cost}`;
      const rows: SrcLine[] = s.at.map((p) => ({ head: `${head} · ${p.npc}`, sub: `${at(p)}${s.req ? ` · 需完成任務:${s.req}` : ''}` }));
      // 同一種貨幣有兩組(例如有一組要完成任務):合併成同一個標籤,詳情把兩組的地點接在一起
      const prev = groups.get(s.t);
      if (prev) prev.rows.push(...rows);
      else groups.set(s.t, { cost: s.cost, rows });
    } else {
      const nm = RATIO_NAME[s.t];
      const c = currencyNeeded(need, s.ratio);
      out.push({
        key: s.t,
        icon: 'srcSwap',
        locked: false,
        text: s.ratio > 1 ? `${nm.label} 1:${s.ratio} · 約 ${c} 個` : `${nm.label} ×${c}`,
        title: `${nm.label}兌換`,
        lines: [{ head: `${nm.cur} ×1 換 ${s.ratio} 個`, sub: `遊戲內「以物易物」 · 需求 ${need} → 約 ${c} 個` }],
        more: 0,
      });
    }
  }
  for (const [k, g] of groups) {
    out.push({ key: k, icon: 'srcSwap', locked: false, text: `${k === 'purple' ? '紫票' : '詩學'} ×${g.cost}`, title: k === 'purple' ? '巧手紫票兌換' : '詩學兌換', ...cut(g.rows) });
  }
  return out.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
}

/** 列表圖示的提示文字:一行一種來源 */
export function sourceTip(tags: readonly SrcTag[]): string {
  return tags.map((t) => t.text).join('\n');
}
