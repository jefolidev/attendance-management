import { DuplicatedError } from "@src/core/entities/errors/duplicated-error";
import { NotAllowedError } from "@src/core/entities/errors/not-allowed-error";
import type { CreateEmployeeUseCase } from "@src/domain/manage/application/use-cases/create-employee";
import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";

export const createEmployeeBodySchema = z.object({
  username: z.string().min(2).max(100),
  password: z.string().min(1).max(100),
});

export type CreateEmployeeBodyBody = z.infer<typeof createEmployeeBodySchema>

export class CreateEmployeeController {
  constructor(private readonly createEmployeeUseCase: CreateEmployeeUseCase, private readonly fastify: FastifyInstance) {}

  async handle(request: FastifyRequest, response: FastifyReply): Promise<void> {
    const { username, password } = createEmployeeBodySchema.parse(request.body);

    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if(!token) {
      response.status(401).send({ error: "Unauthorized" });
      return 
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      
      const result = await this.createEmployeeUseCase.execute({
        username, 
        password,
        role: "EMPLOYEE",
        requesterId: requester.id as string
      });

      if(result.isLeft()) {
        const error = result.value;

        if(error instanceof NotAllowedError) {
          return response.status(401).send({ error: error.message });
        }

        if(error instanceof DuplicatedError) {
          return response.status(400).send({ error: error.message });
        }
      }

      return response.status(201).send(result.value);
    } catch (error) {
      return response.status(400).send({ error: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  }
}