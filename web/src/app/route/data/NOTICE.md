# 航線模擬器資料集 — 授權與來源說明

本資料夾(`web/src/app/route/data/`)中的 `seas.json`、`items.json`、`parts.json`、`ranks.json` 為**第三方資料的整理與轉換結果**,**不適用本專案的 MIT 授權**,
依來源授權以 **CC BY-NC-SA 3.0**(姓名標示-非商業性-相同方式分享)釋出;轉載或改作請保留本說明並以相同授權分享,且不得商業使用。

## 來源

1. 灰機 wiki「部队潜水艇小工具」(https://ff14.huijiwiki.com/wiki/部队潜水艇小工具),頁面標示 CC BY-NC-SA 3.0。
   原始資料來源:Lodestone 作者 **Eclair Falcie@Hades** 的潛水艇掉落一覽整理文章:
   - 【潜水艦-溺没海】4.2～5.0 ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/3701758/
   - 【潜水艦-灰海】5.1～5.25 ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/4201474/
   - 【潜水艦-翠浪海】5.3～5.5ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/4506446/
   - 【潜水艦-セイレーン海】6.3ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/4994164/
   - 【潜水艦-紫礁海】6.4～7.0ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/5224529/
   - 【潜水艦-南蒼茫洋】7.3～ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/5481886/
   - 【潜水艦-北洋】7.5～ドロップ一覧:https://jp.finalfantasyxiv.com/lodestone/character/2199398/blog/5635462/
   取用內容:航點座標、等級門檻、距離與航行耗用、探索需求、經驗、燃料、中高階掉落物 ID、航點連線(由 unlocks 推得)。
2. GitHub `cxzzsf0896753245657-hue/Final-Fantasy-XIV-watre`(該 repo 未附授權條款):僅取用繁體中文名稱(航點、物品、配件)、配件數值表、等級獎勵表、重量上限與低階物品對照。

## 改動說明

- 名稱改為繁體中文;GitHub 沒有繁中名稱的項目以 wiki 簡中名簡轉繁補上(列於 TODO.md,尚待實機校正);完全查不到名稱的內容未收錄。
- 只收等級上限 130 以內的航點與等級;航點連線由 wiki 的 unlocks 欄位產生;距離矩陣僅保留收錄的航點。
- 欄位名稱與結構經重新命名與整理。

非官方粉絲工具。FINAL FANTASY XIV 相關內容之權利屬原權利人所有。
