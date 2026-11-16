FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000 \
	DATABASE_URL=file:/app/data/app.db

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN bun run prisma:generate

COPY src ./src

RUN mkdir -p /app/data && chown -R bun:bun /app
USER bun

VOLUME ["/app/data"]
EXPOSE 3000

CMD ["bun", "run", "src/infra/index.ts"]
