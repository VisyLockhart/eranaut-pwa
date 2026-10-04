# eranaut-pwa

> An installable **PWA + Fastify API** for tracking FFXIV submarine return times across multiple workshops, with Discord login, Discord/Web Push reminders and self-hosted OCR of game screenshots. Built and run for a ~128-member Discord community.

Eranaut 是為 FFXIV 潛水艇公會社群做的工具:成員記錄自己名下多個工坊、各艘潛水艇的返航時間,並在返航前收到提醒。這個 repo 是它的正式版(前端 + 後端 monorepo),目前部署在一台 Mac mini 上,供社群成員實際使用。

- 想先看畫面:[早期 prototype(假資料、免登入)](https://github.com/VisyLockhart/eranaut-demo-page)
- 配套的 Discord bot:[`eranarch-bot`](https://github.com/VisyLockhart/eranarch-bot)(暱稱同步,開源版)

## 功能

- **Discord OAuth2 登入**,並以 bot 查詢公會成員與身份組決定誰有資格使用(規則可寫成 AND / OR 組合)。
- **總覽**:所有工坊與潛水艇依返航時間排序,倒數與「最快返航」。
- **工坊管理**:新增、編輯、刪除,拖曳與按鈕排序(滑鼠與觸控)。
- **更新潛艇**:手動輸入,或上傳 / 貼上 / 擷取遊戲截圖交給自架 OCR 辨識,辨識結果可逐艘核對後再送出。
- **提醒**:Discord 私訊、頻道 @、瀏覽器推播(Web Push)三種方式可複選,返航前依設定提前通知。
- **PWA**:可加到手機主畫面,service worker 只快取 app shell,API 一律走網路。
- **介面**:純深色主題、手機與桌機版面、小 / 中 / 大三種介面大小、手機統計區與桌機側欄可收合、下拉重新整理。

## 架構

```
shared/  前後端共用的常數與型別(固定選項、提醒方式位元旗標、API 請求 / 回應型別)
api/     Fastify API:公開埠(網站用)與內部埠(Discord bot 用),共用同一層 service / repository
web/     Angular 前端(PWA)
```

- 後端:Node.js + TypeScript + Fastify、SQLite(`better-sqlite3`)、`web-push`、排程用 `toad-scheduler`。
- OCR:自架,不連外部服務。`@gutenye/ocr-node`(PP-OCRv4,透過 `onnxruntime-node`)跑在 API 同一個 process,圖片只在記憶體中處理、不落地。
- 認證:Discord OAuth2 Authorization Code Grant,換 token 在後端;伺服器端 session cookie(只存雜湊)、`SameSite=Lax`、Origin 檢查、前端與 API 同網域所以不需要 CORS。
- 提醒:待發提醒存 SQLite,API 進程內每 30 秒輪詢發送;每日一次比對成員資格,失去資格者標記停用而非刪資料。
- 部署:Docker Compose;Cloudflare Tunnel 加 Caddy(Caddy 同時提供前端靜態檔與轉發 `/api`),主機上沒有開任何對外 port。這些部署檔不在本 repo,只有 `api/Dockerfile`、`web/Dockerfile` 與 `web/Caddyfile`。

## 開發

需要 Node 22。

```
npm install
npm test           # 建置 shared,跑 shared 與 api 的 node:test
npm run build
```

- 後端測試使用 Node.js 內建的 `node:test`,沒有額外的測試框架。
- 前端單元測試:`npm test -w web`。
- 本機開發:`npm start -w web` 會啟動自製的轉發器 `web/dev.mjs`,把 `/api` 轉到本機 API,保持同源。
- 設定:複製 `.env.example` 為 `.env` 並填入自己的 Discord 應用程式與 bot 資訊。`.env` 不進 git。要實際登入需要自己的 Discord 應用程式、bot 與伺服器。

## 程式碼裡的 `D-xx` 與 `SCHEMA §`

程式碼註解常出現 `D-125`、`SCHEMA §8.1` 這類標記,它們是作者維護的設計文件編號,說明「為什麼這樣做」。這些原始文件沒有隨 repo 公開,可閱讀 [`docs/DESIGN-NOTES.md`](docs/DESIGN-NOTES.md) 了解慣例與主要決策摘要。

## 聲明

非官方粉絲工具,與 SQUARE ENIX CO., LTD. 無關,僅供社群使用。

授權:[MIT](LICENSE)。Created by Visy Lockhart (Winter@迦樓羅).
