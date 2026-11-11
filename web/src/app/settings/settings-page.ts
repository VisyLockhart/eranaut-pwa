import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from '@eranaut/shared';
import { AppUpdate } from '../core/app-update';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { MOTION_MODES, MotionService } from '../core/motion';
import { PushVm } from '../core/push-vm';
import { SettingsVm } from '../core/settings-vm';
import { THEMES, ThemeService } from '../core/theme';
import { UI_SIZES, UiScale } from '../core/ui-scale';
import { IconComponent } from '../ui/icon';
import { NotifyWindow } from './notify-window';

export type SettingsSection = 'remind' | 'display' | 'about';
const OPEN_KEY = 'eranaut.settings.open';
/** 手機預設:提醒展開、顯示與關於收合(D-349) */
const DEFAULT_OPEN: Record<SettingsSection, boolean> = { remind: true, display: false, about: false };

function loadOpen(): Record<SettingsSection, boolean> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(OPEN_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      const r = raw as Record<string, unknown>;
      return {
        remind: typeof r['remind'] === 'boolean' ? r['remind'] : DEFAULT_OPEN.remind,
        display: typeof r['display'] === 'boolean' ? r['display'] : DEFAULT_OPEN.display,
        about: typeof r['about'] === 'boolean' ? r['about'] : DEFAULT_OPEN.about,
      };
    }
  } catch { /* 沒有儲存或被封鎖:用預設 */ }
  return { ...DEFAULT_OPEN };
}

/** 設定頁(D-349 版型):提醒(D-72;含這台裝置的推播 D-165)、顯示(主題 D-277、介面大小 D-164)、關於(版本與授權)。帳號資訊與登出在側欄 / 手機的使用者選單,不在這裡。手機的區塊可收合(狀態記在這台裝置),桌機一律展開 */
@Component({
  selector: 'app-settings-page',
  imports: [NgTemplateOutlet, RouterLink, IconComponent, NotifyWindow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-page.html',
  host: { style: 'display: contents' },
})
export class SettingsPage {
  protected readonly layout = inject(Layout);
  protected readonly vm = inject(SettingsVm);
  protected readonly auth = inject(Auth);
  protected readonly push = inject(PushVm);
  protected readonly scale = inject(UiScale);
  protected readonly themes = THEMES;
  protected readonly theme = inject(ThemeService);
  protected readonly up = inject(AppUpdate);
  protected readonly sizes = UI_SIZES;
  protected readonly motion = inject(MotionService);
  protected readonly version = APP_VERSION;
  protected readonly motionModes = MOTION_MODES;
  private readonly openState = signal<Record<SettingsSection, boolean>>(loadOpen());
  protected readonly themeLabel = computed(() => THEMES.find((x) => x.id === this.theme.theme())?.label ?? '');
  protected readonly sizeLabel = computed(() => UI_SIZES.find((x) => x.value === this.scale.size())?.label ?? '');

  /** 桌機一律展開;手機依這台裝置記住的狀態 */
  protected isOpen(id: SettingsSection): boolean {
    return this.layout.isDesktop() || this.openState()[id];
  }

  protected toggle(id: SettingsSection): void {
    if (this.layout.isDesktop()) return;
    this.openState.update((s) => ({ ...s, [id]: !s[id] }));
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(this.openState())); } catch { /* 寫不進去就只在這次有效 */ }
  }

  constructor() {
    this.layout.pageTitle.set('設定');
    void this.vm.load();
    void this.push.load();
  }
}
