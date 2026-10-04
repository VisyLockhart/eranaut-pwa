# Design notes

程式碼註解裡的 `D-xx`、`R-xx`、`SCHEMA §x` 是作者在開發期間維護的設計文件編號:

- **`D-xx`**:一條已拍板的設計決策(Decision),附理由。例如 `D-125` 是「OCR 引擎選 PP-OCRv4」。
- **`R-xx`**:被否決的方案(Rejected)與否決原因,避免重複討論同一個點子。
- **`SCHEMA §x`**:資料表與 API 契約文件的章節。

這些原始文件沒有隨 repo 公開(其中夾雜社群內部的細節)。這裡只摘要與程式碼最相關的決策,方便讀者理解註解的出處。型別層面的 API 契約都在 [`shared/src/api.ts`](../shared/src/api.ts)。

## 架構與資料

| 編號 | 決策 |
|---|---|
| D-10 | 所有資料存取經過同一個 API;Discord bot 也呼叫 API,不直接開 SQLite。原因:`better-sqlite3` 同步寫入,多個 process 同寫一個檔案會出問題,入口唯一也好稽核。 |
| D-22 | 後端用 Node.js + TypeScript + Fastify。 |
| D-131 | API 同一程序開兩個埠:公開埠給網站、內部埠給 bot(共用密鑰 Bearer 認證,不對外發佈)。兩者共用同一層 service / repository,差別只在認證與身份解析。 |
| D-136 | 所有資料表主鍵用 UUID v4(存 TEXT),不使用自動遞增整數。 |
| D-140 | 前後端放同一個 monorepo(npm workspaces:`api/`、`web/`、`shared/`),型別與固定常數只維護一份。 |
| D-141 | 前端用 Angular;PWA 的 service worker 只快取 app shell,API 一律 network-only。 |
| D-146 | 總覽用單一 `GET /api/overview` 一次取得所有工坊與潛艇,避免前端打 N 次請求。 |

## 認證與權限

| 編號 | 決策 |
|---|---|
| D-35 | 登入 session 採伺服器端 session cookie(DB 只存雜湊),不用 JWT + refresh token:單一 API 加 SQLite,無狀態驗證的優勢用不上,而且 session 可以即時撤銷。 |
| D-142 | 前端與 API 同網域、不做 CORS;cookie 用 `SameSite=Lax`;GET 端點不得有副作用;改資料的請求檢查 `Origin`;不做 CSRF token、不加 PKCE。 |
| D-143 | 「有資格的身份組」可設多個,規則用字串表達:`,` 為或、`+` 為且,例如 `A+B,C` = (A 且 B)或 C。規則只定義在 API 一處,網站登入、每日比對、bot 指令共用同一個判斷函式。 |
| D-130 | 失去資格(離開伺服器、被移除身份組)時標記停用而非刪除資料;每天比對一次成員名單,登入時另有一次即時檢查。 |

## OCR 與提醒

| 編號 | 決策 |
|---|---|
| D-125 | OCR 自架,不連外部服務;引擎用 PP-OCRv4(`@gutenye/ocr-node`),與 API 同一個 process。 |
| D-126 | 上傳的截圖辨識完不存檔,全程只在記憶體,因此不需要圖片回收排程。 |
| D-128 | 待發提醒存 SQLite 一張表,API 進程內每 30 秒輪詢,不用 Redis 或外部佇列。 |
| D-139 | 提醒以潛艇 / 工坊為鍵 upsert,只留最新一筆,資料量有上限,不需要另開清理排程。 |
| D-165 | 瀏覽器推播(Web Push,VAPID)作為第三種提醒方式,與 Discord 私訊、頻道 @ 並存;推播訂閱按裝置各自開關。 |

## 前端細節

| 編號 | 決策 |
|---|---|
| D-157 | 本機開發轉發改用自製 Node 代理 `web/dev.mjs`:在 Windows 上 Vite 內建的 proxy 會間歇出現 `ECONNRESET`,自製版經實測沒有失敗。 |
| D-164 | 介面大小(小 / 中 / 大)用 CSS `zoom` 整體縮放;`vh` / `vw` / safe-area 長度要除以另一個變數 `--vu-div`,因為 Safari 與 Chrome 對 `zoom` 下這些單位的處理不同。 |
| D-166 | 手機留白縮小、統計區與桌機側欄可收合、手機總覽下拉重新整理。偏好只存在該裝置的 `localStorage`。 |

## 慣例

- 資料庫時間一律存 UTC,台北時間在 API / 前端層轉換。
- 資料以使用者為單位隔離,任何查詢都不跨使用者。
- Commit message 採 Conventional Commits,說明「為什麼」。
