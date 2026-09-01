# uWebSockets.js（ultimate-express 的依賴）是 native module，綁 Node ABI，build 和 runtime 版本
# 不能不一致，所以 builder 跟 runner 兩個 stage 都固定用同一個 Node 22 base image。
FROM node:22-trixie-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@11

# pnpm-workspace.yaml 是必要檔案：ultimate-express 依賴的 uWebSockets.js 走 GitHub 安裝，
# pnpm 預設會擋（ERR_PNPM_EXOTIC_SUBDEP），一定要在 install 之前就存在。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN pnpm install --frozen-lockfile

# postinstall 不會自動產生 Prisma Client（跟本機一樣，需要顯式跑一次 generate）。
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN pnpm run build

# 只保留 production dependencies，縮小最終 image。
RUN pnpm install --prod --frozen-lockfile

FROM node:22-trixie-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# 只是文件用途——實際監聽的 port 由 PORT 環境變數決定（src/shared/config.ts 預設 8084，
# Cloud Run 會注入 8080）。
EXPOSE 8080

# 不要在容器啟動時執行 migration——這裡只啟動 app，schema 變更另外用
# `pnpm prisma migrate deploy` 手動跑（對 DIRECT_URL，不是容器內部的職責）。
CMD ["node", "dist/index.js"]
