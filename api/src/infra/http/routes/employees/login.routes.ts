import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthenticateEmployeeUseCase } from "@src/domain/manage/application/use-cases/authenticate-employee";
import { JwtEncrypter } from "@src/infra/cryptography/jwt-encrypter";
import { BcryptHasher } from "@src/infra/cryptography/bcrypt-hasher";
import { PrismaEmployeeRepository } from "@src/infra/database/prisma/repositories/prisma-employee.repository";
import type { FastifyInstance } from "fastify";
import { loginBodySchema, LoginController } from "../../controllers/login.controller";

export default async function loginRoute(
  fastify: FastifyInstance,
): Promise<void> {
  const employeeRepository = new PrismaEmployeeRepository(fastify.prisma);
  const hasher = new BcryptHasher();
  const encrypter = new JwtEncrypter(fastify);

  const authenticateEmployeeUseCase = new AuthenticateEmployeeUseCase(
    employeeRepository,
    hasher,
    encrypter,
  );

  const controller = new LoginController(authenticateEmployeeUseCase);

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/login",
    schema: {
      body: loginBodySchema,
      tags: ["auth"],
    },
    handler: controller.handle.bind(controller),
  });
}
