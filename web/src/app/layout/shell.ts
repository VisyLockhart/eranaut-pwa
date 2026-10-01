import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { AvatarComponent } from '../ui/avatar';
import { CopyrightComponent } from '../ui/copyright';
import { IconComponent } from '../ui/icon';

/** 登入後的外殼:手機 = 標頭 + 內容 + 底部導覽;桌機 = 側邊欄 + 內容(D-93、D-102) */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent, CopyrightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly auth = inject(Auth);
  protected readonly layout = inject(Layout);
}
