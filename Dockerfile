FROM node:20-slim AS builder
WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json ./server/

RUN npm install -g pnpm && pnpm install --filter @chatbox/server --frozen-lockfile

COPY server/ ./server/
COPY src/shared/ ./src/shared/

RUN cd server && pnpm build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/package.json ./
EXPOSE 3100
CMD ["node", "dist/index.js"]
