import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { ListEmployeeEntriesUseCase } from "@src/domain/manage/application/use-cases/list-employee-entries";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeEntryRepository } from "@src/infra/database/prisma/repositories/prisma-time-entry.repository";
import { PrismaWorkScheduleRepository } from "@src/infra/database/prisma/repositories/prisma-work-schedule.repository";
import type { FastifyInstance } from "fastify";
import {
  listEmployeeEntriesQuerySchema,
  ListEmployeeEntriesController,
} from "../../controllers/list-employee-entries.controller";

export default async function listEmployeeEntriesRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const workScheduleRepository = new PrismaWorkScheduleRepository(fastify.prisma);
  const timeEntryRepository = new PrismaTimeEntryRepository(fastify.prisma);
  const useCase = new ListEmployeeEntriesUseCase(
    employeeRepository,
    workScheduleRepository,
    timeEntryRepository,
  );
  const controller = new ListEmployeeEntriesController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/employees/time-entries",
    schema: {
      querystring: listEmployeeEntriesQuerySchema,
      tags: ["employees", "time-entries"],
    },
    handler: controller.handle.bind(controller),
  });
}
