# eranaut

Aequor Eranos 的網站(Angular PWA)+ 後端 API(Fastify)monorepo。private repo。

```
shared/  前後端共用常數與型別(SERVERS、DISTRICTS、notify_methods 位元、API 型別)
api/     Fastify API(公開埠 3000 / 內部埠 3001)
web/     Angular 前端(PWA)
```

專案文件(決策、schema、狀態)不在此 repo,見 Project「Aequor Eranos」。

## 開發

需要 Node 22。

```
npm install
npm test           # 建置 shared,跑 shared 與 api 的 node:test
npm run build
```

`.env` 不進 git,範本見 `.env.example`。
