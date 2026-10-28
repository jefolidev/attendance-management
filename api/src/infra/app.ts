import { fastify, type FastifyInstance } from "fastify";
import prismaPlugin from "./database/prisma/prisma.plugin.ts";

import fastifyCors from "@fastify/cors";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import cookiesPlugin from "./plugins/cookies.plugin.ts";

export function buildApp(): FastifyInstance {
  const app = fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyCors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })

  app.register(prismaPlugin);
  app.register(cookiesPlugin);

  return app;
}
