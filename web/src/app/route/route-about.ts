import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * 「資料來源與授權」說明(RS-18):航線資料集是第三方資料的整理結果,依 CC BY-NC-SA 3.0 釋出,不適用本專案的 MIT 授權。
 * 內容與 `data/NOTICE.md` 一致,兩處要一起改。
 */
@Component({
  selector: 'app-route-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="rt-about">
      <summary>資料來源與授權</summary>
      <div class="rt-about-body">
        <p>航點、距離、等級門檻與掉落物等資料取自<b>灰機 wiki「部队潜水艇小工具」</b>(標示 CC BY-NC-SA 3.0),其原始資料來源為 Lodestone 作者 <b>Eclair Falcie@Hades</b> 整理的潛水艇掉落一覽;繁體中文名稱與配件數值表另取自 GitHub 專案 Final-Fantasy-XIV-watre。</p>
        <p>本資料集經過整理與轉換(名稱改為繁體中文、只收繁中服已有的內容、等級上限 130),依
          <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/deed.zh_TW" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 3.0</a>
          釋出,<b>不適用本專案的 MIT 授權</b>;轉載或改作請保留來源說明、以相同授權分享,且不得商業使用。</p>
        <p>航行時間與返航時刻為依公式推算的結果,可能與遊戲差 1 分鐘;選取判斷只依潛艇等級與航行距離。</p>
        <p>非官方粉絲工具,與 SQUARE ENIX CO., LTD. 無關。FINAL FANTASY XIV 相關內容之權利屬原權利人所有。</p>
      </div>
    </details>
  `,
})
export class RouteAbout {}
