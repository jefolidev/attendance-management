import { type ZodTypeProvider } from "fastify-type-provider-zod";

import { CreateWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/create-work-schedule";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import { createWorkScheduleBodySchema, CreateWorkScheduleController } from "../../controllers/create-work-schedule.controller";

export default async function createWorkScheduleRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);

  const createWorkScheduleUseCase = new CreateWorkScheduleUseCase(
    workScheduleRepository,
    employeeRepository
  );

  const controller = new CreateWorkScheduleController(
    createWorkScheduleUseCase,
    fastify,
  );

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/employees/work-schedule",
    schema: {
      body: createWorkScheduleBodySchema,
      tags: ["employees", "work-schedule"],
    },
    handler: controller.handle.bind(controller),
  });
}