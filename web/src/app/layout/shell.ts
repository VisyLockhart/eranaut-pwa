import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppUpdate } from '../core/app-update';
import { Auth } from '../core/auth';
import { InstallPrompt } from '../core/install-prompt';
import { Layout } from '../core/layout';
import { INTRO_ENABLED } from '../demo/demo-routes';
import { Maintenance } from '../core/maintenance';
import { AvatarComponent } from '../ui/avatar';
import { CopyrightComponent } from '../ui/copyright';
import { IconComponent } from '../ui/icon';
import type { IconName } from '../ui/icons';
import { MaintenanceNotice } from '../ui/maintenance-notice';
import { Tip } from '../ui/tip';

/** 導覽的子項(D-295) */
interface NavChild {
  label: string;
  url: string;
  icon: IconName;
}
/** 有子選單的大類:配件(清單/製作)、更新(潛艇/海圖) */
interface NavGroup {
  id: 'gear' | 'update';
  label: string;
  icon: IconName;
  children: readonly NavChild[];
}
const GROUPS: readonly NavGroup[] = [
  { id: 'gear', label: '配件', icon: 'anvil', children: [{ label: '清單', url: '/gear', icon: 'list' }, { label: '製作', url: '/craft', icon: 'anvil' }] },
  { id: 'update', label: '更新', icon: 'camera', children: [{ label: '潛艇', url: '/update', icon: 'camera' }, { label: '海圖', url: '/charts', icon: 'seaChart' }] },
];

