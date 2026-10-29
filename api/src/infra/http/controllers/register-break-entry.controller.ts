import { BadRequestError } from "@src/core/entities/errors/bad-request-error";
import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import type { RegisterBreakEntryUseCase } from "@src/domain/manage/application/use-cases/register-break-entry";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const registerBreakEntryBodySchema = z.object({
  breakIn: z.coerce.date(),
});

export class RegisterBreakEntryController {
  constructor(
    private readonly registerBreakEntryUseCase: RegisterBreakEntryUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { breakIn } = registerBreakEntryBodySchema.parse(request.body);
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.registerBreakEntryUseCase.execute({
        breakIn,
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
        }

        if (error instanceof BadRequestError) {
          return reply.status(400).send({ error: error.message });
        }
      }

      return reply.status(200).send(result.value);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
