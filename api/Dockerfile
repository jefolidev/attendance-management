FROM oven/bun:1 AS build

WORKDIR /app

ENV DATABASE_URL=file:/app/data/app.db

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN bun run prisma:generate

COPY src ./src

FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000 \
	DATABASE_URL=file:/app/data/app.db

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/generated ./generated
COPY --from=build --chown=node:node /app/src ./src

RUN mkdir -p /app/data && chown node:node /app/data
USER node

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["node", "--import", "tsx", "src/infra/index.ts"]
