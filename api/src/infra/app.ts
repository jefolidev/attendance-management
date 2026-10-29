import { fastify, type FastifyInstance } from "fastify";
import prismaPlugin from "./database/prisma/prisma.plugin.ts";

import fastifyCors from "@fastify/cors";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";

import cookiesPlugin from "./plugins/cookies.ts";
import cryptographyPlugin from "./plugins/cryptography.ts";
import jwtPlugin from "./plugins/jwt.ts";

import fastifyJwt from "@fastify/jwt";
import routes from "./http/routes/employees/index.ts";

export function buildApp(): FastifyInstance {
  const app = fastify().withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(fastifyCors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
  })

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "ronaldo",
  });

// [ PLUGINS ]
  app.register(cryptographyPlugin);
  app.register(jwtPlugin) 
  app.register(prismaPlugin);
  app.register(cookiesPlugin);

// [ ROTAS ]
  app.register(routes, { prefix: "/api" });

  return app;
}
