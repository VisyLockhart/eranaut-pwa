# build context = repo root(要讀 shared/,D-140)
# glibc 基底:onnxruntime-node 需要(D-127)
FROM node:22-bookworm-slim AS build
# onnxruntime-node 的安裝腳本在 linux/x64 會從 nuget 下載 CUDA 檔(我們只用 CPU);arm64 本來就不下載。一律跳過,CPU 二進位已內含在套件裡(D-125)
ENV ONNXRUNTIME_NODE_INSTALL=skip
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
# better-sqlite3 在 linux/arm64 沒有可用的預編譯檔時會退回 node-gyp 現場編譯,slim 映像沒有工具鏈,
# 所以要裝 python3 / make / g++(2026-10-02 在 Mac mini arm64 實測發現)。裝完同一層清掉,不留在映像裡
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --workspace=shared --workspace=api --include-workspace-root \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/* /root/.npm
COPY shared shared
COPY api api
RUN npm run build -w shared && npm run build -w api

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    ONNXRUNTIME_NODE_INSTALL=skip
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
# 同上:編譯 better-sqlite3 需要工具鏈,同一層裝完即清掉
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev --workspace=shared --workspace=api --include-workspace-root \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/* /root/.npm
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/api/dist api/dist
# SQLite 資料檔放這裡(compose 掛具名 volume);先建好並交給 node,否則非 root 的 node 無法寫入
RUN mkdir -p /app/data && chown node:node /app/data
USER node
# 公開埠 3000(經 Caddy 轉發)、內部埠 3001(只給 Eranarch,不發佈、不轉發,D-131)
CMD ["node", "api/dist/api/src/main.js"]
