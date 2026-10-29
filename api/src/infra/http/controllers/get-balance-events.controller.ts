import type { GetBalanceEventsUseCase } from "@src/domain/manage/application/use-cases/get-balance-events";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { presentTimeBalanceEntry } from "../presenters/time-balance-entry.presenter";
import { z } from "zod";

export const getBalanceEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
});

export class GetBalanceEventsController {
  constructor(
    private readonly getBalanceEventsUseCase: GetBalanceEventsUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, perPage } = getBalanceEventsQuerySchema.parse(request.query);
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getBalanceEventsUseCase.execute({
        requesterId: requester.id as string,
        page,
        perPage,
      });

      if (result.isLeft()) {
        return reply.status(404).send({ error: result.value.message });
      }

      return reply.status(200).send({
        events: result.value.events.map(presentTimeBalanceEntry),
        pagination: result.value.pagination,
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
