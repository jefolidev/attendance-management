FROM oven/bun:1 AS bun

FROM node:24-bookworm-slim AS build

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

ENV DATABASE_URL=file:/app/data/app.db

COPY package.json bun.lock ./
COPY tsconfig.json ./tsconfig.json
RUN bun install --frozen-lockfile --ignore-scripts

COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN bun run prisma:generate

COPY src ./src

RUN npm rebuild better-sqlite3 --build-from-source

FROM node:24-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000 \
	DATABASE_URL=file:/app/data/app.db

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/generated ./generated
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma7.config.ts ./prisma7.config.ts

RUN mkdir -p /app/data && chown node:node /app/data
USER node

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && exec node --import tsx src/infra/index.ts"]
