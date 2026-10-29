import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { UpdateWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/update-work-schedule";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import {
  updateWorkScheduleBodySchema,
  UpdateWorkScheduleController,
} from "../../controllers/update-work-schedule.controller";

export default async function updateWorkScheduleRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const useCase = new UpdateWorkScheduleUseCase(
    employeeRepository,
    workScheduleRepository,
  );
  const controller = new UpdateWorkScheduleController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PATCH",
    url: "/employees/work-schedule",
    schema: {
      body: updateWorkScheduleBodySchema,
      tags: ["employees", "work-schedule"],
    },
    handler: controller.handle.bind(controller),
  });
}