/** 登入後的外殼:手機 = 標頭 + 內容 + 底部導覽;桌機 = 側邊欄 + 內容(D-93、D-102) */
@Component({
  selector: 'app-shell',
  imports: [NgTemplateOutlet, Tip, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent, CopyrightComponent, MaintenanceNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  host: {
    '(document:click)': 'closeMenu()',
    '(document:keydown.escape)': 'onEscape()',
    '(document:pointerdown)': 'onDocPointer($event)',
  },
  // 「海域介紹」入口(只有展示建置才會出現):琥珀色外框 + NEW 標籤,標籤閃三下後靜止
  styles: `
    .intro-link { color: #e6bd6a; font-weight: 700; border: 1px solid rgba(230, 189, 106, 0.55); background: linear-gradient(90deg, rgba(230, 189, 106, 0.2), rgba(230, 189, 106, 0.04)); margin-bottom: 8px; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    .intro-link.active { background: linear-gradient(90deg, rgba(230, 189, 106, 0.32), rgba(230, 189, 106, 0.1)); color: #f3d28c; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    .intro-new { margin-left: auto; font-size: 9.5px; letter-spacing: 0.1em; background: #e6bd6a; color: #06121a; padding: 1px 6px; border-radius: 3px; animation: intro-pulse 2.4s ease-in-out 3; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    .d-sidebar.collapsed .intro-new { display: none; }
    .m-intro { color: #e6bd6a; position: relative; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    .m-intro.active { color: #f3d28c; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    .m-intro .intro-dot { position: absolute; top: 6px; right: calc(50% - 16px); width: 7px; height: 7px; border-radius: 50%; background: #e6bd6a; animation: intro-pulse 2.4s ease-in-out 3; } /* theme-exempt: 加入海域 連結固定用深海金色 */
    /* 淺色底上金色字看不清楚:只把文字與外框換成同色系的深金(仍是「加入海域」自己的顏色,不跟主題走) */
    :host-context(html[data-theme='light']) .intro-link, :host-context(html[data-theme='light']) .m-intro { color: #6e4d0f; } /* theme-exempt */
    :host-context(html[data-theme='light']) .intro-link { border-color: #6e4d0f; border-width: 2px; } /* theme-exempt */
    :host-context(html[data-theme='light']) .intro-link.active, :host-context(html[data-theme='light']) .m-intro.active { color: #4a3208; } /* theme-exempt */
    @keyframes intro-pulse { 50% { opacity: 0.4; } }
    @media (prefers-reduced-motion: reduce) { .intro-new, .m-intro .intro-dot { animation: none; } }
  `,
})
export class Shell {
  protected readonly auth = inject(Auth);
  protected readonly layout = inject(Layout);
  protected readonly install = inject(InstallPrompt);
  protected readonly up = inject(AppUpdate);
  protected readonly intro = INTRO_ENABLED;
  /** 伺服器維護橫幅(D-283):手機暫時取代底部聲明、桌機放在側欄;維護結束後恢復 */
  protected readonly maintenance = inject(Maintenance);
  private readonly router = inject(Router);
  constructor() {
    // 換頁:收起子選單,並恢復目前群組的展開
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => {
      this.openGroup.set(null);
      this.activeClosed.set(false);
    });
  }

  /** 手機右上角頭像選單(D-241):設定、登出 */
  protected readonly menuOpen = signal(false);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  private readonly path = computed(() => this.url().split(/[?#]/)[0]!);

  // ---- 子選單(D-295):桌機是側欄內往下展開、手機是底部列上方的面板;都用「點擊」,沒有 hover ----
  protected readonly groups = GROUPS;
  /** 目前頁面所在的群組(永遠保持展開) */
  protected readonly activeGroup = computed(() => GROUPS.find((g) => g.children.some((c) => c.url === this.path()))?.id ?? null);
  /** 使用者點開「看看」的群組;換頁、點側欄以外、Esc 都會收起。最多一個 */
  protected readonly openGroup = signal<NavGroup['id'] | null>(null);
  /** 使用者把目前所在的群組自己收起來了(換頁後恢復) */
  private readonly activeClosed = signal(false);

  /** 桌機展開的群組;收合成圖示列時只看 openGroup(子項在圖示下方展開,不顯示目前所在群組的展開區) */
  protected isOpen(id: NavGroup['id']): boolean {
    if (this.openGroup() === id) return true;
    return !this.layout.sidebarCollapsed() && this.activeGroup() === id && !this.activeClosed();
  }

  protected toggleGroup(id: NavGroup['id'], ev?: Event): void {
    ev?.stopPropagation();
    if (this.isOpen(id)) {
      if (this.openGroup() === id) this.openGroup.set(null);
      else this.activeClosed.set(true);
    } else {
      this.openGroup.set(id);
    }
  }

  /** 手機:點底部列的群組 → 開/關面板(不跳頁) */
  protected toggleSheet(id: NavGroup['id'], ev: Event): void {
    ev.stopPropagation();
    this.openGroup.update((cur) => (cur === id ? null : id));
  }

  private swipeY = 0;
  protected swipeStart(ev: TouchEvent): void {
    this.swipeY = ev.touches[0]?.clientY ?? 0;
  }
  /** 往下滑超過 40px 收起面板 */
  protected swipeEnd(ev: TouchEvent): void {
    const y = ev.changedTouches[0]?.clientY ?? this.swipeY;
    if (y - this.swipeY > 40) this.closeGroups();
  }

  protected group(id: NavGroup['id']): NavGroup {
    return GROUPS.find((g) => g.id === id)!;
  }

  protected closeGroups(): void {
    if (this.openGroup()) this.openGroup.set(null);
  }

  protected onEscape(): void {
    this.closeMenu();
    this.closeGroups();
  }

  /** 點側欄/底部列以外的地方:收起「看看」的群組(手機的面板由暗幕處理) */
  protected onDocPointer(ev: Event): void {
    if (!this.openGroup() || !(ev.target instanceof Element)) return;
    if (ev.target.closest('.d-sidebar, .m-nav-wrap')) return;
    this.openGroup.set(null);
  }


  protected toggleMenu(ev: Event): void {
    ev.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  /** 「檢查更新」:檢查時選單保持開著(顯示「檢查中…」),結果以提示呈現後再收起 */
  protected async checkUpdate(ev: Event): Promise<void> {
    ev.stopPropagation();
    await this.up.checkAndNotify();
    this.closeMenu();
  }

  protected closeMenu(): void {
    if (this.menuOpen()) this.menuOpen.set(false);
  }
}
