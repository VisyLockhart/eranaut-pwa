import { Injectable, signal } from '@angular/core';
import { readJson, writeJson } from './storage';

/** 主題(D-277、D-279):經典(原本的深色)、淺色(像素風)、深色(鐵灰藍・中世紀)、手札(莫蘭迪・手寫筆記)。不做「跟隨系統」這一項;新使用者首次只在淺色/深色之間依系統決定。
 *  切換主題只改 data-theme、字型與 meta,絕不碰 service worker 與推播訂閱(推播綁在 service worker 註冊上,見 push-vm.ts)。 */
export type ThemeId = 'classic' | 'light' | 'dark' | 'notebook';

export interface ThemeInfo {
  readonly id: ThemeId;
  readonly label: string;
  /** 設定頁色票(背景、面板、強調色);色票是主題的「樣品」,不隨目前主題改變 */
  readonly swatch: readonly [string, string, string];
  /** 瀏覽器網址列 / 狀態列顏色(meta theme-color);index.html 的開機前小腳本有同一組,兩處要一起改 */
  readonly chrome: string;
  /** 這個主題額外需要的網頁字型(Google Fonts);經典沿用原本字型,不載入。index.html 的開機前小腳本有同一組網址 */
  readonly fonts?: string;
}

export const THEMES: readonly ThemeInfo[] = [
  { id: 'classic', label: '經典', swatch: ['#070a14', '#0f1526', '#2dd4bf'], chrome: '#070a14' },
  { id: 'light', label: '淺色', swatch: ['#eef4fc', '#ffffff', '#0a6cc8'], chrome: '#eef4fc',
    fonts: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=DotGothic16&family=Silkscreen:wght@400;700&display=swap' },
  { id: 'dark', label: '深色', swatch: ['#111923', '#263446', '#c9a85c'], chrome: '#111923',
    fonts: 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@500;700;900&family=Cinzel:wght@500;700&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@1,600&display=swap' },
  /* 手札:色票依序是「書脊、封面、標籤」(設定頁把它畫成一本筆記本);chrome 是頂端苔綠色帶 */
  { id: 'notebook', label: '手札', swatch: ['#4a5f42', '#a8b79b', '#faf7ef'], chrome: '#4a5f42',
    fonts: 'https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@300;400;700&family=Caveat:wght@500;700&family=Patrick+Hand&display=swap' },
];

/** localStorage 鍵;index.html 的開機前小腳本也讀這個鍵(並做同一個「全新使用者」判斷),兩處要一起改 */
export const THEME_KEY = 'eranaut.theme';
/** 判斷「全新使用者」的前綴:本站任何 `eranaut.` 開頭的鍵都算舊設定(例如已存的快取、介面大小、工坊順序) */
const KEY_PREFIX = 'eranaut.';

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v);
}

/**
 * 決定開機主題(D-277 ①):
 * - 已存的主題 → 用它;
 * - 沒存過、但本站已有其他 `eranaut.` 設定(既有使用者升級)→ 經典,畫面不因升級而改變;
 * - 沒存過、也沒有任何舊設定(全新使用者)→ 依系統配色:淺色系統用淺色,其他用深色。
 */
export function resolveInitialTheme(stored: unknown, hasOtherKeys: boolean, systemPrefersLight: boolean): ThemeId {
  if (isThemeId(stored)) return stored;
  if (hasOtherKeys) return 'classic';
  return systemPrefersLight ? 'light' : 'dark';
}

function hasOtherEranautKeys(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX) && k !== THEME_KEY) return true;
    }
  } catch {
    // 讀不到就當沒有
  }
  return false;
}

function systemPrefersLight(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
  } catch {
    return false;
  }
}

/**
 * 主題的狀態與套用:`data-theme` 寫在根元素,樣式表用 `html[data-theme='…']` 換整組 token;
 * 切換時立即生效、不需重新整理,偏好只存這台裝置(同介面大小的作法)。
 * 切換的那一瞬間暫停所有 transition / animation(`theme-switching`),避免整個畫面慢慢漸變或元件各自跳不同步。
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeId>(this.load());

  constructor() {
    this.apply(false);
  }

  set(id: ThemeId): void {
    if (id === this.theme()) return;
    this.theme.set(id);
    writeJson(THEME_KEY, id);
    this.apply(true);
  }

  private load(): ThemeId {
    const stored = readJson<unknown>(THEME_KEY);
    const id = resolveInitialTheme(stored, hasOtherEranautKeys(), systemPrefersLight());
    // 第一次決定就存起來:之後以這個為準,不再看系統配色(使用者決定:只有首次依系統)
    if (!isThemeId(stored)) writeJson(THEME_KEY, id);
    return id;
  }

  private apply(animateGuard: boolean): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (animateGuard) {
      root.classList.add('theme-switching');
      // 兩個 frame 之後樣式已重算完,才恢復動畫
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
    }
    root.setAttribute('data-theme', this.theme());
    const info = THEMES.find((t) => t.id === this.theme())!;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', info.chrome);
    loadThemeFonts(info.fonts);
    applyFavicon(this.theme());
  }
}

/**
 * 分頁圖示(D-280):非經典主題把 <link rel="icon"> 換成該主題的 favicon(public/icons/fav-<主題>.png),經典還原 index.html 原本的宣告。
 * 只影響目前這個分頁;主畫面圖示、安裝後的 App 圖示由 manifest 與 apple-touch-icon 決定,不隨主題變。index.html 的開機前小腳本做同一件事。
 */
function applyFavicon(id: ThemeId): void {
  for (const link of Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'))) {
    const d = link.dataset;
    if (d['origHref'] === undefined) {
      d['origHref'] = link.getAttribute('href') ?? '';
      d['origType'] = link.getAttribute('type') ?? '';
      d['origSizes'] = link.getAttribute('sizes') ?? '';
    }
    const set = (name: string, value: string): void => (value ? link.setAttribute(name, value) : link.removeAttribute(name));
    if (id === 'classic') {
      set('href', d['origHref']);
      set('type', d['origType'] ?? '');
      set('sizes', d['origSizes'] ?? '');
    } else {
      set('href', `icons/fav-${id}.png`);
      set('type', 'image/png');
      set('sizes', '64x64');
    }
  }
}

/** 載入主題字型:同一個網址只加一次 <link>;切回經典不移除(已載入的字型留著,下次切換不必重抓) */
function loadThemeFonts(href: string | undefined): void {
  if (!href || document.querySelector(`link[data-theme-fonts="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-theme-fonts', href);
  document.head.appendChild(link);
}
