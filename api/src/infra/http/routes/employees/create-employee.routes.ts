import { type ZodTypeProvider } from "fastify-type-provider-zod";

import { CreateEmployeeUseCase } from "@src/domain/manage/application/use-cases/create-employee";
import { BcryptHasher } from "@src/infra/cryptography/bcrypt-hasher";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import type { FastifyInstance } from "fastify";
import { createEmployeeBodySchema, CreateEmployeeController } from "../../controllers/create-employee.controller";

export default async function createEmployeeRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const hashGenerator = new BcryptHasher();

  const createEmployeeUseCase = new CreateEmployeeUseCase(
    employeeRepository,
    hashGenerator,
  );

  const controller = new CreateEmployeeController(
    createEmployeeUseCase,
    fastify,
  );

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/employees",
    schema: {
      body: createEmployeeBodySchema,
      tags: ["employees"],
    },
    handler: controller.handle.bind(controller),
  });
}