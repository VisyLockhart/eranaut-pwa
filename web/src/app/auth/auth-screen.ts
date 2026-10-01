import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Auth } from '../core/auth';
import { Layout } from '../core/layout';
import { IconComponent } from '../ui/icon';

interface FailCopy {
  title: string;
  desc: string;
  button: string;
  danger: boolean;
}

/**
 * 未登入時的所有畫面(D-108、D-123、D-142):迎賓頁、驗證中、登入失敗(依 login_error 換文案)、Session 過期、無法連線。
 * 手機與桌機各一套版面,依 768px 切換。
 */
@Component({
  selector: 'app-auth-screen',
  imports: [IconComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-screen.html',
})
export class AuthScreen {
  protected readonly auth = inject(Auth);
  protected readonly layout = inject(Layout);

  /** 要顯示哪一種畫面 */
  protected readonly screen = computed<'processing' | 'landing' | 'fail' | 'expired'>(() => {
    const status = this.auth.status();
    if (status === 'loading') return 'processing';
    if (status === 'expired') return 'expired';
    if (status === 'unreachable' || this.auth.loginError() !== null) return 'fail';
    return 'landing';
  });

  // 不放「請聯絡伺服器管理員」之類提示(D-123、D-143 ⑥);「XX 伺服器」用後端 .env 的顯示名稱
  protected readonly failCopy = computed<FailCopy>(() => {
    const g = this.auth.guildName();
    if (this.auth.status() === 'unreachable') {
      return { title: '無法連線', desc: '暫時連不上伺服器，請檢查網路連線後再試一次。', button: '重新整理', danger: true };
    }
    switch (this.auth.loginError()) {
      case 'not_in_guild':
        return { title: `你還不是 ${g} 的成員`, desc: `這個工具只提供給 ${g} 伺服器的成員使用，而你的 Discord 帳號目前不在該伺服器內。`, button: '重新嘗試登入', danger: false };
      case 'no_role':
        return { title: '尚未具備使用資格', desc: `你已在 ${g} 伺服器內，但帳號目前沒有使用這個工具所需的身份組。`, button: '重新嘗試登入', danger: false };
      case 'failed':
        return { title: '登入失敗', desc: '與 Discord 驗證時發生問題，請稍後再試一次。', button: '重新嘗試登入', danger: true };
      default:
        return { title: '登入未完成', desc: '你取消了 Discord 授權。如果改變主意，隨時可以重新登入。', button: '重新嘗試登入', danger: false };
    }
  });

  protected retry(): void {
    if (this.auth.status() === 'unreachable') void this.auth.init();
    else this.auth.login();
  }
}
