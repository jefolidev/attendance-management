import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { GetAccumulatedDelayTimeUseCase } from "@src/domain/manage/application/use-cases/get-accumulated-delay-time";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeEntryRepository } from "@src/infra/database/prisma/repositories/prisma-time-entry.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import { GetAccumulatedDelayTimeController } from "../../controllers/get-accumulated-delay-time.controller";

export default async function getAccumulatedDelayTimeRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const timeEntryRepository = new PrismaTimeEntryRepository(fastify.prisma);
  const useCase = new GetAccumulatedDelayTimeUseCase(
    employeeRepository,
    workScheduleRepository,
    timeEntryRepository,
  );
  const controller = new GetAccumulatedDelayTimeController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/employees/time-balance/accumulated-delay",
    schema: { tags: ["employees", "time-balance"] },
    handler: controller.handle.bind(controller),
  });
}
