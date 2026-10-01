import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { SettingsVm } from '../core/settings-vm';
import { AvatarComponent } from '../ui/avatar';
import { IconComponent } from '../ui/icon';

/** 設定頁:帳號(登出入口,D-108)與提醒方式(D-72)。手機的「我的」分頁、桌機側欄的「設定」 */
@Component({
  selector: 'app-settings-page',
  imports: [NgTemplateOutlet, IconComponent, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  host: { style: 'display: contents' },
})
export class SettingsPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(SettingsVm);
  protected readonly auth = inject(Auth);

  constructor() {
    this.layout.pageTitle.set('我的');
    void this.vm.load();
  }
}
