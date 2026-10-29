import type { GetBalanceUseCase } from "@src/domain/manage/application/use-cases/get-balance";
import type { TimeBalance } from "@src/domain/manage/enterprise/entities/time-balance";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function serializeBalance(balance: TimeBalance) {
  return {
    id: balance.id.toString(),
    employeeId: balance.employeeId.toString(),
    balanceMinutes: balance.balanceMinutes,
    updatedAt: balance.updatedAt,
    events: balance.events.map((event) => ({
      employeeId: event.employeeId.toString(),
      timeBalanceId: event.timeBalanceId.toString(),
      type: event.type,
      reason: event.reason,
      durationInMinutes: event.durationInMinutes,
      createdAt: event.createdAt,
    })),
  };
}

export class GetBalanceController {
  constructor(
    private readonly getBalanceUseCase: GetBalanceUseCase,
    private readonly fastify: FastifyInstance,
  ) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request);

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    try {
      const requester = this.fastify.jwtAuth.verifyToken(token);
      const result = await this.getBalanceUseCase.execute({
        requesterId: requester.id as string,
      });

      if (result.isLeft()) {
        return reply.status(404).send({ error: result.value.message });
      }

      return reply.status(200).send({
        balance: serializeBalance(result.value.balance),
      });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }
}
