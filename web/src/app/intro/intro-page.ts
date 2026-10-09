import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { Layout } from '../core/layout';

type TabId = 'intro' | 'join' | 'tour';

interface Feature {
  readonly title: string;
  readonly text: string;
  readonly locked: boolean;
}

const FONT_LINK_ID = 'intro-fonts';
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap';

/**
 * 「海域介紹」宣傳頁:只存在於展示建置(`demo/demo-routes.demo.ts` 才會註冊路由,正式版與私有 repo 不含),
 * 不同步回私有 repo。純靜態內容,三個子頁:海域簡介、加入辦法、Eranaut 導覽。
 * 風格刻意獨立於 Eranaut 本體(宣傳用),字型只在進入這頁時才載入。
 */
@Component({
  selector: 'app-intro-page',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './intro-page.html',
  styleUrl: './intro-page.scss',
  host: { style: 'display: contents' },
})
export class IntroPage {
  protected readonly layout = inject(Layout);
  private readonly doc = inject(DOCUMENT);

  protected readonly tab = signal<TabId>('intro');
  protected readonly copied = signal<'' | 'ok' | 'manual'>('');
  protected readonly linkCopied = signal<'' | 'ok' | 'manual'>('');
  protected readonly joinName = '純水與銀礦之詩, 靜謐海域交換所';

  protected readonly tabs: readonly { id: TabId; label: string }[] = [
    { id: 'intro', label: '海域簡介' },
    { id: 'join', label: '加入辦法' },
    { id: 'tour', label: 'Eranaut 導覽' },
  ];

  protected readonly features: readonly Feature[] = [
    { locked: true, title: '返航提醒,準時叫你', text: '時間到了推送 Discord 私訊、頻道 @,或手機與電腦的瀏覽器通知,三種可以同時開。可以設定提前幾分鐘提醒。' },
    { locked: true, title: '截圖自動辨識', text: '貼上遊戲截圖,或直接擷取視窗,一次讀出整個工坊的潛艇返航時間。不用逐艘手打,圖片也不會被保存。' },
    { locked: true, title: '你的資料,跨裝置同步', text: '工坊、潛艇、配置都存在你自己的帳號裡。電腦上記的,手機打開就在。每個人的資料彼此獨立,不會被別人看到。' },
    { locked: true, title: '儲存配置與條件組合', text: '把常用的潛艇配置、找路線的條件存起來,一鍵帶入,還能綁定到你的工坊潛艇。展示版只能試算,不能儲存。' },
    { locked: true, title: 'Discord 裡直接查艇', text: '在社群伺服器輸入 /eran submarines,就能看到自己名下潛艇的返航狀況,不必開網頁。' },
    { locked: false, title: '多工坊總覽與倒數', text: '所有工坊、所有潛艇依返航時間排好,最快回來的在最前面,倒數一目了然。可切換列表或卡片。' },
    { locked: false, title: '航線模擬器', text: '選航點、挑配件配置,算出航行時間、燃料與經驗;可以依練級、探索、掉落物找出最適合的路線與配置。' },
  ];

  protected readonly lockedFeatures = this.features.filter((f) => f.locked);
  protected readonly freeFeatures = this.features.filter((f) => !f.locked);

  constructor() {
    this.layout.pageTitle.set('海域介紹');
    this.loadFonts();
  }

  protected show(id: TabId): void {
    this.tab.set(id);
    this.doc.querySelector('.sea')?.scrollIntoView({ block: 'nearest' });
  }

  protected async copyName(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.joinName);
      this.copied.set('ok');
    } catch {
      const sel = this.doc.defaultView?.getSelection();
      const el = this.doc.getElementById('sea-join-name');
      if (sel && el) {
        const r = this.doc.createRange();
        r.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      this.copied.set('manual');
    }
  }

  /** 複製這一頁的分享連結(固定指向 /intro,連結預覽卡見 tools/make-intro-html.mjs) */
  protected async copyLink(): Promise<void> {
    const url = `${this.doc.location.origin}/intro`;
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied.set('ok');
    } catch {
      this.linkCopied.set('manual');
    }
  }

  private loadFonts(): void {
    if (this.doc.getElementById(FONT_LINK_ID)) return;
    const link = this.doc.createElement('link');
    link.id = FONT_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    this.doc.head.appendChild(link);
  }
}
