import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { GetBalanceUseCase } from "@src/domain/manage/application/use-cases/get-balance";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import { PrismaTimeBalanceRepository } from "@src/infra/database/prisma/repositories/prisma-time-balance.repository";
import type { FastifyInstance } from "fastify";
import { GetBalanceController } from "../../controllers/get-balance.controller";

export default async function getBalanceRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const timeBalanceRepository = new PrismaTimeBalanceRepository(fastify.prisma);
  const useCase = new GetBalanceUseCase(
    employeeRepository,
    timeBalanceRepository,
  );
  const controller = new GetBalanceController(useCase, fastify);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/employees/time-balance",
    schema: { tags: ["employees", "time-balance"] },
    handler: controller.handle.bind(controller),
  });
}
