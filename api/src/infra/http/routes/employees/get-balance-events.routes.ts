import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { GetBalanceEventsUseCase } from "@src/domain/manage/application/use-cases/get-balance-events";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeBalanceRepository } from "@src/infra/database/prisma/repositories/prisma-time-balance.repository";
import type { FastifyInstance } from "fastify";
import {
  getBalanceEventsQuerySchema,
  GetBalanceEventsController,
} from "../../controllers/get-balance-events.controller";

export default async function getBalanceEventsRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const timeBalanceRepository = new PrismaTimeBalanceRepository(fastify.prisma);
  const useCase = new GetBalanceEventsUseCase(
    employeeRepository,
    timeBalanceRepository,
  );
  const controller = new GetBalanceEventsController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/employees/time-balance/events",
    schema: {
      querystring: getBalanceEventsQuerySchema,
      tags: ["employees", "time-balance"],
    },
    handler: controller.handle.bind(controller),
  });
}
