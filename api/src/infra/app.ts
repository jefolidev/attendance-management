import Fastify, { type FastifyInstance } from "fastify";
import prismaPlugin from "./database/prisma/prisma.plugin.ts";

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: true,
  });

  app.register(prismaPlugin);

  return app;
}
