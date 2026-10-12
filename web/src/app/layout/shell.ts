import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppUpdate } from '../core/app-update';
import { Auth } from '../core/auth';
import { InstallPrompt } from '../core/install-prompt';
import { Layout } from '../core/layout';
import { INTRO_ENABLED } from '../demo/demo-routes';
import { AvatarComponent } from '../ui/avatar';
import { CopyrightComponent } from '../ui/copyright';
import { IconComponent } from '../ui/icon';

/** 登入後的外殼:手機 = 標頭 + 內容 + 底部導覽;桌機 = 側邊欄 + 內容(D-93、D-102) */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent, CopyrightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  host: { '(document:click)': 'closeMenu()', '(document:keydown.escape)': 'closeMenu()' },
  // 「海域介紹」入口(只有展示建置才會出現):琥珀色外框 + NEW 標籤,標籤閃三下後靜止
  styles: `
    .intro-link { color: #e6bd6a; font-weight: 700; border: 1px solid rgba(230, 189, 106, 0.55); background: linear-gradient(90deg, rgba(230, 189, 106, 0.2), rgba(230, 189, 106, 0.04)); margin-bottom: 8px; }
    .intro-link.active { background: linear-gradient(90deg, rgba(230, 189, 106, 0.32), rgba(230, 189, 106, 0.1)); color: #f3d28c; }
    .intro-new { margin-left: auto; font-size: 9.5px; letter-spacing: 0.1em; background: #e6bd6a; color: #06121a; padding: 1px 6px; border-radius: 3px; animation: intro-pulse 2.4s ease-in-out 3; }
    .d-sidebar.collapsed .intro-new { display: none; }
    .m-intro { color: #e6bd6a; position: relative; }
    .m-intro.active { color: #f3d28c; }
    .m-intro .intro-dot { position: absolute; top: 6px; right: calc(50% - 16px); width: 7px; height: 7px; border-radius: 50%; background: #e6bd6a; animation: intro-pulse 2.4s ease-in-out 3; }
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
  private readonly router = inject(Router);

  /** 手機右上角頭像選單(D-241):設定、登出 */
  protected readonly menuOpen = signal(false);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly onSettings = computed(() => this.url().split(/[?#]/)[0] === '/settings');

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
