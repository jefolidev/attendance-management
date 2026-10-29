import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { RegisterTimeInEntryUseCase } from "@src/domain/manage/application/use-cases/register-time-in-entry";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeBalanceEntryRepository } from "@src/infra/database/prisma/repositories/prisma-time-balance-entry.repository";
import { PrismaTimeBalanceRepository } from "@src/infra/database/prisma/repositories/prisma-time-balance.repository";
import { PrismaTimeEntryRepository } from "@src/infra/database/prisma/repositories/prisma-time-entry.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import {
  registerTimeInEntryBodySchema,
  RegisterTimeInEntryController,
} from "../../controllers/register-time-in-entry.controller";

export default async function registerTimeInEntryRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const timeEntryRepository = new PrismaTimeEntryRepository(fastify.prisma);
  const timeBalanceRepository = new PrismaTimeBalanceRepository(fastify.prisma);
  const timeBalanceEntryRepository = new PrismaTimeBalanceEntryRepository(
    fastify.prisma,
  );
  const useCase = new RegisterTimeInEntryUseCase(
    employeeRepository,
    workScheduleRepository,
    timeEntryRepository,
    timeBalanceRepository,
    timeBalanceEntryRepository,
  );
  const controller = new RegisterTimeInEntryController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/employees/time-entries/in",
    schema: {
      body: registerTimeInEntryBodySchema,
      tags: ["employees", "time-entries"],
    },
    handler: controller.handle.bind(controller),
  });
}
