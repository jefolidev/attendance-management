import type { GetBalanceEventsUseCase } from "@src/domain/manage/application/use-cases/get-balance-events";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export class GetBalanceEventsController {
  constructor(
    private readonly getBalanceEventsUseCase: GetBalanceEventsUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getBalanceEventsUseCase.execute({
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        return reply.status(404).send({ error: result.value.message });
      }

      return reply.status(200).send({
        events: result.value.events.map((event) => ({
          employeeId: event.employeeId.toString(),
          timeBalanceId: event.timeBalanceId.toString(),
          type: event.type,
          reason: event.reason,
          durationInMinutes: event.durationInMinutes,
          createdAt: event.createdAt,
        })),
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
