import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Layout } from '../core/layout';
import { COPYRIGHT_NAME } from '../ui/copyright';

export type LegalKind = 'privacy' | 'terms' | 'licenses';

const TITLES: Record<LegalKind, string> = { privacy: '隱私權政策', terms: '服務條款', licenses: '資料授權' };

/**
 * 聲明頁(D-308):隱私權政策、服務條款、資料授權各自獨立網址(/privacy、/terms、/licenses),未登入也能閱讀。
 * 內容是文字說明,必須與實際行為一致(見 DECISIONS D-34/35/126/130/134/138/142);改了行為就要回頭改這裡。
 * 「資料授權」要與 `route/data/NOTICE.md`、`craft/data/NOTICE.md` 一致。聯絡方式只有 Discord 伺服器(不公開信箱)。
 */
@Component({
  selector: 'app-legal-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .lg { max-width: 720px; margin: 0 auto; padding: 24px 18px 48px; color: var(--text); line-height: 1.8; font-size: 14px; }
    .lg-back { display: inline-block; margin-bottom: 14px; color: var(--accent); font-size: 13px; }
    .lg h1 { font-size: 22px; margin: 0 0 4px; }
    .lg h2 { font-size: 15.5px; margin: 26px 0 6px; }
    .lg p, .lg li { color: var(--text-muted); }
    .lg ul { padding-left: 20px; margin: 6px 0; }
    .lg a { color: var(--accent); }
    .lg-meta { color: var(--text-dim); font-size: 12px; margin-bottom: 18px; }
    .lg-nav { margin-top: 36px; padding-top: 14px; border-top: var(--bw) solid var(--border); display: flex; gap: 14px; flex-wrap: wrap; font-size: 13px; }
  `,
  template: `
    <article class="lg">
      <a class="lg-back" routerLink="/">← 回到 Eranaut</a>
      <h1>{{ title }}</h1>
      <div class="lg-meta">最後更新:2026-10-30 · Eranaut(Created by {{ author }})</div>

      @switch (kind) {
        @case ('privacy') {
          <p>這是 Eranaut 的<b>公開展示版</b>:沒有帳號、沒有登入,也沒有後端伺服器。畫面上的潛艇、工坊與辨識結果都是模擬資料。</p>

          <h2>資料存放在哪裡</h2>
          <p>你在展示版操作產生的內容(例如主題、介面大小、工坊順序、製作清單與模擬資料的快照)只存在<b>你自己瀏覽器的本機儲存空間</b>(localStorage)。這些資料不會傳送到我們,清除瀏覽器網站資料就會消失。</p>

          <h2>我們不蒐集的資料</h2>
          <ul>
            <li>不蒐集帳號、Discord 資料、個人識別資訊。</li>
            <li>截圖辨識功能在展示版是模擬的:你選的圖片<b>不會被讀取或上傳</b>。</li>
            <li>不使用廣告、追蹤或分析用的 cookie。</li>
          </ul>

          <h2>第三方服務</h2>
          <p>載入字型時,你的瀏覽器會向 <b>Google Fonts</b> 請求字型檔,適用 Google 自己的隱私權政策。靜態網頁的代管服務也可能依其慣例記錄一般的連線紀錄(如 IP 位址)。</p>

          <h2>正式版</h2>
          <p>社群內部使用的正式版需要用 Discord 登入,會儲存你的 Discord user id 與你輸入的遊戲資料;那是另一個服務,有它自己的隱私權政策。</p>

          <h2>聯絡</h2>
          <p>有任何問題請到社群的 Discord 伺服器聯絡作者({{ author }})。</p>
        }
        @case ('terms') {
          <p>使用 Eranaut 即表示你同意以下條款。</p>

          <h2>1. 非官方工具</h2>
          <p>Eranaut 是玩家自製的非官方工具,與 SQUARE ENIX CO., LTD. 無關。FINAL FANTASY XIV 及相關名稱、內容之權利屬原權利人所有。</p>

          <h2>2. 使用對象與用途</h2>
          <p>公開展示版開放瀏覽與試用,僅供<b>非商業</b>的個人與社群使用,<b>不得用於商業用途</b>。正式版僅供指定 Discord 伺服器的社群成員<b>內部使用</b>。請勿將本工具或其資料轉售或出租。</p>

          <h2>3. 你的責任</h2>
          <ul>
            <li>請自行確認輸入的資料正確;回港時間、升級與航線結果是依公式推算,可能與遊戲內差 1 分鐘,僅供參考。</li>
            <li>請勿以自動化或不當方式干擾服務、嘗試取得他人資料或繞過登入限制。</li>
          </ul>

          <h2>4. 服務現況</h2>
          <p>本服務以現況提供,不保證不中斷或無錯誤,也不對因使用或無法使用而造成的損失負責(例如漏看收艇時間)。服務可能隨時調整、暫停或終止。</p>

          <h2>5. 帳號與資料</h2>
          <p>我們可以因資格不符或違反本條款而停用存取。資料的處理方式請見<a routerLink="/privacy">隱私權政策</a>;資料與素材的來源與授權請見<a routerLink="/licenses">資料授權</a>。</p>

          <h2>6. 條款變更與聯絡</h2>
          <p>條款可能更新,更新後繼續使用即視為同意。有任何問題請到社群 Discord 伺服器聯絡作者({{ author }})。</p>
        }
        @case ('licenses') {
          <p>Eranaut 使用多份第三方整理的資料。以下是各項資料的來源與授權;本專案程式碼本身採 MIT 授權,<b>不涵蓋下列資料</b>。</p>

          <h2>航線資料集(CC BY-NC-SA 3.0)</h2>
          <p>航點、距離、等級門檻與掉落物等資料取自<b>灰機 wiki「部队潜水艇小工具」</b>(標示 CC BY-NC-SA 3.0),其原始資料來源為 Lodestone 作者 <b>Eclair Falcie@Hades</b> 整理的潛水艇掉落一覽。繁體中文名稱參考 GitHub 專案 <code>cxzzsf0896753245657-hue/Final-Fantasy-XIV-watre</code>(未標示授權)。</p>
          <p>本資料集經過整理與轉換(名稱改為繁體中文、只收繁中服已有的內容、等級上限 130),依
            <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/deed.zh_TW" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 3.0</a>
            釋出,<b>不適用本專案的 MIT 授權</b>。轉載或改作請保留來源說明、以相同授權分享,且<b>不得商業使用</b>。</p>
          <p>航行時間與返航時刻為依公式推算的結果,可能與遊戲差 1 分鐘;選取判斷只依潛艇等級與航行距離。</p>

          <h2>升級經驗與驗證資料</h2>
          <p>各等級升級所需經驗與航點座標驗證資料,取自開源專案 <a href="https://github.com/xivapi/ffxiv-datamining" target="_blank" rel="noopener noreferrer">xivapi/ffxiv-datamining</a> 的資料表。升級攻略的內容為社群中流傳的整理,原作者不詳。</p>

          <h2>製作資料集</h2>
          <p>製作計算相關資料的來源與授權,請見專案內 <code>craft/data/NOTICE.md</code> 的說明。</p>

          <h2>使用限制與權利歸屬</h2>
          <p>上述資料僅供社群內部、非商業使用。Eranaut 為非官方工具,與 SQUARE ENIX CO., LTD. 無關;FINAL FANTASY XIV 相關內容之權利屬原權利人所有。</p>
        }
      }

      <nav class="lg-nav" aria-label="聲明頁面">
        <a routerLink="/licenses">資料授權</a>
        <a routerLink="/privacy">隱私權政策</a>
        <a routerLink="/terms">服務條款</a>
      </nav>
    </article>
  `,
})
export class LegalPage {
  protected readonly kind = inject(ActivatedRoute).snapshot.data['legal'] as LegalKind;
  protected readonly title = TITLES[this.kind];
  protected readonly author = COPYRIGHT_NAME;

  constructor() {
    inject(Layout).pageTitle.set(this.title);
    document.title = `${this.title} · Eranaut`;
  }
}
