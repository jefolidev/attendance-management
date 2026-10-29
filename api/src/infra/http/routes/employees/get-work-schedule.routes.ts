import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { GetWorkScheduleUseCase } from "@src/domain/manage/application/use-cases/get-work-schedule";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import { GetWorkScheduleController } from "../../controllers/get-work-schedule.controller";

export default async function getWorkScheduleRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const useCase = new GetWorkScheduleUseCase(
    employeeRepository,
    workScheduleRepository,
  );
  const controller = new GetWorkScheduleController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/employees/work-schedule",
    schema: { tags: ["employees", "work-schedule"] },
    handler: controller.handle.bind(controller),
  });
}
