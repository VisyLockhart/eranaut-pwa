# build context = repo root(要讀 shared/,D-140)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace=shared --workspace=web --include-workspace-root
COPY shared shared
COPY web web
RUN npm run build -w shared && npm run build -w web

# Caddy:提供靜態檔並把 /api/* 轉發到 API 公開埠;內部埠不轉發(D-144)
FROM caddy:2-alpine
COPY web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/web/dist/web/browser /srv
