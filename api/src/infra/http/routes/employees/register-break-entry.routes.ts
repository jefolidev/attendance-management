import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { RegisterBreakEntryUseCase } from "@src/domain/manage/application/use-cases/register-break-entry";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeEntryRepository } from "@src/infra/database/prisma/repositories/prisma-time-entry.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import {
  registerBreakEntryBodySchema,
  RegisterBreakEntryController,
} from "../../controllers/register-break-entry.controller";

export default async function registerBreakEntryRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const timeEntryRepository = new PrismaTimeEntryRepository(fastify.prisma);
  const useCase = new RegisterBreakEntryUseCase(
    timeEntryRepository,
    employeeRepository,
    workScheduleRepository,
  );
  const controller = new RegisterBreakEntryController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/employees/time-entries/break",
    schema: {
      body: registerBreakEntryBodySchema,
      tags: ["employees", "time-entries"],
    },
    handler: controller.handle.bind(controller),
  });
}
