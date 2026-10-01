# build context = repo root(要讀 shared/,D-140)
# glibc 基底:onnxruntime-node 需要(D-127)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --workspace=shared --workspace=api --include-workspace-root
COPY shared shared
COPY api api
RUN npm run build -w shared && npm run build -w api

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci --omit=dev --workspace=shared --workspace=api --include-workspace-root
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/api/dist api/dist
USER node
# 公開埠 3000(經 Caddy 轉發)、內部埠 3001(只給 Eranarch,不發佈、不轉發,D-131)
CMD ["node", "api/dist/api/src/main.js"]
