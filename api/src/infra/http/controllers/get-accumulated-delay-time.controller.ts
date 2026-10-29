import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import type { GetAccumulatedDelayTimeUseCase } from "@src/domain/manage/application/use-cases/get-accumulated-delay-time";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export class GetAccumulatedDelayTimeController {
  constructor(
    private readonly getAccumulatedDelayTimeUseCase: GetAccumulatedDelayTimeUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getAccumulatedDelayTimeUseCase.execute({
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof NotFoundError) {
          return reply.status(404).send({ error: error.message });
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
